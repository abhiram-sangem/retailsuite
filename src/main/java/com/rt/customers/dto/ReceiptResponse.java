package com.rt.customers.dto;

import java.time.LocalDateTime;

public record ReceiptResponse(
        Long id,
        String customReceiptId,
        Long customerId,
        String customerName,
        Double amount,
        Double discountAmount,
        String paymentMode,
        String remarks,
        LocalDateTime receiptDate) {
}