package com.hcl.inventory_retail.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hcl.inventory_retail.entity.StockReceipt;

public interface StockReceiptRepository
        extends JpaRepository<StockReceipt, Long> {
}