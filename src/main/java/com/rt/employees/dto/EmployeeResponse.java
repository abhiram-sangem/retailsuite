package com.rt.employees.dto;

import java.time.LocalDate;

public record EmployeeResponse(
        Long id,
        String name,
        String phone,
        String email,
        String role,
        Double salary,
        String address,
        LocalDate joinDate,
        String status) {
}