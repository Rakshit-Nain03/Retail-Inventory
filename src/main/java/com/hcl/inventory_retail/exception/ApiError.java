package com.hcl.inventory_retail.exception;

import java.time.LocalDateTime;

public record ApiError(LocalDateTime timestamp, int status, String message) {
}