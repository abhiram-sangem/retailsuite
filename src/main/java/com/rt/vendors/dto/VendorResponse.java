package com.rt.vendors.dto;

public record VendorResponse(
        Long id,
        String name,
        String phone,
        String gstno,
        String address,
        String city,
        Double balance) {
}