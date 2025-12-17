package subscription

import "fmt"

type Status string

const (
	StatusActive   Status = "active"
	StatusExpired  Status = "expired"
	StatusCanceled Status = "canceled"
)

func NewStatus(value string) (Status, error) {
	s := Status(value)
	switch s {
	case StatusActive, StatusExpired, StatusCanceled:
		return s, nil
	default:
		return "", fmt.Errorf("invalid subscription status: %s", value)
	}
}

func (s Status) String() string {
	return string(s)
}

func (s Status) IsActive() bool {
	return s == StatusActive
}
