package com.rt.history.dto;

import java.time.LocalDateTime;

public record InvoiceHistoryResponse(
        Long id,
        Long originalInvoiceId,
        String customerName,
        LocalDateTime editDate,
        String oldItemsJson,
        String newItemsJson,
        Double oldFinalTotal,
        Double newFinalTotal) {
}