// app.js
// POS System Frontend Main Application Logic

// ============================================
// GLOBAL STATE
// ============================================

let cart = [];
const TAX_RATE = 0.1;
const CURRENCY = "GHS";

// ============================================
// PAGE NAVIGATION & INITIALIZATION
// ============================================

document.addEventListener("DOMContentLoaded", function () {
 initializeTheme();
 initializeEventListeners();
 checkAuthentication();
});

function initializeTheme() {
 const theme = localStorage.getItem("theme") || "light";
 if (theme === "dark") {
  document.body.classList.add("dark-mode");
  updateThemeToggleIcon();
 }
}

function updateThemeToggleIcon() {
 const icon = document.querySelector(".theme-icon");
 if (!icon) return;
 if (document.body.classList.contains("dark-mode")) {
  icon.textContent = "☀️";
 } else {
  icon.textContent = "🌙";
 }
}

function togglePasswordVisibility(fieldId, buttonId) {
 const passwordField = document.getElementById(fieldId);
 const toggleButton = document.getElementById(buttonId);
 const isPassword = passwordField.type === "password";
 passwordField.type = isPassword ? "text" : "password";
 toggleButton.querySelector("span").textContent = passwordField.type === "password" ? "👁" : "👁️‍🗨️";
}

function initializeEventListeners() {
 // Theme toggle
 document.getElementById("themeToggle").addEventListener("click", toggleTheme);

 // Authentication
 document.getElementById("loginForm").addEventListener("submit", handleLogin);

 // Logout
 document.getElementById("logoutBtn").addEventListener("click", handleLogout);

 // Navigation
 document.querySelectorAll(".menu-item").forEach((item) => {
  item.addEventListener("click", handleMenuClick);
 });

 // Quick action buttons
 document.querySelectorAll(".quick-action").forEach((btn) => {
  btn.addEventListener("click", (e) => {
   const page = e.currentTarget.dataset.page;
   switchPage(page + "Page");
  });
 });

 // Close modals
 document.querySelectorAll(".close, .modal-close").forEach((btn) => {
  btn.addEventListener("click", (e) => {
   e.target.closest(".modal").classList.add("hidden");
  });
 });
 document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", () => {
   overlay.closest(".modal").classList.add("hidden");
  });
 });

 // POS specific
 document.getElementById("productSearch").addEventListener("input", handleProductSearch);
 document.getElementById("discountAmount").addEventListener("change", updateCartTotals);
 document.getElementById("checkoutBtn").addEventListener("click", handleCheckout);
 document.getElementById("clearCartBtn").addEventListener("click", clearCart);
 document.getElementById("addProductBtn").addEventListener("click", openProductModal);
 document.getElementById("addCustomerBtn").addEventListener("click", openCustomerModal);

 // Payment modal close button
 const paymentModalClose = document.querySelector("#paymentModal .close");
 if (paymentModalClose) {
  paymentModalClose.addEventListener("click", (e) => {
   document.getElementById("paymentModal").classList.add("hidden");
  });
 }

 // Users page
 document.getElementById("addUserBtn")?.addEventListener("click", openUserModal);
 document.getElementById("userForm")?.addEventListener("submit", saveUser);
 document.getElementById("userSearch")?.addEventListener("input", loadUsers);
 document.getElementById("roleFilter")?.addEventListener("change", loadUsers);
 document.getElementById("userRole")?.addEventListener("change", updateRoleInfo);

 document.getElementById("productForm").addEventListener("submit", saveProduct);
 document.getElementById("customerForm").addEventListener("submit", saveCustomer);

 // Customer search
 document.getElementById("customerSearch")?.addEventListener("input", handleCustomerSearch);

 // Customers table: View / Delete (delegated — avoids stale inline handlers / cache issues)
 document.getElementById("customersTable")?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-customer-id]");
  if (!btn) return;
  const id = Number(btn.dataset.customerId);
  if (Number.isNaN(id)) return;
  const action = btn.dataset.action;
  if (action === "view-customer") {
   e.preventDefault();
   viewCustomer(id);
  } else if (action === "delete-customer") {
   e.preventDefault();
   handleDeleteCustomer(id);
  }
 });

 // Inventory adjustment form
 document.getElementById("inventoryForm").addEventListener("submit", handleInventoryAdjustment);
 document.getElementById("adjustmentType").addEventListener("change", updateInventoryPreview);
 document.getElementById("adjustmentQty").addEventListener("input", updateInventoryPreview);

 // Inventory table: Adjust (delegated)
 document.getElementById("inventoryTable")?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-inventory-id]");
  if (!btn) return;
  
  const productId = Number(btn.dataset.inventoryId);
  if (Number.isNaN(productId)) {
   console.error("Invalid product ID:", btn.dataset.inventoryId);
   return;
  }
  
  const action = btn.dataset.action;
  if (action !== "adjust-inventory") return;
  
  // Extract data from button attributes (cleaner approach)
  const productName = btn.dataset.productName || "";
  const currentQty = parseInt(btn.dataset.currentQty) || 0;
  
  console.log("Adjust inventory clicked - Product ID:", productId, "Name:", productName, "Current Qty:", currentQty);
  
  e.preventDefault();
  adjustInventoryModal(productId, productName, currentQty);
 });

 // Product filters
 document.getElementById("productFilterSearch").addEventListener("input", loadProducts);
 document.getElementById("categoryFilter").addEventListener("change", loadProducts);

 // Report "View Details" buttons
 document.querySelectorAll("button[data-report]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
   const reportType = e.currentTarget.dataset.report;
   handleViewReportDetails(reportType);
  });
 });
}

// ============================================
// THEME TOGGLE
// ============================================

function toggleTheme() {
 document.body.classList.toggle("dark-mode");
 const theme = document.body.classList.contains("dark-mode") ? "dark" : "light";
 localStorage.setItem("theme", theme);
 updateThemeToggleIcon();
 showNotification(`Switched to ${theme} mode`, "info");
}

// ============================================
// AUTHENTICATION
// ============================================

async function handleLogin(e) {
 e.preventDefault();
 const email = document.getElementById("email").value;
 const password = document.getElementById("password").value;

 try {
  showNotification("Logging in…", "info");
  await login(email, password);
  showNotification("Login successful!", "success");
  setTimeout(() => {
   loadDashboard();
   switchPage("dashboardPage");
   showSidebar();
   updateUIForRole();
  }, 500);
 } catch (error) {
  showNotification(`Login failed: ${error.message}`, "danger");
 }
}

function handleLogout() {
 if (confirm("Are you sure you want to sign out?")) {
  logout();
  switchPage("loginPage");
  hideSidebar();
  cart = [];
  showNotification("Signed out successfully", "success");
 }
}

function checkAuthentication() {
 if (isAuthenticated()) {
  hidePage("loginPage");
  showSidebar();
  updateUIForRole();
  loadDashboard();
  switchPage("dashboardPage");
 } else {
  showPage("loginPage");
  hideSidebar();
 }
}

// ============================================
// PAGE NAVIGATION
// ============================================

function switchPage(pageName) {
 document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));

 const page = document.getElementById(pageName);
 if (page) page.classList.add("active");

 document.querySelectorAll(".menu-item").forEach((item) => item.classList.remove("active"));
 const menuItem = document.querySelector(`[data-page="${pageName.replace("Page", "")}"]`);
 if (menuItem) menuItem.classList.add("active");

 const action = pageName.replace("Page", "");
 switch (action) {
  case "dashboard":
   loadDashboard();
   break;
  case "pos":
   loadPOS();
   break;
  case "products":
   loadProducts();
   break;
  case "inventory":
   loadInventory();
   break;
  case "customers":
   loadCustomers();
   break;
  case "reports":
   loadReports();
   loadReportsCharts();
   break;
  case "users":
   loadUsers();
   break;
 }
}

