package handlers

import (
	"net/http"
	"timehair-backend/database"
	"timehair-backend/middleware"
	"timehair-backend/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Login 로그인
func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "잘못된 요청입니다"})
		return
	}

	// 사용자 조회
	var user models.User
	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "사용자명 또는 비밀번호가 올바르지 않습니다"})
		return
	}

	// 비밀번호 검증
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "사용자명 또는 비밀번호가 올바르지 않습니다"})
		return
	}

	// JWT 토큰 생성
	token, err := middleware.GenerateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "토큰 생성에 실패했습니다"})
		return
	}

	c.JSON(http.StatusOK, models.LoginResponse{
		Token: token,
		User:  user,
	})
}

// GetCurrentUser 현재 사용자 정보 조회
func GetCurrentUser(c *gin.Context) {
	userID := c.GetString("userID")

	var user models.User
	if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "사용자를 찾을 수 없습니다"})
		return
	}

	c.JSON(http.StatusOK, user)
}
