package system_settings

import (
	"context"

	"github.com/google/uuid"
)

// Repository defines the interface for system settings persistence
type Repository interface {
	// Save saves or updates a system setting
	Save(ctx context.Context, setting *SystemSetting) error

	// FindByKey finds a setting by its key
	FindByKey(ctx context.Context, key string) (*SystemSetting, error)

	// FindAll retrieves all system settings
	FindAll(ctx context.Context) ([]*SystemSetting, error)

	// Delete deletes a setting by ID
	Delete(ctx context.Context, id uuid.UUID) error
}
