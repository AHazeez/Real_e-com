// Wake Cake - Administrative Operations Script
// Coordinates all statistics, product CRUDs, categories, orders, customers, and reporting in the dashboard.

document.addEventListener('DOMContentLoaded', () => {
    // 1. Guard check - Ensure Admin user is logged in
    enforceAdminAuth();

    // 2. Setup Sidebar Hamburger and Dark Mode toggles
    setupAdminNavigation();

    // 3. Page Router initialization
    routeAdminPage();
});

// Enforce admin access. Redirects to login if not authenticated as admin
async function enforceAdminAuth() {
    if (!window.wakeCakeAPI) return;
    const user = window.wakeCakeAPI.getCurrentUser();

    if (!user) {
        window.location.href = '../login.html';
        return;
    }
    
    if (user.role.toLowerCase() !== 'admin') {
        alert('Access denied. Please log in as an administrator.');
        window.location.href = '../login.html';
    }
}

// Sidebar responsive and theme toggles
function setupAdminNavigation() {
    const hamburger = document.querySelector('.admin-hamburger');
    const sidebar = document.querySelector('.admin-sidebar');
    const themeToggle = document.getElementById('theme-toggle-btn');
    
    if (hamburger && sidebar) {
        hamburger.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Theme toggling (Dark mode persistence)
    if (themeToggle) {
        const isDark = localStorage.getItem('admin_dark_mode') === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
            themeToggle.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-mode');
            themeToggle.textContent = '🌙';
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const darkActive = document.body.classList.contains('dark-mode');
            localStorage.setItem('admin_dark_mode', darkActive);
            themeToggle.textContent = darkActive ? '☀️' : '🌙';
        });
    }

    // Active Sidebar Highlight
    const path = window.location.pathname;
    const page = path.split('/').pop();
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === page || (href === 'dashboard.html' && page === '')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Setup Logout
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.wakeCakeAPI.logoutUser();
            window.location.href = '../login.html';
        });
    }

    // Populate user profile info in admin header
    const currentUser = window.wakeCakeAPI.getCurrentUser();
    if (currentUser) {
        const profileName = document.querySelector('.user-name');
        const avatarLetter = document.querySelector('.user-avatar');
        if (profileName) profileName.textContent = currentUser.name;
        if (avatarLetter) avatarLetter.textContent = currentUser.name.charAt(0);
    }
}

// Router to trigger page-specific setup functions
function routeAdminPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop();

    // Setup common admin toast containers
    initAdminToasts();

    switch(page) {
        case 'dashboard.html':
            initDashboardHome();
            break;
        case 'products.html':
            initProductsAdmin();
            break;
        case 'orders.html':
            initOrdersAdmin();
            break;
        case 'inventory.html':
            initInventoryAdmin();
            break;
        case 'customers.html':
            initCustomersAdmin();
            break;
        case 'reports.html':
            initReportsAdmin();
            break;
        case 'settings.html':
            initSettingsAdmin();
            break;
    }
}

// Toast Alert Helper for Admin
function initAdminToasts() {
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '30px';
        container.style.right = '30px';
        container.style.zIndex = '3000';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }
}

