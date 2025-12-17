package packagedomain

import "fmt"

type Duration struct {
	days int
}

func NewDuration(days int) (Duration, error) {
	if days <= 0 {
		return Duration{}, fmt.Errorf("duration must be positive")
	}
	return Duration{days: days}, nil
}

func (d Duration) Days() int {
	return d.days
}
