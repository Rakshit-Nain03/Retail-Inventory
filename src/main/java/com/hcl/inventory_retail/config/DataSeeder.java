package com.hcl.inventory_retail.config;

import java.math.BigDecimal;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.hcl.inventory_retail.entity.Inventory;
import com.hcl.inventory_retail.entity.Product;
import com.hcl.inventory_retail.entity.Supplier;
import com.hcl.inventory_retail.entity.Warehouse;
import com.hcl.inventory_retail.repository.InventoryRepository;
import com.hcl.inventory_retail.repository.ProductRepository;
import com.hcl.inventory_retail.repository.SupplierRepository;
import com.hcl.inventory_retail.repository.WarehouseRepository;

@Configuration
public class DataSeeder {

	@Bean
    @SuppressWarnings("unused")
	CommandLineRunner seedRetailData(SupplierRepository supplierRepository, ProductRepository productRepository,
			WarehouseRepository warehouseRepository, InventoryRepository inventoryRepository) {
		return args -> {
			if (productRepository.count() > 0) {
				return;
			}

			Supplier supplier = supplierRepository.save(new Supplier(null, "Northstar Supply Co.",
					"Jordan Lee", "sales@northstarsupply.example", "555-0100", "100 Market Street"));
			Product coffee = productRepository.save(new Product(null, "Ground Coffee", "COF-001",
					"Medium-roast ground coffee, 340 g", "Grocery", new BigDecimal("12.99"), 10, supplier));
			Product tea = productRepository.save(new Product(null, "Green Tea", "TEA-001",
					"Green tea bags, pack of 20", "Grocery", new BigDecimal("6.49"), 8, supplier));
			Warehouse central = warehouseRepository.save(new Warehouse(null, "Central Warehouse",
					"100 Logistics Way", 10000));
			Warehouse east = warehouseRepository.save(new Warehouse(null, "Eastside Store",
					"24 Pine Avenue", 1500));
			inventoryRepository.save(new Inventory(null, coffee, central, 80, null));
			inventoryRepository.save(new Inventory(null, tea, central, 60, null));
			inventoryRepository.save(new Inventory(null, coffee, east, 8, null));
		};
	}
}