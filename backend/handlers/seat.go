package handlers

import (
	"net/http"
	"time"
	"timehair-backend/database"
	"timehair-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetSeats 좌석 목록 조회
func GetSeats(c *gin.Context) {
	var seats []models.Seat

	if err := database.DB.Preload("CurrentSession").Order("id ASC").Find(&seats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "좌석 목록 조회에 실패했습니다"})
		return
	}

	// 각 세션의 서비스 목록도 로드
	for i := range seats {
		if seats[i].CurrentSession != nil {
			var services []models.SelectedService
			database.DB.Where("service_session_id = ?", seats[i].CurrentSession.ID).Find(&services)
			// 세션에 서비스 정보 추가 (별도 필드로)
		}
	}

	c.JSON(http.StatusOK, seats)
}

// GetSeat 좌석 상세 조회
func GetSeat(c *gin.Context) {
	id := c.Param("id")

	var seat models.Seat
	if err := database.DB.Preload("CurrentSession").First(&seat, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "좌석을 찾을 수 없습니다"})
		return
	}

	c.JSON(http.StatusOK, seat)
}

// StartService 시술 시작
func StartService(c *gin.Context) {
	id := c.Param("id")

	var seat models.Seat
	if err := database.DB.First(&seat, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "좌석을 찾을 수 없습니다"})
		return
	}

	if seat.Status == models.SeatInUse {
		c.JSON(http.StatusConflict, gin.H{"error": "이미 사용 중인 좌석입니다"})
		return
	}

	var req models.StartServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "잘못된 요청입니다"})
		return
	}

	sessionID := uuid.New().String()
	seatID := seat.ID

	// 서비스 세션 생성
	session := models.ServiceSession{
		ID:            sessionID,
		SeatID:        seatID,
		MemberID:      req.MemberID,
		MemberName:    req.MemberName,
		TotalPrice:    req.TotalPrice,
		StaffID:       req.StaffID,
		StaffName:     req.StaffName,
		StartTime:     time.Now(),
		ReservationID: req.ReservationID,
	}

	if err := database.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "세션 생성에 실패했습니다"})
		return
	}

	// 서비스 목록 생성
	for _, s := range req.Services {
		service := models.SelectedService{
			ServiceSessionID: sessionID,
			Name:             s.Name,
			Length:           s.Length,
			Price:            s.Price,
		}
		database.DB.Create(&service)
	}

	// 좌석 상태 업데이트
	seat.Status = models.SeatInUse
	database.DB.Save(&seat)

	// 예약이 있으면 상태 업데이트
	if req.ReservationID != nil {
		database.DB.Model(&models.Reservation{}).Where("id = ?", *req.ReservationID).Update("status", models.ReservationInProgress)
	}

	// 세션과 함께 좌석 다시 조회
	database.DB.Preload("CurrentSession").First(&seat, "id = ?", id)

	c.JSON(http.StatusOK, seat)
}

// CompleteService 시술 완료
func CompleteService(c *gin.Context) {
	id := c.Param("id")

	var seat models.Seat
	if err := database.DB.Preload("CurrentSession").First(&seat, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "좌석을 찾을 수 없습니다"})
		return
	}

	if seat.Status != models.SeatInUse || seat.CurrentSession == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "진행 중인 시술이 없습니다"})
		return
	}

	session := seat.CurrentSession

	// 서비스 목록 조회
	var services []models.SelectedService
	database.DB.Where("service_session_id = ?", session.ID).Find(&services)

	ledgerID := uuid.New().String()

	// 매출 기록 생성
	ledger := models.LedgerEntry{
		ID:            ledgerID,
		ReservationID: session.ReservationID,
		MemberID:      session.MemberID,
		MemberName:    session.MemberName,
		SeatID:        seat.ID,
		StaffID:       session.StaffID,
		StaffName:     session.StaffName,
		TotalPrice:    session.TotalPrice,
		CompletedAt:   time.Now(),
	}

	if err := database.DB.Create(&ledger).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "매출 기록 생성에 실패했습니다"})
		return
	}

	// 서비스 목록을 매출 기록에 연결
	for _, s := range services {
		service := models.SelectedService{
			LedgerEntryID: &ledgerID,
			Name:          s.Name,
			Length:        s.Length,
			Price:         s.Price,
		}
		database.DB.Create(&service)
	}

	// 회원 스탬프 추가
	if session.MemberID != nil {
		database.DB.Model(&models.Member{}).Where("id = ?", *session.MemberID).UpdateColumn("stamps", database.DB.Raw("stamps + 1"))
	}

	// 예약이 있으면 상태 업데이트
	if session.ReservationID != nil {
		database.DB.Model(&models.Reservation{}).Where("id = ?", *session.ReservationID).Update("status", models.ReservationCompleted)
	}

	// 세션 관련 서비스 삭제
	database.DB.Where("service_session_id = ?", session.ID).Delete(&models.SelectedService{})

	// 세션 삭제
	database.DB.Delete(&session)

	// 좌석 상태 업데이트
	seat.Status = models.SeatAvailable
	database.DB.Save(&seat)

	c.JSON(http.StatusOK, gin.H{
		"message": "시술이 완료되었습니다",
		"ledger":  ledger,
	})
}

// CancelService 시술 취소
func CancelService(c *gin.Context) {
	id := c.Param("id")

	var seat models.Seat
	if err := database.DB.Preload("CurrentSession").First(&seat, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "좌석을 찾을 수 없습니다"})
		return
	}

	if seat.Status != models.SeatInUse || seat.CurrentSession == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "진행 중인 시술이 없습니다"})
		return
	}

	session := seat.CurrentSession

	// 예약이 있으면 상태 복원
	if session.ReservationID != nil {
		database.DB.Model(&models.Reservation{}).Where("id = ?", *session.ReservationID).Update("status", models.ReservationScheduled)
	}

	// 세션 관련 서비스 삭제
	database.DB.Where("service_session_id = ?", session.ID).Delete(&models.SelectedService{})

	// 세션 삭제
	database.DB.Delete(&session)

	// 좌석 상태 업데이트
	seat.Status = models.SeatAvailable
	database.DB.Save(&seat)

	c.JSON(http.StatusOK, gin.H{"message": "시술이 취소되었습니다"})
}
