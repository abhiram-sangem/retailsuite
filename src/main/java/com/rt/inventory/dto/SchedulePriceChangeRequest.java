package com.rt.inventory.dto;

import java.time.LocalDate;
import java.util.List;

public record SchedulePriceChangeRequest(
        LocalDate effectiveDate,
        List<ProductPriceItem> items) {

    public record ProductPriceItem(
            Long productId,
            Double newPurchasePrice,
            Double newMrp,
            Double newPrice,
            Double newPiecePurchasePrice,
            Double newPieceMrp,
            Double newPiecePrice) {
    }
}