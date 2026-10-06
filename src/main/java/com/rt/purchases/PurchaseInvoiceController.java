package com.rt.purchases;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rt.purchases.dto.CreatePurchaseInvoiceRequest;
import com.rt.purchases.dto.PurchaseInvoiceResponse;
import com.rt.purchases.dto.UpdatePurchaseInvoiceRequest;

@RestController
@RequestMapping("/api/purchase-invoices")
@CrossOrigin(origins = "*")
public class PurchaseInvoiceController {

    private final PurchaseInvoiceService purchaseInvoiceService;

    public PurchaseInvoiceController(PurchaseInvoiceService purchaseInvoiceService) {
        this.purchaseInvoiceService = purchaseInvoiceService;
    }

    @GetMapping
    public ResponseEntity<List<PurchaseInvoiceResponse>> getAllPurchaseInvoices() {
        return ResponseEntity.ok(purchaseInvoiceService.getAllPurchaseInvoices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseInvoiceResponse> getPurchaseInvoiceById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(purchaseInvoiceService.getPurchaseInvoiceById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createPurchaseInvoice(@RequestBody CreatePurchaseInvoiceRequest request) {
        try {
            return ResponseEntity.ok(purchaseInvoiceService.createPurchaseInvoice(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePurchaseInvoice(@PathVariable Long id, @RequestBody UpdatePurchaseInvoiceRequest request) {
        try {
            return ResponseEntity.ok(purchaseInvoiceService.updatePurchaseInvoice(id, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}