package packagedomain

import "fmt"

type TokenLimit struct {
	value int
}

func NewTokenLimit(value int) (TokenLimit, error) {
	if value <= 0 {
		return TokenLimit{}, fmt.Errorf("token limit must be positive")
	}
	return TokenLimit{value: value}, nil
}

func (t TokenLimit) Value() int {
	return t.value
}

// Legacy support - will be removed in future versions
type QueryLimit = TokenLimit

func NewQueryLimit(value int) (QueryLimit, error) {
	return NewTokenLimit(value)
}
