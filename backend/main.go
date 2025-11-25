package main

import (
	"log"
	"timehair-backend/config"
	"timehair-backend/database"
	"timehair-backend/handlers"
	"timehair-backend/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	// 설정 로드
	cfg := config.Load()

	// JWT 시크릿 설정
	middleware.SetJWTSecret(cfg.JWTSecret)

	// 데이터베이스 초기화
	if err := database.Initialize(cfg.DBPath); err != nil {
		log.Fatal("데이터베이스 초기화 실패:", err)
	}
	log.Println("데이터베이스 연결 성공")

	// Gin 라우터 설정
	r := gin.Default()

	// 미들웨어
	r.Use(middleware.CORSMiddleware())

	// API 라우터
	api := r.Group("/api")
	{
		// 인증 (공개)
		auth := api.Group("/auth")
		{
			auth.POST("/login", handlers.Login)
		}

		// 인증 필요한 API
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			// 현재 사용자
			protected.GET("/auth/me", handlers.GetCurrentUser)

			// 회원
			members := protected.Group("/members")
			{
				members.GET("", handlers.GetMembers)
				members.GET("/search", handlers.SearchMemberByPhone)
				members.GET("/:id", handlers.GetMember)
				members.POST("", handlers.CreateMember)
				members.PUT("/:id", handlers.UpdateMember)
				members.DELETE("/:id", handlers.DeleteMember)
				members.POST("/:id/stamp", handlers.AddStamp)
				members.POST("/:id/reset-stamps", handlers.ResetStamps)
			}

			// 직원
			staff := protected.Group("/staff")
			{
				staff.GET("", handlers.GetStaffList)
				staff.GET("/:id", handlers.GetStaff)
				staff.POST("", handlers.CreateStaff)
				staff.PUT("/:id", handlers.UpdateStaff)
				staff.DELETE("/:id", handlers.DeleteStaff)
			}

			// 좌석
			seats := protected.Group("/seats")
			{
				seats.GET("", handlers.GetSeats)
				seats.GET("/:id", handlers.GetSeat)
				seats.POST("/:id/start", handlers.StartService)
				seats.POST("/:id/complete", handlers.CompleteService)
				seats.POST("/:id/cancel", handlers.CancelService)
			}

			// 예약
			reservations := protected.Group("/reservations")
			{
				reservations.GET("", handlers.GetReservations)
				reservations.GET("/:id", handlers.GetReservation)
				reservations.POST("", handlers.CreateReservation)
				reservations.PUT("/:id", handlers.UpdateReservation)
				reservations.PATCH("/:id/status", handlers.UpdateReservationStatus)
				reservations.DELETE("/:id", handlers.DeleteReservation)
			}

			// 매출
			ledger := protected.Group("/ledger")
			{
				ledger.GET("", handlers.GetLedgerEntries)
				ledger.GET("/summary", handlers.GetLedgerSummary)
				ledger.GET("/daily", handlers.GetDailySummary)
			}
		}
	}

	// 서버 시작
	log.Printf("서버 시작: http://localhost:%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("서버 시작 실패:", err)
	}
}
