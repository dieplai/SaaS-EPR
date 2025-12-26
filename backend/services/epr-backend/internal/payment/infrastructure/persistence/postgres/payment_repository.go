package postgres

import (
	"context"
	"errors"

	"github.com/epr-legal/epr-backend/internal/payment/domain/payment"
	"github.com/epr-legal/epr-backend/internal/shared/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PaymentRepository struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) *PaymentRepository {
	return &PaymentRepository{db: db}
}

func (r *PaymentRepository) Save(ctx context.Context, pmt *payment.Payment) error {
	model := toModel(pmt)

	// UPSERT using GORM's Clauses
	return r.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{
			"sepay_transaction_id",
			"sepay_reference_code",
			"sepay_gateway",
			"sepay_account_number",
			"sepay_transaction_date",
			"sepay_transfer_content",
			"status",
			"updated_at",
			"paid_at",
		}),
	}).Create(model).Error
}

func (r *PaymentRepository) FindByID(ctx context.Context, id uuid.UUID) (*payment.Payment, error) {
	var model PaymentModel
	result := r.db.WithContext(ctx).Where("id = ?", id).First(&model)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, result.Error
	}

	return toDomain(&model), nil
}

func (r *PaymentRepository) FindByOrderCode(ctx context.Context, orderCode string) (*payment.Payment, error) {
	var model PaymentModel
	result := r.db.WithContext(ctx).Where("order_code = ?", orderCode).First(&model)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, result.Error
	}

	return toDomain(&model), nil
}

func (r *PaymentRepository) FindBySepayTransactionID(ctx context.Context, transactionID int64) (*payment.Payment, error) {
	var model PaymentModel
	result := r.db.WithContext(ctx).Where("sepay_transaction_id = ?", transactionID).First(&model)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, result.Error
	}

	return toDomain(&model), nil
}

func (r *PaymentRepository) FindByUserID(ctx context.Context, userID uuid.UUID) ([]*payment.Payment, error) {
	var models []PaymentModel
	result := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&models)

	if result.Error != nil {
		return nil, result.Error
	}

	payments := make([]*payment.Payment, len(models))
	for i, model := range models {
		payments[i] = toDomain(&model)
	}

	return payments, nil
}

// Helper functions to convert between domain and model

func toModel(pmt *payment.Payment) *PaymentModel {
	return &PaymentModel{
		ID:                   pmt.ID,
		UserID:               pmt.UserID(),
		PackageID:            pmt.PackageID(),
		OrderCode:            pmt.OrderCode(),
		Amount:               pmt.Amount(),
		Currency:             pmt.Currency(),
		Period:               pmt.Period(),
		SepayTransactionID:   pmt.SepayTransactionID(),
		SepayReferenceCode:   pmt.SepayReferenceCode(),
		SepayGateway:         pmt.SepayGateway(),
		SepayAccountNumber:   pmt.SepayAccountNumber(),
		SepayTransactionDate: pmt.SepayTransactionDate(),
		SepayTransferContent: pmt.SepayTransferContent(),
		Status:               pmt.Status().String(),
		CreatedAt:            pmt.CreatedAt,
		UpdatedAt:            pmt.UpdatedAt,
		PaidAt:               pmt.PaidAt(),
		ExpiresAt:            pmt.ExpiresAt(),
	}
}

func toDomain(model *PaymentModel) *payment.Payment {
	status := payment.StatusPending
	switch model.Status {
	case "pending":
		status = payment.StatusPending
	case "completed":
		status = payment.StatusCompleted
	case "failed":
		status = payment.StatusFailed
	case "cancelled":
		status = payment.StatusCancelled
	case "refunded":
		status = payment.StatusRefunded
	}

	return payment.ReconstructPayment(
		model.ID,
		model.UserID,
		model.PackageID,
		model.OrderCode,
		model.Amount,
		model.Currency,
		model.Period,
		status,
		model.SepayTransactionID,
		model.SepayReferenceCode,
		model.SepayGateway,
		model.SepayAccountNumber,
		model.SepayTransactionDate,
		model.SepayTransferContent,
		model.CreatedAt,
		model.UpdatedAt,
		model.PaidAt,
		model.ExpiresAt,
	)
}
