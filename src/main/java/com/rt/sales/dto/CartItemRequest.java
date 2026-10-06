package com.rt.sales.dto;

public record CartItemRequest(
        Long id,
        Double quantity,
        Double price,
        String sellType) {
}