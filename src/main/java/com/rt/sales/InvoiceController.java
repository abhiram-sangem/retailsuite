package com.rt.sales;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rt.sales.dto.CreateInvoiceRequest;
import com.rt.sales.dto.DashboardInvoiceResponse;
import com.rt.sales.dto.InvoiceResponse;
import com.rt.sales.dto.ReturnInvoiceRequest;
import com.rt.sales.dto.UpdateInvoiceRequest;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getAllInvoices() {
        return ResponseEntity.ok(invoiceService.getAllInvoices());
    }

    // --- NEW: LIGHTWEIGHT DASHBOARD ENDPOINT ---
    @GetMapping("/dashboard")
    public ResponseEntity<List<DashboardInvoiceResponse>> getDashboardData(
            @RequestParam(required = false, defaultValue = "") String startDate,
            @RequestParam(required = false, defaultValue = "") String endDate) {
        
        // Default to fetching the last 12 months for the dashboard charts
        LocalDateTime start = startDate.isEmpty() ? 
            LocalDateTime.now().minusMonths(12) : LocalDateTime.parse(startDate + "T00:00:00");
        LocalDateTime end = endDate.isEmpty() ? 
            LocalDateTime.now().plusDays(1) : LocalDateTime.parse(endDate + "T23:59:59");

        return ResponseEntity.ok(invoiceService.getDashboardData(start, end));
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<InvoiceResponse>> getPagedInvoices(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "") String startDate,
            @RequestParam(required = false, defaultValue = "") String endDate) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "orderDate"));
        
        LocalDateTime start = startDate.isEmpty() ? 
            LocalDateTime.of(2000, 1, 1, 0, 0) : LocalDateTime.parse(startDate + "T00:00:00");
        LocalDateTime end = endDate.isEmpty() ? 
            LocalDateTime.of(2100, 1, 1, 0, 0) : LocalDateTime.parse(endDate + "T23:59:59");

        return ResponseEntity.ok(invoiceService.getPagedInvoices(search, start, end, pageable));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(invoiceService.getInvoiceById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping(value = {"", "/create"})
    public ResponseEntity<?> createInvoice(@RequestBody CreateInvoiceRequest request) {
        try {
            return ResponseEntity.ok(invoiceService.createInvoice(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id:\\d+}")
    public ResponseEntity<?> updateInvoice(@PathVariable Long id, @RequestBody UpdateInvoiceRequest request) {
        try {
            return ResponseEntity.ok(invoiceService.updateInvoice(id, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id:\\d+}/return")
    public ResponseEntity<?> returnInvoice(@PathVariable Long id, @RequestBody ReturnInvoiceRequest request) {
        try {
            return ResponseEntity.ok(invoiceService.returnInvoice(id, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}