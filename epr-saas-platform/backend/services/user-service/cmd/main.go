package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/yourusername/epr-saas/user-service/internal/config"
	"github.com/yourusername/epr-saas/user-service/internal/domain"
	deliveryHttp "github.com/yourusername/epr-saas/user-service/internal/delivery/http"
	"github.com/yourusername/epr-saas/user-service/internal/repository"
	postgresRepo "github.com/yourusername/epr-saas/user-service/internal/repository/postgres"
	"github.com/yourusername/epr-saas/user-service/internal/usecase"
)

func main() {
	// ============================================
	// 1. LOAD CONFIGURATION
	// ============================================
	log.Println("🔧 Loading configuration...")
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Set Gin mode based on environment
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	log.Printf("✅ Config loaded (ENV: %s, PORT: %s)", cfg.Env, cfg.Port)

	// ============================================
	// 2. CONNECT TO DATABASE
	// ============================================
	log.Println("🔌 Connecting to PostgreSQL...")
	db, err := connectDatabase(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("✅ Database connected")

	// ============================================
	// 3. RUN MIGRATIONS
	// ============================================
	log.Println("🔄 Running database migrations...")
	if err := runMigrations(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("✅ Migrations completed")

	// ============================================
	// 4. INITIALIZE REPOSITORIES
	// ============================================
	log.Println("📦 Initializing repositories...")
	userRepo := postgresRepo.NewUserRepository(db)
	tokenRepo := postgresRepo.NewRefreshTokenRepository(db)
	log.Println("✅ Repositories initialized")

	// ============================================
	// 5. INITIALIZE USE CASES
	// ============================================
	log.Println("💼 Initializing use cases...")
	authUseCase := usecase.NewAuthUseCase(userRepo, tokenRepo, cfg)
	log.Println("✅ Use cases initialized")

	// ============================================
	// 6. INITIALIZE HANDLERS & MIDDLEWARE
	// ============================================
	log.Println("🎯 Initializing handlers...")
	authHandler := deliveryHttp.NewAuthHandler(authUseCase)
	jwtMiddleware := deliveryHttp.NewJWTMiddleware(cfg)
	log.Println("✅ Handlers initialized")

	// ============================================
	// 7. SETUP GIN ROUTER
	// ============================================
	log.Println("🚀 Setting up router...")
	router := setupRouter(authHandler, jwtMiddleware)
	log.Println("✅ Router configured")

	// ============================================
	// 8. START HTTP SERVER
	// ============================================
	srv := &http.Server{
		Addr:           ":" + cfg.Port,
		Handler:        router,
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1 MB
	}

	// Start server in goroutine
	go func() {
		log.Printf("🌐 Server starting on http://localhost:%s", cfg.Port)
		log.Printf("📚 API documentation: http://localhost:%s/api/v1/health", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// ============================================
	// 9. GRACEFUL SHUTDOWN
	// ============================================
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server exited gracefully")
}

// ============================================
// DATABASE CONNECTION
// ============================================

// connectDatabase establishes a connection to PostgreSQL
func connectDatabase(cfg *config.Config) (*gorm.DB, error) {
	// Configure GORM logger
	gormLogger := logger.Default.LogMode(logger.Info)
	if cfg.IsProduction() {
		gormLogger = logger.Default.LogMode(logger.Error)
	}

	// Connect to PostgreSQL
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: gormLogger,
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})

	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Get underlying SQL DB for connection pooling
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get SQL DB: %w", err)
	}

	// Configure connection pool
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Ping database to verify connection
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}

// ============================================
// DATABASE MIGRATIONS
// ============================================

// runMigrations runs GORM auto migrations
func runMigrations(db *gorm.DB) error {
	// AutoMigrate will create tables if they don't exist
	// For production, use migration files instead
	return db.AutoMigrate(
		&domain.User{},
		&repository.RefreshToken{},
	)
}

// ============================================
// ROUTER SETUP
// ============================================

// setupRouter configures the Gin router with all routes and middleware
func setupRouter(authHandler *deliveryHttp.AuthHandler, jwtMiddleware *deliveryHttp.JWTMiddleware) *gin.Engine {
	router := gin.New()

	// ============================================
	// GLOBAL MIDDLEWARE
	// ============================================
	router.Use(gin.Recovery()) // Recover from panics
	router.Use(deliveryHttp.CORS()) // Enable CORS
	router.Use(deliveryHttp.Logger()) // Log requests

	// ============================================
	// HEALTH CHECK
	// ============================================
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "user-service",
			"version": "1.0.0",
		})
	})

	// ============================================
	// API V1 ROUTES
	// ============================================
	v1 := router.Group("/api/v1")
	{
		// Auth routes (public + protected)
		authHandler.RegisterRoutes(v1, jwtMiddleware)

		// Protected user routes (example)
		users := v1.Group("/users")
		users.Use(jwtMiddleware.Authenticate()) // Apply JWT middleware
		{
			users.GET("/me", func(c *gin.Context) {
				userID := c.GetString("userID")
				email := c.GetString("email")

				c.JSON(http.StatusOK, gin.H{
					"user_id": userID,
					"email":   email,
					"message": "This is a protected route",
				})
			})
		}
	}

	return router
}
