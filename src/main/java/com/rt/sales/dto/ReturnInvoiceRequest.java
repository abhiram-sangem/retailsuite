package com.rt.sales.dto;

import java.util.List;

public record ReturnInvoiceRequest(
        List<CartItemRequest> cartItems,
        Double grossTotal,
        Double discountPercent,
        Double cgst,
        Double sgst,
        Double finalTotal) {
}