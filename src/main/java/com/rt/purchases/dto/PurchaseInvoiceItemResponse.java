package com.rt.purchases.dto;

import com.rt.inventory.dto.ProductResponse;

public record PurchaseInvoiceItemResponse(
        Long id,
        ProductResponse product,
        Integer quantity,
        Double purchasePrice,
        String sellType) {
}