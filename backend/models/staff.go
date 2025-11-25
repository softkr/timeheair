package models

import (
	"time"

	"gorm.io/gorm"
)

// Staff 직원
type Staff struct {
	ID        string         `json:"id" gorm:"primaryKey"`
	Name      string         `json:"name" gorm:"not null"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// StaffRequest 직원 생성/수정 요청
type StaffRequest struct {
	Name string `json:"name" binding:"required"`
}