function handleMenuClick(e) {
 e.preventDefault();
 const page = e.currentTarget.dataset.page + "Page";
 switchPage(page);
}

function showPage(pageId) {
 document.getElementById(pageId)?.classList.add("active");
}
function hidePage(pageId) {
 document.getElementById(pageId)?.classList.remove("active");
}
function showSidebar() {
 document.getElementById("sidebar")?.classList.remove("hidden");
}
function hideSidebar() {
 document.getElementById("sidebar")?.classList.add("hidden");
}

// ============================================
// UI UPDATE BY ROLE
// ============================================

function updateUIForRole() {
 const user = getCurrentUser();
 const userRole = user?.role || "cashier";

 const firstName = user?.first_name || user?.username || "User";
 document.getElementById("userGreeting").textContent = `Welcome, ${firstName}!`;
 document.getElementById("userRole").textContent = userRole.toUpperCase();

 const userNameEl = document.getElementById("userName");
 const userAvatarEl = document.getElementById("userAvatar");
 if (userNameEl) userNameEl.textContent = firstName;
 if (userAvatarEl) userAvatarEl.textContent = firstName.charAt(0).toUpperCase();

 const adminOnly = document.querySelectorAll(
  "#productMenuItem, #inventoryMenuItem, #usersMenuItem, #reportsMenuItem, #addProductBtn, #adjustStockBtn",
 );

 if (userRole === "cashier") {
  adminOnly.forEach((item) => {
   if (!item) return;
   if (["usersMenuItem", "productMenuItem", "inventoryMenuItem"].includes(item.id)) {
    item.style.display = "none";
   }
  });
  document.getElementById("adminDashboard").classList.add("hidden");
 } else {
  adminOnly.forEach((item) => {
   if (item) item.style.display = "";
  });
  document.getElementById("adminDashboard").classList.remove("hidden");
 }
}

// ============================================
// DASHBOARD
// ============================================

async function loadDashboard() {
 try {
  const today = new Date().toISOString().split("T")[0];

  const dailySummary = await getDailySalesSummary(today);
  document.getElementById("todaySalesAmount").textContent = formatCurrency(dailySummary?.total_sales || 0);
  document.getElementById("todayTransactions").textContent = dailySummary?.total_transactions || 0;

  const customerStats = await getCustomerStats();
  document.getElementById("totalCustomers").textContent = customerStats?.total_customers || 0;

  const inventoryStats = await getInventoryStats();
  document.getElementById("lowStockCount").textContent = inventoryStats?.low_stock_count || 0;
  document.getElementById("inventoryValue").textContent = formatCurrency(inventoryStats?.inventory_value || 0);

  const dateEl = document.getElementById("headerDate");
  if (dateEl) {
   dateEl.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
   });
  }
 } catch (error) {
  console.error("Dashboard load error:", error);
 }
}

// ============================================
// POS PAGE
// ============================================

async function loadPOS() {
 try {
  const products = await getAllProducts();
  renderProductsGrid(products);

  const customers = await getAllCustomers();
  const customerSelect = document.getElementById("customerSelect");
  customerSelect.innerHTML = '<option value="">Walk-in Customer</option>';
  customers.forEach((customer) => {
   const option = document.createElement("option");
   option.value = customer.customer_id;
   option.textContent = customer.customer_name;
   customerSelect.appendChild(option);
  });

  const categories = document.getElementById("categoryFilter");
  if (categories) {
   const cats = await getCategories();
   const existing = Array.from(categories.options).map((o) => o.value);
   cats.forEach((cat) => {
    if (!existing.includes(cat)) {
     const option = document.createElement("option");
     option.value = cat;
     option.textContent = cat;
     categories.appendChild(option);
    }
   });
  }

  updateCartDisplay();
 } catch (error) {
  showNotification(`Error loading POS: ${error.message}`, "danger");
 }
}

function renderProductsGrid(products) {
 const grid = document.getElementById("productsGrid");
 grid.innerHTML = "";

 if (!products.length) {
  grid.innerHTML = '<p style="color:var(--text-secondary);padding:20px;">No products found.</p>';
  return;
 }

 products.forEach((product) => {
  const card = document.createElement("div");
  card.className = "product-card";
  if (product.quantity_on_hand === 0) card.classList.add("out-of-stock");

  card.innerHTML = `
      <h4>${product.product_name}</h4>
      <div class="product-price">₵${parseFloat(product.unit_price).toFixed(2)}</div>
      <div class="product-stock">Stock: ${product.quantity_on_hand || 0}</div>
    `;

  if (product.quantity_on_hand > 0) {
   card.addEventListener("click", () => addToCart(product));
  }

  grid.appendChild(card);
 });
}

function addToCart(product) {
 const existingItem = cart.find((item) => item.product_id === product.product_id);

 if (existingItem) {
  if (existingItem.quantity < product.quantity_on_hand) {
   existingItem.quantity++;
  } else {
   showNotification("Insufficient stock", "warning");
  }
 } else {
  cart.push({
   product_id: product.product_id,
   product_name: product.product_name,
   unit_price: product.unit_price,
   quantity: 1,
   max_quantity: product.quantity_on_hand,
  });
 }

 updateCartDisplay();
}

function updateCartDisplay() {
 const cartItemsContainer = document.getElementById("cartItems");
 const cartCountEl = document.getElementById("cartCount");

 const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
 if (cartCountEl) cartCountEl.textContent = `${totalItems} item${totalItems !== 1 ? "s" : ""}`;

 if (cart.length === 0) {
  cartItemsContainer.innerHTML = `
      <div class="empty-cart">
        <span class="empty-icon">⊕</span>
        <p>Cart is empty</p>
        <small>Select a product to begin</small>
      </div>`;
 } else {
  cartItemsContainer.innerHTML = cart
   .map(
    (item, index) => `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.product_name}</div>
            <div class="cart-item-details">₵${parseFloat(item.unit_price).toFixed(2)} each</div>
          </div>
          <div class="cart-item-qty">
            <button onclick="decreaseQuantity(${index})">−</button>
            <span>${item.quantity}</span>
            <button onclick="increaseQuantity(${index})">+</button>
          </div>
          <div class="cart-item-total">₵${(item.quantity * item.unit_price).toFixed(2)}</div>
          <button class="cart-item-remove" onclick="removeFromCart(${index})">✕</button>
        </div>`,
   )
   .join("");
 }

 updateCartTotals();
}

function increaseQuantity(index) {
 if (cart[index].quantity < cart[index].max_quantity) {
  cart[index].quantity++;
  updateCartDisplay();
 } else {
  showNotification("Maximum stock quantity reached", "warning");
 }
}

function decreaseQuantity(index) {
 if (cart[index].quantity > 1) {
  cart[index].quantity--;
 } else {
  removeFromCart(index);
  return;
 }
 updateCartDisplay();
}

function removeFromCart(index) {
 cart.splice(index, 1);
 updateCartDisplay();
}

function clearCart() {
 if (confirm("Clear the entire cart?")) {
  cart = [];
  updateCartDisplay();
 }
}

function updateCartTotals() {
 const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
 const discount = parseFloat(document.getElementById("discountAmount").value) || 0;
 const taxable = Math.max(0, subtotal - discount);
 const tax = taxable * TAX_RATE;
 const total = taxable + tax;

 document.getElementById("subtotal").textContent = formatCurrency(subtotal, false);
 document.getElementById("taxAmount").textContent = formatCurrency(tax, false);
 document.getElementById("totalAmount").textContent = formatCurrency(total, false);
}

