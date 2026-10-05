package com.rt.history.dto;

import java.time.LocalDateTime;

public record PurchaseInvoiceHistoryResponse(
        Long id,
        Long originalPurchaseInvoiceId,
        String sellerName,
        LocalDateTime editDate,
        String oldItemsJson,
        String newItemsJson,
        Double oldFinalTotal,
        Double newFinalTotal) {
}