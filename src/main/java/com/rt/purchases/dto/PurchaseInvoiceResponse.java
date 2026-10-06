package com.rt.purchases.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PurchaseInvoiceResponse(
        Long id,
        String customInvoiceId,
        String sellerName,
        String sellerPhone,
        String sellerGst,
        LocalDate purchaseDate,
        LocalDateTime entryDate,
        Double grossTotal,
        Double discountPercent,
        Double cgst,
        Double sgst,
        Double finalTotal,
        List<PurchaseInvoiceItemResponse> items) {
}