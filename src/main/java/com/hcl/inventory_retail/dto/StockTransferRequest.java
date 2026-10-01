package com.hcl.inventory_retail.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StockTransferRequest(
		@NotNull Long productId,
		@NotNull Long sourceWarehouseId,
		@NotNull Long destinationWarehouseId,
		@Min(1) int quantity) {
}