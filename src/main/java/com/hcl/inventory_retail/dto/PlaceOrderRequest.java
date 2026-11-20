package com.hcl.inventory_retail.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PlaceOrderRequest(
		@NotBlank String orderNumber,
		@NotBlank String customerName,
		@NotNull Long productId,
		@NotNull Long warehouseId,
		@Min(1) int quantity) {
}