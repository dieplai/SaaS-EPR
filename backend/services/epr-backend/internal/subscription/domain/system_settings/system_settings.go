package system_settings

import (
	"fmt"
	"strconv"
	"time"

	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/google/uuid"
)

// ValueType represents the type of a setting value
type ValueType string

const (
	ValueTypeString  ValueType = "string"
	ValueTypeInteger ValueType = "integer"
	ValueTypeBoolean ValueType = "boolean"
	ValueTypeJSON    ValueType = "json"
)

// SystemSetting represents a global system configuration setting
type SystemSetting struct {
	domain.BaseEntity
	settingKey   string
	settingValue string
	description  string
	valueType    ValueType
	updatedBy    *uuid.UUID
}

// NewSystemSetting creates a new system setting
func NewSystemSetting(
	settingKey string,
	settingValue string,
	description string,
	valueType ValueType,
	updatedBy *uuid.UUID,
) (*SystemSetting, error) {
	if settingKey == "" {
		return nil, fmt.Errorf("setting key cannot be empty")
	}

	if settingValue == "" {
		return nil, fmt.Errorf("setting value cannot be empty")
	}

	setting := &SystemSetting{
		BaseEntity: domain.BaseEntity{
			ID: uuid.New(),
		},
		settingKey:   settingKey,
		settingValue: settingValue,
		description:  description,
		valueType:    valueType,
		updatedBy:    updatedBy,
	}

	return setting, nil
}

// ReconstructSystemSetting reconstructs a system setting from persistence
func ReconstructSystemSetting(
	id uuid.UUID,
	settingKey string,
	settingValue string,
	description string,
	valueType ValueType,
	updatedBy *uuid.UUID,
	createdAt time.Time,
	updatedAt time.Time,
) *SystemSetting {
	return &SystemSetting{
		BaseEntity: domain.BaseEntity{
			ID:        id,
			CreatedAt: createdAt,
			UpdatedAt: updatedAt,
		},
		settingKey:   settingKey,
		settingValue: settingValue,
		description:  description,
		valueType:    valueType,
		updatedBy:    updatedBy,
	}
}

// Getters
func (s *SystemSetting) GetSettingKey() string {
	return s.settingKey
}

func (s *SystemSetting) GetSettingValue() string {
	return s.settingValue
}

func (s *SystemSetting) GetDescription() string {
	return s.description
}

func (s *SystemSetting) GetValueType() ValueType {
	return s.valueType
}

func (s *SystemSetting) GetUpdatedBy() *uuid.UUID {
	return s.updatedBy
}

func (s *SystemSetting) GetUpdatedAt() time.Time {
	return s.UpdatedAt
}

// GetIntValue returns the value as an integer
func (s *SystemSetting) GetIntValue() (int, error) {
	if s.valueType != ValueTypeInteger {
		return 0, fmt.Errorf("setting is not of type integer")
	}

	val, err := strconv.Atoi(s.settingValue)
	if err != nil {
		return 0, fmt.Errorf("failed to parse integer value: %w", err)
	}

	return val, nil
}

// GetBoolValue returns the value as a boolean
func (s *SystemSetting) GetBoolValue() (bool, error) {
	if s.valueType != ValueTypeBoolean {
		return false, fmt.Errorf("setting is not of type boolean")
	}

	val, err := strconv.ParseBool(s.settingValue)
	if err != nil {
		return false, fmt.Errorf("failed to parse boolean value: %w", err)
	}

	return val, nil
}

// UpdateValue updates the setting value
func (s *SystemSetting) UpdateValue(newValue string, updatedBy *uuid.UUID) error {
	if newValue == "" {
		return fmt.Errorf("setting value cannot be empty")
	}

	// Validate the new value based on type
	switch s.valueType {
	case ValueTypeInteger:
		if _, err := strconv.Atoi(newValue); err != nil {
			return fmt.Errorf("invalid integer value: %w", err)
		}
	case ValueTypeBoolean:
		if _, err := strconv.ParseBool(newValue); err != nil {
			return fmt.Errorf("invalid boolean value: %w", err)
		}
	}

	s.settingValue = newValue
	s.updatedBy = updatedBy

	return nil
}
