package postgres

import (
	"context"

	"github.com/epr-legal/epr-backend/internal/subscription/domain/system_settings"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SystemSettingsRepository struct {
	db *gorm.DB
}

func NewSystemSettingsRepository(db *gorm.DB) *SystemSettingsRepository {
	return &SystemSettingsRepository{
		db: db,
	}
}

func (r *SystemSettingsRepository) Save(ctx context.Context, setting *system_settings.SystemSetting) error {
	model := r.toModel(setting)

	// Use ON CONFLICT to update if exists
	result := r.db.WithContext(ctx).
		Clauses().
		Save(model)

	return result.Error
}

func (r *SystemSettingsRepository) FindByKey(ctx context.Context, key string) (*system_settings.SystemSetting, error) {
	var model SystemSettingModel

	result := r.db.WithContext(ctx).
		Where("setting_key = ?", key).
		First(&model)

	if result.Error != nil {
		return nil, result.Error
	}

	return r.toDomain(&model), nil
}

func (r *SystemSettingsRepository) FindAll(ctx context.Context) ([]*system_settings.SystemSetting, error) {
	var models []SystemSettingModel

	result := r.db.WithContext(ctx).Find(&models)

	if result.Error != nil {
		return nil, result.Error
	}

	settings := make([]*system_settings.SystemSetting, len(models))
	for i, model := range models {
		settings[i] = r.toDomain(&model)
	}

	return settings, nil
}

func (r *SystemSettingsRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&SystemSettingModel{}, id).Error
}

func (r *SystemSettingsRepository) toModel(setting *system_settings.SystemSetting) *SystemSettingModel {
	return &SystemSettingModel{
		ID:           setting.ID,
		SettingKey:   setting.GetSettingKey(),
		SettingValue: setting.GetSettingValue(),
		Description:  setting.GetDescription(),
		ValueType:    string(setting.GetValueType()),
		UpdatedBy:    setting.GetUpdatedBy(),
		CreatedAt:    setting.CreatedAt,
		UpdatedAt:    setting.UpdatedAt,
	}
}

func (r *SystemSettingsRepository) toDomain(model *SystemSettingModel) *system_settings.SystemSetting {
	return system_settings.ReconstructSystemSetting(
		model.ID,
		model.SettingKey,
		model.SettingValue,
		model.Description,
		system_settings.ValueType(model.ValueType),
		model.UpdatedBy,
		model.CreatedAt,
		model.UpdatedAt,
	)
}
