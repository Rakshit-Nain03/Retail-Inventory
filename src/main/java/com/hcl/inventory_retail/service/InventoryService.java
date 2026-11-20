package com.hcl.inventory_retail.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hcl.inventory_retail.dto.StockOperationRequest;
import com.hcl.inventory_retail.dto.StockReceiptRequest;
import com.hcl.inventory_retail.dto.StockTransferRequest;
import com.hcl.inventory_retail.entity.Inventory;
import com.hcl.inventory_retail.entity.Product;
import com.hcl.inventory_retail.entity.StockReceipt;
import com.hcl.inventory_retail.entity.Supplier;
import com.hcl.inventory_retail.entity.Warehouse;
import com.hcl.inventory_retail.exception.InsufficientStockException;
import com.hcl.inventory_retail.exception.ResourceNotFoundException;
import com.hcl.inventory_retail.repository.InventoryRepository;
import com.hcl.inventory_retail.repository.ProductRepository;
import com.hcl.inventory_retail.repository.StockReceiptRepository;
import com.hcl.inventory_retail.repository.SupplierRepository;
import com.hcl.inventory_retail.repository.WarehouseRepository;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final SupplierRepository supplierRepository;
    private final StockReceiptRepository stockReceiptRepository;

    public InventoryService(
            InventoryRepository inventoryRepository,
            ProductRepository productRepository,
            WarehouseRepository warehouseRepository,
            SupplierRepository supplierRepository,
            StockReceiptRepository stockReceiptRepository) {

        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.supplierRepository = supplierRepository;
        this.stockReceiptRepository = stockReceiptRepository;
    }

    @Transactional
    public Inventory addStock(StockOperationRequest request) {
        Product product = findProduct(request.productId());
        Warehouse warehouse = findWarehouse(request.warehouseId());

        Inventory inventory = inventoryRepository
                .findForUpdateByProductIdAndWarehouseId(
                        product.getId(), warehouse.getId())
                .orElseGet(() ->
                        new Inventory(null, product, warehouse, 0, null));

        inventory.setQuantity(
                Math.addExact(inventory.getQuantity(), request.quantity()));

        return inventoryRepository.save(inventory);
    }

    @Transactional
    public Inventory receiveStock(StockReceiptRequest request) {

        // Validate all referenced records before changing stock.
        Product product = findProduct(request.productId());
        Warehouse warehouse = findWarehouse(request.warehouseId());

        Supplier supplier = supplierRepository.findById(request.supplierId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Supplier " + request.supplierId() + " was not found."));

        // Increase the actual inventory quantity.
        Inventory updatedInventory = addStock(
                new StockOperationRequest(
                        product.getId(),
                        warehouse.getId(),
                        request.quantity()));

        // Record who supplied the new stock and where it was received.
        StockReceipt receipt = new StockReceipt(
                null,
                product,
                supplier,
                warehouse,
                request.quantity(),
                null);

        stockReceiptRepository.save(receipt);

        return updatedInventory;
    }

    @Transactional
    public Inventory reduceStock(StockOperationRequest request) {
        Inventory inventory = getInventoryForUpdate(
                request.productId(), request.warehouseId());

        if (inventory.getQuantity() < request.quantity()) {
            throw new InsufficientStockException(
                    "Insufficient stock for product " + request.productId()
                    + " in warehouse " + request.warehouseId()
                    + ". Available: " + inventory.getQuantity());
        }

        inventory.setQuantity(
                inventory.getQuantity() - request.quantity());

        return inventoryRepository.save(inventory);
    }

    @Transactional
    public void transferStock(StockTransferRequest request) {

        if (request.sourceWarehouseId()
                .equals(request.destinationWarehouseId())) {
            throw new IllegalArgumentException(
                    "Source and destination warehouses must be different.");
        }

        // Both changes happen in the same transaction.
        reduceStock(new StockOperationRequest(
                request.productId(),
                request.sourceWarehouseId(),
                request.quantity()));

        addStock(new StockOperationRequest(
                request.productId(),
                request.destinationWarehouseId(),
                request.quantity()));
    }

    @Transactional(readOnly = true)
    public List<Inventory> getLowStockItems() {
        return inventoryRepository.findLowStockItems();
    }

    @Transactional(readOnly = true)
    public List<Inventory> findByWarehouse(Long warehouseId) {
        findWarehouse(warehouseId);
        return inventoryRepository.findByWarehouseId(warehouseId);
    }

    private Inventory getInventoryForUpdate(
            Long productId, Long warehouseId) {
        return inventoryRepository
                .findForUpdateByProductIdAndWarehouseId(
                        productId, warehouseId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "No inventory exists for product "
                                + productId + " in warehouse "
                                + warehouseId + "."));
    }

    private Product findProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Product " + productId + " was not found."));
    }

    private Warehouse findWarehouse(Long warehouseId) {
        return warehouseRepository.findById(warehouseId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Warehouse " + warehouseId + " was not found."));
    }
}