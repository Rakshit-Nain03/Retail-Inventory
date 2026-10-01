package com.hcl.inventory_retail.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hcl.inventory_retail.entity.Warehouse;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    
}