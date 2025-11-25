package models

import (
	"time"

	"gorm.io/gorm"
)

// SeatStatus 좌석 상태
type SeatStatus string

const (
	SeatAvailable SeatStatus = "available"
	SeatInUse     SeatStatus = "in_use"
	SeatReserved  SeatStatus = "reserved"
)

// Seat 좌석
type Seat struct {
	ID             int             `json:"id" gorm:"primaryKey;autoIncrement"`
	Name           string          `json:"name" gorm:"not null"`
	Status         SeatStatus      `json:"status" gorm:"default:available"`
	CurrentSession *ServiceSession `json:"currentSession,omitempty" gorm:"foreignKey:SeatID"`
	CreatedAt      time.Time       `json:"createdAt"`
	UpdatedAt      time.Time       `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt  `json:"-" gorm:"index"`
}

// ServiceSession 현재 진행중인 시술
type ServiceSession struct {
	ID            string    `json:"id" gorm:"primaryKey"`
	SeatID        int       `json:"seatId" gorm:"index"`
	MemberID      *string   `json:"memberId,omitempty"`
	MemberName    string    `json:"memberName" gorm:"not null"`
	TotalPrice    int       `json:"totalPrice" gorm:"default:0"`
	StaffID       string    `json:"staffId" gorm:"not null"`
	StaffName     string    `json:"staffName" gorm:"not null"`
	StartTime     time.Time `json:"startTime"`
	ReservationID *string   `json:"reservationId,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// SelectedService 선택된 서비스
type SelectedService struct {
	ID               uint    `json:"-" gorm:"primaryKey;autoIncrement"`
	ServiceSessionID string  `json:"-" gorm:"index"`
	ReservationID    *string `json:"-" gorm:"index"`
	LedgerEntryID    *string `json:"-" gorm:"index"`
	Name             string  `json:"name" gorm:"not null"`
	Length           *string `json:"length,omitempty"` // short, medium, long
	Price            int     `json:"price" gorm:"default:0"`
}

// StartServiceRequest 시술 시작 요청
type StartServiceRequest struct {
	MemberID      *string           `json:"memberId,omitempty"`
	MemberName    string            `json:"memberName" binding:"required"`
	Services      []SelectedService `json:"services" binding:"required"`
	TotalPrice    int               `json:"totalPrice" binding:"required"`
	StaffID       string            `json:"staffId" binding:"required"`
	StaffName     string            `json:"staffName" binding:"required"`
	ReservationID *string           `json:"reservationId,omitempty"`
}
