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

	"github.com/epr-legal/epr-backend/internal/identity/application/command"
	identityquery "github.com/epr-legal/epr-backend/internal/identity/application/query"
	identityinfra "github.com/epr-legal/epr-backend/internal/identity/infrastructure/persistence/postgres"
	"github.com/epr-legal/epr-backend/internal/identity/infrastructure/security"
	identityhttp "github.com/epr-legal/epr-backend/internal/identity/presentation/http"
	identityhandler "github.com/epr-legal/epr-backend/internal/identity/presentation/http/handler"
	"github.com/epr-legal/epr-backend/internal/identity/presentation/http/middleware"
	"github.com/epr-legal/epr-backend/internal/shared/infrastructure/config"
	"github.com/epr-legal/epr-backend/internal/shared/infrastructure/database"
	"github.com/epr-legal/epr-backend/internal/shared/infrastructure/logger"
	subscriptioncommand "github.com/epr-legal/epr-backend/internal/subscription/application/command"
	subscriptionquery "github.com/epr-legal/epr-backend/internal/subscription/application/query"
	subscriptioninfra "github.com/epr-legal/epr-backend/internal/subscription/infrastructure/persistence/postgres"
	"github.com/epr-legal/epr-backend/internal/subscription/infrastructure/scheduler"
	subscriptionhttp "github.com/epr-legal/epr-backend/internal/subscription/presentation/http"
	subscriptionhandler "github.com/epr-legal/epr-backend/internal/subscription/presentation/http/handler"
	"github.com/gin-gonic/gin"
)

func main() {
	logger := logger.NewLogger()
	logger.Info("Starting EPR Backend Service...")

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	logger.Info("Connecting to database...")
	db, err := database.NewPostgresConnection(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// NOTE: Database migrations are handled by CI/CD pipeline
	// See: infrastructure/scripts/run-migrations.sh
	// Migrations run BEFORE application deployment

	jwtService := security.NewJWTService(
		cfg.JWT.Secret,
		cfg.JWT.AccessExpiration,
		cfg.JWT.RefreshExpiration,
	)

	userRepo := identityinfra.NewUserRepository(db)
	packageRepo := subscriptioninfra.NewPackageRepository(db)
	subscriptionRepo := subscriptioninfra.NewSubscriptionRepository(db)
	systemSettingsRepo := subscriptioninfra.NewSystemSettingsRepository(db)

	// Identity handlers
	registerUserHandler := command.NewRegisterUserHandler(userRepo)
	loginUserHandler := command.NewLoginUserHandler(userRepo)
	getUserProfileHandler := identityquery.NewGetUserProfileHandler(userRepo)

	// Subscription handlers
	createPackageHandler := subscriptioncommand.NewCreatePackageHandler(packageRepo)
	updatePackageHandler := subscriptioncommand.NewUpdatePackageHandler(packageRepo)
	deletePackageHandler := subscriptioncommand.NewDeletePackageHandler(packageRepo)
	getPackageHandler := subscriptionquery.NewGetPackageHandler(packageRepo)
	listPackagesHandler := subscriptionquery.NewListPackagesHandler(packageRepo)

	createSubscriptionHandler := subscriptioncommand.NewCreateSubscriptionHandler(subscriptionRepo, packageRepo, systemSettingsRepo)
	cancelSubscriptionHandler := subscriptioncommand.NewCancelSubscriptionHandler(subscriptionRepo)
	consumeTokensHandler := subscriptioncommand.NewConsumeTokensHandler(subscriptionRepo, packageRepo)
	getSubscriptionHandler := subscriptionquery.NewGetSubscriptionHandler(subscriptionRepo, packageRepo)

	// Token reset handlers
	processTokenResetsHandler := subscriptioncommand.NewProcessTokenResetsHandler(subscriptionRepo, systemSettingsRepo)
	getTokenResetSettingsHandler := subscriptionquery.NewGetTokenResetSettingsHandler(systemSettingsRepo)
	updateTokenResetSettingsHandler := subscriptioncommand.NewUpdateTokenResetSettingsHandler(systemSettingsRepo, subscriptionRepo)

	// Free account settings handlers
	getFreeAccountSettingsHandler := subscriptionquery.NewGetFreeAccountSettingsHandler(systemSettingsRepo)
	updateFreeAccountSettingsHandler := subscriptioncommand.NewUpdateFreeAccountSettingsHandler(systemSettingsRepo)

	// Start token reset scheduler
	tokenResetScheduler := scheduler.NewTokenResetScheduler(processTokenResetsHandler)
	if err := tokenResetScheduler.Start(); err != nil {
		log.Fatalf("Failed to start token reset scheduler: %v", err)
	}
	defer tokenResetScheduler.Stop()

	// Cookie helper for secure cookie management
	isProduction := cfg.Server.Env == "production"
	cookieHelper := identityhandler.NewCookieHelper(isProduction, "")

	// HTTP handlers
	authHandler := identityhandler.NewAuthHandler(
		registerUserHandler,
		loginUserHandler,
		getUserProfileHandler,
		jwtService,
		cookieHelper,
		createSubscriptionHandler,
		packageRepo,
	)
	userHandler := identityhandler.NewUserHandler(getUserProfileHandler)

	packageHandler := subscriptionhandler.NewPackageHandler(
		createPackageHandler,
		updatePackageHandler,
		deletePackageHandler,
		getPackageHandler,
		listPackagesHandler,
	)
	subscriptionHandler := subscriptionhandler.NewSubscriptionHandler(
		createSubscriptionHandler,
		cancelSubscriptionHandler,
		consumeTokensHandler,
		getSubscriptionHandler,
	)
	settingsHandler := subscriptionhandler.NewSettingsHandler(
		getTokenResetSettingsHandler,
		updateTokenResetSettingsHandler,
		getFreeAccountSettingsHandler,
		updateFreeAccountSettingsHandler,
	)

	authMiddleware := middleware.NewAuthMiddleware(jwtService)

	router := setupRouter(cfg.Server.Env)
	router.Use(middleware.ErrorHandler())
	router.Use(middleware.CORS())

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "epr-backend",
		})
	})

	identityhttp.RegisterRoutes(router, authHandler, userHandler, authMiddleware)
	subscriptionhttp.RegisterRoutes(router, packageHandler, subscriptionHandler, settingsHandler, authMiddleware)

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.Server.Port),
		Handler: router,
	}

	go func() {
		logger.Info(fmt.Sprintf("Server starting on port %s", cfg.Server.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	logger.Info("Server exited")
}

func setupRouter(env string) *gin.Engine {
	if env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	return gin.Default()
}