function showAdminToast(message, type = 'success') {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.backgroundColor = 'var(--admin-card-bg)';
    toast.style.border = '1px solid var(--admin-card-border)';
    toast.style.borderLeft = `4px solid ${type === 'success' ? 'var(--color-success)' : 'var(--color-danger)'}`;
    toast.style.padding = '14px 20px';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = 'var(--shadow-md)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '10px';
    toast.style.minWidth = '280px';
    toast.style.color = 'var(--admin-text-primary)';
    toast.style.transform = 'translateX(120%)';
    toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

    const icon = type === 'success' ? '✅' : '❌';

    toast.innerHTML = `
        <span>${icon}</span>
        <span style="font-size:13px; font-weight:600;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Modal handling utilities
function openModal(modalId) {
    const backdrop = document.getElementById(modalId);
    if (backdrop) {
        backdrop.classList.add('show');
    }
}

function closeModal(modalId) {
    const backdrop = document.getElementById(modalId);
    if (backdrop) {
        backdrop.classList.remove('show');
    }
}

// Close modals when clicking backdrop
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
        e.target.classList.remove('show');
    }
});


// =========================================================================
// 1. DASHBOARD HOME PAGE
// =========================================================================
async function initDashboardHome() {
    renderKPIOverview();
    renderRecentOrdersTable();
    renderLowStockDashboardAlerts();
}

async function renderKPIOverview() {
    try {
        const stats = await window.wakeCakeAPI.getDashboardStats();
        
        const valRev = document.getElementById('kpi-revenue');
        const valOrd = document.getElementById('kpi-orders');
        const valProd = document.getElementById('kpi-products');
        const valCust = document.getElementById('kpi-customers');
        const valStock = document.getElementById('kpi-stock');

        if (valRev) valRev.textContent = `$${stats.totalRevenue.toFixed(2)}`;
        if (valOrd) valOrd.textContent = stats.totalOrders;
        if (valProd) valProd.textContent = stats.totalProducts;
        if (valCust) valCust.textContent = stats.totalCustomers;
        if (valStock) valStock.textContent = stats.lowStockCount;
    } catch (error) {
        console.error('Failed to render KPI overview:', error);
        showAdminToast('Could not load dashboard KPIs.', 'error');
    }
}

async function renderRecentOrdersTable() {
    const container = document.getElementById('recent-orders-body');
    if (!container) return;

    try {
        const orders = await window.wakeCakeAPI.getOrders({ limit: 5, sort: 'date,desc' });

        if (orders.length === 0) {
            container.innerHTML = `<tr><td colspan="5" style="text-align:center;">No orders placed yet.</td></tr>`;
            return;
        }

        container.innerHTML = orders.map(o => `
            <tr>
                <td><strong>#${o.id}</strong></td>
                <td>${o.customer_name || 'N/A'}</td>
                <td>${new Date(o.created_at).toLocaleDateString()}</td>
                <td>$${Number(o.total_amount || 0).toFixed(2)}</td>
                <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to render recent orders:', error);
        container.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--color-danger);">Failed to load orders.</td></tr>`;
    }
}

async function renderLowStockDashboardAlerts() {
    const container = document.getElementById('dashboard-stock-alerts');
    if (!container) return;

    try {
        const products = await window.wakeCakeAPI.getProducts({ low_stock: true, limit: 5 });

        if (products.length === 0) {
            container.innerHTML = `<p style="color:var(--color-success); font-weight:500;">✅ All stock levels are sufficient.</p>`;
            return;
        }

        container.innerHTML = products.map(p => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border:1px solid var(--admin-card-border); border-radius:6px; margin-bottom:10px;">
                <div>
                    <strong style="font-size:14px;">${p.name}</strong>
                    <div style="font-size:12px; color:var(--admin-text-muted);">Category: ${p.category || 'Cake'}</div>
                </div>
                <span class="badge badge-low-stock" style="font-size:11px;">Stock: ${p.stock}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to render low stock alerts:', error);
        container.innerHTML = `<p style="color:var(--color-danger); font-weight:500;">❌ Could not load stock alerts.</p>`;
    }
}


// =========================================================================
// 2. PRODUCTS MODULE PAGE
// =========================================================================
function initProductsAdmin() {
    renderProductsListTable();

    // Bind Add Product Modals buttons
    const addBtn = document.getElementById('btn-add-product');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            document.getElementById('modal-title-product').textContent = 'Add New Product';
            document.getElementById('product-form').reset();
            document.getElementById('prod-form-id').value = '';
            openModal('modal-product');
        });
    }

    // Bind modal forms submissions
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const id = document.getElementById('prod-form-id').value;
            const name = document.getElementById('prod-form-name').value.trim();
            const category = document.getElementById('prod-form-category').value;
            const price = parseFloat(document.getElementById('prod-form-price').value) || 0;
            const stock = parseInt(document.getElementById('prod-form-stock').value) || 0;
            const status = document.getElementById('prod-form-status').value;
            const description = document.getElementById('prod-form-desc').value.trim();
            const ingredients = document.getElementById('prod-form-ingr').value.trim();
            const imageFile = document.getElementById('prod-form-image').files[0];

            if (!name || price <= 0 || stock < 0 || !description) {
                showAdminToast('Please fill all required product details.', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('name', name);
            formData.append('category', category);
            formData.append('price', price);
            formData.append('stock_quantity', stock);
            formData.append('status', status.toLowerCase());
            formData.append('description', description);
            // formData.append('ingredients', ingredients); // Assuming 'ingredients' is not a field in the 'products' table
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const saved = await saveProductWithImage(id, formData);

            if (saved) {
                showAdminToast(id ? 'Product updated successfully' : 'Product created successfully', 'success');
                closeModal('modal-product');
                renderProductsListTable();
            }
        };
    }
}

