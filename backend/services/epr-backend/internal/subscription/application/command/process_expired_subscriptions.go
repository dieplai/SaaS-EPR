package command

import (
	"context"
	"fmt"
	"log"

	"github.com/epr-legal/epr-backend/internal/subscription/domain/subscription"
	"github.com/epr-legal/epr-backend/internal/subscription/domain/system_settings"
)

type ProcessExpiredSubscriptionsCommand struct{}

type ProcessExpiredSubscriptionsHandler struct {
	subscriptionRepo         subscription.Repository
	settingsRepo             system_settings.Repository
	createSubscriptionHandler *CreateSubscriptionHandler
}

func NewProcessExpiredSubscriptionsHandler(
	subscriptionRepo subscription.Repository,
	settingsRepo system_settings.Repository,
	createSubscriptionHandler *CreateSubscriptionHandler,
) *ProcessExpiredSubscriptionsHandler {
	return &ProcessExpiredSubscriptionsHandler{
		subscriptionRepo:         subscriptionRepo,
		settingsRepo:             settingsRepo,
		createSubscriptionHandler: createSubscriptionHandler,
	}
}

func (h *ProcessExpiredSubscriptionsHandler) Handle(ctx context.Context, cmd ProcessExpiredSubscriptionsCommand) error {
	// Find all expired subscriptions (active status but end_date < NOW)
	expiredSubscriptions, err := h.subscriptionRepo.FindExpired(ctx)
	if err != nil {
		return fmt.Errorf("failed to find expired subscriptions: %w", err)
	}

	if len(expiredSubscriptions) == 0 {
		log.Println("[Subscription Expiry] No expired subscriptions found")
		return nil
	}

	log.Printf("[Subscription Expiry] Found %d expired subscriptions to process\n", len(expiredSubscriptions))

	successCount := 0
	errorCount := 0

	for _, expiredSub := range expiredSubscriptions {
		userID := expiredSub.GetUserID()
		packageID := expiredSub.GetPackageID()

		// Skip if this is already a free account
		if packageID == nil {
			log.Printf("[Subscription Expiry] Subscription %s is already a free account, skipping\n", expiredSub.ID)
			// Just mark as expired
			if err := expiredSub.Cancel(); err != nil {
				log.Printf("[Subscription Expiry] Failed to cancel free subscription %s: %v\n", expiredSub.ID, err)
				errorCount++
				continue
			}
			if err := h.subscriptionRepo.Save(ctx, expiredSub); err != nil {
				log.Printf("[Subscription Expiry] Failed to save expired free subscription %s: %v\n", expiredSub.ID, err)
				errorCount++
				continue
			}
			successCount++
			continue
		}

		// This is a PAID subscription that expired - downgrade to FREE
		log.Printf("[Subscription Expiry] Downgrading user %s from paid to free (expired subscription: %s)\n",
			userID, expiredSub.ID)

		// Cancel the expired paid subscription
		if err := expiredSub.Cancel(); err != nil {
			log.Printf("[Subscription Expiry] Failed to cancel subscription %s: %v\n", expiredSub.ID, err)
			errorCount++
			continue
		}

		if err := h.subscriptionRepo.Save(ctx, expiredSub); err != nil {
			log.Printf("[Subscription Expiry] Failed to save canceled subscription %s: %v\n", expiredSub.ID, err)
			errorCount++
			continue
		}

		// Create new FREE subscription for the user
		freeSubID, err := h.createSubscriptionHandler.Handle(ctx, CreateSubscriptionCommand{
			UserID:    userID,
			PackageID: nil, // nil = FREE account
		})

		if err != nil {
			// If the error is "active subscription exists", it's fine - user may have already upgraded
			if err == ErrActiveSubscriptionExists {
				log.Printf("[Subscription Expiry] User %s already has an active subscription, skipping free account creation\n", userID)
				successCount++
				continue
			}

			log.Printf("[Subscription Expiry] Failed to create free subscription for user %s: %v\n", userID, err)
			errorCount++
			continue
		}

		log.Printf("[Subscription Expiry] Successfully downgraded user %s to free account (new subscription: %s)\n",
			userID, freeSubID)
		successCount++
	}

	log.Printf("[Subscription Expiry] Completed: %d successful, %d errors\n", successCount, errorCount)

	if errorCount > 0 {
		return fmt.Errorf("subscription expiry processing completed with %d errors", errorCount)
	}

	return nil
}
