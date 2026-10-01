# Retail Inventory Management API

Spring Boot REST backend for product catalog, supplier management, warehouse inventory, and order fulfillment. The project uses Java 17, Maven, Spring Data JPA, Bean Validation, Lombok, and MySQL.

## Requirements

- Java 17 or newer
- MySQL 8 or newer
- Maven (or the included Maven wrapper)

## Setup and Run

1. Create a MySQL user or update the credentials in `src/main/resources/application.properties`. The configured URL creates `inventory_retail_db` when it does not exist.
2. Set `spring.datasource.password` to the local MySQL root password.
3. Start the API:

   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

The API listens on `http://localhost:8080`. Hibernate updates the schema on startup and seeds sample data when the product catalog is empty. CORS is enabled for `http://localhost:3000` and `http://localhost:4200`.

## API Endpoints

All request and response bodies use JSON. Create endpoints return `201 Created`; deletes return `204 No Content`. Invalid input returns `400`, missing resources return `404`, and stock/data conflicts return `409` with `{ "timestamp", "status", "message" }`.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/suppliers` | List suppliers |
| GET | `/api/suppliers/{id}` | Get a supplier |
| POST | `/api/suppliers` | Create a supplier |
| PUT | `/api/suppliers/{id}` | Update a supplier |
| DELETE | `/api/suppliers/{id}` | Delete a supplier |
| GET | `/api/products` | List products; optionally filter with `?category=Grocery` |
| GET | `/api/products/{id}` | Get a product |
| POST | `/api/products` | Create a product; provide the supplier as `{ "id": 1 }` |
| PUT | `/api/products/{id}` | Update a product |
| DELETE | `/api/products/{id}` | Delete a product |
| GET | `/api/warehouses` | List warehouses |
| GET | `/api/warehouses/{id}` | Get a warehouse |
| POST | `/api/warehouses` | Create a warehouse |
| PUT | `/api/warehouses/{id}` | Update a warehouse |
| DELETE | `/api/warehouses/{id}` | Delete a warehouse |
| POST | `/api/inventory/add` | Add stock: `productId`, `warehouseId`, `quantity` |
| POST | `/api/inventory/reduce` | Reduce stock: `productId`, `warehouseId`, `quantity` |
| POST | `/api/inventory/transfer` | Transfer stock: `productId`, `sourceWarehouseId`, `destinationWarehouseId`, `quantity` |
| GET | `/api/inventory/low-stock` | List inventory below its product reorder level |
| GET | `/api/inventory/warehouse/{warehouseId}` | List stock in a warehouse |
| POST | `/api/orders` | Place an order; deducts stock and confirms the order |
| GET | `/api/orders` | List orders; optionally filter with `?status=CONFIRMED` |
| GET | `/api/orders/{id}` | Get an order |
| PUT | `/api/orders/{id}/status` | Update status with `{ "status": "SHIPPED" }` |
| POST | `/api/orders/{id}/cancel` | Cancel an order and restore its stock once |

Order placement body:

```json
{
  "orderNumber": "ORD-1001",
  "customerName": "Taylor Morgan",
  "productId": 1,
  "warehouseId": 1,
  "quantity": 2
}
```

Order statuses are `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, and `CANCELLED`.
