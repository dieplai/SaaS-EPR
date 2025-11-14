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

	"github.com/yourusername/epr-saas/package-service/internal/config"
	"github.com/yourusername/epr-saas/package-service/internal/domain"
	deliveryHttp "github.com/yourusername/epr-saas/package-service/internal/delivery/http"
	postgresRepo "github.com/yourusername/epr-saas/package-service/internal/repository/postgres"
	"github.com/yourusername/epr-saas/package-service/internal/usecase"
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
	packageRepo := postgresRepo.NewPackageRepository(db)
	subscriptionRepo := postgresRepo.NewSubscriptionRepository(db)
	usageQuotaRepo := postgresRepo.NewUsageQuotaRepository(db)
	log.Println("✅ Repositories initialized")

	// ============================================
	// 5. INITIALIZE USE CASES
	// ============================================
	log.Println("💼 Initializing use cases...")
	packageUseCase := usecase.NewPackageUseCase(packageRepo)
	subscriptionUseCase := usecase.NewSubscriptionUseCase(subscriptionRepo, packageRepo, usageQuotaRepo)
	log.Println("✅ Use cases initialized")

	// ============================================
	// 6. INITIALIZE HANDLERS & MIDDLEWARE
	// ============================================
	log.Println("🎯 Initializing handlers...")
	packageHandler := deliveryHttp.NewPackageHandler(packageUseCase)
	subscriptionHandler := deliveryHttp.NewSubscriptionHandler(subscriptionUseCase)
	jwtMiddleware := deliveryHttp.NewJWTMiddleware(cfg)
	log.Println("✅ Handlers initialized")

	// ============================================
	// 7. SETUP GIN ROUTER
	// ============================================
	log.Println("🚀 Setting up router...")
	router := setupRouter(packageHandler, subscriptionHandler, jwtMiddleware)
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
	return db.AutoMigrate(
		&domain.Package{},
		&domain.Subscription{},
		&domain.UsageQuota{},
	)
}

// ============================================
// ROUTER SETUP
// ============================================

// setupRouter configures the Gin router with all routes and middleware
func setupRouter(
	packageHandler *deliveryHttp.PackageHandler,
	subscriptionHandler *deliveryHttp.SubscriptionHandler,
	jwtMiddleware *deliveryHttp.JWTMiddleware,
) *gin.Engine {
	router := gin.New()

	// ============================================
	// GLOBAL MIDDLEWARE
	// ============================================
	router.Use(gin.Recovery())             // Recover from panics
	router.Use(deliveryHttp.CORS())        // Enable CORS
	router.Use(deliveryHttp.Logger())      // Log requests

	// ============================================
	// HEALTH CHECK
	// ============================================
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "package-service",
			"version": "1.0.0",
		})
	})

	// ============================================
	// API V1 ROUTES
	// ============================================
	v1 := router.Group("/api/v1")
	{
		// ============================================
		// PUBLIC ROUTES (no authentication)
		// ============================================

		// Get active packages (for pricing page)
		v1.GET("/packages/active", packageHandler.GetActivePackages)

		// ============================================
		// PROTECTED ROUTES (require authentication)
		// ============================================
		protected := v1.Group("")
		protected.Use(jwtMiddleware.Authenticate())
		{
			// ===== PACKAGE ROUTES (Admin only - in production add admin check) =====
			packages := protected.Group("/packages")
			{
				packages.POST("", packageHandler.CreatePackage)         // Create package
				packages.GET("", packageHandler.GetAllPackages)         // List all packages
				packages.GET("/:id", packageHandler.GetPackage)         // Get package by ID
				packages.PUT("/:id", packageHandler.UpdatePackage)      // Update package
				packages.DELETE("/:id", packageHandler.DeletePackage)   // Delete package
			}

			// ===== SUBSCRIPTION ROUTES (User) =====
			subscriptions := protected.Group("/subscriptions")
			{
				subscriptions.POST("", subscriptionHandler.CreateSubscription)              // Subscribe to package
				subscriptions.GET("/me", subscriptionHandler.GetMySubscriptions)            // Get my subscriptions
				subscriptions.GET("/me/active", subscriptionHandler.GetMyActiveSubscription) // Get active subscription
				subscriptions.GET("/:id", subscriptionHandler.GetSubscription)              // Get subscription by ID
				subscriptions.POST("/:id/cancel", subscriptionHandler.CancelSubscription)   // Cancel subscription

				// Quota management
				subscriptions.GET("/check-quota", subscriptionHandler.CheckQuota)   // Check if can query
				subscriptions.POST("/record-query", subscriptionHandler.RecordQuery) // Record query usage
			}
		}
	}

	return router
}
