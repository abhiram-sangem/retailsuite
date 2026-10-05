package com.rt.customers.dto;

public record UpdateCustomerRequest(
        String name,
        String gstno,
        String mobile,
        String city,
        String location,
        double balance,
        String state) {
}