async function saveProductWithImage(id, formData) {
    if (!window.wakeCakeAPI?.getAuthToken()) {
        showAdminToast('Authentication error. Please log in again.', 'error');
        return false;
    }

    try {
        if (id) {
            await window.wakeCakeAPI.updateProduct(id, formData);
        } else {
            await window.wakeCakeAPI.createProduct(formData);
        }
        return true;
    } catch (error) {
        showAdminToast(error.message, 'error');
        return false;
    }
}


async function renderProductsListTable() {
    const tableBody = document.getElementById('admin-products-table-body');
    if (!tableBody) return;

    let products = [];
    try {
        products = await window.wakeCakeAPI.getProducts();
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--color-danger);">Failed to load products.</td></tr>`;
        showAdminToast(error.message, 'error');
        return;
    }

    if (products.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No products available. Add some!</td></tr>`;
        return;
    }

    tableBody.innerHTML = products.map(p => `
        <tr>
            <td>
                <img src="${p.image_url || '../assets/images/cake-chocolate.svg'}" alt="${p.name}" style="width:40px; height:40px; object-fit:contain; background:#FAF6F0; border-radius:4px; border:1px solid var(--admin-card-border);" onerror="this.src='../assets/images/cake-chocolate.svg'">
            </td>
            <td><strong>${p.name}</strong></td>
            <td>${p.category}</td>
            <td>$${p.price.toFixed(2)}</td>
            <td>${p.stock}</td>
            <td><span class="badge ${String(p.status).toLowerCase() === 'active' ? 'badge-active' : 'badge-inactive'}">${p.status}</span></td>
            <td>
                <button class="btn-action btn-edit edit-product-trigger" data-id="${p.id}">✏️</button>
                <button class="btn-action btn-delete delete-product-trigger" data-id="${p.id}">🗑️</button>
            </td>
        </tr>
    `).join('');

    // Bind Edit triggers
    tableBody.querySelectorAll('.edit-product-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const product = products.find(p => p.id == id);
            if (product) {
                document.getElementById('modal-title-product').textContent = 'Edit Product';
                document.getElementById('prod-form-id').value = product.id;
                document.getElementById('prod-form-name').value = product.name;
                document.getElementById('prod-form-category').value = product.category;
                document.getElementById('prod-form-price').value = product.price;
                document.getElementById('prod-form-stock').value = product.stock;
                document.getElementById('prod-form-status').value = String(product.status).charAt(0).toUpperCase() + String(product.status).slice(1).toLowerCase();
                document.getElementById('prod-form-desc').value = product.description;
                // document.getElementById('prod-form-ingr').value = product.ingredients || '';
                
                openModal('modal-product');
            }
        });
    });

    // Bind Delete triggers
    tableBody.querySelectorAll('.delete-product-trigger').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const product = products.find(p => p.id == id);
            if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                const deleted = await deleteProductById(id);
                if (deleted) {
                    showAdminToast('Product deleted.', 'success');
                    renderProductsListTable();
                }
            }
        });
    });
}

async function deleteProductById(id) {
    if (!window.wakeCakeAPI?.getAuthToken()) {
        showAdminToast('Authentication error. Please log in again.', 'error');
        return false;
    }

    try {
        await window.wakeCakeAPI.deleteProduct(id);
        return true;
    } catch (error) {
        showAdminToast(error.message, 'error');
        return false;
    }
}


// =========================================================================
// 3. ORDERS MODULE PAGE
// =========================================================================
function initOrdersAdmin() {
    renderOrdersListTable();

    // Bind Order detail modal close actions
    const closeBtn = document.getElementById('btn-close-order-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal('modal-order');
        });
    }
}

async function renderOrdersListTable() {
    const tableBody = document.getElementById('admin-orders-table-body');
    if (!tableBody) return;

    let sortedOrders = [];
    try {
        const orders = await window.wakeCakeAPI.getOrders();
        sortedOrders = [...orders].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--color-danger);">Failed to load orders.</td></tr>`;
        showAdminToast(error.message, 'error');
        return;
    }

    if (sortedOrders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No orders found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = sortedOrders.map(o => `
        <tr>
            <td><strong>#${o.id}</strong></td>
            <td>${o.customer_name || 'N/A'}</td>
            <td>${new Date(o.created_at).toLocaleDateString()} ${new Date(o.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
            <td>$${Number(o.total_amount || 0).toFixed(2)}</td>
            <td>${o.payment_method || 'COD'}</td>
            <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
            <td>
                <button class="btn-action btn-view view-order-trigger" data-id="${o.id}">👁️ View Details</button>
            </td>
        </tr>
    `).join('');

    // Bind view buttons
    tableBody.querySelectorAll('.view-order-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            renderOrderDetailsModal(id);
        });
    });
}