// ── Step 1: Open payment confirmation modal ──
function handleCheckout() {
 if (cart.length === 0) {
  showNotification("Cart is empty", "warning");
  return;
 }

 const total = parseFloat(document.getElementById("totalAmount").textContent.replace(/[^0-9.]/g, ""));

 // Show processing modal
 showPayStep(2);
 document.getElementById("paymentModal").classList.remove("hidden");
 
 // Directly process checkout - Paystack will handle everything
 processCheckout(total);
}

// ── Process Checkout: Create sale and initiate Paystack ──
async function processCheckout(total) {
 showPayStep(2);

 try {
  const saleData = {
   items: cart.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: parseFloat(item.unit_price),
   })),
   customer_id: document.getElementById("customerSelect").value || null,
   discount_amount: parseFloat(document.getElementById("discountAmount").value) || 0,
   tax_rate: TAX_RATE,
   payment_method: "card", // Will be determined by Paystack, using card as default
   amount_paid: total,
  };

  document.getElementById("payProcessingText").textContent = "Creating sale...";
  await delay(500);

  const sale = await createSale(saleData);

  document.getElementById("payProcessingText").textContent = "Getting customer details...";
  await delay(500);

  // Build a guaranteed-valid email for Paystack transaction init
  let customerEmail = "";
  const customerSelect = document.getElementById("customerSelect");
  
  // Generate a valid email for Paystack (uses example.com format)
  if (customerSelect.value) {
   customerEmail = `customer${customerSelect.value}@example.com`;
  } else {
   customerEmail = `customer@example.com`;
  }

  customerEmail = customerEmail.trim().toLowerCase();

  if (!customerEmail || !customerEmail.includes("@")) {
   throw new Error("A valid customer email is required for Paystack checkout");
  }

  // Initialize Paystack payment
  const paystackData = await initializePaystackPayment({
   sale_id: sale.sale_id,
   customer_email: customerEmail,
   amount_paid: total,
   customer_name: customerSelect.value ? 
    document.querySelector(`#customerSelect option[value="${customerSelect.value}"]`)?.textContent : 
    'Customer',
   customer_phone: ''
  });

  document.getElementById("payProcessingText").textContent = "Opening Paystack checkout...";
  await delay(500);

  // Store sale ID for later verification
  sessionStorage.setItem('current_sale_id', sale.sale_id);
  sessionStorage.setItem('current_paystack_reference', paystackData.reference);

  // Use Paystack Inline SDK
  const handler = PaystackPop.setup({
   key: PAYSTACK_PUBLIC_KEY,
   email: customerEmail,
    amount: Math.round(Number(total) * 100), // Paystack expects amount in pesewas for GHS
    currency: CURRENCY,
   ref: paystackData.reference,
   onClose: function() {
    showNotification('Payment cancelled', 'warning');
    document.getElementById("paymentModal").classList.add("hidden");
    resetCart();
   },
   onSuccess: async function(response) {
    try {
     document.getElementById("payProcessingText").textContent = "Verifying payment...";
     showPayStep(2);
     document.getElementById("paymentModal").classList.remove("hidden");
     await delay(500);

     // Verify payment with backend
     const verifyResult = await verifyPaystackPayment(response.reference);

     if (verifyResult && verifyResult.success) {
      // Payment verified - record it in our system
      document.getElementById("payProcessingText").textContent = "Recording transaction...";
      await delay(500);

      await processPayment({
       sale_id: sale.sale_id,
       payment_method: "card",
       amount_paid: total,
       payment_details: {
        processor: 'paystack',
        reference: response.reference,
        status: 'verified'
       }
      });

      const receipt = await getReceipt(sale.sale_id);

      document.getElementById("paySuccessDetail").textContent = "Payment verified! Transaction completed.";
      showPayStep(3);

      document.getElementById("viewReceiptBtn").onclick = () => {
       document.getElementById("paymentModal").classList.add("hidden");
       showReceipt(receipt);
      };

      document.getElementById("newSaleBtn").onclick = () => {
       document.getElementById("paymentModal").classList.add("hidden");
       resetCart();
      };

      resetCart();
      sessionStorage.removeItem('current_sale_id');
      sessionStorage.removeItem('current_paystack_reference');
     } else {
      throw new Error('Payment verification failed');
     }
    } catch (error) {
     document.getElementById("paymentModal").classList.add("hidden");
     showNotification(`Payment verification error: ${error.message}`, 'danger');
     console.error('Paystack verification error:', error);
     sessionStorage.removeItem('current_sale_id');
     sessionStorage.removeItem('current_paystack_reference');
    }
   }
  });
  handler.openIframe();

 } catch (error) {
  document.getElementById("paymentModal").classList.add("hidden");
  showNotification(`Checkout error: ${error.message}`, "danger");
  console.error('Checkout error:', error);
 }
}

function resetCart() {
 cart = [];
 document.getElementById("discountAmount").value = "0";
 updateCartDisplay();
 loadDashboard();
}

function showPayStep(step) {
 // Show/hide payment steps
 const stepElements = {
  2: 'payStep2',
  3: 'payStep3'
 };

 Object.keys(stepElements).forEach(key => {
  const elem = document.getElementById(stepElements[key]);
  if (elem) {
   elem.classList.toggle('hidden', key !== String(step));
  }
 });
}

function delay(ms) {
 return new Promise((resolve) => setTimeout(resolve, ms));
}

function showReceipt(receipt) {
 const receiptContent = document.getElementById("receiptContent");
 receiptContent.innerHTML = formatReceipt(receipt);
 document.getElementById("receiptModal").classList.remove("hidden");

 document.getElementById("printReceiptBtn").onclick = () => window.print();
 document.getElementById("emailReceiptBtn").onclick = () => showNotification("Email feature coming soon", "info");
 document.getElementById("closeReceiptBtn").onclick = () => {
  document.getElementById("receiptModal").classList.add("hidden");
  loadDashboard();
 };
}

function formatReceipt(receipt) {
 let html = "<pre>";
 html += "=".repeat(40) + "\n";
 html += centerText(receipt.store_name, 40) + "\n";
 html += "=".repeat(40) + "\n";
 html += `Transaction: ${receipt.transaction_id}\n`;
 html += `Date: ${receipt.date} ${receipt.time}\n`;
 html += `Cashier: ${receipt.cashier}\n`;
 if (receipt.customer) html += `Customer: ${receipt.customer.name}\n`;
 html += "\n" + "-".repeat(40) + "\n";
 html += "ITEMS\n";
 html += "-".repeat(40) + "\n";
 receipt.items.forEach((item) => {
  html += `${item.name}\n`;
  html += `  Qty: ${item.quantity} x ₵${item.unit_price} = ₵${item.total}\n`;
 });
 html += "\n" + "-".repeat(40) + "\n";
 html += `Subtotal: ${" ".repeat(28)}₵${receipt.subtotal}\n`;
 if (parseFloat(receipt.discount) > 0) html += `Discount: ${" ".repeat(28)}$-${receipt.discount}\n`;
 if (parseFloat(receipt.tax) > 0) html += `Tax:      ${" ".repeat(28)}₵${receipt.tax}\n`;
 html += `TOTAL:    ${" ".repeat(28)}₵${receipt.total}\n`;
 html += "\n" + "-".repeat(40) + "\n";
 if (receipt.payment) {
  html += `Payment: ${receipt.payment.method.toUpperCase()}\n`;
  html += `Paid:     ${" ".repeat(28)}₵${receipt.payment.amount_paid}\n`;
  html += `Change:   ${" ".repeat(28)}₵${receipt.payment.change}\n`;
 }
 html += "\n" + "=".repeat(40) + "\n";
 html += centerText("Thank You!", 40) + "\n";
 html += "=".repeat(40) + "\n";
 html += "</pre>";
 return html;
}

