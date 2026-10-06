package com.rt.sales.dto;

import com.rt.inventory.dto.ProductResponse;

public record InvoiceItemResponse(
        Long id,
        ProductResponse product,
        Double quantity,
        Double price,
        String sellType) {
}