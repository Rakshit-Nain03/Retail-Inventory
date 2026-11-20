package com.hcl.inventory_retail.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hcl.inventory_retail.dto.PlaceOrderRequest;
import com.hcl.inventory_retail.dto.StockOperationRequest;
import com.hcl.inventory_retail.entity.CustomerOrder;
import com.hcl.inventory_retail.entity.OrderStatus;
import com.hcl.inventory_retail.entity.Product;
import com.hcl.inventory_retail.entity.Warehouse;
import com.hcl.inventory_retail.exception.ResourceNotFoundException;
import com.hcl.inventory_retail.repository.CustomerOrderRepository;
import com.hcl.inventory_retail.repository.ProductRepository;
import com.hcl.inventory_retail.repository.WarehouseRepository;

@Service
public class OrderService {
	private final CustomerOrderRepository orderRepository;
	private final ProductRepository productRepository;
	private final WarehouseRepository warehouseRepository;
	private final InventoryService inventoryService;

	public OrderService(CustomerOrderRepository orderRepository, ProductRepository productRepository,
			WarehouseRepository warehouseRepository, InventoryService inventoryService) {
		this.orderRepository = orderRepository;
		this.productRepository = productRepository;
		this.warehouseRepository = warehouseRepository;
		this.inventoryService = inventoryService;
	}

	@Transactional
	public CustomerOrder placeOrder(PlaceOrderRequest request) {
		Product product = productRepository.findById(request.productId())
				.orElseThrow(() -> new ResourceNotFoundException("Product " + request.productId() + " was not found."));
		Warehouse warehouse = warehouseRepository.findById(request.warehouseId())
				.orElseThrow(() -> new ResourceNotFoundException("Warehouse " + request.warehouseId() + " was not found."));
		inventoryService.reduceStock(new StockOperationRequest(product.getId(), warehouse.getId(), request.quantity()));
		CustomerOrder order = new CustomerOrder(null, request.orderNumber(), request.customerName(), product, warehouse,
				request.quantity(), OrderStatus.CONFIRMED, LocalDateTime.now());
		return orderRepository.save(order);
	}

	@Transactional(readOnly = true)
	public List<CustomerOrder> findAll() {
		return orderRepository.findAll();
	}

	@Transactional(readOnly = true)
	public CustomerOrder findById(Long id) {
		return orderRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Order " + id + " was not found."));
	}

	@Transactional(readOnly = true)
	public List<CustomerOrder> findByStatus(OrderStatus status) {
		return orderRepository.findByStatus(status);
	}

	@Transactional
	public CustomerOrder updateStatus(Long id, OrderStatus status) {
		if (status == OrderStatus.CANCELLED) {
			return cancel(id);
		}
		CustomerOrder order = findForUpdate(id);
		if (order.getStatus() == OrderStatus.CANCELLED) {
			throw new IllegalArgumentException("A cancelled order cannot be reopened.");
		}
		order.setStatus(status);
		return orderRepository.save(order);
	}

	@Transactional
	public CustomerOrder cancel(Long id) {
		CustomerOrder order = findForUpdate(id);
		if (order.getStatus() != OrderStatus.CANCELLED) {
			inventoryService.addStock(new StockOperationRequest(order.getProduct().getId(),
					order.getWarehouse().getId(), order.getQuantity()));
			order.setStatus(OrderStatus.CANCELLED);
			orderRepository.save(order);
		}
		return order;
	}

	private CustomerOrder findForUpdate(Long id) {
		return orderRepository.findForUpdateById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Order " + id + " was not found."));
	}
}