function centerText(text, width) {
 const padding = Math.max(0, Math.floor((width - text.length) / 2));
 return " ".repeat(padding) + text;
}

function handleProductSearch(e) {
 const query = e.target.value.trim();
 if (query.length === 0) {
  document.getElementById("searchResults").classList.add("hidden");
  return;
 }

 searchProducts(query).then((products) => {
  const resultsContainer = document.getElementById("productList");
  resultsContainer.innerHTML = products
   .map(
    (p) => `
        <li onclick="addToCart({
          product_id: ${p.product_id},
          product_name: '${p.product_name.replace(/'/g, "\\'")}',
          unit_price: ${p.unit_price},
          quantity_on_hand: ${p.quantity_on_hand}
        }); document.getElementById('searchResults').classList.add('hidden'); document.getElementById('productSearch').value='';">
          <strong>${p.product_name}</strong> — ₵${parseFloat(p.unit_price).toFixed(2)}
          <span style="float:right;color:var(--text-dim-val);font-size:12px;">Stock: ${p.quantity_on_hand}</span>
        </li>`,
   )
   .join("");
  document.getElementById("searchResults").classList.remove("hidden");
 });
}

// ============================================
// PRODUCTS PAGE
// ============================================

async function loadProducts() {
 try {
  const search = document.getElementById("productFilterSearch")?.value || "";
  const category = document.getElementById("categoryFilter")?.value || "";
  const products = await getAllProducts({ search, category });
  renderProductsTable(products);
 } catch (error) {
  showNotification(`Error loading products: ${error.message}`, "danger");
 }
}

function renderProductsTable(products) {
 const tbody = document.getElementById("productsTableBody");
 if (!products.length) {
  tbody.innerHTML =
   '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);padding:24px;">No products found.</td></tr>';
  return;
 }
 tbody.innerHTML = products
  .map(
   (p) => `
      <tr>
        <td><strong>${p.product_name}</strong></td>
        <td style="color:var(--text-secondary)">${p.barcode || "—"}</td>
        <td><span class="status-badge status-ok">${p.category}</span></td>
        <td><strong>₵${parseFloat(p.unit_price).toFixed(2)}</strong></td>
        <td>${stockBadge(p.quantity_on_hand, p.reorder_level)}</td>
        <td>
          <div class="table-actions">
            <button class="btn-edit" onclick="editProduct(${p.product_id})">Edit</button>
            <button class="btn-delete" onclick="deleteProductConfirm(${p.product_id})">Delete</button>
          </div>
        </td>
      </tr>`,
  )
  .join("");
}

function stockBadge(qty, reorderLevel) {
 qty = qty || 0;
 if (qty === 0) return `<span class="status-badge status-out">Out of Stock</span>`;
 if (reorderLevel && qty <= reorderLevel) return `<span class="status-badge status-low">${qty} — Low</span>`;
 return `<span class="status-badge status-ok">${qty}</span>`;
}

function openProductModal() {
 document.getElementById("productForm").reset();
 document.getElementById("productModalTitle").textContent = "Add Product";
 document.getElementById("productForm").onsubmit = saveProduct;
 document.getElementById("productModal").classList.remove("hidden");
}

function editProduct(productId) {
 getProductById(productId)
  .then((product) => {
   document.getElementById("productName").value = product.product_name;
   document.getElementById("productBarcode").value = product.barcode || "";
   document.getElementById("productCategory").value = product.category;
   document.getElementById("productPrice").value = product.unit_price;
   document.getElementById("productCost").value = product.cost_price || "";
   document.getElementById("productModalTitle").textContent = "Edit Product";
   document.getElementById("productForm").onsubmit = (e) => saveProduct(e, productId);
   document.getElementById("productModal").classList.remove("hidden");
  })
  .catch((err) => showNotification(`Error loading product: ${err.message}`, "danger"));
}

async function saveProduct(e, productId) {
 e.preventDefault();

 const productData = {
  product_name: document.getElementById("productName").value,
  barcode: document.getElementById("productBarcode").value,
  category: document.getElementById("productCategory").value,
  unit_price: parseFloat(document.getElementById("productPrice").value),
  cost_price: parseFloat(document.getElementById("productCost").value) || null,
 };

 try {
  if (productId) {
   await updateProduct(productId, productData);
   showNotification("Product updated successfully", "success");
  } else {
   await createProduct(productData);
   showNotification("Product created successfully", "success");
  }
  document.getElementById("productModal").classList.add("hidden");
  loadProducts();
 } catch (error) {
  showNotification(`Error saving product: ${error.message}`, "danger");
 }
}

function deleteProductConfirm(productId) {
 if (confirm("Are you sure you want to delete this product?")) {
  deleteProduct(productId)
   .then(() => {
    showNotification("Product deleted successfully", "success");
    loadProducts();
   })
   .catch((error) => showNotification(`Error: ${error.message}`, "danger"));
 }
}

// ============================================
// INVENTORY PAGE
// ============================================

async function loadInventory() {
 try {
  const [inventory, alerts] = await Promise.all([getAllInventory(), getLowStockAlerts()]);
  renderInventoryTable(inventory);
  renderLowStockAlerts(alerts);
 } catch (error) {
  showNotification(`Error loading inventory: ${error.message}`, "danger");
 }
}

function renderInventoryTable(inventory) {
 const tbody = document.getElementById("inventoryTableBody");
 if (!inventory.length) {
  tbody.innerHTML =
   '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:24px;">No inventory data found.</td></tr>';
  return;
 }
 
 console.log("Rendering inventory with items:", inventory);
 
 tbody.innerHTML = inventory
  .map((item) => {
   const qty = item.quantity_on_hand || 0;
   const reorder = item.reorder_level || 0;
   const isOut = qty === 0;
   const isLow = !isOut && qty <= reorder;
   const statusClass = isOut ? "status-out" : isLow ? "status-low" : "status-ok";
   const statusLabel = isOut ? "Out of Stock" : isLow ? "Low Stock" : "OK";
   
   // Ensure product_id is properly set for data attribute
   const productId = item.product_id || item.id;
   
   const html = `
        <tr>
          <td><strong>${item.product_name}</strong></td>
          <td><strong style="font-family:'Syne',sans-serif;font-size:16px;">${qty}</strong></td>
          <td style="color:var(--text-secondary)">${reorder}</td>
          <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
          <td class="actions-cell">
            <div class="table-actions">
              <button 
                class="btn btn-sm btn-primary btn-adjust-stock" 
                type="button"
                data-inventory-id="${productId}" 
                data-product-name="${item.product_name}"
                data-current-qty="${qty}"
                data-action="adjust-inventory"
                title="Adjust stock for ${item.product_name}">
                Adjust Stock
              </button>
            </div>
          </td>
        </tr>`;
   
   console.log("Item product_id:", productId, "product_name:", item.product_name, "HTML rendered:", html);
   return html;
  })
  .join("");
  
 console.log("Final tbody HTML:", tbody.innerHTML);
 console.log("Total rows rendered:", tbody.querySelectorAll("tr").length);
}

function renderLowStockAlerts(alerts) {
 const container = document.getElementById("lowStockAlerts");
 if (!alerts.length) {
  container.innerHTML = '<div class="alert alert-success">✓ All items are well stocked</div>';
  return;
 }
 container.innerHTML = alerts
  .map(
   (item) => `
      <div class="low-stock-alert">
        ⚠ <strong>${item.product_name}</strong> — Current: ${item.quantity_on_hand}, Reorder level: ${item.reorder_level}
      </div>`,
  )
  .join("");
}

