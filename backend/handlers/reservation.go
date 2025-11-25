package handlers

import (
	"net/http"
	"time"
	"timehair-backend/database"
	"timehair-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetReservations 예약 목록 조회
func GetReservations(c *gin.Context) {
	var reservations []models.Reservation

	query := database.DB.Preload("Services").Order("reserved_at ASC")

	// 상태 필터
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// 날짜 필터
	if date := c.Query("date"); date != "" {
		startOfDay, _ := time.Parse("2006-01-02", date)
		endOfDay := startOfDay.Add(24 * time.Hour)
		query = query.Where("reserved_at >= ? AND reserved_at < ?", startOfDay, endOfDay)
	}

	// 오늘 이후 예약만 (기본)
	if c.Query("all") != "true" {
		today := time.Now().Truncate(24 * time.Hour)
		query = query.Where("reserved_at >= ? OR status = ?", today, models.ReservationInProgress)
	}

	if err := query.Find(&reservations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "예약 목록 조회에 실패했습니다"})
		return
	}

	c.JSON(http.StatusOK, reservations)
}

// GetReservation 예약 상세 조회
func GetReservation(c *gin.Context) {
	id := c.Param("id")

	var reservation models.Reservation
	if err := database.DB.Preload("Services").First(&reservation, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "예약을 찾을 수 없습니다"})
		return
	}

	c.JSON(http.StatusOK, reservation)
}

// CreateReservation 예약 생성
func CreateReservation(c *gin.Context) {
	var req models.ReservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "잘못된 요청입니다"})
		return
	}

	reservedAt, err := time.Parse(time.RFC3339, req.ReservedAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "잘못된 예약 시간 형식입니다"})
		return
	}

	reservationID := uuid.New().String()

	// 서비스 목록 처리
	services := make([]models.SelectedService, len(req.Services))
	for i, s := range req.Services {
		services[i] = models.SelectedService{
			ReservationID: &reservationID,
			Name:          s.Name,
			Length:        s.Length,
			Price:         s.Price,
		}
	}

	reservation := models.Reservation{
		ID:                reservationID,
		MemberID:          req.MemberID,
		MemberName:        req.MemberName,
		MemberPhone:       req.MemberPhone,
		SeatID:            req.SeatID,
		StaffID:           req.StaffID,
		StaffName:         req.StaffName,
		Services:          services,
		TotalPrice:        req.TotalPrice,
		ReservedAt:        reservedAt,
		EstimatedDuration: req.EstimatedDuration,
		Status:            models.ReservationScheduled,
	}

	if err := database.DB.Create(&reservation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "예약 생성에 실패했습니다"})
		return
	}

	// 서비스 목록과 함께 다시 조회
	database.DB.Preload("Services").First(&reservation, "id = ?", reservation.ID)

	c.JSON(http.StatusCreated, reservation)
}

// UpdateReservation 예약 수정
func UpdateReservation(c *gin.Context) {
	id := c.Param("id")

	var reservation models.Reservation
	if err := database.DB.First(&reservation, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "예약을 찾을 수 없습니다"})
		return
	}

	var req models.ReservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "잘못된 요청입니다"})
		return
	}

	reservedAt, err := time.Parse(time.RFC3339, req.ReservedAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "잘못된 예약 시간 형식입니다"})
		return
	}

	// 기존 서비스 삭제
	database.DB.Where("reservation_id = ?", id).Delete(&models.SelectedService{})

	// 새 서비스 목록 생성
	services := make([]models.SelectedService, len(req.Services))
	for i, s := range req.Services {
		services[i] = models.SelectedService{
			ReservationID: &id,
			Name:          s.Name,
			Length:        s.Length,
			Price:         s.Price,
		}
	}

	reservation.MemberID = req.MemberID
	reservation.MemberName = req.MemberName
	reservation.MemberPhone = req.MemberPhone
	reservation.SeatID = req.SeatID
	reservation.StaffID = req.StaffID
	reservation.StaffName = req.StaffName
	reservation.Services = services
	reservation.TotalPrice = req.TotalPrice
	reservation.ReservedAt = reservedAt
	reservation.EstimatedDuration = req.EstimatedDuration

	if err := database.DB.Save(&reservation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "예약 수정에 실패했습니다"})
		return
	}

	// 서비스 목록과 함께 다시 조회
	database.DB.Preload("Services").First(&reservation, "id = ?", reservation.ID)

	c.JSON(http.StatusOK, reservation)
}

// UpdateReservationStatus 예약 상태 변경
func UpdateReservationStatus(c *gin.Context) {
	id := c.Param("id")

	var reservation models.Reservation
	if err := database.DB.First(&reservation, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "예약을 찾을 수 없습니다"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "잘못된 요청입니다"})
		return
	}

	reservation.Status = models.ReservationStatus(req.Status)

	if err := database.DB.Save(&reservation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "예약 상태 변경에 실패했습니다"})
		return
	}

	c.JSON(http.StatusOK, reservation)
}

// DeleteReservation 예약 삭제
func DeleteReservation(c *gin.Context) {
	id := c.Param("id")

	var reservation models.Reservation
	if err := database.DB.First(&reservation, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "예약을 찾을 수 없습니다"})
		return
	}

	// 관련 서비스도 삭제
	database.DB.Where("reservation_id = ?", id).Delete(&models.SelectedService{})

	if err := database.DB.Delete(&reservation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "예약 삭제에 실패했습니다"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "예약이 삭제되었습니다"})
}
