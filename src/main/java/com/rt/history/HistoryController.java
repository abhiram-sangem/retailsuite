package com.rt.history;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rt.history.dto.InventoryHistoryResponse;
import com.rt.history.dto.InvoiceHistoryResponse;
import com.rt.history.dto.PurchaseInvoiceHistoryResponse;
import com.rt.history.dto.ReceiptHistoryResponse;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = "*")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping("/inventory")
    public ResponseEntity<List<InventoryHistoryResponse>> getInventoryHistory() {
        return ResponseEntity.ok(historyService.getInventoryHistory());
    }

    @GetMapping("/invoices")
    public ResponseEntity<List<InvoiceHistoryResponse>> getInvoiceHistory() {
        return ResponseEntity.ok(historyService.getInvoiceHistory());
    }

    @GetMapping("/purchase-invoices")
    public ResponseEntity<List<PurchaseInvoiceHistoryResponse>> getPurchaseInvoiceHistory() {
        return ResponseEntity.ok(historyService.getPurchaseInvoiceHistory());
    }

    @GetMapping("/receipts")
    public ResponseEntity<List<ReceiptHistoryResponse>> getReceiptHistory() {
        return ResponseEntity.ok(historyService.getReceiptHistory());
    }
}