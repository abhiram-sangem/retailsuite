package com.rt.customers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rt.customers.dto.CreateReceiptRequest;
import com.rt.customers.dto.ReceiptResponse;
import com.rt.customers.dto.UpdateReceiptRequest;
import com.rt.history.ReceiptHistory;
import com.rt.history.ReceiptHistoryRepository;

@Service
public class ReceiptService {

    private final ReceiptRepository receiptRepository;
    private final CustomerRepository customerRepository;
    private final ReceiptHistoryRepository receiptHistoryRepository;

    public ReceiptService(
            ReceiptRepository receiptRepository,
            CustomerRepository customerRepository,
            ReceiptHistoryRepository receiptHistoryRepository) {
        this.receiptRepository = receiptRepository;
        this.customerRepository = customerRepository;
        this.receiptHistoryRepository = receiptHistoryRepository;
    }

    @Transactional(readOnly = true)
    public List<ReceiptResponse> getAllReceipts() {
        return receiptRepository.findAllByOrderByReceiptDateDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReceiptResponse createReceipt(CreateReceiptRequest request) {
        if (request == null || request.customerId() == null) {
            throw new RuntimeException("Customer ID is required");
        }

        Double amount = request.amount() != null ? request.amount() : 0.0;
        Double discountAmount = request.discountAmount() != null ? request.discountAmount() : 0.0;

        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Double currentBalance = customer.getBalance() != null ? customer.getBalance() : 0.0;
        customer.setBalance(currentBalance - (amount + discountAmount));
        customerRepository.save(customer);

        Receipt receipt = new Receipt();
        receipt.setCustomerId(request.customerId());
        receipt.setCustomerName(customer.getName());
        receipt.setAmount(amount);
        receipt.setDiscountAmount(discountAmount);
        receipt.setPaymentMode(request.paymentMode());
        receipt.setRemarks(request.remarks());
        receipt.setCustomReceiptId(request.customReceiptId());

        if (request.receiptDate() != null && !request.receiptDate().trim().isEmpty()) {
            LocalDate parsedDate = LocalDate.parse(request.receiptDate().trim());
            if (parsedDate.isEqual(LocalDate.now())) {
                receipt.setReceiptDate(LocalDateTime.now());
            } else {
                receipt.setReceiptDate(parsedDate.atTime(LocalTime.MAX));
            }
        } else {
            receipt.setReceiptDate(LocalDateTime.now());
        }

        return toResponse(receiptRepository.save(receipt));
    }

    @Transactional
    public ReceiptResponse updateReceipt(Long id, UpdateReceiptRequest request) {
        Receipt receipt = receiptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Receipt not found"));

        Customer customer = customerRepository.findById(receipt.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Double newAmount = request.amount() != null ? request.amount() : 0.0;
        Double newDiscount = request.discountAmount() != null ? request.discountAmount() : 0.0;

        Double oldAmount = receipt.getAmount() != null ? receipt.getAmount() : 0.0;
        Double oldDiscount = receipt.getDiscountAmount() != null ? receipt.getDiscountAmount() : 0.0;
        Double oldTotal = oldAmount + oldDiscount;
        Double newTotal = newAmount + newDiscount;

        ReceiptHistory history = new ReceiptHistory();
        history.setOriginalReceiptId(receipt.getId());
        history.setCustomerName(receipt.getCustomerName());
        history.setOldAmount(oldAmount);
        history.setOldDiscount(oldDiscount);
        history.setNewAmount(newAmount);
        history.setNewDiscount(newDiscount);
        history.setEditDate(LocalDateTime.now());
        receiptHistoryRepository.save(history);

        Double currentBalance = customer.getBalance() != null ? customer.getBalance() : 0.0;
        customer.setBalance(currentBalance + oldTotal - newTotal);
        customerRepository.save(customer);

        receipt.setAmount(newAmount);
        receipt.setDiscountAmount(newDiscount);
        receipt.setPaymentMode(request.paymentMode());
        receipt.setRemarks(request.remarks());
        receipt.setCustomReceiptId(request.customReceiptId());

        if (request.receiptDate() != null && !request.receiptDate().trim().isEmpty()) {
            LocalDate parsedDate = LocalDate.parse(request.receiptDate().trim());
            receipt.setReceiptDate(parsedDate.atTime(LocalTime.MAX));
        }

        return toResponse(receiptRepository.save(receipt));
    }

    private ReceiptResponse toResponse(Receipt r) {
        return new ReceiptResponse(
                r.getId(),
                r.getCustomReceiptId(),
                r.getCustomerId(),
                r.getCustomerName(),
                r.getAmount(),
                r.getDiscountAmount(),
                r.getPaymentMode(),
                r.getRemarks(),
                r.getReceiptDate());
    }
}