package database

import (
	"log"
	"timehair-backend/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Initialize 데이터베이스 초기화
func Initialize(dbPath string) error {
	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return err
	}

	// 테이블 자동 마이그레이션
	err = DB.AutoMigrate(
		&models.User{},
		&models.Member{},
		&models.Staff{},
		&models.Seat{},
		&models.ServiceSession{},
		&models.SelectedService{},
		&models.Reservation{},
		&models.LedgerEntry{},
	)
	if err != nil {
		return err
	}

	// 초기 데이터 시딩
	seedInitialData()

	return nil
}

// seedInitialData 초기 데이터 생성
func seedInitialData() {
	// 기본 관리자 계정 생성
	var userCount int64
	DB.Model(&models.User{}).Count(&userCount)
	if userCount == 0 {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)
		admin := models.User{
			ID:       uuid.New().String(),
			Username: "admin",
			Password: string(hashedPassword),
		}
		DB.Create(&admin)
		log.Println("기본 관리자 계정 생성: admin / admin")
	}

	// 기본 직원 생성
	var staffCount int64
	DB.Model(&models.Staff{}).Count(&staffCount)
	if staffCount == 0 {
		staffs := []models.Staff{
			{ID: "staff-1", Name: "원장"},
			{ID: "staff-2", Name: "직원1"},
			{ID: "staff-3", Name: "직원2"},
			{ID: "staff-4", Name: "직원3"},
			{ID: "staff-5", Name: "직원4"},
		}
		DB.Create(&staffs)
		log.Println("기본 직원 데이터 생성")
	}

	// 기본 좌석 생성
	var seatCount int64
	DB.Model(&models.Seat{}).Count(&seatCount)
	if seatCount == 0 {
		seats := []models.Seat{
			{ID: 1, Name: "1번 좌석", Status: models.SeatAvailable},
			{ID: 2, Name: "2번 좌석", Status: models.SeatAvailable},
			{ID: 3, Name: "3번 좌석", Status: models.SeatAvailable},
			{ID: 4, Name: "4번 좌석", Status: models.SeatAvailable},
			{ID: 5, Name: "5번 좌석", Status: models.SeatAvailable},
			{ID: 6, Name: "6번 좌석", Status: models.SeatAvailable},
		}
		DB.Create(&seats)
		log.Println("기본 좌석 데이터 생성")
	}
}

// GetDB 데이터베이스 인스턴스 반환
func GetDB() *gorm.DB {
	return DB
}
