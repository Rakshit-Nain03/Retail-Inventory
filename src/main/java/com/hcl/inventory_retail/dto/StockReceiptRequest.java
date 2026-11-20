package com.hcl.inventory_retail.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StockReceiptRequest(
        @NotNull Long productId,
        @NotNull Long warehouseId,
        @NotNull Long supplierId,
        @Min(1) int quantity) {
}