function adjustInventoryModal(productId, productName, currentQty) {
 document.getElementById("invProductId").value = productId;
 document.getElementById("invProductName").textContent = productName;
 document.getElementById("invProductMeta").textContent = `Current stock: ${currentQty} units`;
 document.getElementById("invStockBadge").textContent = currentQty;

 document.getElementById("adjustmentType").value = "add";
 document.getElementById("adjustmentQty").value = "";
 document.getElementById("adjustmentReason").value = "";

 const preview = document.getElementById("invPreview");
 const previewVal = document.getElementById("invPreviewValue");
 preview.className = "inv-preview";
 previewVal.textContent = "—";

 document.getElementById("inventoryModal").classList.remove("hidden");
}

function updateInventoryPreview() {
 const type = document.getElementById("adjustmentType").value;
 const qty = parseInt(document.getElementById("adjustmentQty").value) || 0;
 const currentQty = parseInt(document.getElementById("invStockBadge").textContent) || 0;

 const preview = document.getElementById("invPreview");
 const previewVal = document.getElementById("invPreviewValue");

 let newQty;
 if (type === "add") newQty = currentQty + qty;
 if (type === "remove") newQty = currentQty - qty;
 if (type === "set") newQty = qty;

 if (qty === 0 || isNaN(newQty)) {
  previewVal.textContent = "—";
  preview.className = "inv-preview";
  return;
 }

 previewVal.textContent = `${newQty} units`;
 preview.className = "inv-preview";
 if (newQty < 0) {
  preview.classList.add("preview-danger");
  previewVal.textContent = "Cannot go below 0";
 } else if (newQty === 0) {
  preview.classList.add("preview-danger");
 } else if (newQty <= 5) {
  preview.classList.add("preview-warn");
 }
}

async function handleInventoryAdjustment(e) {
 e.preventDefault();

 const productId = parseInt(document.getElementById("invProductId").value);
 const type = document.getElementById("adjustmentType").value;
 const qty = parseInt(document.getElementById("adjustmentQty").value);
 const reason = document.getElementById("adjustmentReason").value || "";
 const currentQty = parseInt(document.getElementById("invStockBadge").textContent) || 0;

 if (!qty || qty <= 0) {
  showNotification("Please enter a valid quantity", "warning");
  return;
 }

 if (type === "remove" && qty > currentQty) {
  showNotification(`Cannot remove ${qty} — only ${currentQty} in stock`, "danger");
  return;
 }

 let sendQty = qty;
 let sendType = type;

 if (type === "set") {
  if (qty > currentQty) {
   sendType = "add";
   sendQty = qty - currentQty;
  } else if (qty < currentQty) {
   sendType = "remove";
   sendQty = currentQty - qty;
  } else {
   showNotification("Stock is already at that quantity", "info");
   return;
  }
 }

 try {
  await adjustStock({ product_id: productId, quantity: sendQty, type: sendType, reason });
  showNotification("Stock adjusted successfully", "success");
  document.getElementById("inventoryModal").classList.add("hidden");
  loadInventory();
 } catch (error) {
  showNotification(`Adjustment failed: ${error.message}`, "danger");
 }
}

// ============================================
// CUSTOMERS PAGE
// ============================================

async function loadCustomers() {
 try {
  const customers = await getAllCustomers();
  renderCustomersTable(customers);
 } catch (error) {
  showNotification(`Error loading customers: ${error.message}`, "danger");
 }
}

// Live search filter for customers
async function handleCustomerSearch(e) {
 const query = e.target.value.trim().toLowerCase();
 try {
  const customers = await getAllCustomers();
  const filtered = query
   ? customers.filter(
      (c) =>
       c.customer_name?.toLowerCase().includes(query) ||
       c.email?.toLowerCase().includes(query) ||
       c.phone?.toLowerCase().includes(query),
     )
   : customers;
  renderCustomersTable(filtered);
 } catch (error) {
  showNotification(`Error searching customers: ${error.message}`, "danger");
 }
}

function renderCustomersTable(customers) {
 const tbody = document.getElementById("customersTableBody");
 if (!customers.length) {
  tbody.innerHTML =
   '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);padding:24px;">No customers found.</td></tr>';
  return;
 }
 tbody.innerHTML = customers
  .map(
   (c) => `
      <tr>
        <td><strong>${c.customer_name}</strong></td>
        <td style="color:var(--text-secondary)">${c.email || "—"}</td>
        <td style="color:var(--text-secondary)">${c.phone || "—"}</td>
        <td><strong>₵${parseFloat(c.total_purchases || 0).toFixed(2)}</strong></td>
        <td><span class="status-badge status-ok">${c.loyalty_points || 0} pts</span></td>
        <td>
          <div class="table-actions">
            <button type="button" class="btn-edit" data-action="view-customer" data-customer-id="${c.customer_id}">View</button>
            <button type="button" class="btn-delete" data-action="delete-customer" data-customer-id="${c.customer_id}">Delete</button>
          </div>
        </td>
      </tr>`,
  )
  .join("");
}

function openCustomerModal() {
 document.getElementById("customerForm").reset();
 document.getElementById("customerForm").dataset.editingCustomerId = "";
 document.getElementById("customerModalTitle").textContent = "Add Customer";
 document.getElementById("customerModal").classList.remove("hidden");
}

async function saveCustomer(e) {
 e.preventDefault();

 const form = document.getElementById("customerForm");
 const editingCustomerId = form.dataset.editingCustomerId;

 const customerData = {
  customer_name: document.getElementById("customerName").value,
  email: document.getElementById("customerEmail").value,
  phone: document.getElementById("customerPhone").value,
  loyalty_points: parseInt(document.getElementById("customerLoyaltyPoints")?.value || "0", 10) || 0,
 };

 try {
  if (editingCustomerId) {
   await updateCustomer(editingCustomerId, {
    customer_name: customerData.customer_name,
    email: customerData.email,
    phone: customerData.phone,
   });
   showNotification("Customer updated successfully", "success");
  } else {
   await registerCustomer(customerData);
   showNotification("Customer registered successfully", "success");
  }

  form.dataset.editingCustomerId = "";
  document.getElementById("customerModal").classList.add("hidden");
  loadCustomers();
 } catch (error) {
  showNotification(`Error: ${error.message}`, "danger");
 }
}

async function viewCustomer(customerId) {
 const contentEl = document.getElementById("customerDetailsContent");
 const modalEl = document.getElementById("customerDetailsModal");
 try {
  const customer = await getCustomerById(customerId);
  let history = [];
  try {
   history = await getPurchaseHistory(customerId);
  } catch (histErr) {
   console.warn("Purchase history failed:", histErr);
   showNotification("Loaded customer; purchase history unavailable", "warning");
  }

  const historyHtml = history.length
   ? history
      .map(
       (h) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-color);font-size:13px;">
        <span>${h.transaction_id || `Sale #${h.sale_id}`}</span>
        <span style="color:var(--text-secondary)">${formatDate(h.created_at || h.sale_date)}</span>
        <span style="color:var(--accent);font-weight:700;">₵${parseFloat(h.total_amount || 0).toFixed(2)}</span>
      </div>`,
      )
      .join("")
   : '<p style="color:var(--text-secondary);font-size:13px;">No purchases yet</p>';

  document.getElementById("customerDetailsTitle").textContent = customer.customer_name;
  contentEl.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
      <div style="background:var(--bg-elevated);padding:12px;border-radius:8px;border:1px solid var(--border-color);">
        <p style="color:var(--text-secondary);font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Email</p>
        <p style="font-weight:500;">${customer.email || "—"}</p>
      </div>
      <div style="background:var(--bg-elevated);padding:12px;border-radius:8px;border:1px solid var(--border-color);">
        <p style="color:var(--text-secondary);font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Phone</p>
        <p style="font-weight:500;">${customer.phone || "—"}</p>
      </div>
      <div style="background:var(--bg-elevated);padding:12px;border-radius:8px;border:1px solid var(--border-color);">
        <p style="color:var(--text-secondary);font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Loyalty Points</p>
        <p style="font-weight:700;color:var(--accent);font-size:18px;">${customer.loyalty_points || 0}</p>
      </div>
      <div style="background:var(--bg-elevated);padding:12px;border-radius:8px;border:1px solid var(--border-color);">
        <p style="color:var(--text-secondary);font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Total Purchases</p>
        <p style="font-weight:700;color:var(--accent);font-size:18px;">₵${parseFloat(customer.total_purchases || 0).toFixed(2)}</p>
      </div>
    </div>
    <div style="margin-bottom:16px;">
      <p style="color:var(--text-secondary);font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Purchase History (${history.length})</p>
      <div style="max-height:200px;overflow-y:auto;">
        ${historyHtml}
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px;">
      <button class="btn btn-secondary" onclick="openEditCustomerModal(${customer.customer_id})">Edit</button>
      <button class="btn" style="background:#d32f2f;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;" onclick="handleDeleteCustomer(${customer.customer_id})">Delete</button>
    </div>
  `;

  modalEl.classList.remove("hidden");
 } catch (error) {
  showNotification(`Error loading customer: ${error.message}`, "danger");
 }
}

