package logger

import (
	"log"
	"os"
)

type Logger struct {
	logger *log.Logger
}

func NewLogger() *Logger {
	return &Logger{
		logger: log.New(os.Stdout, "[EPR] ", log.LstdFlags),
	}
}

func (l *Logger) Info(msg string) {
	l.logger.Printf("[INFO] %s", msg)
}

func (l *Logger) Error(msg string) {
	l.logger.Printf("[ERROR] %s", msg)
}

func (l *Logger) Debug(msg string) {
	l.logger.Printf("[DEBUG] %s", msg)
}

func (l *Logger) Warn(msg string) {
	l.logger.Printf("[WARN] %s", msg)
}