async function renderOrderDetailsModal(orderId) {
    let order = null;
    try {
        order = await window.wakeCakeAPI.apiRequest(`/orders/${orderId}`);
    } catch (error) {
        showAdminToast(error.message, 'error');
        return;
    }

    // Fill fields
    document.getElementById('ord-modal-id').textContent = order.id;
    document.getElementById('ord-modal-date').textContent = new Date(order.created_at).toLocaleString();
    document.getElementById('ord-modal-name').textContent = order.customer_name || 'Customer';
    document.getElementById('ord-modal-email').textContent = order.customer_email || '';
    document.getElementById('ord-modal-phone').textContent = order.customer_phone || '';
    document.getElementById('ord-modal-address').textContent = order.delivery_address || '';
    document.getElementById('ord-modal-payment').textContent = order.payment_method || 'COD';

    // Fill Item rows
    const itemsContainer = document.getElementById('ord-modal-items');
    itemsContainer.innerHTML = order.items.map(item => `
        <div class="order-item-row">
            <span>${item.product_name} <strong>x ${item.quantity}</strong></span>
            <span>$${Number(item.line_total || item.unit_price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    // Financial math
    document.getElementById('ord-modal-subtotal').textContent = `$${Number(order.subtotal || 0).toFixed(2)}`;
    document.getElementById('ord-modal-discount').textContent = `-$0.00`;
    document.getElementById('ord-modal-total').textContent = `$${Number(order.total_amount || 0).toFixed(2)}`;

    // Dropdown status selector
    const select = document.getElementById('ord-modal-status-select');
    select.value = order.status;

    // Bind status update trigger
    const updateBtn = document.getElementById('btn-update-order-status');
    updateBtn.onclick = async () => {
        const newStatus = select.value;
        try {
            await window.wakeCakeAPI.updateOrderStatus(order.id, newStatus);
            showAdminToast(`Order #${order.id} status updated to: ${newStatus}`, 'success');
            closeModal('modal-order');
            renderOrdersListTable();
        } catch (error) {
            showAdminToast(error.message, 'error');
        }
    };

    openModal('modal-order');
}


// =========================================================================
// 4. INVENTORY MODULE PAGE
// =========================================================================
function initInventoryAdmin() {
    renderInventoryTable();
}

