package com.rt.customers.dto;

public record CreateReceiptRequest(
        Long customerId,
        Double amount,
        Double discountAmount,
        String paymentMode,
        String receiptDate,
        String remarks,
        String customReceiptId) {
}