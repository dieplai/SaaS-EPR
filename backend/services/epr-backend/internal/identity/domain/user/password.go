package user

import (
	"errors"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

type Password struct {
	hash string
}

var (
	ErrWeakPassword    = errors.New("password is too weak")
	ErrInvalidPassword = errors.New("invalid password")
	minPasswordLength  = 8
)

func NewPassword(plainPassword string) (Password, error) {
	if err := validatePasswordStrength(plainPassword); err != nil {
		return Password{}, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	if err != nil {
		return Password{}, err
	}

	return Password{hash: string(hash)}, nil
}

func NewPasswordFromHash(hash string) Password {
	return Password{hash: hash}
}

func (p Password) Verify(plainPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(p.hash), []byte(plainPassword))
	return err == nil
}

func (p Password) Hash() string {
	return p.hash
}

func validatePasswordStrength(password string) error {
	if len(password) < minPasswordLength {
		return ErrWeakPassword
	}

	var (
		hasUpper  bool
		hasLower  bool
		hasNumber bool
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsDigit(char):
			hasNumber = true
		}
	}

	if !hasUpper || !hasLower || !hasNumber {
		return ErrWeakPassword
	}

	return nil
}