async function openEditCustomerModal(customerId) {
 const customer = await getCustomerById(customerId);
 document.getElementById("customerName").value = customer.customer_name;
 document.getElementById("customerEmail").value = customer.email || "";
 document.getElementById("customerPhone").value = customer.phone || "";
 document.getElementById("customerLoyaltyPoints").value = customer.loyalty_points || 0;
 document.getElementById("customerForm").dataset.editingCustomerId = customer.customer_id;
 document.getElementById("customerModalTitle").textContent = "Edit Customer";
 document.getElementById("customerDetailsModal").classList.add("hidden");
 document.getElementById("customerModal").classList.remove("hidden");
}

async function handleDeleteCustomer(customerId) {
 if (!confirm("Delete this customer? This action cannot be undone.")) {
  return;
 }

 try {
  await deleteCustomer(customerId);
  document.getElementById("customerDetailsModal").classList.add("hidden");
  showNotification("Customer deleted successfully", "success");
  loadCustomers();
 } catch (error) {
  showNotification(`Error deleting customer: ${error.message}`, "danger");
 }
}

// ============================================
// REPORTS PAGE
// ============================================

async function loadReports() {
 try {
  const today = new Date().toISOString().split("T")[0];

  const dailyReport = await getDailySalesReport(today);
  document.getElementById("dailySalesReport").innerHTML = `
      <p style="font-size:22px;font-weight:700;font-family:'Syne',sans-serif;color:var(--accent);margin-bottom:4px;">
        ₵${parseFloat(dailyReport.summary?.total_revenue || 0).toFixed(2)}
      </p>
      <p style="color:var(--text-secondary);font-size:13px;">${dailyReport.summary?.total_transactions || 0} transactions today</p>`;

  const topProducts = await getTopProductsReport(today, today, 5);
  document.getElementById("topProductsReport").innerHTML =
   topProducts
    .slice(0, 3)
    .map(
     (p, i) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-color);">
          <span style="font-size:13px;color:var(--text-primary);">${i + 1}. ${p.product_name}</span>
          <span class="status-badge status-ok">${p.total_quantity_sold} sold</span>
        </div>`,
    )
    .join("") || '<p style="color:var(--text-secondary);font-size:13px;">No data yet</p>';

  const invStatus = await getInventoryStatusReport();
  const lowStock = invStatus.filter((i) => i.stock_status !== "OK").length;
  document.getElementById("inventoryStatusReport").innerHTML = `
      <p style="font-size:22px;font-weight:700;font-family:'Syne',sans-serif;color:${lowStock > 0 ? "var(--warn)" : "var(--accent)"};margin-bottom:4px;">${lowStock}</p>
      <p style="color:var(--text-secondary);font-size:13px;">items below reorder level</p>`;

  const cashierPerf = await getCashierPerformanceReport(today, today);
  document.getElementById("cashierPerformanceReport").innerHTML =
   cashierPerf
    .slice(0, 3)
    .map(
     (c) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-color);">
          <span style="font-size:13px;color:var(--text-primary);">${c.username}</span>
          <span style="font-weight:700;color:var(--accent);">₵${parseFloat(c.total_sales || 0).toFixed(2)}</span>
        </div>`,
    )
    .join("") || '<p style="color:var(--text-secondary);font-size:13px;">No data yet</p>';
 } catch (error) {
  showNotification(`Error loading reports: ${error.message}`, "danger");
 }
}

// Initialize and render all charts
async function loadReportsCharts() {
 try {
  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  // Daily Sales Trend
  await renderDailySalesTrendChart(sevenDaysAgo, todayStr);

  // Top Products
  await renderTopProductsChart(todayStr, todayStr);

  // Inventory Distribution
  await renderInventoryChart();

  // Cashier Performance
  await renderCashierPerformanceChart(todayStr, todayStr);
 } catch (error) {
  console.error("Error loading charts:", error);
 }
}

async function renderDailySalesTrendChart(startDate, endDate) {
 try {
  const today = new Date().toISOString().split("T")[0];
  const data = await getDailySalesReport(today);
  const ctx = document.getElementById("dailySalesChart");
  
  if (!ctx || !data.transactions || data.transactions.length === 0) {
   if (ctx) {
    ctx.parentElement.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-secondary);">No transactions today</div>';
   }
   return;
  }

  // Group transactions by hour
  const hourlyData = {};
  for (let i = 0; i < 24; i++) {
   hourlyData[i] = { count: 0, total: 0 };
  }

  data.transactions.forEach(t => {
   const hour = new Date(t.created_at).getHours();
   hourlyData[hour].count++;
   hourlyData[hour].total += parseFloat(t.total_amount || 0);
  });

  const labels = Object.keys(hourlyData).map(h => `${h.toString().padStart(2, '0')}:00`);
  const salesData = Object.values(hourlyData).map(h => h.total);
  const transactionCounts = Object.values(hourlyData).map(h => h.count);

  new Chart(ctx, {
   type: "line",
   data: {
    labels,
    datasets: [
     {
      label: "Sales Revenue",
      data: salesData,
      borderColor: "var(--accent)",
      backgroundColor: "rgba(0, 255, 200, 0.1)",
      borderWidth: 3,
      tension: 0.4,
      fill: true,
      pointRadius: 5,
      pointBackgroundColor: "var(--accent)",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
     },
     {
      label: "Transactions",
      data: transactionCounts,
      borderColor: "rgba(100, 200, 255, 0.7)",
      backgroundColor: "transparent",
      borderWidth: 2,
      tension: 0.4,
      yAxisID: "y1",
      pointRadius: 4,
     }
    ]
   },
   options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
     legend: {
      display: true,
      labels: {
       color: "var(--text-secondary)",
       usePointStyle: true,
       padding: 20,
      }
     }
    },
    scales: {
     y: {
      beginAtZero: true,
      ticks: {
       color: "var(--text-secondary)",
       callback: function(value) {
        return "$" + value.toLocaleString();
       }
      },
      grid: {
       color: "var(--border-color)"
      }
     },
     y1: {
      type: "linear",
      position: "right",
      beginAtZero: true,
      ticks: {
       color: "rgba(100, 200, 255, 0.7)"
      },
      grid: {
       display: false
      }
     },
     x: {
      ticks: {
       color: "var(--text-secondary)"
      },
      grid: {
       color: "var(--border-color)"
      }
     }
    }
   }
  });
 } catch (error) {
  console.error("Error rendering daily sales chart:", error);
 }
}

