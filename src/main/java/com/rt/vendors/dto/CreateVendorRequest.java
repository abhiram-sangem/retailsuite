package com.rt.vendors.dto;

public record CreateVendorRequest(
        String name,
        String phone,
        String gstno,
        String address,
        String city,
        Double balance) {
}