package com.rt.inventory.dto;

import java.time.LocalDate;

public record ProductResponse(
        Long id,
        String name,
        String hsnCode,
        Double purchasePrice,
        Double mrp,
        Double price,
        Double stock,
        Integer piecesPerBox,
        Double piecePurchasePrice,
        Double pieceMrp,
        Double piecePrice,
        String barcode,
        LocalDate scheduledDate,
        Double scheduledPurchasePrice,
        Double scheduledMrp,
        Double scheduledPrice,
        Double scheduledPiecePurchasePrice,
        Double scheduledPieceMrp,
        Double scheduledPiecePrice) {
}