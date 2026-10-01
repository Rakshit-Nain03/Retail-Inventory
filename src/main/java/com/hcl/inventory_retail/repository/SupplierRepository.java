package com.hcl.inventory_retail.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hcl.inventory_retail.entity.Supplier;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
}