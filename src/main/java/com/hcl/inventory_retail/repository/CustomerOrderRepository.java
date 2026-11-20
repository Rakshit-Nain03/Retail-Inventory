package com.hcl.inventory_retail.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.hcl.inventory_retail.entity.CustomerOrder;
import com.hcl.inventory_retail.entity.OrderStatus;

import jakarta.persistence.LockModeType;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
	List<CustomerOrder> findByStatus(OrderStatus status);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select customerOrder from CustomerOrder customerOrder where customerOrder.id = :orderId")
	Optional<CustomerOrder> findForUpdateById(@Param("orderId") Long orderId);
}