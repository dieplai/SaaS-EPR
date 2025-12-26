package sepay

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/url"

	"github.com/shopspring/decimal"
)

type Client struct {
	merchantID    string
	secretKey     string
	bankName      string
	bankAccount   string
	accountHolder string
}

func NewClient(merchantID, secretKey, bankName, bankAccount, accountHolder string) *Client {
	return &Client{
		merchantID:    merchantID,
		secretKey:     secretKey,
		bankName:      bankName,
		bankAccount:   bankAccount,
		accountHolder: accountHolder,
	}
}

// GenerateQRCode generates a VietQR payment QR code URL
// Format: https://qr.sepay.vn/img?acc={account}&bank={bank}&amount={amount}&des={description}
func (c *Client) GenerateQRCode(orderCode string, amount decimal.Decimal) string {
	params := url.Values{}
	params.Add("acc", c.bankAccount)
	params.Add("bank", c.bankName)
	params.Add("amount", amount.StringFixed(0)) // VND doesn't use decimals
	params.Add("des", orderCode)

	return fmt.Sprintf("https://qr.sepay.vn/img?%s", params.Encode())
}

// VerifyWebhookSignature verifies the webhook signature from SePay
// SePay uses HMAC-SHA256 for webhook signatures
func (c *Client) VerifyWebhookSignature(signature string, payload []byte) bool {
	// If no secret key configured, skip verification (for testing)
	if c.secretKey == "" {
		return true
	}

	// Calculate expected signature
	mac := hmac.New(sha256.New, []byte(c.secretKey))
	mac.Write(payload)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	// Compare signatures
	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

// GetBankInfo returns bank account information for display
func (c *Client) GetBankInfo() map[string]string {
	return map[string]string{
		"bank_name":      c.bankName,
		"account_number": c.bankAccount,
		"account_holder": c.accountHolder,
	}
}
