package com.rt.customers.dto;

public record UpdateReceiptRequest(
        Long customerId,
        Double amount,
        Double discountAmount,
        String paymentMode,
        String receiptDate,
        String remarks,
        String customReceiptId) {
}