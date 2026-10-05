package com.rt.customers;

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

import com.rt.customers.dto.CreateReceiptRequest;
import com.rt.customers.dto.ReceiptResponse;
import com.rt.customers.dto.UpdateReceiptRequest;

@RestController
@RequestMapping("/api/receipts")
@CrossOrigin(origins = "*")
public class ReceiptController {

    private final ReceiptService receiptService;

    public ReceiptController(ReceiptService receiptService) {
        this.receiptService = receiptService;
    }

    @GetMapping
    public ResponseEntity<List<ReceiptResponse>> getAllReceipts() {
        return ResponseEntity.ok(receiptService.getAllReceipts());
    }

    @PostMapping
    public ResponseEntity<?> createReceipt(@RequestBody CreateReceiptRequest request) {
        try {
            return ResponseEntity.ok(receiptService.createReceipt(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateReceipt(@PathVariable Long id, @RequestBody UpdateReceiptRequest request) {
        try {
            return ResponseEntity.ok(receiptService.updateReceipt(id, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}