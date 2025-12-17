package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// CookieConfig holds cookie configuration
type CookieConfig struct {
	IsProduction bool
	Domain       string
}

// CookieHelper provides methods for secure cookie management
type CookieHelper struct {
	config CookieConfig
}

// NewCookieHelper creates a new cookie helper
func NewCookieHelper(isProduction bool, domain string) *CookieHelper {
	return &CookieHelper{
		config: CookieConfig{
			IsProduction: isProduction,
			Domain:       domain,
		},
	}
}

// SetAuthCookie sets an authentication cookie with secure defaults
// Uses HTTP-only, Secure (in production), and SameSite=Lax for CSRF protection
func (h *CookieHelper) SetAuthCookie(c *gin.Context, name, value string, maxAge int) {
	c.SetSameSite(http.SameSiteLaxMode) // CSRF protection

	c.SetCookie(
		name,
		value,
		maxAge,
		"/",                      // path
		h.config.Domain,          // domain (empty for localhost)
		h.config.IsProduction,    // secure (true in production)
		true,                     // httpOnly (prevent XSS)
	)
}

// SetAccessTokenCookie sets the access token cookie
func (h *CookieHelper) SetAccessTokenCookie(c *gin.Context, token string, maxAge int) {
	h.SetAuthCookie(c, "accessToken", token, maxAge)
}

// SetRefreshTokenCookie sets the refresh token cookie
func (h *CookieHelper) SetRefreshTokenCookie(c *gin.Context, token string, maxAge int) {
	h.SetAuthCookie(c, "refreshToken", token, maxAge)
}

// ClearAuthCookies clears all authentication cookies
func (h *CookieHelper) ClearAuthCookies(c *gin.Context) {
	h.SetAccessTokenCookie(c, "", -1)
	h.SetRefreshTokenCookie(c, "", -1)
}

// TokenDurations holds token duration configurations
type TokenDurations struct {
	AccessTokenMaxAge  int
	RefreshTokenMaxAge int
}

// GetTokenDurations calculates token durations based on remember me flag
func GetTokenDurations(rememberMe bool) TokenDurations {
	if rememberMe {
		return TokenDurations{
			AccessTokenMaxAge:  604800,  // 7 days
			RefreshTokenMaxAge: 2592000, // 30 days
		}
	}

	return TokenDurations{
		AccessTokenMaxAge:  86400,  // 1 day
		RefreshTokenMaxAge: 604800, // 7 days
	}
}
