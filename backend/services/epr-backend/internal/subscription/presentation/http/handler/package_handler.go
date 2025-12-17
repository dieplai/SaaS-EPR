package handler

import (
	"net/http"

	"github.com/epr-legal/epr-backend/internal/subscription/application/command"
	"github.com/epr-legal/epr-backend/internal/subscription/application/dto"
	"github.com/epr-legal/epr-backend/internal/subscription/application/query"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PackageHandler struct {
	createHandler *command.CreatePackageHandler
	updateHandler *command.UpdatePackageHandler
	deleteHandler *command.DeletePackageHandler
	getHandler    *query.GetPackageHandler
	listHandler   *query.ListPackagesHandler
}

func NewPackageHandler(
	createHandler *command.CreatePackageHandler,
	updateHandler *command.UpdatePackageHandler,
	deleteHandler *command.DeletePackageHandler,
	getHandler *query.GetPackageHandler,
	listHandler *query.ListPackagesHandler,
) *PackageHandler {
	return &PackageHandler{
		createHandler: createHandler,
		updateHandler: updateHandler,
		deleteHandler: deleteHandler,
		getHandler:    getHandler,
		listHandler:   listHandler,
	}
}

func (h *PackageHandler) Create(c *gin.Context) {
	var req dto.CreatePackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request body",
			"details": err.Error(),
		})
		return
	}

	cmd := command.CreatePackageCommand{
		Name:         req.Name,
		Description:  req.Description,
		Price:        req.Price,
		TokenLimit:   req.TokenLimit,
		DurationDays: req.DurationDays,
		Features:     req.Features,
	}

	packageID, err := h.createHandler.Handle(c.Request.Context(), cmd)
	if err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "package created successfully",
		"package_id": packageID.String(),
	})
}

func (h *PackageHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid package ID",
		})
		return
	}

	var req dto.UpdatePackageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "invalid request body",
			"details": err.Error(),
		})
		return
	}

	cmd := command.UpdatePackageCommand{
		ID:           id,
		Name:         req.Name,
		Description:  req.Description,
		Price:        req.Price,
		TokenLimit:   req.TokenLimit,
		DurationDays: req.DurationDays,
		Features:     req.Features,
		IsActive:     req.IsActive,
	}

	if err := h.updateHandler.Handle(c.Request.Context(), cmd); err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "package updated successfully",
	})
}

func (h *PackageHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid package ID",
		})
		return
	}

	q := query.GetPackageQuery{
		PackageID: id,
	}

	pkg, err := h.getHandler.Handle(c.Request.Context(), q)
	if err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": pkg,
	})
}

func (h *PackageHandler) List(c *gin.Context) {
	q := query.ListPackagesQuery{
		Limit:  100,
		Offset: 0,
	}

	packages, err := h.listHandler.Handle(c.Request.Context(), q)
	if err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": packages,
	})
}

func (h *PackageHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid package ID",
		})
		return
	}

	cmd := command.DeletePackageCommand{
		ID: id,
	}

	if err := h.deleteHandler.Handle(c.Request.Context(), cmd); err != nil {
		c.Error(err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "package deleted successfully",
	})
}
