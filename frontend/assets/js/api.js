// Wake Cake - Backend API client

const configuredApiBaseUrl =
    window.WAKE_CAKE_API_BASE_URL ||
    localStorage.getItem('wake_cake_api_base_url') ||
    '';

if (!configuredApiBaseUrl) {
    console.warn('Wake Cake API URL is not configured. Set window.WAKE_CAKE_API_BASE_URL or localStorage wake_cake_api_base_url.');
}

const WAKE_CAKE_API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, '');
const WAKE_CAKE_TOKEN_KEY = 'auth_token';
const WAKE_CAKE_USER_KEY = 'auth_user';

function getAuthToken() {
    return localStorage.getItem(WAKE_CAKE_TOKEN_KEY);
}

function setAuthToken(token) {
    if (token) {
        localStorage.setItem(WAKE_CAKE_TOKEN_KEY, token);
    } else {
        localStorage.removeItem(WAKE_CAKE_TOKEN_KEY);
    }
}

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem(WAKE_CAKE_USER_KEY) || 'null');
    } catch (error) {
        return null;
    }
}

// Alias for role-based front-end routing
function getCurrentUser() {
    return getStoredUser();
}


function setStoredUser(user) {
    if (user) {
        localStorage.setItem(WAKE_CAKE_USER_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(WAKE_CAKE_USER_KEY);
    }
}

function logoutUser() {
    setAuthToken(null);
    setStoredUser(null);
}

function getProductImage(product) {
    return product?.image_url || 'assets/images/no-image.png';
}

function normalizeProduct(product) {
    if (!product) return null;

    return {
        ...product,
        id: String(product.id),
        price: Number(product.price || 0),
        stock: Number(product.stock ?? product.stock_quantity ?? 0),
        image_url: getProductImage(product),
        status: product.status === 'active' ? 'Active' : product.status || 'Active',
        rating: Number(product.rating || 4.8),
        ingredients: product.ingredients || 'Fresh bakery ingredients. Please contact Wake Cake for detailed allergen information.'
    };
}

function normalizeCartItem(item) {
    const price = Number(item.price || 0);
    const quantity = Number(item.quantity || 0);

    return {
        ...item,
        id: String(item.id),
        productId: String(item.product_id || item.productId),
        name: item.name || item.product_name || 'Cake',
        price,
        quantity,
        image_url: item.image_url || 'assets/images/no-image.png',
        lineTotal: Number(item.line_total || price * quantity)
    };
}

function unwrapApiResponse(responseBody) {
    if (responseBody && Object.prototype.hasOwnProperty.call(responseBody, 'data')) {
        return responseBody.data;
    }
    return responseBody;
}

async function apiRequest(endpoint, options = {}) {
    if (!WAKE_CAKE_API_BASE_URL) {
        throw new Error('Wake Cake API URL is not configured.');
    }

    const token = getAuthToken();
    const headers = {
        Accept: 'application/json',
        ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${WAKE_CAKE_API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    let body = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        body = await response.json();
    }

    if (!response.ok) {
        if (response.status === 401) {
            logoutUser();
        }
        const message = body?.message || body?.error || 'Something went wrong. Please try again.';
        throw new Error(message);
    }

    return unwrapApiResponse(body);
}

async function getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const products = await apiRequest(query ? `/products?${query}` : '/products');
    return Array.isArray(products) ? products.map(normalizeProduct) : [];
}

async function getProductById(id) {
    return normalizeProduct(await apiRequest(`/products/${id}`));
}

async function getDashboardStats() {
    return apiRequest('/admin/stats');
}

async function getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/orders?${query}`);
}

async function getCustomers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/customers?${query}`);
}

async function getInventory() {
    return apiRequest('/inventory');
}

async function updateInventory(id, payload) {
    return apiRequest(`/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
}

async function getReport(period = 'weekly') {
    return apiRequest(`/reports/${period}`);
}

async function getSettings() {
    return apiRequest('/settings');
}

async function updateSettings(payload) {
    return apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
    });
}

async function loginUser(email, password) {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });

    setAuthToken(data.token);
    setStoredUser(data.user);
    return data;
}

async function registerUser({ name, email, password, phone }) {
    const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone })
    });

    setAuthToken(data.token);
    setStoredUser(data.user);
    return data;
}

async function getCart() {
    const data = await apiRequest('/cart');
    const items = Array.isArray(data?.items) ? data.items.map(normalizeCartItem) : [];
    return {
        items,
        total: Number(data?.total || items.reduce((sum, item) => sum + item.lineTotal, 0))
    };
}

async function addToCart(productId, quantity = 1) {
    return apiRequest('/cart', {
        method: 'POST',
        body: JSON.stringify({
            product_id: Number(productId),
            quantity: Number(quantity)
        })
    });
}

async function updateCart(cartItemId, quantity) {
    return apiRequest(`/cart/${cartItemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: Number(quantity) })
    });
}

async function removeCartItem(cartItemId) {
    return apiRequest(`/cart/${cartItemId}`, {
        method: 'DELETE'
    });
}

async function createOrder({ deliveryAddress, notes, paymentMethod }) {
    return apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
            delivery_address: deliveryAddress,
            notes,
            payment_method: paymentMethod
        })
    });
}

async function createProduct(formData) {
    return apiRequest('/products', {
        method: 'POST',
        body: formData
    });
}

async function updateProduct(id, formData) {
    return apiRequest(`/products/${id}`, {
        method: 'PUT',
        body: formData
    });
}

async function deleteProduct(id) {
    return apiRequest(`/products/${id}`, {
        method: 'DELETE'
    });
}

async function updateOrderStatus(id, status) {
    return apiRequest(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    });
}

window.wakeCakeAPI = {
    apiBaseUrl: WAKE_CAKE_API_BASE_URL,
    apiRequest,
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    loginUser,
    registerUser,
    getCart,
    addToCart,
    updateCart,
    removeCartItem,
    createOrder,
    updateOrderStatus,
    getDashboardStats,
    getOrders,
    getCustomers,
    getInventory,
    updateInventory,
    getReport,
    getSettings,
    updateSettings,
    getAuthToken,
    setAuthToken,
    getStoredUser,
    getCurrentUser,
    setStoredUser,
    logoutUser,
    getProductImage
};
