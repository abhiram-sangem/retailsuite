package com.rt.sales.dto;

import java.time.LocalDateTime;
import java.util.List;

public record InvoiceResponse(
        Long id,
        String customerName,
        LocalDateTime orderDate,
        Double grossTotal,
        Double discountPercent,
        Double cgst,
        Double sgst,
        Double finalTotal,
        String paymentMethod,
        Integer dueDays,
        String customInvoiceId,
        Boolean isReturn,
        Long originalInvoiceId,
        List<InvoiceItemResponse> items) {
}