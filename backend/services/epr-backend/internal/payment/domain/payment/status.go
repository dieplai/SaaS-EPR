package payment

type Status string

const (
	StatusPending   Status = "pending"
	StatusCompleted Status = "completed"
	StatusFailed    Status = "failed"
	StatusCancelled Status = "cancelled"
	StatusRefunded  Status = "refunded"
)

func (s Status) String() string {
	return string(s)
}

func (s Status) IsValid() bool {
	switch s {
	case StatusPending, StatusCompleted, StatusFailed, StatusCancelled, StatusRefunded:
		return true
	default:
		return false
	}
}

func (s Status) IsFinal() bool {
	return s == StatusCompleted || s == StatusFailed || s == StatusCancelled || s == StatusRefunded
}
