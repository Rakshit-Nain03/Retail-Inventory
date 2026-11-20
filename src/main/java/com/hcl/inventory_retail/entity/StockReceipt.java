package com.hcl.inventory_retail.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "stock_receipts")
public class StockReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Min(1)
    private int quantity;

    @NotNull
    private LocalDateTime receivedAt;

    public StockReceipt() {
    }

    public StockReceipt(
            Long id,
            Product product,
            Supplier supplier,
            Warehouse warehouse,
            int quantity,
            LocalDateTime receivedAt) {
        this.id = id;
        this.product = product;
        this.supplier = supplier;
        this.warehouse = warehouse;
        this.quantity = quantity;
        this.receivedAt = receivedAt;
    }

    public Long getId() {
        return id;
    }

    public Product getProduct() {
        return product;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public Warehouse getWarehouse() {
        return warehouse;
    }

    public int getQuantity() {
        return quantity;
    }

    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }

    @PrePersist
    protected void setReceivedAt() {
        if (receivedAt == null) {
            receivedAt = LocalDateTime.now();
        }
    }
}