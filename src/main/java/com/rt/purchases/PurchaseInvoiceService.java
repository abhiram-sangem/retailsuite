package com.rt.purchases;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rt.history.InventoryHistory;
import com.rt.history.InventoryHistoryRepository;
import com.rt.history.PurchaseInvoiceHistory;
import com.rt.history.PurchaseInvoiceHistoryRepository;
import com.rt.inventory.Product;
import com.rt.inventory.ProductRepository;
import com.rt.inventory.dto.ProductResponse;
import com.rt.purchases.dto.CreatePurchaseInvoiceRequest;
import com.rt.purchases.dto.PurchaseInvoiceItemResponse;
import com.rt.purchases.dto.PurchaseInvoiceResponse;
import com.rt.purchases.dto.PurchaseItemRequest;
import com.rt.purchases.dto.UpdatePurchaseInvoiceRequest;

@Service
public class PurchaseInvoiceService {

    private final PurchaseInvoiceRepository purchaseInvoiceRepository;
    private final ProductRepository productRepository;
    private final PurchaseInvoiceHistoryRepository purchaseInvoiceHistoryRepository;
    private final InventoryHistoryRepository inventoryHistoryRepository;

    public PurchaseInvoiceService(
            PurchaseInvoiceRepository purchaseInvoiceRepository,
            ProductRepository productRepository,
            PurchaseInvoiceHistoryRepository purchaseInvoiceHistoryRepository,
            InventoryHistoryRepository inventoryHistoryRepository) {
        this.purchaseInvoiceRepository = purchaseInvoiceRepository;
        this.productRepository = productRepository;
        this.purchaseInvoiceHistoryRepository = purchaseInvoiceHistoryRepository;
        this.inventoryHistoryRepository = inventoryHistoryRepository;
    }

