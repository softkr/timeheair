package handlers

import (
	"net/http"
	"timehair-backend/database"
	"timehair-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetStaffList 직원 목록 조회
func GetStaffList(c *gin.Context) {
	var staffs []models.Staff

	if err := database.DB.Order("created_at ASC").Find(&staffs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "직원 목록 조회에 실패했습니다"})
		return
	}

	c.JSON(http.StatusOK, staffs)
}

// GetStaff 직원 상세 조회
func GetStaff(c *gin.Context) {
	id := c.Param("id")

	var staff models.Staff
	if err := database.DB.First(&staff, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "직원을 찾을 수 없습니다"})
		return
	}

	c.JSON(http.StatusOK, staff)
}

// CreateStaff 직원 생성
func CreateStaff(c *gin.Context) {
	var req models.StaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "잘못된 요청입니다"})
		return
	}

	staff := models.Staff{
		ID:   uuid.New().String(),
		Name: req.Name,
	}

	if err := database.DB.Create(&staff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "직원 생성에 실패했습니다"})
		return
	}

	c.JSON(http.StatusCreated, staff)
}

// UpdateStaff 직원 수정
func UpdateStaff(c *gin.Context) {
	id := c.Param("id")

	var staff models.Staff
	if err := database.DB.First(&staff, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "직원을 찾을 수 없습니다"})
		return
	}

	var req models.StaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "잘못된 요청입니다"})
		return
	}

	staff.Name = req.Name

	if err := database.DB.Save(&staff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "직원 수정에 실패했습니다"})
		return
	}

	c.JSON(http.StatusOK, staff)
}

// DeleteStaff 직원 삭제
func DeleteStaff(c *gin.Context) {
	id := c.Param("id")

	var staff models.Staff
	if err := database.DB.First(&staff, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "직원을 찾을 수 없습니다"})
		return
	}

	if err := database.DB.Delete(&staff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "직원 삭제에 실패했습니다"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "직원이 삭제되었습니다"})
}
