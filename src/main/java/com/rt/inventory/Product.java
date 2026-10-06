package com.rt.inventory;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String hsnCode;
    private Double purchasePrice;
    private Double mrp; 
    private Double price;
    
    // --- FRACTIONAL STOCK ---
    private Double stock;

    // --- PIECE PRICING FIELDS ---
    private Integer piecesPerBox;
    private Double piecePurchasePrice;
    private Double pieceMrp;
    private Double piecePrice;
    
    // --- BARCODE SCANNING ---
    private String barcode;

    // --- NEW: SCHEDULED PRICE ROLLOUT FIELDS ---
    private LocalDate scheduledDate;
    private Double scheduledPurchasePrice;
    private Double scheduledMrp;
    private Double scheduledPrice;
    private Double scheduledPiecePurchasePrice;
    private Double scheduledPieceMrp;
    private Double scheduledPiecePrice;

    public Product() {}

    public Product(String name, Double price, Double stock) {
        this.name = name;
        this.price = price;
        this.stock = stock;
        this.purchasePrice = 0.0;
        this.mrp = price; 
        this.hsnCode = "N/A";
    }

    public Product(String name, String hsnCode, Double purchasePrice, Double mrp, Double price, Double stock, Integer piecesPerBox) {
        this.name = name;
        this.hsnCode = hsnCode;
        this.purchasePrice = purchasePrice;
        this.mrp = mrp;
        this.price = price;
        this.stock = stock;
        this.piecesPerBox = piecesPerBox;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }

    public Double getPurchasePrice() { return purchasePrice; }
    public void setPurchasePrice(Double purchasePrice) { this.purchasePrice = purchasePrice; }

    public Double getMrp() { return mrp; }
    public void setMrp(Double mrp) { this.mrp = mrp; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Double getStock() { return stock; }
    public void setStock(Double stock) { this.stock = stock; }

    public Integer getPiecesPerBox() { return piecesPerBox; }
    public void setPiecesPerBox(Integer piecesPerBox) { this.piecesPerBox = piecesPerBox; }

    public Double getPiecePurchasePrice() { return piecePurchasePrice; }
    public void setPiecePurchasePrice(Double piecePurchasePrice) { this.piecePurchasePrice = piecePurchasePrice; }

    public Double getPieceMrp() { return pieceMrp; }
    public void setPieceMrp(Double pieceMrp) { this.pieceMrp = pieceMrp; }

    public Double getPiecePrice() { return piecePrice; }
    public void setPiecePrice(Double piecePrice) { this.piecePrice = piecePrice; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }

    public Double getScheduledPurchasePrice() { return scheduledPurchasePrice; }
    public void setScheduledPurchasePrice(Double scheduledPurchasePrice) { this.scheduledPurchasePrice = scheduledPurchasePrice; }

    public Double getScheduledMrp() { return scheduledMrp; }
    public void setScheduledMrp(Double scheduledMrp) { this.scheduledMrp = scheduledMrp; }

    public Double getScheduledPrice() { return scheduledPrice; }
    public void setScheduledPrice(Double scheduledPrice) { this.scheduledPrice = scheduledPrice; }

    public Double getScheduledPiecePurchasePrice() { return scheduledPiecePurchasePrice; }
    public void setScheduledPiecePurchasePrice(Double scheduledPiecePurchasePrice) { this.scheduledPiecePurchasePrice = scheduledPiecePurchasePrice; }

    public Double getScheduledPieceMrp() { return scheduledPieceMrp; }
    public void setScheduledPieceMrp(Double scheduledPieceMrp) { this.scheduledPieceMrp = scheduledPieceMrp; }

    public Double getScheduledPiecePrice() { return scheduledPiecePrice; }
    public void setScheduledPiecePrice(Double scheduledPiecePrice) { this.scheduledPiecePrice = scheduledPiecePrice; }
}