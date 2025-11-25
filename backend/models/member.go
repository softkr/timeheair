package models

import (
	"time"

	"gorm.io/gorm"
)

// Member 고객
type Member struct {
	ID        string         `json:"id" gorm:"primaryKey"`
	Name      string         `json:"name" gorm:"not null"`
	Phone     string         `json:"phone" gorm:"uniqueIndex"`
	Stamps    int            `json:"stamps" gorm:"default:0"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// MemberRequest 고객 생성/수정 요청
type MemberRequest struct {
	Name  string `json:"name" binding:"required"`
	Phone string `json:"phone" binding:"required"`
}
