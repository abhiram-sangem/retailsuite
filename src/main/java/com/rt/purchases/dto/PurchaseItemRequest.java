package com.rt.purchases.dto;

public record PurchaseItemRequest(
        Long productId,
        Double quantity,
        Double purchasePrice,
        String sellType) {
}