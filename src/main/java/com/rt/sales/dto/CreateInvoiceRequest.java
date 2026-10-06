package com.rt.sales.dto;

import java.util.List;

public record CreateInvoiceRequest(
        String customerName,
        List<CartItemRequest> cartItems,
        Double grossTotal,
        Double discountPercent,
        Double cgst,
        Double sgst,
        Double finalTotal,
        String paymentMethod,
        String orderDate,
        Integer dueDays,
        String customInvoiceId) {
}