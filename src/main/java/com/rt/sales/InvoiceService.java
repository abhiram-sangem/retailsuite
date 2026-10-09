package com.rt.sales;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rt.customers.Customer;
import com.rt.customers.CustomerRepository;
import com.rt.history.InventoryHistory;
import com.rt.history.InventoryHistoryRepository;
import com.rt.history.InvoiceHistory;
import com.rt.history.InvoiceHistoryRepository;
import com.rt.inventory.Product;
import com.rt.inventory.ProductRepository;
import com.rt.inventory.dto.ProductResponse;
import com.rt.sales.dto.CartItemRequest;
import com.rt.sales.dto.CreateInvoiceRequest;
import com.rt.sales.dto.DashboardInvoiceResponse;
import com.rt.sales.dto.DashboardItemResponse;
import com.rt.sales.dto.InvoiceItemResponse;
import com.rt.sales.dto.InvoiceResponse;
import com.rt.sales.dto.ReturnInvoiceRequest;
import com.rt.sales.dto.UpdateInvoiceRequest;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ProductRepository productRepository;
    private final InventoryHistoryRepository inventoryHistoryRepository;
    private final InvoiceHistoryRepository invoiceHistoryRepository;
    private final CustomerRepository customerRepository;

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            ProductRepository productRepository,
            InventoryHistoryRepository inventoryHistoryRepository,
            InvoiceHistoryRepository invoiceHistoryRepository,
            CustomerRepository customerRepository) {
        this.invoiceRepository = invoiceRepository;
        this.productRepository = productRepository;
        this.inventoryHistoryRepository = inventoryHistoryRepository;
        this.invoiceHistoryRepository = invoiceHistoryRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getPagedInvoices(String search, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        Page<Invoice> invoicePage = invoiceRepository.findFilteredInvoices(search, startDate, endDate, pageable);
        return invoicePage.map(this::toResponse);
    }

    // --- NEW: LIGHTWEIGHT DASHBOARD MAPPER ---
    @Transactional(readOnly = true)
    public List<DashboardInvoiceResponse> getDashboardData(LocalDateTime startDate, LocalDateTime endDate) {
        List<Invoice> invoices = invoiceRepository.findByOrderDateBetween(startDate, endDate);
        
        return invoices.stream().map(inv -> {
            List<DashboardItemResponse> items = inv.getItems().stream()
                .map(item -> new DashboardItemResponse(
                    item.getProduct() != null ? item.getProduct().getName() : "Unknown Product",
                    item.getQuantity()
                )).collect(Collectors.toList());
                
            return new DashboardInvoiceResponse(
                inv.getId(),
                inv.getOrderDate(),
                inv.getFinalTotal() != null ? inv.getFinalTotal() : inv.getGrossTotal(),
                inv.getIsReturn(),
                inv.getPaymentMethod(),
                items
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));
        return toResponse(invoice);
    }

    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        Invoice invoice = new Invoice();
        invoice.setCustomerName(request.customerName());

        if (request.orderDate() != null && !request.orderDate().trim().isEmpty()) {
            invoice.setOrderDate(LocalDateTime.of(LocalDate.parse(request.orderDate().trim()), LocalTime.now()));
        } else {
            invoice.setOrderDate(LocalDateTime.now());
        }

        invoice.setGrossTotal(request.grossTotal() != null ? request.grossTotal() : 0.0);
        invoice.setDiscountPercent(request.discountPercent() != null ? request.discountPercent() : 0.0);
        invoice.setCgst(request.cgst() != null ? request.cgst() : 0.0);
        invoice.setSgst(request.sgst() != null ? request.sgst() : 0.0);

        Double finalTotal = request.finalTotal() != null ? request.finalTotal() : 0.0;
        invoice.setFinalTotal(finalTotal);

        String paymentMethod = request.paymentMethod() != null ? request.paymentMethod() : "Cash";
        invoice.setPaymentMethod(paymentMethod);

        invoice.setDueDays(request.dueDays());
        invoice.setCustomInvoiceId(request.customInvoiceId());

        List<InvoiceItem> items = new ArrayList<>();
        if (request.cartItems() != null) {
            for (CartItemRequest itemReq : request.cartItems()) {
                Product product = productRepository.findById(itemReq.id()).orElseThrow();
                Double qty = itemReq.quantity() != null ? itemReq.quantity() : 1.0;

                Double stockDeduction = qty;
                String sellType = itemReq.sellType() != null ? itemReq.sellType() : "Box";

                if ("Piece".equalsIgnoreCase(sellType) && product.getPiecesPerBox() != null && product.getPiecesPerBox() > 0) {
                    stockDeduction = qty / product.getPiecesPerBox();
                }

                Double currentStock = product.getStock() == null ? 0.0 : product.getStock();
                product.setStock(Math.max(0.0, currentStock - stockDeduction));
                productRepository.save(product);

                InvoiceItem item = new InvoiceItem();
                item.setProduct(product);
                item.setQuantity(qty);
                item.setSellType(sellType);
                item.setPrice(itemReq.price() != null ? itemReq.price() : product.getPrice());
                item.setInvoice(invoice);
                items.add(item);
            }
        }
        invoice.setItems(items);

        Invoice savedInvoice = invoiceRepository.save(invoice);

        for (InvoiceItem item : savedInvoice.getItems()) {
            InventoryHistory log = new InventoryHistory();
            log.setProductId(item.getProduct().getId());
            log.setProductName(item.getProduct().getName());
            log.setActionType("SALE");

            Double stockDeduction = item.getQuantity();
            if ("Piece".equalsIgnoreCase(item.getSellType()) && item.getProduct().getPiecesPerBox() != null && item.getProduct().getPiecesPerBox() > 0) {
                stockDeduction = item.getQuantity() / item.getProduct().getPiecesPerBox();
            }

            log.setQuantityChanged(-stockDeduction);
            log.setFinalStock(item.getProduct().getStock());
            log.setDescription("Sale Bill #" + savedInvoice.getId());
            log.setTimestamp(LocalDateTime.now());
            inventoryHistoryRepository.save(log);
        }

        if ("Pay Later".equalsIgnoreCase(paymentMethod)) {
            List<Customer> customers = customerRepository.findByName(request.customerName());
            if (customers != null && !customers.isEmpty()) {
                Customer customer = customers.get(0);
                Double currentBalance = customer.getBalance() != null ? customer.getBalance() : 0.0;
                customer.setBalance(currentBalance + finalTotal);
                customerRepository.save(customer);
            }
        }

        return toResponse(savedInvoice);
    }

    @Transactional
    public InvoiceResponse updateInvoice(Long id, UpdateInvoiceRequest request) {
        Invoice invoice = invoiceRepository.findById(id).orElseThrow();

        InvoiceHistory history = new InvoiceHistory();
        history.setOriginalInvoiceId(invoice.getId());
        history.setCustomerName(invoice.getCustomerName());
        history.setOldFinalTotal(invoice.getFinalTotal());
        history.setEditDate(LocalDateTime.now());

        StringBuilder oldJson = new StringBuilder("[");
        for (int i = 0; i < invoice.getItems().size(); i++) {
            InvoiceItem item = invoice.getItems().get(i);
            oldJson.append(String.format("{\"name\":\"%s\", \"qty\":%s, \"price\":%f}",
                    item.getProduct().getName().replace("\"", "\\\""),
                    String.valueOf(item.getQuantity()),
                    item.getPrice()));
            if (i < invoice.getItems().size() - 1) oldJson.append(",");
        }
        oldJson.append("]");
        history.setOldItemsJson(oldJson.toString());

        for (InvoiceItem oldItem : invoice.getItems()) {
            Product p = oldItem.getProduct();
            Double currentStock = p.getStock() == null ? 0.0 : p.getStock();

            Double oldStockDeduction = oldItem.getQuantity() != null ? oldItem.getQuantity() : 0.0;
            if ("Piece".equalsIgnoreCase(oldItem.getSellType()) && p.getPiecesPerBox() != null && p.getPiecesPerBox() > 0) {
                oldStockDeduction = oldStockDeduction / p.getPiecesPerBox();
            }

            p.setStock(currentStock + oldStockDeduction);
            productRepository.save(p);

            InventoryHistory log = new InventoryHistory();
            log.setProductId(p.getId());
            log.setProductName(p.getName());
            log.setActionType("EDIT_REVERT");
            log.setQuantityChanged(oldStockDeduction);
            log.setFinalStock(p.getStock());
            log.setDescription("Revert Bill #" + invoice.getId() + " for Edit");
            log.setTimestamp(LocalDateTime.now());
            inventoryHistoryRepository.save(log);
        }

        invoice.getItems().clear();

        invoice.setCustomerName(request.customerName());
        invoice.setGrossTotal(request.grossTotal() != null ? request.grossTotal() : 0.0);
        invoice.setDiscountPercent(request.discountPercent() != null ? request.discountPercent() : 0.0);
        invoice.setCgst(request.cgst() != null ? request.cgst() : 0.0);
        invoice.setSgst(request.sgst() != null ? request.sgst() : 0.0);
        invoice.setFinalTotal(request.finalTotal() != null ? request.finalTotal() : 0.0);
        invoice.setPaymentMethod(request.paymentMethod() != null ? request.paymentMethod() : invoice.getPaymentMethod());

        invoice.setDueDays(request.dueDays());
        invoice.setCustomInvoiceId(request.customInvoiceId());

        LocalDateTime originalDateTime = invoice.getOrderDate();
        if (request.orderDate() != null && !request.orderDate().trim().isEmpty()) {
            LocalDate requestedDate = LocalDate.parse(request.orderDate().trim());
            invoice.setOrderDate(originalDateTime != null
                    ? LocalDateTime.of(requestedDate, originalDateTime.toLocalTime())
                    : LocalDateTime.of(requestedDate, LocalTime.now()));
        }

        StringBuilder newJson = new StringBuilder("[");
        if (request.cartItems() != null) {
            for (int i = 0; i < request.cartItems().size(); i++) {
                CartItemRequest itemReq = request.cartItems().get(i);
                Product product = productRepository.findById(itemReq.id()).orElseThrow();
                Double qty = itemReq.quantity() != null ? itemReq.quantity() : 1.0;
                Double appliedPrice = itemReq.price() != null ? itemReq.price() : product.getPrice();
                String sellType = itemReq.sellType() != null ? itemReq.sellType() : "Box";

                Double stockDeduction = qty;
                if ("Piece".equalsIgnoreCase(sellType) && product.getPiecesPerBox() != null && product.getPiecesPerBox() > 0) {
                    stockDeduction = qty / product.getPiecesPerBox();
                }

                Double currentStock = product.getStock() == null ? 0.0 : product.getStock();
                product.setStock(Math.max(0.0, currentStock - stockDeduction));
                productRepository.save(product);

                InvoiceItem item = new InvoiceItem();
                item.setProduct(product);
                item.setQuantity(qty);
                item.setSellType(sellType);
                item.setPrice(appliedPrice);
                item.setInvoice(invoice);
                invoice.getItems().add(item);

                newJson.append(String.format("{\"name\":\"%s\", \"qty\":%s, \"price\":%f}",
                        product.getName().replace("\"", "\\\""),
                        String.valueOf(qty),
                        appliedPrice));
                if (i < request.cartItems().size() - 1) newJson.append(",");

                InventoryHistory log = new InventoryHistory();
                log.setProductId(product.getId());
                log.setProductName(product.getName());
                log.setActionType("EDIT_APPLY");
                log.setQuantityChanged(-stockDeduction);
                log.setFinalStock(product.getStock());
                log.setDescription("Apply New Items to Bill #" + invoice.getId());
                log.setTimestamp(LocalDateTime.now());
                inventoryHistoryRepository.save(log);
            }
        }
        newJson.append("]");

        Invoice savedInvoice = invoiceRepository.save(invoice);

        history.setNewFinalTotal(savedInvoice.getFinalTotal());
        history.setNewItemsJson(newJson.toString());
        invoiceHistoryRepository.save(history);

        return toResponse(savedInvoice);
    }

    @Transactional
    public InvoiceResponse returnInvoice(Long id, ReturnInvoiceRequest request) {
        Invoice originalInvoice = invoiceRepository.findById(id).orElseThrow();

        Invoice returnInvoice = new Invoice();
        returnInvoice.setCustomerName(originalInvoice.getCustomerName() + " (Returned)");
        returnInvoice.setOrderDate(LocalDateTime.now());
        returnInvoice.setPaymentMethod(originalInvoice.getPaymentMethod());
        returnInvoice.setIsReturn(true);
        returnInvoice.setOriginalInvoiceId(originalInvoice.getId());

        Double returnGross = request.grossTotal() != null ? request.grossTotal() : 0.0;
        Double returnCgst = request.cgst() != null ? request.cgst() : 0.0;
        Double returnSgst = request.sgst() != null ? request.sgst() : 0.0;
        Double returnFinal = request.finalTotal() != null ? request.finalTotal() : 0.0;

        returnInvoice.setGrossTotal(-returnGross);
        returnInvoice.setDiscountPercent(request.discountPercent() != null ? request.discountPercent() : 0.0);
        returnInvoice.setCgst(-returnCgst);
        returnInvoice.setSgst(-returnSgst);
        returnInvoice.setFinalTotal(-returnFinal);

        List<InvoiceItem> returnItems = new ArrayList<>();
        if (request.cartItems() != null) {
            for (CartItemRequest itemReq : request.cartItems()) {
                Product product = productRepository.findById(itemReq.id()).orElseThrow();
                Double qtyToReturn = itemReq.quantity() != null ? itemReq.quantity() : 1.0;
                String sellType = itemReq.sellType() != null ? itemReq.sellType() : "Box";

                Double stockRestoration = qtyToReturn;
                if ("Piece".equalsIgnoreCase(sellType) && product.getPiecesPerBox() != null && product.getPiecesPerBox() > 0) {
                    stockRestoration = qtyToReturn / product.getPiecesPerBox();
                }

                Double currentStock = product.getStock() == null ? 0.0 : product.getStock();
                product.setStock(currentStock + stockRestoration);
                productRepository.save(product);

                InvoiceItem item = new InvoiceItem();
                item.setProduct(product);
                item.setQuantity(-qtyToReturn);
                item.setSellType(sellType);
                item.setPrice(itemReq.price() != null ? itemReq.price() : product.getPrice());
                item.setInvoice(returnInvoice);
                returnItems.add(item);

                InventoryHistory log = new InventoryHistory();
                log.setProductId(product.getId());
                log.setProductName(product.getName());
                log.setActionType("RETURN");
                log.setQuantityChanged(stockRestoration);
                log.setFinalStock(product.getStock());
                log.setDescription("Return from Bill #" + originalInvoice.getId());
                log.setTimestamp(LocalDateTime.now());
                inventoryHistoryRepository.save(log);
            }
        }
        returnInvoice.setItems(returnItems);

        if ("Pay Later".equalsIgnoreCase(originalInvoice.getPaymentMethod())) {
            List<Customer> customers = customerRepository.findByName(originalInvoice.getCustomerName());
            if (customers != null && !customers.isEmpty()) {
                Customer customer = customers.get(0);
                Double currentBalance = customer.getBalance() != null ? customer.getBalance() : 0.0;
                customer.setBalance(currentBalance - returnFinal);
                customerRepository.save(customer);
            }
        }

        return toResponse(invoiceRepository.save(returnInvoice));
    }

    private InvoiceResponse toResponse(Invoice inv) {
        List<InvoiceItemResponse> itemResponses = inv.getItems() == null ? List.of() :
                inv.getItems().stream()
                        .map(this::toItemResponse)
                        .collect(Collectors.toList());

        return new InvoiceResponse(
                inv.getId(),
                inv.getCustomerName(),
                inv.getOrderDate(),
                inv.getGrossTotal(),
                inv.getDiscountPercent(),
                inv.getCgst(),
                inv.getSgst(),
                inv.getFinalTotal(),
                inv.getPaymentMethod(),
                inv.getDueDays(),
                inv.getCustomInvoiceId(),
                inv.getIsReturn(),
                inv.getOriginalInvoiceId(),
                itemResponses);
    }

    private InvoiceItemResponse toItemResponse(InvoiceItem item) {
        Product p = item.getProduct();
        ProductResponse productResp = p == null ? null : new ProductResponse(
                p.getId(),
                p.getName(),
                p.getHsnCode(),
                p.getPurchasePrice(),
                p.getMrp(),
                p.getPrice(),
                p.getStock(),
                p.getPiecesPerBox(),
                p.getPiecePurchasePrice(),
                p.getPieceMrp(),
                p.getPiecePrice(),
                p.getBarcode(),
                p.getScheduledDate(),
                p.getScheduledPurchasePrice(),
                p.getScheduledMrp(),
                p.getScheduledPrice(),
                p.getScheduledPiecePurchasePrice(),
                p.getScheduledPieceMrp(),
                p.getScheduledPiecePrice());

        return new InvoiceItemResponse(
                item.getId(),
                productResp,
                item.getQuantity(),
                item.getPrice(),
                item.getSellType());
    }
}