package http

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourusername/epr-saas/package-service/internal/domain"
	"github.com/yourusername/epr-saas/package-service/internal/repository"
	"github.com/yourusername/epr-saas/package-service/internal/usecase"
)

// PackageHandler handles HTTP requests for packages
type PackageHandler struct {
	packageUseCase usecase.PackageUseCase
}

// NewPackageHandler creates a new package handler
func NewPackageHandler(packageUseCase usecase.PackageUseCase) *PackageHandler {
	return &PackageHandler{
		packageUseCase: packageUseCase,
	}
}

// ============================================
// CREATE PACKAGE
// ============================================

// CreatePackage handles package creation
// POST /api/v1/packages
func (h *PackageHandler) CreatePackage(c *gin.Context) {
	var input domain.CreatePackageInput

	// 1. Bind and validate JSON input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"details": err.Error(),
		})
		return
	}

	// 2. Call use case to create package
	pkg, err := h.packageUseCase.CreatePackage(c.Request.Context(), &input)
	if err != nil {
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// 3. Return success response
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    pkg.ToResponse(),
	})
}

// ============================================
// GET PACKAGE
// ============================================

// GetPackage retrieves a package by ID
// GET /api/v1/packages/:id
func (h *PackageHandler) GetPackage(c *gin.Context) {
	// 1. Parse ID from URL
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid package ID",
		})
		return
	}

	// 2. Get package
	pkg, err := h.packageUseCase.GetPackage(c.Request.Context(), id)
	if err != nil {
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// 3. Return response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    pkg.ToResponse(),
	})
}

// ============================================
// GET ALL PACKAGES
// ============================================

// GetAllPackages retrieves all packages with pagination
// GET /api/v1/packages?limit=10&offset=0
func (h *PackageHandler) GetAllPackages(c *gin.Context) {
	// 1. Parse query parameters
	limit := 10
	offset := 0

	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := parseInt(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if o, err := parseInt(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	// 2. Get packages
	packages, err := h.packageUseCase.GetAllPackages(c.Request.Context(), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve packages",
		})
		return
	}

	// 3. Convert to response format
	responses := make([]*domain.PackageResponse, len(packages))
	for i, pkg := range packages {
		responses[i] = pkg.ToResponse()
	}

	// 4. Return response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    responses,
		"meta": gin.H{
			"limit":  limit,
			"offset": offset,
			"count":  len(responses),
		},
	})
}

// ============================================
// GET ACTIVE PACKAGES
// ============================================

// GetActivePackages retrieves all active packages (public endpoint)
// GET /api/v1/packages/active
func (h *PackageHandler) GetActivePackages(c *gin.Context) {
	// 1. Get active packages
	packages, err := h.packageUseCase.GetActivePackages(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve packages",
		})
		return
	}

	// 2. Convert to response format
	responses := make([]*domain.PackageResponse, len(packages))
	for i, pkg := range packages {
		responses[i] = pkg.ToResponse()
	}

	// 3. Return response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    responses,
	})
}

// ============================================
// UPDATE PACKAGE
// ============================================

// UpdatePackage updates an existing package
// PUT /api/v1/packages/:id
func (h *PackageHandler) UpdatePackage(c *gin.Context) {
	// 1. Parse ID from URL
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid package ID",
		})
		return
	}

	// 2. Bind and validate JSON input
	var input domain.UpdatePackageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"details": err.Error(),
		})
		return
	}

	// 3. Call use case to update package
	pkg, err := h.packageUseCase.UpdatePackage(c.Request.Context(), id, &input)
	if err != nil {
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// 4. Return success response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    pkg.ToResponse(),
	})
}

// ============================================
// DELETE PACKAGE
// ============================================

// DeletePackage soft-deletes a package
// DELETE /api/v1/packages/:id
func (h *PackageHandler) DeletePackage(c *gin.Context) {
	// 1. Parse ID from URL
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid package ID",
		})
		return
	}

	// 2. Call use case to delete package
	if err := h.packageUseCase.DeletePackage(c.Request.Context(), id); err != nil {
		statusCode, message := mapErrorToHTTP(err)
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// 3. Return success response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Package deleted successfully",
	})
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// mapErrorToHTTP maps business errors to HTTP status codes and messages
func mapErrorToHTTP(err error) (statusCode int, message string) {
	switch err {
	case repository.ErrPackageNotFound:
		return http.StatusNotFound, "Package not found"

	case repository.ErrPackageNameExists:
		return http.StatusConflict, "Package name already exists"

	case repository.ErrSubscriptionNotFound:
		return http.StatusNotFound, "Subscription not found"

	case repository.ErrActiveSubscriptionExists:
		return http.StatusConflict, "User already has an active subscription"

	case repository.ErrNoQueriesRemaining:
		return http.StatusForbidden, "No queries remaining"

	case repository.ErrSubscriptionExpired:
		return http.StatusForbidden, "Subscription has expired"

	default:
		return http.StatusInternalServerError, "Internal server error"
	}
}

// parseInt parses a string to int
func parseInt(s string) (int, error) {
	var i int
	_, err := fmt.Sscanf(s, "%d", &i)
	return i, err
}
