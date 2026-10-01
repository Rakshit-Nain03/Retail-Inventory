package com.hcl.inventory_retail.service;

import com.hcl.inventory_retail.entity.Warehouse;
import com.hcl.inventory_retail.exception.ResourceNotFoundException;
import com.hcl.inventory_retail.repository.WarehouseRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class WarehouseService {
	private final WarehouseRepository warehouseRepository;

	public WarehouseService(WarehouseRepository warehouseRepository) {
		this.warehouseRepository = warehouseRepository;
	}

	@Transactional(readOnly = true)
	public List<Warehouse> findAll() {
		return warehouseRepository.findAll();
	}

	@Transactional(readOnly = true)
	public Warehouse findById(Long id) {
		return warehouseRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Warehouse " + id + " was not found."));
	}

	public Warehouse create(Warehouse warehouse) {
		warehouse.setId(null);
		return warehouseRepository.save(warehouse);
	}

	public Warehouse update(Long id, Warehouse warehouse) {
		Warehouse existing = findById(id);
		existing.setName(warehouse.getName());
		existing.setLocation(warehouse.getLocation());
		existing.setCapacity(warehouse.getCapacity());
		return warehouseRepository.save(existing);
	}

	public void delete(Long id) {
		warehouseRepository.delete(findById(id));
	}
}