import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:8080/api";

function App() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const [activePage, setActivePage] = useState("Dashboard");
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [orderForm, setOrderForm] = useState({
    orderNumber: "",
    customerName: "",
    productId: "",
    warehouseId: "",
    quantity: 1,
  });

  const [transferForm, setTransferForm] = useState({
    productId: "",
    sourceWarehouseId: "",
    destinationWarehouseId: "",
    quantity: 1,
  });

  const [statusForm, setStatusForm] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        productsRes,
        suppliersRes,
        warehousesRes,
        ordersRes,
        inventoryRes,
        lowStockRes,
      ] = await Promise.all([
        fetch(`${API}/products`),
        fetch(`${API}/suppliers`),
        fetch(`${API}/warehouses`),
        fetch(`${API}/orders`),
        fetch(`${API}/inventory/warehouse/1`),
        fetch(`${API}/inventory/low-stock`),
      ]);

      setProducts(await productsRes.json());
      setSuppliers(await suppliersRes.json());
      setWarehouses(await warehousesRes.json());
      setOrders(await ordersRes.json());
      setInventory(await inventoryRes.json());
      setLowStock(await lowStockRes.json());
    } catch (err) {
      setError("Unable to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showMessage = (msg) => {
    setMessage(msg);
    setError("");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const showError = (msg) => {
    setError(msg);
    setMessage("");

    setTimeout(() => {
      setError("");
    }, 4000);
  };

  // CREATE ORDER
  const createOrder = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderNumber: orderForm.orderNumber,
          customerName: orderForm.customerName,
          productId: Number(orderForm.productId),
          warehouseId: Number(orderForm.warehouseId),
          quantity: Number(orderForm.quantity),
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to create order");
      }

      setOrderForm({
        orderNumber: "",
        customerName: "",
        productId: "",
        warehouseId: "",
        quantity: 1,
      });

      showMessage("Order created successfully!");
      loadData();
    } catch (err) {
      showError("Failed to create order.");
    }
  };

  // UPDATE ORDER STATUS
  const updateOrderStatus = async (orderId) => {
    const status = statusForm[orderId];

    if (!status) {
      showError("Please select a status.");
      return;
    }

    try {
      const response = await fetch(`${API}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      showMessage("Order status updated!");
      loadData();
    } catch (err) {
      showError("Failed to update order status.");
    }
  };

  // CANCEL ORDER
  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/orders/${orderId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel order");
      }

      showMessage("Order cancelled successfully!");
      loadData();
    } catch (err) {
      showError("Failed to cancel order.");
    }
  };

  // TRANSFER STOCK
  const transferStock = async (e) => {
    e.preventDefault();

    if (
      transferForm.sourceWarehouseId ===
      transferForm.destinationWarehouseId
    ) {
      showError("Source and destination warehouses must be different.");
      return;
    }

    try {
      const response = await fetch(`${API}/inventory/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: Number(transferForm.productId),
          sourceWarehouseId: Number(transferForm.sourceWarehouseId),
          destinationWarehouseId: Number(
            transferForm.destinationWarehouseId
          ),
          quantity: Number(transferForm.quantity),
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to transfer stock");
      }

      setTransferForm({
        productId: "",
        sourceWarehouseId: "",
        destinationWarehouseId: "",
        quantity: 1,
      });

      showMessage("Stock transferred successfully!");
      loadData();
    } catch (err) {
      showError("Failed to transfer stock.");
    }
  };

  const totalStock = inventory.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  const activeOrders = orders.filter(
    (order) =>
      order.status !== "CANCELLED" &&
      order.status !== "DELIVERED"
  ).length;

  const getProductName = (id) => {
    const product = products.find((p) => p.id === id);
    return product ? product.name : `Product ${id}`;
  };

  const getWarehouseName = (id) => {
    const warehouse = warehouses.find((w) => w.id === id);
    return warehouse ? warehouse.name : `Warehouse ${id}`;
  };

  const renderDashboard = () => (
    <>
      <div className="stats">
        <div className="stat-card">
          <h3>Total Products</h3>
          <p>{products.length}</p>
        </div>

        <div className="stat-card">
          <h3>Total Stock</h3>
          <p>{totalStock}</p>
        </div>

        <div className="stat-card">
          <h3>Active Orders</h3>
          <p>{activeOrders}</p>
        </div>

        <div className="stat-card">
          <h3>Low Stock</h3>
          <p>{lowStock.length}</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <h2>Products</h2>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>₹{product.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h2>Low Stock</h2>

          {lowStock.length === 0 ? (
            <p className="empty">No low-stock products.</p>
          ) : (
            lowStock.map((item) => (
              <div className="list-item" key={item.id}>
                <strong>{getProductName(item.product?.id)}</strong>
                <span>Qty: {item.quantity}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <h2>Warehouses</h2>

          {warehouses.map((warehouse) => (
            <div className="list-item" key={warehouse.id}>
              <strong>{warehouse.name}</strong>
              <span>{warehouse.location}</span>
            </div>
          ))}
        </div>

        <div className="panel">
          <h2>Recent Orders</h2>

          {orders.slice(-5).reverse().map((order) => (
            <div className="list-item" key={order.id}>
              <strong>{order.orderNumber}</strong>
              <span className={`order-status ${order.status?.toLowerCase()}`}>
                {order.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderProducts = () => (
    <div className="panel">
      <h2>Products</h2>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>SKU</th>
              <th>Price</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>₹{product.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInventory = () => (
    <>
      <div className="panel">
        <h2>Transfer Stock</h2>

        <form className="action-form" onSubmit={transferStock}>
          <select
            value={transferForm.productId}
            onChange={(e) =>
              setTransferForm({
                ...transferForm,
                productId: e.target.value,
              })
            }
            required
          >
            <option value="">Select Product</option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>

          <select
            value={transferForm.sourceWarehouseId}
            onChange={(e) =>
              setTransferForm({
                ...transferForm,
                sourceWarehouseId: e.target.value,
              })
            }
            required
          >
            <option value="">Source Warehouse</option>

            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>

          <select
            value={transferForm.destinationWarehouseId}
            onChange={(e) =>
              setTransferForm({
                ...transferForm,
                destinationWarehouseId: e.target.value,
              })
            }
            required
          >
            <option value="">Destination Warehouse</option>

            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            placeholder="Quantity"
            value={transferForm.quantity}
            onChange={(e) =>
              setTransferForm({
                ...transferForm,
                quantity: e.target.value,
              })
            }
            required
          />

          <button type="submit">Transfer Stock</button>
        </form>
      </div>

      <div className="panel">
        <h2>Inventory</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Quantity</th>
                <th>Reorder Level</th>
              </tr>
            </thead>

            <tbody>
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td>{getProductName(item.product?.id)}</td>
                  <td>{getWarehouseName(item.warehouse?.id)}</td>
                  <td>{item.quantity}</td>
                  <td>{item.reorderLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderOrders = () => (
    <>
      <div className="panel">
        <h2>Create Order</h2>

        <form className="action-form" onSubmit={createOrder}>
          <input
            type="text"
            placeholder="Order Number"
            value={orderForm.orderNumber}
            onChange={(e) =>
              setOrderForm({
                ...orderForm,
                orderNumber: e.target.value,
              })
            }
            required
          />

          <input
            type="text"
            placeholder="Customer Name"
            value={orderForm.customerName}
            onChange={(e) =>
              setOrderForm({
                ...orderForm,
                customerName: e.target.value,
              })
            }
            required
          />

          <select
            value={orderForm.productId}
            onChange={(e) =>
              setOrderForm({
                ...orderForm,
                productId: e.target.value,
              })
            }
            required
          >
            <option value="">Select Product</option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>

          <select
            value={orderForm.warehouseId}
            onChange={(e) =>
              setOrderForm({
                ...orderForm,
                warehouseId: e.target.value,
              })
            }
            required
          >
            <option value="">Select Warehouse</option>

            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            placeholder="Quantity"
            value={orderForm.quantity}
            onChange={(e) =>
              setOrderForm({
                ...orderForm,
                quantity: e.target.value,
              })
            }
            required
          />

          <button type="submit">Create Order</button>
        </form>
      </div>

      <div className="panel">
        <h2>Orders</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Update Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.orderNumber}</td>
                  <td>{order.customerName}</td>

                  <td>
                    <span
                      className={`order-status ${order.status?.toLowerCase()}`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td>
                    <div className="status-action">
                      <select
                        value={statusForm[order.id] || order.status}
                        onChange={(e) =>
                          setStatusForm({
                            ...statusForm,
                            [order.id]: e.target.value,
                          })
                        }
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>

                      <button
                        className="small-btn"
                        onClick={() => updateOrderStatus(order.id)}
                      >
                        Update
                      </button>
                    </div>
                  </td>

                  <td>
                    {order.status !== "CANCELLED" &&
                      order.status !== "DELIVERED" && (
                        <button
                          className="cancel-btn"
                          onClick={() => cancelOrder(order.id)}
                        >
                          Cancel
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderSuppliers = () => (
    <div className="panel">
      <h2>Suppliers</h2>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>

          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.id}</td>
                <td>{supplier.name}</td>
                <td>{supplier.email}</td>
                <td>{supplier.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWarehouses = () => (
    <div className="panel">
      <h2>Warehouses</h2>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Location</th>
            </tr>
          </thead>

          <tbody>
            {warehouses.map((warehouse) => (
              <tr key={warehouse.id}>
                <td>{warehouse.id}</td>
                <td>{warehouse.name}</td>
                <td>{warehouse.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (activePage) {
      case "Products":
        return renderProducts();

      case "Inventory":
        return renderInventory();

      case "Orders":
        return renderOrders();

      case "Suppliers":
        return renderSuppliers();

      case "Warehouses":
        return renderWarehouses();

      default:
        return renderDashboard();
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <h2>Inventory</h2>
          <span>Retail Management</span>
        </div>

        <nav>
          {[
            "Dashboard",
            "Products",
            "Inventory",
            "Orders",
            "Suppliers",
            "Warehouses",
          ].map((page) => (
            <button
              key={page}
              className={activePage === page ? "active" : ""}
              onClick={() => setActivePage(page)}
            >
              {page}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{activePage}</h1>
            <p>Retail Inventory Management System</p>
          </div>

          <button className="refresh-btn" onClick={loadData}>
            ↻ Refresh
          </button>
        </header>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          renderPage()
        )}
      </main>
    </div>
  );
}

export default App;