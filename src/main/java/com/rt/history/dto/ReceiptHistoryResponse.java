package com.rt.history.dto;

import java.time.LocalDateTime;

public record ReceiptHistoryResponse(
        Long id,
        Long originalReceiptId,
        String customerName,
        LocalDateTime editDate,
        Double oldAmount,
        Double oldDiscount,
        Double newAmount,
        Double newDiscount) {
}