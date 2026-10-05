package com.rt.history;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rt.history.dto.InventoryHistoryResponse;
import com.rt.history.dto.InvoiceHistoryResponse;
import com.rt.history.dto.PurchaseInvoiceHistoryResponse;
import com.rt.history.dto.ReceiptHistoryResponse;

@Service
public class HistoryService {

    private final InventoryHistoryRepository inventoryHistoryRepository;
    private final InvoiceHistoryRepository invoiceHistoryRepository;
    private final PurchaseInvoiceHistoryRepository purchaseInvoiceHistoryRepository;
    private final ReceiptHistoryRepository receiptHistoryRepository;

    public HistoryService(
            InventoryHistoryRepository inventoryHistoryRepository,
            InvoiceHistoryRepository invoiceHistoryRepository,
            PurchaseInvoiceHistoryRepository purchaseInvoiceHistoryRepository,
            ReceiptHistoryRepository receiptHistoryRepository) {
        this.inventoryHistoryRepository = inventoryHistoryRepository;
        this.invoiceHistoryRepository = invoiceHistoryRepository;
        this.purchaseInvoiceHistoryRepository = purchaseInvoiceHistoryRepository;
        this.receiptHistoryRepository = receiptHistoryRepository;
    }

    @Transactional(readOnly = true)
    public List<InventoryHistoryResponse> getInventoryHistory() {
        return inventoryHistoryRepository.findAllByOrderByTimestampDesc().stream()
                .map(h -> new InventoryHistoryResponse(
                        h.getId(),
                        h.getProductId(),
                        h.getProductName(),
                        h.getActionType(),
                        h.getQuantityChanged(),
                        h.getFinalStock(),
                        h.getDescription(),
                        h.getTimestamp()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceHistoryResponse> getInvoiceHistory() {
        return invoiceHistoryRepository.findAllByOrderByEditDateDesc().stream()
                .map(h -> new InvoiceHistoryResponse(
                        h.getId(),
                        h.getOriginalInvoiceId(),
                        h.getCustomerName(),
                        h.getEditDate(),
                        h.getOldItemsJson(),
                        h.getNewItemsJson(),
                        h.getOldFinalTotal(),
                        h.getNewFinalTotal()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PurchaseInvoiceHistoryResponse> getPurchaseInvoiceHistory() {
        return purchaseInvoiceHistoryRepository.findAllByOrderByEditDateDesc().stream()
                .map(h -> new PurchaseInvoiceHistoryResponse(
                        h.getId(),
                        h.getOriginalPurchaseInvoiceId(),
                        h.getSellerName(),
                        h.getEditDate(),
                        h.getOldItemsJson(),
                        h.getNewItemsJson(),
                        h.getOldFinalTotal(),
                        h.getNewFinalTotal()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReceiptHistoryResponse> getReceiptHistory() {
        return receiptHistoryRepository.findAllByOrderByEditDateDesc().stream()
                .map(h -> new ReceiptHistoryResponse(
                        h.getId(),
                        h.getOriginalReceiptId(),
                        h.getCustomerName(),
                        h.getEditDate(),
                        h.getOldAmount(),
                        h.getOldDiscount(),
                        h.getNewAmount(),
                        h.getNewDiscount()))
                .collect(Collectors.toList());
    }
}