async function renderInventoryTable() {
    const tableBody = document.getElementById('admin-inventory-table-body');
    const statTotalItems = document.getElementById('inv-stat-total');
    const statLowStock = document.getElementById('inv-stat-low');
    const statOutStock = document.getElementById('inv-stat-out');

    if (!tableBody) return;

    let inventoryItems = [];
    try {
        inventoryItems = await window.wakeCakeAPI.getInventory();
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--color-danger);">Failed to load inventory.</td></tr>`;
        showAdminToast(error.message, 'error');
        return;
    }

    // Calculations
    const totalItems = inventoryItems.reduce((sum, item) => sum + Number(item.stock_quantity || 0), 0);
    const lowStockItems = inventoryItems.filter(item => Number(item.stock_quantity) > 0 && Number(item.stock_quantity) <= Number(item.reorder_level)).length;
    const outStockItems = inventoryItems.filter(item => Number(item.stock_quantity) === 0).length;

    if (statTotalItems) statTotalItems.textContent = totalItems;
    if (statLowStock) statLowStock.textContent = lowStockItems;
    if (statOutStock) statOutStock.textContent = outStockItems;

    if (inventoryItems.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No stock records found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = inventoryItems.map(item => {
        const stock = Number(item.stock_quantity || 0);
        const reorderLevel = Number(item.reorder_level || 0);
        // Build Stock Level Indicator Bar
        let colorClass = 'var(--color-success)';
        if (stock === 0) colorClass = 'var(--color-danger)';
        else if (stock <= reorderLevel) colorClass = 'var(--color-warning)';

        const percentage = Math.min(100, (stock / Math.max(reorderLevel * 2, 20)) * 100);

        return `
            <tr>
                <td><strong>${item.product_name}</strong></td>
                <td>#${item.product_id}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="flex-grow:1; height:8px; background-color:var(--admin-card-border); border-radius:4px; overflow:hidden; min-width:100px;">
                            <div style="width:${percentage}%; height:100%; background-color:${colorClass};"></div>
                        </div>
                        <span style="font-weight:600; font-size:13px;">${stock} units</span>
                    </div>
                </td>
                <td>
                    ${stock === 0 ? '<span class="badge badge-cancelled">Out of Stock</span>' : 
                      stock <= reorderLevel ? '<span class="badge badge-pending">Low Stock Alert</span>' : 
                      '<span class="badge badge-active">Sufficient</span>'}
                </td>
                <td>
                    <div style="display:flex; gap:6px;">
                        <input type="number" id="quick-stock-${item.id}" value="${stock}" min="0" style="width:60px; padding:6px; border:1px solid var(--admin-border-color); border-radius:4px; text-align:center;">
                        <button class="btn-admin btn-admin-primary quick-stock-save" data-id="${item.id}" style="padding:6px 12px; font-size:12px; border-radius:4px;">Update</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Bind stock update action buttons
    tableBody.querySelectorAll('.quick-stock-save').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const val = parseInt(document.getElementById(`quick-stock-${id}`).value);
            
            if (isNaN(val) || val < 0) {
                showAdminToast('Please provide a valid stock quantity.', 'error');
                return;
            }

            window.wakeCakeAPI.updateInventory(id, { stock_quantity: val })
                .then(() => {
                    showAdminToast('Stock levels adjusted successfully', 'success');
                    renderInventoryTable();
                })
                .catch(error => showAdminToast(error.message, 'error'));
        });
    });
}


// =========================================================================
// 5. CUSTOMERS MODULE PAGE
// =========================================================================
function initCustomersAdmin() {
    renderCustomersTable();

    // Close details modal
    const closeBtn = document.getElementById('btn-close-customer-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal('modal-customer');
        });
    }
}

async function renderCustomersTable() {
    const tableBody = document.getElementById('admin-customers-table-body');
    if (!tableBody) return;

    let customers = [];
    try {
        customers = await window.wakeCakeAPI.getCustomers();
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--color-danger);">Failed to load customers.</td></tr>`;
        showAdminToast(error.message, 'error');
        return;
    }

    if (customers.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No customer records found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = customers.map(c => `
        <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.email}</td>
            <td>${c.phone || ''}</td>
            <td>${Number(c.order_count || 0)} orders</td>
            <td>$${Number(c.total_spent || 0).toFixed(2)}</td>
            <td>
                <button class="btn-action btn-view view-customer-trigger" data-email="${c.email}">👁️ Purchase History</button>
            </td>
        </tr>
    `).join('');

    // Bind view purchase history button triggers
    tableBody.querySelectorAll('.view-customer-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const email = e.currentTarget.getAttribute('data-email');
            renderCustomerDetailsModal(email);
        });
    });
}

async function renderCustomerDetailsModal(email) {
    const customers = await window.wakeCakeAPI.getCustomers();
    const customer = customers.find(c => c.email === email);
    if (!customer) return;

    document.getElementById('cust-modal-name').textContent = customer.name;
    document.getElementById('cust-modal-email').textContent = customer.email;
    document.getElementById('cust-modal-phone').textContent = customer.phone;
    document.getElementById('cust-modal-address').textContent = customer.address;

    // Fetch orders placed by this customer email
    const orders = (await window.wakeCakeAPI.getOrders()).filter(o => String(o.customer_email || '').toLowerCase() === email.toLowerCase());

    const tableBody = document.getElementById('cust-modal-orders');
    if (orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px 0;">No order logs found for this customer.</td></tr>`;
    } else {
        tableBody.innerHTML = orders.map(o => `
            <tr>
                <td><strong>#${o.id}</strong></td>
                <td>${new Date(o.created_at).toLocaleDateString()}</td>
                <td>$${Number(o.total_amount || 0).toFixed(2)}</td>
                <td><span class="badge badge-${o.status.toLowerCase()}">${o.status}</span></td>
            </tr>
        `).join('');
    }

    openModal('modal-customer');
}


// =========================================================================
// 6. REPORTS MODULE PAGE
// =========================================================================
function initReportsAdmin() {
    renderSalesReportCharts();
    renderTopSellingProductsTable();
}

