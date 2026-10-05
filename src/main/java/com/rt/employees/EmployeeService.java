package com.rt.employees;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rt.employees.dto.CreateEmployeeRequest;
import com.rt.employees.dto.EmployeeResponse;
import com.rt.employees.dto.UpdateEmployeeRequest;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees() {
        return employeeRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
        if (request == null || request.name() == null || request.name().trim().isEmpty()) {
            throw new RuntimeException("Employee name is required");
        }

        Employee employee = new Employee();
        employee.setName(request.name().trim());
        employee.setPhone(request.phone());
        employee.setEmail(request.email());
        employee.setRole(request.role());
        employee.setSalary(request.salary());
        employee.setAddress(request.address());
        employee.setJoinDate(request.joinDate());
        employee.setStatus((request.status() == null || request.status().isEmpty()) ? "Active" : request.status());

        return toResponse(employeeRepository.save(employee));
    }

    @Transactional
    public EmployeeResponse updateEmployee(Long id, UpdateEmployeeRequest details) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));

        if (details.name() != null && !details.name().trim().isEmpty()) {
            employee.setName(details.name().trim());
        }
        if (details.phone() != null) employee.setPhone(details.phone());
        if (details.email() != null) employee.setEmail(details.email());
        if (details.role() != null) employee.setRole(details.role());
        if (details.salary() != null) employee.setSalary(details.salary());
        if (details.address() != null) employee.setAddress(details.address());
        if (details.joinDate() != null) employee.setJoinDate(details.joinDate());
        if (details.status() != null) employee.setStatus(details.status());

        return toResponse(employeeRepository.save(employee));
    }

    @Transactional
    public void deleteEmployee(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new RuntimeException("Employee not found with id: " + id);
        }
        employeeRepository.deleteById(id);
    }

    private EmployeeResponse toResponse(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getName(),
                employee.getPhone(),
                employee.getEmail(),
                employee.getRole(),
                employee.getSalary(),
                employee.getAddress(),
                employee.getJoinDate(),
                employee.getStatus());
    }
}