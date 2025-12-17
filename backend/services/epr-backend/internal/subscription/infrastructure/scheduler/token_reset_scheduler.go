package scheduler

import (
	"context"
	"log"

	"github.com/epr-legal/epr-backend/internal/subscription/application/command"
	"github.com/robfig/cron/v3"
)

// TokenResetScheduler runs periodic token reset jobs
type TokenResetScheduler struct {
	cron    *cron.Cron
	handler *command.ProcessTokenResetsHandler
}

// NewTokenResetScheduler creates a new token reset scheduler
func NewTokenResetScheduler(handler *command.ProcessTokenResetsHandler) *TokenResetScheduler {
	return &TokenResetScheduler{
		cron:    cron.New(),
		handler: handler,
	}
}

// Start starts the scheduler
// The job runs every hour to check for subscriptions that need token reset
func (s *TokenResetScheduler) Start() error {
	log.Println("[Token Reset Scheduler] Starting token reset scheduler")

	// Run every hour
	_, err := s.cron.AddFunc("0 * * * *", func() {
		log.Println("[Token Reset Scheduler] Running token reset job")

		ctx := context.Background()
		if err := s.handler.Handle(ctx, command.ProcessTokenResetsCommand{}); err != nil {
			log.Printf("[Token Reset Scheduler] Error processing token resets: %v\n", err)
		}
	})

	if err != nil {
		return err
	}

	s.cron.Start()
	log.Println("[Token Reset Scheduler] Scheduler started successfully")

	return nil
}

// Stop stops the scheduler
func (s *TokenResetScheduler) Stop() {
	log.Println("[Token Reset Scheduler] Stopping token reset scheduler")
	s.cron.Stop()
}

// RunNow manually triggers the token reset job (useful for testing)
func (s *TokenResetScheduler) RunNow() error {
	log.Println("[Token Reset Scheduler] Manually triggering token reset job")
	ctx := context.Background()
	return s.handler.Handle(ctx, command.ProcessTokenResetsCommand{})
}