    @Transactional(readOnly = true)
    public List<PurchaseInvoiceResponse> getAllPurchaseInvoices() {
        return purchaseInvoiceRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PurchaseInvoiceResponse getPurchaseInvoiceById(Long id) {
        PurchaseInvoice invoice = purchaseInvoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase Invoice not found with id: " + id));
        return toResponse(invoice);
    }

    @Transactional
    public PurchaseInvoiceResponse createPurchaseInvoice(CreatePurchaseInvoiceRequest request) {
        PurchaseInvoice invoice = new PurchaseInvoice();
        invoice.setSellerName(request.sellerName());
        invoice.setSellerPhone(request.sellerPhone());
        invoice.setSellerGst(request.sellerGst());
        invoice.setCustomInvoiceId(request.customInvoiceId());

        if (request.purchaseDate() != null && !request.purchaseDate().trim().isEmpty()) {
            invoice.setPurchaseDate(LocalDate.parse(request.purchaseDate().trim()));
        }

        invoice.setEntryDate(LocalDateTime.now());
        invoice.setGrossTotal(request.grossTotal() != null ? request.grossTotal() : 0.0);
        invoice.setDiscountPercent(request.discountPercent() != null ? request.discountPercent() : 0.0);
        invoice.setCgst(request.cgst() != null ? request.cgst() : 0.0);
        invoice.setSgst(request.sgst() != null ? request.sgst() : 0.0);
        invoice.setFinalTotal(request.finalTotal() != null ? request.finalTotal() : 0.0);

        List<PurchaseInvoiceItem> items = new ArrayList<>();
        if (request.items() != null) {
            for (PurchaseItemRequest itemData : request.items()) {
                Long productId = itemData.productId();
                Double quantity = itemData.quantity() != null ? itemData.quantity() : 0.0;
                Double purchasePrice = itemData.purchasePrice() != null ? itemData.purchasePrice() : 0.0;
                String sellType = itemData.sellType() != null ? itemData.sellType() : "Box";

                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Product not found"));

                Double stockImpact = quantity;
                if ("Piece".equalsIgnoreCase(sellType) && product.getPiecesPerBox() != null && product.getPiecesPerBox() > 0) {
                    stockImpact = quantity / product.getPiecesPerBox();
                }

                Double currentStock = product.getStock() == null ? 0.0 : product.getStock();
                product.setStock(currentStock + stockImpact);
                product.setPurchasePrice(purchasePrice);
                productRepository.save(product);

                InventoryHistory log = new InventoryHistory();
                log.setProductId(product.getId());
                log.setProductName(product.getName());
                log.setActionType("PURCHASE");
                log.setQuantityChanged(stockImpact);
                log.setFinalStock(product.getStock());
                log.setDescription("Vendor Purchase (" + quantity + " " + sellType + "s) from " + invoice.getSellerName());
                log.setTimestamp(LocalDateTime.now());
                inventoryHistoryRepository.save(log);

                PurchaseInvoiceItem item = new PurchaseInvoiceItem();
                item.setProduct(product);
                item.setQuantity(quantity.intValue());
                item.setSellType(sellType);
                item.setPurchasePrice(purchasePrice);
                item.setPurchaseInvoice(invoice);
                items.add(item);
            }
        }

        invoice.setItems(items);
        PurchaseInvoice savedInvoice = purchaseInvoiceRepository.save(invoice);
        return toResponse(savedInvoice);
    }

    @Transactional
    public PurchaseInvoiceResponse updatePurchaseInvoice(Long id, UpdatePurchaseInvoiceRequest request) {
        PurchaseInvoice existingInvoice = purchaseInvoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase Invoice not found"));

        StringBuilder oldItemsJson = new StringBuilder("[");
        for (int i = 0; i < existingInvoice.getItems().size(); i++) {
            PurchaseInvoiceItem oldItem = existingInvoice.getItems().get(i);
            oldItemsJson.append(String.format("{\"name\":\"%s\", \"qty\":%s, \"unit\":\"%s\", \"price\":%.2f}",
                    oldItem.getProduct().getName().replace("\"", "\\\""),
                    String.valueOf(oldItem.getQuantity()),
                    oldItem.getSellType() != null ? oldItem.getSellType() : "Box",
                    oldItem.getPurchasePrice()));
            if (i < existingInvoice.getItems().size() - 1) oldItemsJson.append(",");
        }
        oldItemsJson.append("]");
        Double oldFinalTotal = existingInvoice.getFinalTotal();

        for (PurchaseInvoiceItem oldItem : existingInvoice.getItems()) {
            Product product = oldItem.getProduct();
            Double currentStock = product.getStock() == null ? 0.0 : product.getStock();
            Double itemQuantity = oldItem.getQuantity() != null ? oldItem.getQuantity().doubleValue() : 0.0;
            String oldSellType = oldItem.getSellType() != null ? oldItem.getSellType() : "Box";

            Double stockImpact = itemQuantity;
            if ("Piece".equalsIgnoreCase(oldSellType) && product.getPiecesPerBox() != null && product.getPiecesPerBox() > 0) {
                stockImpact = itemQuantity / product.getPiecesPerBox();
            }

            product.setStock(currentStock - stockImpact);
            productRepository.save(product);

            InventoryHistory log = new InventoryHistory();
            log.setProductId(product.getId());
            log.setProductName(product.getName());
            log.setActionType("PURCHASE_EDIT_REVERT");
            log.setQuantityChanged(-stockImpact);
            log.setFinalStock(product.getStock());
            log.setDescription("Reverting Purchase Invoice Edit #" + existingInvoice.getId());
            log.setTimestamp(LocalDateTime.now());
            inventoryHistoryRepository.save(log);
        }

        existingInvoice.getItems().clear();

        existingInvoice.setSellerName(request.sellerName());
        existingInvoice.setSellerPhone(request.sellerPhone());
        existingInvoice.setSellerGst(request.sellerGst());
        existingInvoice.setCustomInvoiceId(request.customInvoiceId());

        if (request.purchaseDate() != null && !request.purchaseDate().trim().isEmpty()) {
            existingInvoice.setPurchaseDate(LocalDate.parse(request.purchaseDate().trim()));
        }

        existingInvoice.setGrossTotal(request.grossTotal() != null ? request.grossTotal() : 0.0);
        existingInvoice.setDiscountPercent(request.discountPercent() != null ? request.discountPercent() : 0.0);
        existingInvoice.setCgst(request.cgst() != null ? request.cgst() : 0.0);
        existingInvoice.setSgst(request.sgst() != null ? request.sgst() : 0.0);
        existingInvoice.setFinalTotal(request.finalTotal() != null ? request.finalTotal() : 0.0);

        StringBuilder newItemsJson = new StringBuilder("[");
        if (request.items() != null) {
            for (int i = 0; i < request.items().size(); i++) {
                PurchaseItemRequest itemData = request.items().get(i);
                Long productId = itemData.productId();
                Double quantity = itemData.quantity() != null ? itemData.quantity() : 0.0;
                Double purchasePrice = itemData.purchasePrice() != null ? itemData.purchasePrice() : 0.0;
                String sellType = itemData.sellType() != null ? itemData.sellType() : "Box";

                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Product not found"));

                Double stockImpact = quantity;
                if ("Piece".equalsIgnoreCase(sellType) && product.getPiecesPerBox() != null && product.getPiecesPerBox() > 0) {
                    stockImpact = quantity / product.getPiecesPerBox();
                }

                Double currentStock = product.getStock() == null ? 0.0 : product.getStock();
                product.setStock(currentStock + stockImpact);
                product.setPurchasePrice(purchasePrice);
                productRepository.save(product);

                InventoryHistory log = new InventoryHistory();
                log.setProductId(product.getId());
                log.setProductName(product.getName());
                log.setActionType("PURCHASE_EDIT_APPLY");
                log.setQuantityChanged(stockImpact);
                log.setFinalStock(product.getStock());
                log.setDescription("Applying Edit to Purchase Invoice #" + existingInvoice.getId());
                log.setTimestamp(LocalDateTime.now());
                inventoryHistoryRepository.save(log);

                PurchaseInvoiceItem item = new PurchaseInvoiceItem();
                item.setProduct(product);
                item.setQuantity(quantity.intValue());
                item.setSellType(sellType);
                item.setPurchasePrice(purchasePrice);
                item.setPurchaseInvoice(existingInvoice);
                existingInvoice.getItems().add(item);

                newItemsJson.append(String.format("{\"name\":\"%s\", \"qty\":%s, \"unit\":\"%s\", \"price\":%.2f}",
                        product.getName().replace("\"", "\\\""),
                        String.valueOf(quantity),
                        sellType,
                        purchasePrice));
                if (i < request.items().size() - 1) newItemsJson.append(",");
            }
        }
        newItemsJson.append("]");

        PurchaseInvoiceHistory history = new PurchaseInvoiceHistory();
        history.setOriginalPurchaseInvoiceId(existingInvoice.getId());
        history.setSellerName(existingInvoice.getSellerName());
        history.setEditDate(LocalDateTime.now());
        history.setOldItemsJson(oldItemsJson.toString());
        history.setNewItemsJson(newItemsJson.toString());
        history.setOldFinalTotal(oldFinalTotal);
        history.setNewFinalTotal(existingInvoice.getFinalTotal());
        purchaseInvoiceHistoryRepository.save(history);

        PurchaseInvoice savedInvoice = purchaseInvoiceRepository.save(existingInvoice);
        return toResponse(savedInvoice);
    }

    private PurchaseInvoiceResponse toResponse(PurchaseInvoice inv) {
        List<PurchaseInvoiceItemResponse> itemResponses = inv.getItems() == null ? List.of() :
                inv.getItems().stream()
                        .map(this::toItemResponse)
                        .collect(Collectors.toList());

        return new PurchaseInvoiceResponse(
                inv.getId(),
                inv.getCustomInvoiceId(),
                inv.getSellerName(),
                inv.getSellerPhone(),
                inv.getSellerGst(),
                inv.getPurchaseDate(),
                inv.getEntryDate(),
                inv.getGrossTotal(),
                inv.getDiscountPercent(),
                inv.getCgst(),
                inv.getSgst(),
                inv.getFinalTotal(),
                itemResponses);
    }

    private PurchaseInvoiceItemResponse toItemResponse(PurchaseInvoiceItem item) {
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
                p.getBarcode());

        return new PurchaseInvoiceItemResponse(
                item.getId(),
                productResp,
                item.getQuantity(),
                item.getPurchasePrice(),
                item.getSellType());
    }
}