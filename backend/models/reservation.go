package models

import (
	"time"

	"gorm.io/gorm"
)

// ReservationStatus 예약 상태
type ReservationStatus string

const (
	ReservationScheduled  ReservationStatus = "scheduled"
	ReservationInProgress ReservationStatus = "in_progress"
	ReservationCompleted  ReservationStatus = "completed"
	ReservationCancelled  ReservationStatus = "cancelled"
)

// Reservation 예약
type Reservation struct {
	ID                string            `json:"id" gorm:"primaryKey"`
	MemberID          *string           `json:"memberId,omitempty"`
	MemberName        string            `json:"memberName" gorm:"not null"`
	MemberPhone       *string           `json:"memberPhone,omitempty"`
	SeatID            *int              `json:"seatId,omitempty"`
	StaffID           string            `json:"staffId" gorm:"not null"`
	StaffName         string            `json:"staffName" gorm:"not null"`
	Services          []SelectedService `json:"services" gorm:"foreignKey:ReservationID"`
	TotalPrice        int               `json:"totalPrice" gorm:"default:0"`
	ReservedAt        time.Time         `json:"reservedAt"`
	EstimatedDuration int               `json:"estimatedDuration"` // 분 단위
	Status            ReservationStatus `json:"status" gorm:"default:scheduled"`
	CreatedAt         time.Time         `json:"createdAt"`
	UpdatedAt         time.Time         `json:"updatedAt"`
	DeletedAt         gorm.DeletedAt    `json:"-" gorm:"index"`
}

// ReservationRequest 예약 생성/수정 요청
type ReservationRequest struct {
	MemberID          *string           `json:"memberId,omitempty"`
	MemberName        string            `json:"memberName" binding:"required"`
	MemberPhone       *string           `json:"memberPhone,omitempty"`
	SeatID            *int              `json:"seatId,omitempty"`
	StaffID           string            `json:"staffId" binding:"required"`
	StaffName         string            `json:"staffName" binding:"required"`
	Services          []SelectedService `json:"services" binding:"required"`
	TotalPrice        int               `json:"totalPrice" binding:"required"`
	ReservedAt        string            `json:"reservedAt" binding:"required"`
	EstimatedDuration int               `json:"estimatedDuration" binding:"required"`
}
