package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/epr-legal/epr-backend/internal/payment/domain/payment"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type PaymentRepository struct {
	db *sqlx.DB
}

func NewPaymentRepository(db *sqlx.DB) *PaymentRepository {
	return &PaymentRepository{db: db}
}

func (r *PaymentRepository) Save(ctx context.Context, pmt *payment.Payment) error {
	model := toModel(pmt)

	query := `
		INSERT INTO payments (
			id, user_id, package_id, order_code, amount, currency, period,
			sepay_transaction_id, sepay_reference_code, sepay_gateway,
			sepay_account_number, sepay_transaction_date, sepay_transfer_content,
			status, created_at, updated_at, paid_at, expires_at
		) VALUES (
			:id, :user_id, :package_id, :order_code, :amount, :currency, :period,
			:sepay_transaction_id, :sepay_reference_code, :sepay_gateway,
			:sepay_account_number, :sepay_transaction_date, :sepay_transfer_content,
			:status, :created_at, :updated_at, :paid_at, :expires_at
		)
		ON CONFLICT (id) DO UPDATE SET
			sepay_transaction_id = EXCLUDED.sepay_transaction_id,
			sepay_reference_code = EXCLUDED.sepay_reference_code,
			sepay_gateway = EXCLUDED.sepay_gateway,
			sepay_account_number = EXCLUDED.sepay_account_number,
			sepay_transaction_date = EXCLUDED.sepay_transaction_date,
			sepay_transfer_content = EXCLUDED.sepay_transfer_content,
			status = EXCLUDED.status,
			updated_at = EXCLUDED.updated_at,
			paid_at = EXCLUDED.paid_at
	`

	_, err := r.db.NamedExecContext(ctx, query, model)
	return err
}

func (r *PaymentRepository) FindByID(ctx context.Context, id uuid.UUID) (*payment.Payment, error) {
	var model PaymentModel
	query := `SELECT * FROM payments WHERE id = $1`

	err := r.db.GetContext(ctx, &model, query, id)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("payment not found")
	}
	if err != nil {
		return nil, err
	}

	return toDomain(&model), nil
}

func (r *PaymentRepository) FindByOrderCode(ctx context.Context, orderCode string) (*payment.Payment, error) {
	var model PaymentModel
	query := `SELECT * FROM payments WHERE order_code = $1`

	err := r.db.GetContext(ctx, &model, query, orderCode)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("payment not found")
	}
	if err != nil {
		return nil, err
	}

	return toDomain(&model), nil
}

func (r *PaymentRepository) FindBySepayTransactionID(ctx context.Context, transactionID int64) (*payment.Payment, error) {
	var model PaymentModel
	query := `SELECT * FROM payments WHERE sepay_transaction_id = $1`

	err := r.db.GetContext(ctx, &model, query, transactionID)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("payment not found")
	}
	if err != nil {
		return nil, err
	}

	return toDomain(&model), nil
}

func (r *PaymentRepository) FindByUserID(ctx context.Context, userID uuid.UUID) ([]*payment.Payment, error) {
	var models []PaymentModel
	query := `SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC`

	err := r.db.SelectContext(ctx, &models, query, userID)
	if err != nil {
		return nil, err
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
