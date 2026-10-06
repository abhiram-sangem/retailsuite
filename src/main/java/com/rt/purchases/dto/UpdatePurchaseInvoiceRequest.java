package com.rt.purchases.dto;

import java.util.List;

public record UpdatePurchaseInvoiceRequest(
        String sellerName,
        String purchaseDate,
        String customInvoiceId,
        Double grossTotal,
        Double discountPercent,
        Double cgst,
        Double sgst,
        Double finalTotal,
        String sellerPhone,
        String sellerGst,
        List<PurchaseItemRequest> items) {
}