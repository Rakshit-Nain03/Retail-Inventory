package com.hcl.inventory_retail.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StockOperationRequest(
		@NotNull Long productId,
		@NotNull Long warehouseId,
		@Min(1) int quantity) {
}