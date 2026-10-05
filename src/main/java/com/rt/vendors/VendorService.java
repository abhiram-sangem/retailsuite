package com.rt.vendors;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rt.vendors.dto.CreateVendorRequest;
import com.rt.vendors.dto.UpdateVendorRequest;
import com.rt.vendors.dto.VendorResponse;

@Service
public class VendorService {

    private final VendorRepository vendorRepository;

    public VendorService(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    @Transactional(readOnly = true)
    public List<VendorResponse> getAllVendors() {
        return vendorRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public VendorResponse createVendor(CreateVendorRequest request) {
        if (request == null || request.name() == null || request.name().trim().isEmpty()) {
            throw new RuntimeException("Vendor name is required");
        }

        Vendor vendor = new Vendor();
        vendor.setName(request.name().trim());
        vendor.setPhone(request.phone());
        vendor.setGstno(request.gstno());
        vendor.setAddress(request.address());
        vendor.setCity(request.city());
        vendor.setBalance(request.balance() != null ? request.balance() : 0.0);

        return toResponse(vendorRepository.save(vendor));
    }

    @Transactional
    public VendorResponse updateVendor(Long id, UpdateVendorRequest details) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + id));

        if (details.name() != null && !details.name().trim().isEmpty()) {
            vendor.setName(details.name().trim());
        }
        if (details.phone() != null) vendor.setPhone(details.phone());
        if (details.gstno() != null) vendor.setGstno(details.gstno());
        if (details.address() != null) vendor.setAddress(details.address());
        if (details.city() != null) vendor.setCity(details.city());
        if (details.balance() != null) vendor.setBalance(details.balance());

        return toResponse(vendorRepository.save(vendor));
    }

    @Transactional
    public void deleteVendor(Long id) {
        if (!vendorRepository.existsById(id)) {
            throw new RuntimeException("Vendor not found with id: " + id);
        }
        vendorRepository.deleteById(id);
    }

    private VendorResponse toResponse(Vendor vendor) {
        return new VendorResponse(
                vendor.getId(),
                vendor.getName(),
                vendor.getPhone(),
                vendor.getGstno(),
                vendor.getAddress(),
                vendor.getCity(),
                vendor.getBalance());
    }
}