async function renderTopProductsChart(startDate, endDate) {
 try {
  const data = await getTopProductsReport(startDate, endDate, 8);
  const ctx = document.getElementById("topProductsChart");
  
  if (!ctx) return;

  const labels = data.slice(0, 8).map(p => p.product_name);
  const quantities = data.slice(0, 8).map(d => d.total_quantity_sold || 0);
  const revenues = data.slice(0, 8).map(d => parseFloat(d.total_revenue || 0));

  new Chart(ctx, {
   type: "bar",
   data: {
    labels,
    datasets: [
     {
      label: "Revenue ($)",
      data: revenues,
      backgroundColor: "var(--accent)",
      borderRadius: 5,
      borderSkipped: false,
     }
    ]
   },
   options: {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
     legend: {
      display: false
     }
    },
    scales: {
     x: {
      beginAtZero: true,
      ticks: {
       color: "var(--text-secondary)",
       callback: function(value) {
        return "$" + value.toLocaleString();
       }
      },
      grid: {
       color: "var(--border-color)"
      }
     },
     y: {
      ticks: {
       color: "var(--text-secondary)"
      },
      grid: {
       display: false
      }
     }
    }
   }
  });
 } catch (error) {
  console.error("Error rendering top products chart:", error);
 }
}

async function renderInventoryChart() {
 try {
  const data = await getInventoryStatusReport();
  const ctx = document.getElementById("inventoryChart");
  
  if (!ctx) return;

  const statusCounts = {
   "OK": 0,
   "Low Stock Alert": 0,
   "Out of Stock": 0
  };

  data.forEach(item => {
   statusCounts[item.stock_status]++;
  });

  new Chart(ctx, {
   type: "doughnut",
   data: {
    labels: Object.keys(statusCounts),
    datasets: [
     {
      data: Object.values(statusCounts),
      backgroundColor: [
       "var(--accent)",
       "#ff9500",
       "#ff4444"
      ],
      borderColor: "var(--bg-primary)",
      borderWidth: 2,
     }
    ]
   },
   options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
     legend: {
      position: "bottom",
      labels: {
       color: "var(--text-secondary)",
       usePointStyle: true,
       padding: 15,
      }
     }
    }
   }
  });
 } catch (error) {
  console.error("Error rendering inventory chart:", error);
 }
}

async function renderCashierPerformanceChart(startDate, endDate) {
 try {
  const data = await getCashierPerformanceReport(startDate, endDate);
  const ctx = document.getElementById("cashierChart");
  
  if (!ctx) return;

  const labels = data.map(c => c.username);
  const salesData = data.map(d => parseFloat(d.total_sales || 0));
  const transactionData = data.map(d => d.total_transactions || 0);

  new Chart(ctx, {
   type: "bar",
   data: {
    labels,
    datasets: [
     {
      label: "Sales Revenue",
      data: salesData,
      backgroundColor: "var(--accent)",
      borderRadius: 5,
      borderSkipped: false,
      yAxisID: "y"
     }
    ]
   },
   options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
     legend: {
      display: false
     }
    },
    scales: {
     y: {
      beginAtZero: true,
      ticks: {
       color: "var(--text-secondary)",
       callback: function(value) {
        return "$" + value.toLocaleString();
       }
      },
      grid: {
       color: "var(--border-color)"
      }
     },
     x: {
      ticks: {
       color: "var(--text-secondary)"
      },
      grid: {
       display: false
      }
     }
    }
   }
  });
 } catch (error) {
  console.error("Error rendering cashier chart:", error);
 }
}

async function handleViewReportDetails(reportType) {
 try {
  const today = new Date().toISOString().split("T")[0];
  let data, title, html;

  switch (reportType) {
   case "daily":
    data = await getDailySalesReport(today);
    title = "Daily Sales Report — " + today;
    html = `
          <div style="padding:20px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:24px;">
              <div style="background:var(--bg-elevated);padding:16px;border-radius:10px;border:1px solid var(--border-color);">
                <p style="color:var(--text-secondary);font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Total Sales</p>
                <p style="font-size:24px;font-weight:700;color:var(--accent);">₵${parseFloat(data.summary?.total_revenue || 0).toFixed(2)}</p>
              </div>
              <div style="background:var(--bg-elevated);padding:16px;border-radius:10px;border:1px solid var(--border-color);">
                <p style="color:var(--text-secondary);font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Transactions</p>
                <p style="font-size:24px;font-weight:700;color:var(--accent);">${data.summary?.total_transactions || 0}</p>
              </div>
            </div>
            ${
             data.transactions?.length
              ? `
              <p style="font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--text-secondary);text-transform:uppercase;margin-bottom:10px;">Transactions</p>
              <div style="max-height:300px;overflow-y:auto;">
                ${data.transactions
                 .map(
                  (t) => `
                  <div style="padding:10px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;">
                    <span>#${t.transaction_id}</span>
                    <span style="color:var(--accent);font-weight:700;">₵${parseFloat(t.total_amount || 0).toFixed(2)}</span>
                  </div>`,
                 )
                 .join("")}
              </div>`
              : '<p style="color:var(--text-secondary);">No transactions today</p>'
            }
          </div>`;
    break;

   case "products":
    data = await getTopProductsReport(today, today, 100);
    title = "Top Products — " + today;
    html = `
          <div style="padding:20px;">
            <div style="max-height:420px;overflow-y:auto;">
              ${
               data.length
                ? data
                   .slice(0, 20)
                   .map(
                    (p, i) => `
                <div style="padding:12px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <p style="font-weight:700;margin-bottom:2px;">${i + 1}. ${p.product_name}</p>
                    <p style="font-size:12px;color:var(--text-secondary);">₵${parseFloat(p.unit_price || 0).toFixed(2)} × ${p.total_quantity_sold}</p>
                  </div>
                  <span style="background:var(--accent-dim);color:var(--accent);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;">${p.total_quantity_sold} sold</span>
                </div>`,
                   )
                   .join("")
                : '<p style="color:var(--text-secondary);">No data available</p>'
              }
            </div>
          </div>`;
    break;

   case "inventory":
    data = await getInventoryStatusReport();
    const lowItems = data.filter((i) => i.stock_status !== "OK");
    title = "Inventory Status Report";
    html = `
          <div style="padding:20px;">
            ${
             lowItems.length
              ? `
              <p style="font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--warn);text-transform:uppercase;margin-bottom:10px;">⚠ ${lowItems.length} Items Need Attention</p>
              <div style="max-height:220px;overflow-y:auto;margin-bottom:24px;">
                ${lowItems
                 .map(
                  (i) => `
                  <div style="padding:12px;border-bottom:1px solid var(--border-color);border-left:3px solid var(--warn);padding-left:14px;margin-bottom:4px;">
                    <p style="font-weight:700;margin-bottom:2px;">${i.product_name}</p>
                    <p style="font-size:12px;color:var(--text-secondary);">Current: ${i.quantity_on_hand} | Reorder: ${i.reorder_level}</p>
                  </div>`,
                 )
                 .join("")}
              </div>`
              : '<div style="padding:12px;background:var(--accent-dim);border-radius:8px;color:var(--accent);font-weight:600;margin-bottom:20px;">✓ All items well stocked</div>'
            }
            <p style="font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--text-secondary);text-transform:uppercase;margin-bottom:10px;">All Inventory (${data.length})</p>
            <div style="max-height:240px;overflow-y:auto;">
              ${data
               .map(
                (i) => `
                <div style="padding:10px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;">
                  <span>${i.product_name}</span>
                  <span style="font-weight:700;color:${i.stock_status === "OK" ? "var(--accent)" : "var(--warn)"};">${i.quantity_on_hand}</span>
                </div>`,
               )
               .join("")}
            </div>
          </div>`;
    break;

   case "cashier":
    data = await getCashierPerformanceReport(today, today);
    title = "Cashier Performance — " + today;
    html = `
          <div style="padding:20px;">
            ${
             data.length
              ? `
              <div style="max-height:420px;overflow-y:auto;">
                ${data
                 .map(
                  (c, i) => `
                  <div style="padding:12px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;">
                    <div>
                      <p style="font-weight:700;margin-bottom:2px;">${i + 1}. ${c.username}</p>
                      <p style="font-size:12px;color:var(--text-secondary);">${c.transaction_count || 0} transactions</p>
                    </div>
                    <div style="text-align:right;">
                      <p style="color:var(--accent);font-weight:700;">₵${parseFloat(c.total_sales || 0).toFixed(2)}</p>
                      <p style="font-size:12px;color:var(--text-secondary);">Avg: ₵${(parseFloat(c.total_sales || 0) / Math.max(c.transaction_count || 1, 1)).toFixed(2)}</p>
                    </div>
                  </div>`,
                 )
                 .join("")}
              </div>`
              : '<p style="color:var(--text-secondary);">No cashier data for today</p>'
            }
          </div>`;
    break;
  }

  document.getElementById("reportDetailsTitle").textContent = title;
  document.getElementById("reportDetailsContent").innerHTML = html;
  document.getElementById("reportDetailsModal").classList.remove("hidden");
 } catch (error) {
  showNotification(`Error loading report details: ${error.message}`, "danger");
 }
}