async function renderSalesReportCharts() {
    const chartWrapper = document.getElementById('reports-sales-chart');
    if (!chartWrapper) return;

    let report = { sales: [] };
    try {
        report = await window.wakeCakeAPI.getReport('weekly');
    } catch (error) {
        chartWrapper.innerHTML = `<p style="color: var(--color-danger);">Failed to load report.</p>`;
        showAdminToast(error.message, 'error');
        return;
    }

    const labels = report.sales.map(row => new Date(row.sales_date).toLocaleDateString([], { weekday: 'short' })).reverse();
    const dayTotals = report.sales.map(row => Number(row.total_sales || 0)).reverse();

    const maxAmt = Math.max(...dayTotals, 100); // minimum scale limit to 100

    // Render visual bars
    let html = '';
    dayTotals.forEach((total, idx) => {
        const percentage = (total / maxAmt) * 100;
        html += `
            <div class="chart-bar-wrapper">
                <div class="chart-bar" style="height:${percentage}%">
                    <span class="chart-bar-tooltip">$${total.toFixed(2)}</span>
                </div>
                <span class="chart-bar-label">${labels[idx] || ''}</span>
            </div>
        `;
    });

    chartWrapper.innerHTML = html;

    // Group totals display
    const totalSales = dayTotals.reduce((sum, val) => sum + val, 0);
    const orderCount = report.sales.reduce((sum, row) => sum + Number(row.total_orders || 0), 0);
    const avgTicket = orderCount > 0 ? (totalSales / orderCount) : 0.0;

    const sumSales = document.getElementById('rep-sales-total');
    const sumCount = document.getElementById('rep-orders-count');
    const sumAvg = document.getElementById('rep-avg-ticket');

    if (sumSales) sumSales.textContent = `$${totalSales.toFixed(2)}`;
    if (sumCount) sumCount.textContent = orderCount;
    if (sumAvg) sumAvg.textContent = `$${avgTicket.toFixed(2)}`;
}

async function renderTopSellingProductsTable() {
    const tableBody = document.getElementById('reports-top-products');
    if (!tableBody) return;

    let sorted = [];
    try {
        const report = await window.wakeCakeAPI.getReport('monthly');
        sorted = report.top_selling_products || [];
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--color-danger);">Failed to load top products.</td></tr>`;
        showAdminToast(error.message, 'error');
        return;
    }

    if (sorted.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No product transaction data available.</td></tr>`;
        return;
    }

    tableBody.innerHTML = sorted.map((p, idx) => `
        <tr>
            <td><strong>#${idx + 1}</strong></td>
            <td><strong>${p.product_name}</strong></td>
            <td>${Number(p.quantity_sold || 0)} units sold</td>
            <td>$${Number(p.revenue || 0).toFixed(2)}</td>
        </tr>
    `).join('');
}


// =========================================================================
// 7. SETTINGS MODULE PAGE
// =========================================================================
function initSettingsAdmin() {
    const form = document.getElementById('settings-form');
    if (!form) return;

    loadSettingsForm();

    form.onsubmit = async (e) => {
        e.preventDefault();

        try {
            await window.wakeCakeAPI.updateSettings({
            company_name: document.getElementById('set-company').value.trim(),
            email: document.getElementById('set-email').value.trim(),
            phone: document.getElementById('set-phone').value.trim(),
            address: document.getElementById('set-address').value.trim(),
            instagram: document.getElementById('set-instagram').value.trim(),
            facebook: document.getElementById('set-facebook').value.trim(),
            twitter: document.getElementById('set-twitter').value.trim(),
            delivery_fee: parseFloat(document.getElementById('set-delivery').value) || 0
        });
            showAdminToast('Settings updated successfully.', 'success');
        } catch (error) {
            showAdminToast(error.message, 'error');
        }
    };
}

async function loadSettingsForm() {
    try {
        const settings = await window.wakeCakeAPI.getSettings();

        document.getElementById('set-company').value = settings.company_name || '';
        document.getElementById('set-email').value = settings.email || '';
        document.getElementById('set-phone').value = settings.phone || '';
        document.getElementById('set-address').value = settings.address || '';
        document.getElementById('set-instagram').value = settings.instagram || '';
        document.getElementById('set-facebook').value = settings.facebook || '';
        document.getElementById('set-twitter').value = settings.twitter || '';
        document.getElementById('set-delivery').value = Number(settings.delivery_fee || 0);
    } catch (error) {
        showAdminToast(error.message, 'error');
    }
}
