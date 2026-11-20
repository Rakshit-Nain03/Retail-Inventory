package com.hcl.inventory_retail.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hcl.inventory_retail.entity.Supplier;
import com.hcl.inventory_retail.exception.ResourceNotFoundException;
import com.hcl.inventory_retail.repository.SupplierRepository;

@Service
@Transactional
public class SupplierService {
	private final SupplierRepository supplierRepository;

	public SupplierService(SupplierRepository supplierRepository) {
		this.supplierRepository = supplierRepository;
	}

	@Transactional(readOnly = true)
	public List<Supplier> findAll() {
		return supplierRepository.findAll();
	}

	@Transactional(readOnly = true)
	public Supplier findById(Long id) {
		return supplierRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Supplier " + id + " was not found."));
	}

	public Supplier create(Supplier supplier) {
		supplier.setId(null);
		return supplierRepository.save(supplier);
	}

	public Supplier update(Long id, Supplier supplier) {
		Supplier existing = findById(id);
		existing.setName(supplier.getName());
		existing.setContactPerson(supplier.getContactPerson());
		existing.setEmail(supplier.getEmail());
		existing.setPhone(supplier.getPhone());
		existing.setAddress(supplier.getAddress());
		return supplierRepository.save(existing);
	}

	public void delete(Long id) {
		supplierRepository.delete(findById(id));
	}
}