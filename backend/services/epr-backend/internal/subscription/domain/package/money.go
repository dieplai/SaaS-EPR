package packagedomain

import "fmt"

type Money struct {
	amount float64
}

func NewMoney(amount float64) (Money, error) {
	if amount < 0 {
		return Money{}, fmt.Errorf("money amount cannot be negative")
	}
	return Money{amount: amount}, nil
}

func (m Money) Amount() float64 {
	return m.amount
}

func (m Money) Equals(other Money) bool {
	return m.amount == other.amount
}
