package com.rt.sales.dto;

import java.time.LocalDateTime;
import java.util.List;

public record DashboardInvoiceResponse(
    Long id,
    LocalDateTime orderDate,
    Double finalTotal,
    Boolean isReturn,
    String paymentMethod,
    List<DashboardItemResponse> items
) {}