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

  pages = ['Dashboard', 'Products', 'Inventory', 'Orders', 'Suppliers', 'Warehouses'];
  activePage = 'Dashboard';

  products: any[] = [];
  suppliers: any[] = [];
  warehouses: any[] = [];
  orders: any[] = [];
  inventory: any[] = [];
  lowStock: any[] = [];

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

  receiveForm = {
  productId: '',
  supplierId: '',
  warehouseId: '',
  quantity: 1
  };

  statusForm: { [key: number]: string } = {};

  constructor() {
    this.loadData();
  }

  async loadData() {
  try {
    // Load products
    const productResponse = await fetch(`${this.API}/products`);
    if (!productResponse.ok) {
      throw new Error(`Products API: HTTP ${productResponse.status}`);
    }
    this.products = await productResponse.json();

    // Load suppliers
    const supplierResponse = await fetch(`${this.API}/suppliers`);
    if (!supplierResponse.ok) {
      throw new Error(`Suppliers API: HTTP ${supplierResponse.status}`);
    }
    this.suppliers = await supplierResponse.json();

    // Load all warehouses
    const warehouseResponse = await fetch(`${this.API}/warehouses`);
    if (!warehouseResponse.ok) {
      throw new Error(`Warehouses API: HTTP ${warehouseResponse.status}`);
    }
    this.warehouses = await warehouseResponse.json();

    // Load orders
    const orderResponse = await fetch(`${this.API}/orders`);
    if (!orderResponse.ok) {
      throw new Error(`Orders API: HTTP ${orderResponse.status}`);
    }
    this.orders = await orderResponse.json();

    this.orders.forEach(order => {
      this.statusForm[order.id] = order.status;
    });

    // Fetch inventory from every warehouse, not just warehouse ID 1
    const inventoryLists = await Promise.all(
      this.warehouses.map(async warehouse => {
        const response = await fetch(
          `${this.API}/inventory/warehouse/${warehouse.id}`
        );

        if (!response.ok) {
          throw new Error(
            `Inventory API failed for ${warehouse.name}: HTTP ${response.status}`
          );
        }

        return await response.json();
      })
    );

    const actualInventory: any[] = inventoryLists.flat();

    // Match each product with its warehouse inventory record
    const inventoryMap = new Map<string, any>();

    actualInventory.forEach(item => {
      const key = `${item.product?.id}-${item.warehouse?.id}`;
      inventoryMap.set(key, item);
    });

    // Show every product for every warehouse.
    // Missing database records are displayed as zero; they are NOT inserted.
    this.inventory = this.products.flatMap(product =>
      this.warehouses.map(warehouse => {
        const key = `${product.id}-${warehouse.id}`;
        const existingItem = inventoryMap.get(key);

        return existingItem ?? {
          id: `missing-${product.id}-${warehouse.id}`,
          product,
          warehouse,
          quantity: 0,
          lastUpdated: null
        };
      })
    );

    // Low stock means quantity is below that product's reorder level.
    // Calculate it across both warehouses.
    this.lowStock = this.inventory.filter(item =>
      Number(item.quantity ?? 0) <
      Number(item.product?.reorderLevel ?? 0)
    );

    console.log('Products:', this.products);
    console.log('Warehouses:', this.warehouses);
    console.log('Inventory across all warehouses:', this.inventory);
    console.log('Low-stock items:', this.lowStock);

    this.error = '';
  } catch (error) {
    console.error('Data loading failed:', error);

    this.showError(
      error instanceof Error
        ? error.message
        : 'Unable to load inventory data.'
    );
  }
}

  get totalStock(): number {
    return this.inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  get activeOrders(): number {
    return this.orders.filter(order => order.status !== 'CANCELLED' && order.status !== 'DELIVERED').length;
  }

  getProductName(id: number): string {
    const product = this.products.find(product => product.id === id);
    return product ? product.name : `Product ${id}`;
  }

  getWarehouseName(id: number): string {
    const warehouse = this.warehouses.find(warehouse => warehouse.id === id);
    return warehouse ? warehouse.name : `Warehouse ${id}`;
  }

  async createOrder() {
    try {
      const response = await fetch(`${this.API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: this.orderForm.orderNumber,
          customerName: this.orderForm.customerName,
          productId: Number(this.orderForm.productId),
          warehouseId: Number(this.orderForm.warehouseId),
          quantity: Number(this.orderForm.quantity)
        })
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `HTTP ${response.status}`);
      }

      this.orderForm = { orderNumber: '', customerName: '', productId: '', warehouseId: '', quantity: 1 };
      this.showMessage('Order created successfully!');
      await this.loadData();
    } catch (error) {
      console.error('Create order failed:', error);
      this.showError('Failed to create order. Check stock availability and order details.');
    }
  }

  async updateOrderStatus(orderId: number) {
    const status = this.statusForm[orderId];
    if (!status) {
      this.showError('Please select a status.');
      return;
    }

    try {
      const response = await fetch(`${this.API}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `HTTP ${response.status}`);
      }
      this.showMessage('Order status updated!');
      await this.loadData();
    } catch (error) {
      console.error('Update order status failed:', error);
      this.showError('Failed to update order status. Check the order status and backend response.');
    }
  }

  async cancelOrder(orderId: number) {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      const response = await fetch(`${this.API}/orders/${orderId}/cancel`, { method: 'POST' });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `HTTP ${response.status}`);
      }
      this.showMessage('Order cancelled successfully!');
      await this.loadData();
    } catch (error) {
      console.error('Cancel order failed:', error);
      this.showError('Failed to cancel order.');
    }
  }

  async transferStock() {
  const productId = Number(this.transferForm.productId);
  const sourceWarehouseId = Number(
    this.transferForm.sourceWarehouseId
  );
  const destinationWarehouseId = Number(
    this.transferForm.destinationWarehouseId
  );
  const quantity = Number(this.transferForm.quantity);

  if (!productId || !sourceWarehouseId || !destinationWarehouseId) {
    this.showError('Please select a product and both warehouses.');
    return;
  }

  if (sourceWarehouseId === destinationWarehouseId) {
    this.showError(
      'Source and destination warehouses must be different.'
    );
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    this.showError('Quantity must be a positive whole number.');
    return;
  }

  // Check the currently displayed quantity at the source.
  const sourceItem = this.inventory.find(item =>
    Number(item.product?.id) === productId &&
    Number(item.warehouse?.id) === sourceWarehouseId
  );

  const available = Number(sourceItem?.quantity ?? 0);

  if (quantity > available) {
    this.showError(
      `Insufficient stock. Available in ${
        this.getWarehouseName(sourceWarehouseId)
      }: ${available} units.`
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
          productId,
          sourceWarehouseId,
          destinationWarehouseId,
          quantity
        })
      }
    );

    if (!response.ok) {
      const responseText = await response.text();
      let detail = responseText;

      try {
        const parsed = JSON.parse(responseText);
        detail = parsed.message || responseText;
      } catch {
        // Keep the original response text if it isn't JSON.
      }

      throw new Error(
        detail || `Transfer failed with HTTP ${response.status}`
      );
    }

    this.transferForm = {
      productId: '',
      sourceWarehouseId: '',
      destinationWarehouseId: '',
      quantity: 1
    };

    await this.loadData();
    this.showMessage('Stock transferred successfully!');
  } catch (error) {
    console.error('Stock transfer failed:', error);

    this.showError(
      error instanceof Error
        ? `Stock transfer failed: ${error.message}`
        : 'Stock transfer failed.'
    );
  }
}

async receiveStock() {
  const { productId, supplierId, warehouseId, quantity } =
    this.receiveForm;

  if (!productId || !supplierId || !warehouseId ||
      !Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
    this.showError('Select a product, supplier, warehouse and valid quantity.');
    return;
  }

  try {
    const response = await fetch(`${this.API}/inventory/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: Number(productId),
        supplierId: Number(supplierId),
        warehouseId: Number(warehouseId),
        quantity: Number(quantity)
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `HTTP ${response.status}`);
    }

    this.receiveForm = {
      productId: '',
      supplierId: '',
      warehouseId: '',
      quantity: 1
    };

    await this.loadData();
    this.showMessage('Stock received from supplier successfully!');
  } catch (error) {
    console.error('Stock receipt failed:', error);
    this.showError(
      error instanceof Error
        ? `Could not receive stock: ${error.message}`
        : 'Could not receive stock.'
    );
  }
}
  showMessage(message: string) {
    this.message = message;
    this.error = '';
    setTimeout(() => this.message = '', 3000);
  }

  showError(error: string) {
    this.error = error;
    this.message = '';
    setTimeout(() => this.error = '', 4000);
  }
}
