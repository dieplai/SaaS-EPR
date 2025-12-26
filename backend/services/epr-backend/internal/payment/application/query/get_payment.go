package query

import (
	"context"
	"fmt"

	"github.com/epr-legal/epr-backend/internal/payment/application/dto"
	"github.com/epr-legal/epr-backend/internal/payment/domain/payment"
	"github.com/google/uuid"
)

type GetPaymentQuery struct {
	PaymentID uuid.UUID
}

type GetPaymentHandler struct {
	paymentRepo payment.Repository
}

func NewGetPaymentHandler(paymentRepo payment.Repository) *GetPaymentHandler {
	return &GetPaymentHandler{
		paymentRepo: paymentRepo,
	}
}

func (h *GetPaymentHandler) Handle(ctx context.Context, query GetPaymentQuery) (*dto.PaymentDTO, error) {
	pmt, err := h.paymentRepo.FindByID(ctx, query.PaymentID)
	if err != nil {
		return nil, fmt.Errorf("payment not found: %w", err)
	}

	return dto.FromPaymentDomain(pmt), nil
}
