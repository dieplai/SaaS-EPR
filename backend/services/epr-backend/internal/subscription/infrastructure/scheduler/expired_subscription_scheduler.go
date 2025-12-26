package scheduler

import (
	"context"
	"log"

	"github.com/epr-legal/epr-backend/internal/subscription/application/command"
	"github.com/robfig/cron/v3"
)

type ExpiredSubscriptionScheduler struct {
	cron    *cron.Cron
	handler *command.ProcessExpiredSubscriptionsHandler
}

func NewExpiredSubscriptionScheduler(handler *command.ProcessExpiredSubscriptionsHandler) *ExpiredSubscriptionScheduler {
	return &ExpiredSubscriptionScheduler{
		cron:    cron.New(),
		handler: handler,
	}
}

func (s *ExpiredSubscriptionScheduler) Start() error {
	// Run every hour at 15 minutes past the hour (offset from token reset scheduler)
	// This gives time for any pending operations to complete
	_, err := s.cron.AddFunc("15 * * * *", func() {
		log.Println("[Expired Subscription Scheduler] Starting expired subscription processing...")

		ctx := context.Background()
		if err := s.handler.Handle(ctx, command.ProcessExpiredSubscriptionsCommand{}); err != nil {
			log.Printf("[Expired Subscription Scheduler] Error processing expired subscriptions: %v\n", err)
		} else {
			log.Println("[Expired Subscription Scheduler] Completed successfully")
		}
	})

	if err != nil {
		return err
	}

	s.cron.Start()
	log.Println("[Expired Subscription Scheduler] Started (runs every hour at :15)")
	return nil
}

func (s *ExpiredSubscriptionScheduler) Stop() {
	log.Println("[Expired Subscription Scheduler] Stopping...")
	s.cron.Stop()
}
