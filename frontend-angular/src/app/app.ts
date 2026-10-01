import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  API = 'http://localhost:8080/api';

  pages = [
    'Dashboard',
    'Products',
    'Inventory',
    'Orders',
    'Suppliers',
    'Warehouses'
  ];

  activePage = 'Dashboard';

  products: any[] = [];
  suppliers: any[] = [];
  warehouses: any[] = [];
  orders: any[] = [];
  inventory: any[] = [];
  lowStock: any[] = [];

  selectedInventory: any[] = [];
  selectedWarehouseId = '';
  inventoryMode: 'warehouse' | 'lowstock' = 'warehouse';

  message = '';
  error = '';

  orderForm = {
    orderNumber: '',
    customerName: '',
    productId: '',
    warehouseId: '',
    quantity: 1
  };

  transferForm = {
    productId: '',
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    quantity: 1
  };

  statusForm: { [key: number]: string } = {};

  constructor() {
    this.loadData();
  }

  async loadData() {
    try {
      const productResponse = await fetch(`${this.API}/products`);
      if (productResponse.ok) {
        this.products = await productResponse.json();
      }

      const supplierResponse = await fetch(`${this.API}/suppliers`);
      if (supplierResponse.ok) {
        this.suppliers = await supplierResponse.json();
      }

      const warehouseResponse = await fetch(`${this.API}/warehouses`);
      if (warehouseResponse.ok) {
        this.warehouses = await warehouseResponse.json();
      }

      const orderResponse = await fetch(`${this.API}/orders`);
      if (orderResponse.ok) {
        this.orders = await orderResponse.json();

        this.orders.forEach(order => {
          this.statusForm[order.id] = order.status;
        });
      }

      /*
       * Load inventory from EVERY warehouse.
       * This makes Dashboard Total Stock represent the whole network.
       */
      if (this.warehouses.length > 0) {
        const inventoryResponses = await Promise.all(
          this.warehouses.map(warehouse =>
            fetch(`${this.API}/inventory/warehouse/${warehouse.id}`)
          )
        );

        const inventoryLists = await Promise.all(
          inventoryResponses.map(response =>
            response.ok ? response.json() : []
          )
        );

        this.inventory = inventoryLists.flat();
      } else {
        this.inventory = [];
      }

      const lowStockResponse = await fetch(
        `${this.API}/inventory/low-stock`
      );

      if (lowStockResponse.ok) {
        this.lowStock = await lowStockResponse.json();
      }

      this.selectWarehouse(this.selectedWarehouseId);

      console.log('Products:', this.products);
      console.log('Warehouses:', this.warehouses);
      console.log('All Inventory:', this.inventory);
      console.log('Low Stock:', this.lowStock);

    } catch (error) {
      console.error('Backend connection error:', error);
      this.showError('Unable to connect to backend.');
    }
  }

  selectWarehouse(warehouseId: string) {
    this.selectedWarehouseId = warehouseId;

    if (!warehouseId) {
      this.selectedInventory = [];
      return;
    }

    this.selectedInventory = this.inventory.filter(
      item => String(item.warehouse?.id) === String(warehouseId)
    );
  }

  get totalStock(): number {
    return this.inventory.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
  }

  get activeOrders(): number {
    return this.orders.filter(
      order =>
        order.status !== 'CANCELLED' &&
        order.status !== 'DELIVERED'
    ).length;
  }

  getProductName(id: number): string {
    const product = this.products.find(
      product => product.id === id
    );

    return product
      ? product.name
      : `Product ${id}`;
  }

  getWarehouseName(id: number): string {
    const warehouse = this.warehouses.find(
      warehouse => warehouse.id === id
    );

    return warehouse
      ? warehouse.name
      : `Warehouse ${id}`;
  }

  async createOrder() {
    try {
      const response = await fetch(`${this.API}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderNumber: this.orderForm.orderNumber,
          customerName: this.orderForm.customerName,
          productId: Number(this.orderForm.productId),
          warehouseId: Number(this.orderForm.warehouseId),
          quantity: Number(this.orderForm.quantity)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      this.orderForm = {
        orderNumber: '',
        customerName: '',
        productId: '',
        warehouseId: '',
        quantity: 1
      };

      this.showMessage('Order created successfully!');
      await this.loadData();

    } catch (error) {
      console.error(error);
      this.showError('Failed to create order.');
    }
  }

  async updateOrderStatus(orderId: number) {
    const status = this.statusForm[orderId];

    if (!status) {
      this.showError('Please select a status.');
      return;
    }

    try {
      const response = await fetch(
        `${this.API}/orders/${orderId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: status
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      this.statusForm[orderId] = status;

      this.showMessage('Order status updated!');
      await this.loadData();

    } catch (error) {
      console.error(error);
      this.showError('Failed to update order status.');
    }
  }

  async cancelOrder(orderId: number) {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this order?'
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${this.API}/orders/${orderId}/cancel`,
        {
          method: 'POST'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      this.statusForm[orderId] = 'CANCELLED';

      this.showMessage(
        'Order cancelled successfully!'
      );

      await this.loadData();

    } catch (error) {
      console.error(error);
      this.showError('Failed to cancel order.');
    }
  }

  async transferStock() {
    if (
      this.transferForm.sourceWarehouseId ===
      this.transferForm.destinationWarehouseId
    ) {
      this.showError(
        'Source and destination warehouses must be different.'
      );

      return;
    }

    try {
      const response = await fetch(
        `${this.API}/inventory/transfer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            productId: Number(
              this.transferForm.productId
            ),
            sourceWarehouseId: Number(
              this.transferForm.sourceWarehouseId
            ),
            destinationWarehouseId: Number(
              this.transferForm.destinationWarehouseId
            ),
            quantity: Number(
              this.transferForm.quantity
            )
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to transfer stock');
      }

      this.transferForm = {
        productId: '',
        sourceWarehouseId: '',
        destinationWarehouseId: '',
        quantity: 1
      };

      this.showMessage(
        'Stock transferred successfully!'
      );

      await this.loadData();

    } catch (error) {
      console.error(error);
      this.showError(
        'Failed to transfer stock.'
      );
    }
  }

  showMessage(message: string) {
    this.message = message;
    this.error = '';

    setTimeout(() => {
      this.message = '';
    }, 3000);
  }

  showError(error: string) {
    this.error = error;
    this.message = '';

    setTimeout(() => {
      this.error = '';
    }, 4000);
  }
}
