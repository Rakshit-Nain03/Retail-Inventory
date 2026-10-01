package com.hcl.inventory_retail.service;

import com.hcl.inventory_retail.entity.Product;
import com.hcl.inventory_retail.entity.Supplier;
import com.hcl.inventory_retail.exception.ResourceNotFoundException;
import com.hcl.inventory_retail.repository.ProductRepository;
import com.hcl.inventory_retail.repository.SupplierRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProductService {
	private final ProductRepository productRepository;
	private final SupplierRepository supplierRepository;

	public ProductService(ProductRepository productRepository, SupplierRepository supplierRepository) {
		this.productRepository = productRepository;
		this.supplierRepository = supplierRepository;
	}

	@Transactional(readOnly = true)
	public List<Product> findAll() {
		return productRepository.findAll();
	}

	@Transactional(readOnly = true)
	public Product findById(Long id) {
		return productRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Product " + id + " was not found."));
	}

	@Transactional(readOnly = true)
	public List<Product> findByCategory(String category) {
		return productRepository.findByCategory(category);
	}

	public Product create(Product product) {
		product.setId(null);
		product.setSupplier(findSupplier(product.getSupplier().getId()));
		return productRepository.save(product);
	}

	public Product update(Long id, Product product) {
		Product existing = findById(id);
		productRepository.findBySku(product.getSku()).ifPresent(match -> {
			if (!match.getId().equals(id)) {
				throw new IllegalArgumentException("SKU is already in use: " + product.getSku());
			}
		});
		existing.setName(product.getName());
		existing.setSku(product.getSku());
		existing.setDescription(product.getDescription());
		existing.setCategory(product.getCategory());
		existing.setPrice(product.getPrice());
		existing.setReorderLevel(product.getReorderLevel());
		existing.setSupplier(findSupplier(product.getSupplier().getId()));
		return productRepository.save(existing);
	}

	public void delete(Long id) {
		productRepository.delete(findById(id));
	}

	private Supplier findSupplier(Long supplierId) {
		return supplierRepository.findById(supplierId)
				.orElseThrow(() -> new ResourceNotFoundException("Supplier " + supplierId + " was not found."));
	}
}