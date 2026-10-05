package com.rt.history.dto;

import java.time.LocalDateTime;

public record InventoryHistoryResponse(
        Long id,
        Long productId,
        String productName,
        String actionType,
        Double quantityChanged,
        Double finalStock,
        String description,
        LocalDateTime timestamp) {
}