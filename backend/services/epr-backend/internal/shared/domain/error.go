package domain

import "errors"

var (
	ErrNotFound          = errors.New("entity not found")
	ErrAlreadyExists     = errors.New("entity already exists")
	ErrInvalidInput      = errors.New("invalid input")
	ErrUnauthorized      = errors.New("unauthorized")
	ErrForbidden         = errors.New("forbidden")
	ErrInvalidState      = errors.New("invalid state")
	ErrInvalidOperation  = errors.New("invalid operation")
)
