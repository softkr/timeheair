package handlers

import (
	"net/http"
	"time"
	"timehair-backend/database"
	"timehair-backend/models"

	"github.com/gin-gonic/gin"
)

// GetLedgerEntries 매출 목록 조회
func GetLedgerEntries(c *gin.Context) {
	var entries []models.LedgerEntry

	query := database.DB.Preload("Services").Order("completed_at DESC")

	// 날짜 필터
	if date := c.Query("date"); date != "" {
		startOfDay, _ := time.Parse("2006-01-02", date)
		endOfDay := startOfDay.Add(24 * time.Hour)
		query = query.Where("completed_at >= ? AND completed_at < ?", startOfDay, endOfDay)
	}

	// 기간 필터
	if startDate := c.Query("startDate"); startDate != "" {
		start, _ := time.Parse("2006-01-02", startDate)
		query = query.Where("completed_at >= ?", start)
	}
	if endDate := c.Query("endDate"); endDate != "" {
		end, _ := time.Parse("2006-01-02", endDate)
		end = end.Add(24 * time.Hour)
		query = query.Where("completed_at < ?", end)
	}

	// 직원 필터
	if staffID := c.Query("staffId"); staffID != "" {
		query = query.Where("staff_id = ?", staffID)
	}

	if err := query.Find(&entries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "매출 목록 조회에 실패했습니다"})
		return
	}

	c.JSON(http.StatusOK, entries)
}

// GetLedgerSummary 매출 요약 조회
func GetLedgerSummary(c *gin.Context) {
	var entries []models.LedgerEntry

	query := database.DB.Preload("Services")

	// 날짜 필터 (기본: 오늘)
	if date := c.Query("date"); date != "" {
		startOfDay, _ := time.Parse("2006-01-02", date)
		endOfDay := startOfDay.Add(24 * time.Hour)
		query = query.Where("completed_at >= ? AND completed_at < ?", startOfDay, endOfDay)
	} else if startDate := c.Query("startDate"); startDate != "" {
		start, _ := time.Parse("2006-01-02", startDate)
		query = query.Where("completed_at >= ?", start)
		if endDate := c.Query("endDate"); endDate != "" {
			end, _ := time.Parse("2006-01-02", endDate)
			end = end.Add(24 * time.Hour)
			query = query.Where("completed_at < ?", end)
		}
	} else {
		// 기본: 오늘
		today := time.Now().Truncate(24 * time.Hour)
		tomorrow := today.Add(24 * time.Hour)
		query = query.Where("completed_at >= ? AND completed_at < ?", today, tomorrow)
	}

	if err := query.Find(&entries).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "매출 요약 조회에 실패했습니다"})
		return
	}

	// 요약 계산
	summary := models.LedgerSummary{
		TotalRevenue: 0,
		TotalCount:   len(entries),
		ByStaff:      []models.StaffRevenue{},
		ByService:    []models.ServiceCount{},
	}

	staffMap := make(map[string]*models.StaffRevenue)
	serviceMap := make(map[string]*models.ServiceCount)

	for _, entry := range entries {
		summary.TotalRevenue += entry.TotalPrice

		// 직원별 집계
		if _, exists := staffMap[entry.StaffID]; !exists {
			staffMap[entry.StaffID] = &models.StaffRevenue{
				StaffID:   entry.StaffID,
				StaffName: entry.StaffName,
				Revenue:   0,
				Count:     0,
			}
		}
		staffMap[entry.StaffID].Revenue += entry.TotalPrice
		staffMap[entry.StaffID].Count++

		// 서비스별 집계
		for _, service := range entry.Services {
			if _, exists := serviceMap[service.Name]; !exists {
				serviceMap[service.Name] = &models.ServiceCount{
					ServiceName: service.Name,
					Count:       0,
					Revenue:     0,
				}
			}
			serviceMap[service.Name].Count++
			serviceMap[service.Name].Revenue += service.Price
		}
	}

	// Map을 Slice로 변환
	for _, v := range staffMap {
		summary.ByStaff = append(summary.ByStaff, *v)
	}
	for _, v := range serviceMap {
		summary.ByService = append(summary.ByService, *v)
	}

	c.JSON(http.StatusOK, summary)
}

// GetDailySummary 일별 매출 요약
func GetDailySummary(c *gin.Context) {
	year := c.Query("year")
	month := c.Query("month")

	if year == "" || month == "" {
		now := time.Now()
		year = now.Format("2006")
		month = now.Format("01")
	}

	startDate, _ := time.Parse("2006-01", year+"-"+month)
	endDate := startDate.AddDate(0, 1, 0)

	var results []struct {
		Date    string `json:"date"`
		Revenue int    `json:"revenue"`
		Count   int    `json:"count"`
	}

	database.DB.Model(&models.LedgerEntry{}).
		Select("DATE(completed_at) as date, SUM(total_price) as revenue, COUNT(*) as count").
		Where("completed_at >= ? AND completed_at < ?", startDate, endDate).
		Group("DATE(completed_at)").
		Order("date ASC").
		Scan(&results)

	c.JSON(http.StatusOK, results)
}