// ============================================
// NOTIFICATIONS
// ============================================

function showNotification(message, type = "info") {
 const container = document.getElementById("notificationContainer");
 const notification = document.createElement("div");
 notification.className = `notification alert alert-${type}`;
 notification.textContent = message;
 container.appendChild(notification);

 setTimeout(() => {
  notification.style.opacity = "0";
  notification.style.transform = "translateY(-8px)";
  notification.style.transition = "all 0.3s ease";
  setTimeout(() => notification.remove(), 300);
 }, 3500);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount, compact = false) {
 const num = parseFloat(amount || 0);
 if (compact || num >= 10000) return formatCompactCurrency(num);
 return `₵${num.toFixed(2)}`;
}

function formatCompactCurrency(num) {
 if (num >= 1_000_000_000) return `₵${(num / 1_000_000_000).toFixed(1)}B`;
 if (num >= 1_000_000) return `₵${(num / 1_000_000).toFixed(1)}M`;
 if (num >= 10_000) return `₵${(num / 1_000).toFixed(1)}K`;
 return `₵${num.toFixed(2)}`;
}

function formatDate(dateString) {
 if (!dateString) return "—";
 return new Date(dateString).toLocaleDateString("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
 });
}

// ============================================
// USERS PAGE (Admin only)
// ============================================

async function loadUsers() {
 try {
  const search = document.getElementById("userSearch")?.value || "";
  const role = document.getElementById("roleFilter")?.value || "";
  const users = await getAllUsers({ search, role });
  renderUsersTable(users);
 } catch (error) {
  showNotification(`Error loading users: ${error.message}`, "danger");
 }
}

function renderUsersTable(users) {
 const tbody = document.getElementById("usersTableBody");
 if (!users.length) {
  tbody.innerHTML =
   '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);padding:24px;">No users found.</td></tr>';
  return;
 }

 const currentUser = getCurrentUser();

 tbody.innerHTML = users
  .map((u) => {
   const isSelf = u.user_id === currentUser?.user_id;
   const statusBadge =
    u.is_active !== false
     ? '<span class="status-badge status-ok">Active</span>'
     : '<span class="status-badge status-out">Inactive</span>';

   return `
        <tr>
          <td><strong>${u.first_name || ""} ${u.last_name || ""}</strong></td>
          <td style="color:var(--text-secondary)">@${u.username}</td>
          <td style="color:var(--text-secondary)">${u.email}</td>
          <td>${roleBadge(u.role)}</td>
          <td>${statusBadge}</td>
          <td>
            <div class="table-actions">
              <button class="btn-edit" onclick="editUser(${u.user_id})">Edit</button>
              ${
               !isSelf
                ? `<button class="btn-delete" onclick="deleteUserConfirm(${u.user_id}, '${u.username.replace(/'/g, "\\'")}')">Delete</button>`
                : '<span style="font-size:12px;color:var(--text-dim-val);">You</span>'
              }
            </div>
          </td>
        </tr>`;
  })
  .join("");
}

function roleBadge(role) {
 const map = {
  administrator: '<span class="user-role-pill role-admin">Administrator</span>',
  cashier: '<span class="user-role-pill role-cashier">Cashier</span>',
 };
 return map[role] || `<span class="user-role-pill role-cashier">${role}</span>`;
}

function openUserModal() {
 document.getElementById("userForm").reset();
 document.getElementById("userIdField").value = "";
 document.getElementById("userModalTitle").textContent = "Add User";
 document.getElementById("userPassword").required = true;
 document.getElementById("passwordHint").style.display = "none";
 document.getElementById("userForm").onsubmit = saveUser;
 updateRoleInfo();
 document.getElementById("userModal").classList.remove("hidden");
}

function editUser(userId) {
 getUserById(userId)
  .then((user) => {
   document.getElementById("userIdField").value = user.user_id;
   document.getElementById("userFirstName").value = user.first_name || "";
   document.getElementById("userLastName").value = user.last_name || "";
   document.getElementById("userUsername").value = user.username;
   document.getElementById("userEmail").value = user.email;
   document.getElementById("userRole").value = user.role;
   document.getElementById("userPassword").value = "";
   document.getElementById("userPassword").required = false;
   document.getElementById("passwordHint").style.display = "block";
   document.getElementById("userModalTitle").textContent = "Edit User";
   document.getElementById("userForm").onsubmit = (e) => saveUser(e, userId);
   updateRoleInfo();
   document.getElementById("userModal").classList.remove("hidden");
  })
  .catch((err) => showNotification(`Error loading user: ${err.message}`, "danger"));
}

async function saveUser(e, userId) {
 e.preventDefault();

 const password = document.getElementById("userPassword").value;
 const isNew = !userId;

 if (isNew && !password) {
  showNotification("Password is required for new users", "warning");
  return;
 }

 const userData = {
  first_name: document.getElementById("userFirstName").value,
  last_name: document.getElementById("userLastName").value,
  username: document.getElementById("userUsername").value,
  email: document.getElementById("userEmail").value,
  role: document.getElementById("userRole").value,
 };

 if (password) userData.password = password;

 try {
  if (userId) {
   await updateUser(userId, userData);
   showNotification("User updated successfully", "success");
  } else {
   await createUser(userData);
   showNotification("User created successfully", "success");
  }
  document.getElementById("userModal").classList.add("hidden");
  loadUsers();
 } catch (error) {
  showNotification(`Error saving user: ${error.message}`, "danger");
 }
}

function deleteUserConfirm(userId, username) {
 if (confirm(`Delete user "@${username}"? This cannot be undone.`)) {
  deleteUser(userId)
   .then(() => {
    showNotification("User deleted successfully", "success");
    loadUsers();
   })
   .catch((err) => showNotification(`Error: ${err.message}`, "danger"));
 }
}

function updateRoleInfo() {
 const selected = document.getElementById("userRole")?.value;
 document.querySelectorAll(".role-info-card").forEach((card) => {
  card.classList.toggle("active", card.dataset.role === selected);
 });
}

window.viewCustomer = viewCustomer;
window.openEditCustomerModal = openEditCustomerModal;
window.handleDeleteCustomer = handleDeleteCustomer;
