package models

import (
	"time"

	"gorm.io/gorm"
)

// User 사용자 (관리자)
type User struct {
	ID        string         `json:"id" gorm:"primaryKey"`
	Username  string         `json:"username" gorm:"uniqueIndex;not null"`
	Password  string         `json:"-" gorm:"not null"` // 비밀번호는 JSON 응답에서 제외
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// LoginRequest 로그인 요청
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse 로그인 응답
type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// Claims JWT 클레임
type Claims struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
}
