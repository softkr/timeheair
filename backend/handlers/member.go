package handlers

import (
	"net/http"
	"timehair-backend/database"
	"timehair-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetMembers 회원 목록 조회
func GetMembers(c *gin.Context) {
	var members []models.Member

	query := database.DB.Order("created_at DESC")

	// 검색어 필터
	if search := c.Query("search"); search != "" {
		query = query.Where("name LIKE ? OR phone LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Find(&members).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "회원 목록 조회에 실패했습니다"})
		return
	}

	c.JSON(http.StatusOK, members)
}

// GetMember 회원 상세 조회
func GetMember(c *gin.Context) {
	id := c.Param("id")

	var member models.Member
	if err := database.DB.First(&member, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "회원을 찾을 수 없습니다"})
		return
	}

	c.JSON(http.StatusOK, member)
}

// CreateMember 회원 생성
func CreateMember(c *gin.Context) {
	var req models.MemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "잘못된 요청입니다"})
		return
	}

	// 전화번호 중복 체크
	var existing models.Member
	if err := database.DB.Where("phone = ?", req.Phone).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "이미 등록된 전화번호입니다"})
		return
	}

	member := models.Member{
		ID:     uuid.New().String(),
		Name:   req.Name,
		Phone:  req.Phone,
		Stamps: 0,
	}

	if err := database.DB.Create(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "회원 생성에 실패했습니다"})
		return
	}

	c.JSON(http.StatusCreated, member)
}

// UpdateMember 회원 수정
func UpdateMember(c *gin.Context) {
	id := c.Param("id")

	var member models.Member
	if err := database.DB.First(&member, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "회원을 찾을 수 없습니다"})
		return
	}

	var req models.MemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "잘못된 요청입니다"})
		return
	}

	// 전화번호 중복 체크 (본인 제외)
	var existing models.Member
	if err := database.DB.Where("phone = ? AND id != ?", req.Phone, id).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "이미 등록된 전화번호입니다"})
		return
	}

	member.Name = req.Name
	member.Phone = req.Phone

	if err := database.DB.Save(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "회원 수정에 실패했습니다"})
		return
	}

	c.JSON(http.StatusOK, member)
}

// DeleteMember 회원 삭제
func DeleteMember(c *gin.Context) {
	id := c.Param("id")

	var member models.Member
	if err := database.DB.First(&member, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "회원을 찾을 수 없습니다"})
		return
	}

	if err := database.DB.Delete(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "회원 삭제에 실패했습니다"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "회원이 삭제되었습니다"})
}

// AddStamp 스탬프 추가
func AddStamp(c *gin.Context) {
	id := c.Param("id")

	var member models.Member
	if err := database.DB.First(&member, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "회원을 찾을 수 없습니다"})
		return
	}

	member.Stamps++
	if err := database.DB.Save(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "스탬프 추가에 실패했습니다"})
		return
	}

	c.JSON(http.StatusOK, member)
}

// ResetStamps 스탬프 리셋
func ResetStamps(c *gin.Context) {
	id := c.Param("id")

	var member models.Member
	if err := database.DB.First(&member, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "회원을 찾을 수 없습니다"})
		return
	}

	member.Stamps = 0
	if err := database.DB.Save(&member).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "스탬프 리셋에 실패했습니다"})
		return
	}

	c.JSON(http.StatusOK, member)
}

// SearchMemberByPhone 전화번호로 회원 검색
func SearchMemberByPhone(c *gin.Context) {
	phone := c.Query("phone")
	if phone == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "전화번호를 입력해주세요"})
		return
	}

	var member models.Member
	if err := database.DB.Where("phone = ?", phone).First(&member).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "회원을 찾을 수 없습니다"})
		return
	}

	c.JSON(http.StatusOK, member)
}
