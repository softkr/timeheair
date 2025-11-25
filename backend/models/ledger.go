package models

import (
	"time"
)

// LedgerEntry 매출
type LedgerEntry struct {
	ID            string            `json:"id" gorm:"primaryKey"`
	ReservationID *string           `json:"reservationId,omitempty"`
	MemberID      *string           `json:"memberId,omitempty"`
	MemberName    string            `json:"memberName" gorm:"not null"`
	SeatID        int               `json:"seatId"`
	StaffID       string            `json:"staffId" gorm:"not null"`
	StaffName     string            `json:"staffName" gorm:"not null"`
	Services      []SelectedService `json:"services" gorm:"foreignKey:LedgerEntryID"`
	TotalPrice    int               `json:"totalPrice" gorm:"default:0"`
	CompletedAt   time.Time         `json:"completedAt"`
	CreatedAt     time.Time         `json:"createdAt"`
}

// LedgerSummary 매출 요약
type LedgerSummary struct {
	TotalRevenue int            `json:"totalRevenue"`
	TotalCount   int            `json:"totalCount"`
	ByStaff      []StaffRevenue `json:"byStaff"`
	ByService    []ServiceCount `json:"byService"`
}

// StaffRevenue 직원별 매출
type StaffRevenue struct {
	StaffID   string `json:"staffId"`
	StaffName string `json:"staffName"`
	Revenue   int    `json:"revenue"`
	Count     int    `json:"count"`
}

// ServiceCount 서비스별 건수
type ServiceCount struct {
	ServiceName string `json:"serviceName"`
	Count       int    `json:"count"`
	Revenue     int    `json:"revenue"`
}
