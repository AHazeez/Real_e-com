// Wake Cake - E-commerce Operations Script
// Handles products catalog, product details, cart modifications, and checkout pipeline.

let allProducts = [];
let currentCategoryFilter = 'all';
let searchQuery = '';
let currentPage = 1;
let appliedDiscount = 0.0;
let appliedCouponCode = '';

const itemsPerPage = 6;
const deliveryFeeDefault = 5.99;
const fallbackProductImage = 'assets/images/no-image.png';

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    if (page === 'products.html') {
        setupProductsCatalog();
    } else if (page === 'product-details.html') {
        setupProductDetailsPage();
    } else if (page === 'cart.html') {
        setupCartPage();
    } else if (page === 'checkout.html') {
        setupCheckoutPage();
    } else if (page === 'index.html' || page === '') {
        setupHomePageFeatured();
    }
});

function isAuthenticated() {
    return Boolean(window.wakeCakeAPI?.getAuthToken());
}

function requireAuth() {
    if (isAuthenticated()) return true;

    const redirect = encodeURIComponent(window.location.pathname.split('/').pop() || 'index.html');
    window.showToast('Please login to continue.', 'error');
    setTimeout(() => {
        window.location.href = `login.html?redirect=${redirect}`;
    }, 700);
    return false;
}

async function loadProducts() {
    allProducts = await window.wakeCakeAPI.getProducts();
    return allProducts;
}

function activeProducts(products = allProducts) {
    return products.filter(product => String(product.status).toLowerCase() === 'active');
}

function renderError(container, message) {
    if (!container) return;
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 0; grid-column: 1/-1;">
            <p style="font-size: 18px; color: var(--color-text-muted);">${message}</p>
        </div>
    `;
}

async function setupHomePageFeatured() {
    const featuredGrid = document.getElementById('featured-grid');
    const bestsellerGrid = document.getElementById('bestseller-grid');
    if (!featuredGrid && !bestsellerGrid) return;

    try {
        const products = activeProducts(await loadProducts());

        if (featuredGrid) {
            featuredGrid.innerHTML = products.slice(0, 4).map(product => generateProductCard(product)).join('');
        }

        if (bestsellerGrid) {
            bestsellerGrid.innerHTML = products.slice(4, 7).map(product => generateProductCard(product)).join('');
        }

        bindProductCardActions();
    } catch (error) {
        renderError(featuredGrid || bestsellerGrid, 'Unable to load products right now.');
    }
}

async function setupProductsCatalog() {
    const productsContainer = document.getElementById('catalog-products');
    if (!productsContainer) return;

    productsContainer.innerHTML = '<div style="padding: 40px 0; color: var(--color-text-muted);">Loading cakes...</div>';

    try {
        await loadProducts();
        renderCategoryFilters();

        const searchInput = document.getElementById('search-products');
        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                searchQuery = event.target.value.toLowerCase();
                currentPage = 1;
                renderFilteredProducts();
            });
        }

        renderFilteredProducts();
    } catch (error) {
        renderError(productsContainer, 'Unable to load cakes. Please try again later.');
    }
}

function renderCategoryFilters() {
    const list = document.getElementById('category-filter-list');
    if (!list) return;

    const products = activeProducts();
    const categoryNames = [...new Set(products.map(product => product.category).filter(Boolean))];

    let html = `
        <li>
            <button class="category-filter-btn active" data-category="all">
                <span>All Cakes</span>
                <span class="category-count-badge">${products.length}</span>
            </button>
        </li>
    `;

    categoryNames.forEach(categoryName => {
        const count = products.filter(product => String(product.category).toLowerCase() === String(categoryName).toLowerCase()).length;
        html += `
            <li>
                <button class="category-filter-btn" data-category="${categoryName}">
                    <span>${categoryName}</span>
                    <span class="category-count-badge">${count}</span>
                </button>
            </li>
        `;
    });

    list.innerHTML = html;

    list.querySelectorAll('.category-filter-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            list.querySelectorAll('.category-filter-btn').forEach(item => item.classList.remove('active'));
            const clickedButton = event.currentTarget;
            clickedButton.classList.add('active');
            currentCategoryFilter = clickedButton.getAttribute('data-category');
            currentPage = 1;
            renderFilteredProducts();
        });
    });
}

function renderFilteredProducts() {
    const container = document.getElementById('catalog-products');
    if (!container) return;

    let products = activeProducts();

    if (currentCategoryFilter !== 'all') {
        products = products.filter(product => String(product.category).toLowerCase() === currentCategoryFilter.toLowerCase());
    }

    if (searchQuery) {
        products = products.filter(product =>
            product.name.toLowerCase().includes(searchQuery) ||
            String(product.description || '').toLowerCase().includes(searchQuery)
        );
    }

    const totalPages = Math.ceil(products.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = products.slice(start, start + itemsPerPage);

    if (paginatedProducts.length > 0) {
        container.innerHTML = `<div class="products-grid">${paginatedProducts.map(product => generateProductCard(product)).join('')}</div>`;
        bindProductCardActions();
        renderPaginationControls(totalPages);
    } else {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 0; grid-column: 1/-1;">
                <p style="font-size: 18px; color: var(--color-text-muted);">No products found matching your criteria.</p>
                <button class="btn btn-primary" style="margin-top: 20px;" onclick="resetFilters()">Reset Filters</button>
            </div>
        `;
        renderPaginationControls(0);
    }
}

function resetFilters() {
    searchQuery = '';
    currentCategoryFilter = 'all';
    currentPage = 1;

    const searchInput = document.getElementById('search-products');
    if (searchInput) searchInput.value = '';

    document.querySelectorAll('.category-filter-btn').forEach(button => {
        button.classList.toggle('active', button.getAttribute('data-category') === 'all');
    });

    renderFilteredProducts();
}
window.resetFilters = resetFilters;

function renderPaginationControls(totalPages) {
    const pagContainer = document.getElementById('catalog-pagination');
    if (!pagContainer) return;

    if (totalPages <= 1) {
        pagContainer.innerHTML = '';
        return;
    }

    pagContainer.innerHTML = Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        return `<button class="page-btn ${currentPage === page ? 'active' : ''}" data-page="${page}">${page}</button>`;
    }).join('');

    pagContainer.querySelectorAll('.page-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            currentPage = parseInt(event.target.getAttribute('data-page'), 10);
            renderFilteredProducts();
            window.scrollTo({ top: 300, behavior: 'smooth' });
        });
    });
}

function generateProductCard(product) {
    const isOutOfStock = product.stock <= 0;
    const badgeHtml = isOutOfStock ? '<span class="product-badge out-of-stock">Out of Stock</span>' : '';
    const buttonHtml = isOutOfStock
        ? '<button class="product-card-btn" disabled style="cursor: not-allowed; opacity: 0.6;">&#10060;</button>'
        : `<button class="product-card-btn add-to-cart-quick" data-id="${product.id}">&#128722;</button>`;

    let starsHtml = '';
    const fullStars = Math.floor(product.rating);
    for (let i = 0; i < 5; i++) {
        starsHtml += i < fullStars ? '&#9733;' : '&#9734;';
    }

    return `
        <div class="product-card">
            ${badgeHtml}
            <div class="product-img-wrapper">
                <a href="product-details.html?id=${product.id}">
                    <img src="${product.image_url || fallbackProductImage}" alt="${product.name}" class="product-card-img" onerror="this.src='${fallbackProductImage}'">
                </a>
            </div>
            <div class="product-card-content">
                <span class="product-card-cat">${product.category || 'Cake'}</span>
                <a href="product-details.html?id=${product.id}">
                    <h3 class="product-card-title">${product.name}</h3>
                </a>
                <div class="product-rating">
                    <span class="rating-stars">${starsHtml}</span>
                    <span class="rating-value">${product.rating.toFixed(1)}</span>
                </div>
                <div class="product-card-footer">
                    <span class="product-price">$${product.price.toFixed(2)}</span>
                    ${buttonHtml}
                </div>
            </div>
        </div>
    `;
}

function bindProductCardActions() {
    document.querySelectorAll('.add-to-cart-quick').forEach(button => {
        button.addEventListener('click', async (event) => {
            event.preventDefault();
            if (!requireAuth()) return;

            const id = event.currentTarget.getAttribute('data-id');
            const product = allProducts.find(item => item.id === String(id));

            try {
                await window.wakeCakeAPI.addToCart(id, 1);
                await window.updateCartCountBadge();
                window.showToast(`Added ${product?.name || 'cake'} to cart!`, 'success');
            } catch (error) {
                window.showToast(error.message, 'error');
            }
        });
    });
}

async function setupProductDetailsPage() {
    const productId = new URLSearchParams(window.location.search).get('id');
    if (!productId) {
        window.location.href = 'products.html';
        return;
    }

    try {
        const product = await window.wakeCakeAPI.getProductById(productId);
        allProducts = await window.wakeCakeAPI.getProducts();
        renderProductDetails(product);
        renderReviewsSection(product.id);
        renderRelatedProducts(product);
    } catch (error) {
        window.showToast(error.message, 'error');
        setTimeout(() => {
            window.location.href = 'products.html';
        }, 900);
    }
}

function renderProductDetails(product) {
    document.title = `${product.name} - Wake Cake`;
    document.getElementById('details-name').textContent = product.name;
    document.getElementById('details-category').textContent = product.category || 'Cake';
    document.getElementById('details-price').textContent = `$${product.price.toFixed(2)}`;
    document.getElementById('details-desc').textContent = product.description || '';

    const mainImg = document.getElementById('details-main-img');
    if (mainImg) {
        mainImg.src = product.image_url || fallbackProductImage;
        mainImg.alt = product.name;
        mainImg.onerror = function () {
            this.src = fallbackProductImage;
        };
    }

    const thumbnailRow = document.querySelector('.thumbnail-row');
    if (thumbnailRow) {
        const imageUrl = product.image_url || fallbackProductImage;
        thumbnailRow.innerHTML = `
            <div class="thumbnail active">
                <img src="${imageUrl}" alt="${product.name}" onerror="this.src='${fallbackProductImage}'">
            </div>
        `;
        const thumbnailImage = thumbnailRow.querySelector('img');
        thumbnailImage.addEventListener('click', () => {
            mainImg.src = thumbnailImage.src;
        });
    }

    let starsHtml = '';
    const fullStars = Math.floor(product.rating);
    for (let i = 0; i < 5; i++) {
        starsHtml += i < fullStars ? '&#9733;' : '&#9734;';
    }
    document.getElementById('details-stars').innerHTML = starsHtml;
    document.getElementById('details-rating-value').textContent = `${product.rating.toFixed(1)} Rating`;
    document.getElementById('tab-desc-content').textContent = product.description || '';
    document.getElementById('tab-ingr-content').textContent = product.ingredients || '';

    const stockMsg = document.getElementById('details-stock-msg');
    const addToCartBtn = document.getElementById('details-add-to-cart');
    const buyNowBtn = document.getElementById('details-buy-now');
    const qtyInput = document.getElementById('details-qty');

    if (product.stock <= 0) {
        stockMsg.textContent = 'Out of Stock';
        stockMsg.style.color = 'var(--color-error)';
        if (addToCartBtn) addToCartBtn.disabled = true;
        if (buyNowBtn) buyNowBtn.disabled = true;
        if (qtyInput) qtyInput.disabled = true;
    } else if (product.stock <= 3) {
        stockMsg.textContent = `Only ${product.stock} left in stock!`;
        stockMsg.style.color = 'var(--color-error)';
    } else {
        stockMsg.textContent = 'In Stock';
        stockMsg.style.color = 'var(--color-success)';
    }

    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');

    if (qtyMinus && qtyPlus && qtyInput) {
        qtyMinus.addEventListener('click', () => {
            const value = parseInt(qtyInput.value, 10) || 1;
            if (value > 1) qtyInput.value = value - 1;
        });

        qtyPlus.addEventListener('click', () => {
            const value = parseInt(qtyInput.value, 10) || 1;
            if (value < product.stock) {
                qtyInput.value = value + 1;
            } else {
                window.showToast(`Only ${product.stock} units available in stock.`, 'error');
            }
        });
    }

    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            document.querySelectorAll('.tab-btn').forEach(item => item.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            const targetId = event.target.getAttribute('data-tab');
            event.target.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });

    const addProductToCart = async (redirectToCart = false) => {
        if (!requireAuth()) return;
        const qty = parseInt(qtyInput.value, 10) || 1;

        try {
            await window.wakeCakeAPI.addToCart(product.id, qty);
            await window.updateCartCountBadge();
            if (redirectToCart) {
                window.location.href = 'cart.html';
            } else {
                window.showToast(`Added ${qty} x ${product.name} to cart!`, 'success');
            }
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    };

    if (addToCartBtn) addToCartBtn.addEventListener('click', () => addProductToCart(false));
    if (buyNowBtn) buyNowBtn.addEventListener('click', () => addProductToCart(true));
}

function renderReviewsSection() {
    const list = document.getElementById('reviews-list');
    if (list) {
        list.innerHTML = '<p style="color:var(--color-text-muted); font-style:italic;">Reviews are coming soon.</p>';
    }

    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.onsubmit = (event) => {
            event.preventDefault();
            window.showToast('Review submission is not available yet.', 'error');
        };
    }
}

function renderRelatedProducts(product) {
    const container = document.getElementById('related-grid');
    if (!container) return;

    let related = activeProducts()
        .filter(item => item.category === product.category && item.id !== product.id)
        .slice(0, 3);

    if (related.length === 0) {
        related = activeProducts().filter(item => item.id !== product.id).slice(0, 3);
    }

    container.innerHTML = related.map(item => generateProductCard(item)).join('');
    bindProductCardActions();
}

async function setupCartPage() {
    const tableBody = document.getElementById('cart-table-body');
    if (!tableBody) return;

    if (!requireAuth()) return;

    await renderCartItems();

    const couponBtn = document.getElementById('apply-coupon-btn');
    if (couponBtn) {
        couponBtn.addEventListener('click', async () => {
            const input = document.getElementById('coupon-input');
            const code = input.value.trim().toUpperCase();

            if (code === 'WAKEBAKE10') {
                appliedDiscount = 0.10;
                appliedCouponCode = code;
                window.showToast('Promo Code WAKEBAKE10 Applied (10% Off)!', 'success');
            } else if (code === 'WELCOME') {
                appliedDiscount = 0.15;
                appliedCouponCode = code;
                window.showToast('Promo Code WELCOME Applied (15% Off)!', 'success');
            } else {
                appliedDiscount = 0.0;
                appliedCouponCode = '';
                window.showToast('Invalid Coupon Code.', 'error');
            }
            await renderCartItems();
        });
    }
}

async function renderCartItems() {
    const tableBody = document.getElementById('cart-table-body');
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountEl = document.getElementById('cart-discount');
    const deliveryEl = document.getElementById('cart-delivery');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('cart-checkout-btn');

    if (!tableBody) return;

    try {
        const cart = await window.wakeCakeAPI.getCart();
        const items = cart.items;

        if (items.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 60px 0;">
                        <p style="font-size: 18px; color: var(--color-text-muted); margin-bottom: 20px;">Your cart is empty.</p>
                        <a href="products.html" class="btn btn-primary">Continue Shopping</a>
                    </td>
                </tr>
            `;
            if (subtotalEl) subtotalEl.textContent = '$0.00';
            if (discountEl) discountEl.textContent = '$0.00';
            if (deliveryEl) deliveryEl.textContent = '$0.00';
            if (totalEl) totalEl.textContent = '$0.00';
            if (checkoutBtn) checkoutBtn.style.pointerEvents = 'none';
            return;
        }

        if (checkoutBtn) checkoutBtn.style.pointerEvents = 'auto';

        let subtotal = 0.0;
        tableBody.innerHTML = items.map(item => {
            const itemSubtotal = item.price * item.quantity;
            subtotal += itemSubtotal;

            return `
                <tr data-id="${item.id}">
                    <td>
                        <div class="cart-item-detail">
                            <img src="${item.image_url || fallbackProductImage}" alt="${item.name}" class="cart-item-img" onerror="this.src='${fallbackProductImage}'">
                            <div>
                                <h4 class="cart-item-name">${item.name}</h4>
                                <button class="cart-remove-btn remove-item-action" data-id="${item.id}">Remove</button>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="product-price" style="font-size: 16px;">$${item.price.toFixed(2)}</span>
                    </td>
                    <td>
                        <div class="qty-selector" style="height: 36px;">
                            <button class="qty-btn change-qty-action" data-id="${item.id}" data-quantity="${item.quantity}" data-action="minus" style="width:32px; height:32px;">-</button>
                            <input type="text" value="${item.quantity}" readonly class="qty-input" style="width:32px; height:32px; font-size:14px;">
                            <button class="qty-btn change-qty-action" data-id="${item.id}" data-quantity="${item.quantity}" data-action="plus" style="width:32px; height:32px;">+</button>
                        </div>
                    </td>
                    <td>
                        <span class="product-price" style="font-size: 16px;">$${itemSubtotal.toFixed(2)}</span>
                    </td>
                </tr>
            `;
        }).join('');

        const discountAmount = subtotal * appliedDiscount;
        const deliveryFee = subtotal > 50 ? 0.00 : deliveryFeeDefault;
        const grandTotal = (subtotal - discountAmount) + deliveryFee;

        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (discountEl) discountEl.textContent = `-$${discountAmount.toFixed(2)}`;
        if (deliveryEl) deliveryEl.textContent = deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${grandTotal.toFixed(2)}`;

        sessionStorage.setItem('wake_cake_checkout_discount', discountAmount.toFixed(2));
        sessionStorage.setItem('wake_cake_checkout_coupon', appliedCouponCode);

        bindCartRowActions();
    } catch (error) {
        window.showToast(error.message, 'error');
    }
}

function bindCartRowActions() {
    const tableBody = document.getElementById('cart-table-body');
    if (!tableBody) return;

    tableBody.querySelectorAll('.change-qty-action').forEach(button => {
        button.addEventListener('click', async (event) => {
            const id = event.currentTarget.getAttribute('data-id');
            const action = event.currentTarget.getAttribute('data-action');
            const currentQuantity = Number(event.currentTarget.getAttribute('data-quantity'));
            const nextQuantity = action === 'plus' ? currentQuantity + 1 : currentQuantity - 1;

            try {
                if (nextQuantity <= 0) {
                    await window.wakeCakeAPI.removeCartItem(id);
                } else {
                    await window.wakeCakeAPI.updateCart(id, nextQuantity);
                }
                await window.updateCartCountBadge();
                await renderCartItems();
            } catch (error) {
                window.showToast(error.message, 'error');
            }
        });
    });

    tableBody.querySelectorAll('.remove-item-action').forEach(button => {
        button.addEventListener('click', async (event) => {
            const id = event.currentTarget.getAttribute('data-id');

            try {
                await window.wakeCakeAPI.removeCartItem(id);
                await window.updateCartCountBadge();
                await renderCartItems();
                window.showToast('Item removed from cart.', 'success');
            } catch (error) {
                window.showToast(error.message, 'error');
            }
        });
    });
}

async function setupCheckoutPage() {
    const listContainer = document.getElementById('checkout-items-list');
    if (!listContainer) return;

    if (!requireAuth()) return;

    try {
        const cart = await window.wakeCakeAPI.getCart();
        if (cart.items.length === 0) {
            window.location.href = 'cart.html';
            return;
        }

        renderCheckoutSummary(cart.items);
        populateCheckoutUser();
        bindCheckoutForm(cart.items);
    } catch (error) {
        window.showToast(error.message, 'error');
    }
}

function renderCheckoutSummary(cartItems) {
    const listContainer = document.getElementById('checkout-items-list');
    let subtotal = 0.0;

    listContainer.innerHTML = cartItems.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
                <span>${item.name} <strong>x ${item.quantity}</strong></span>
                <span>$${itemTotal.toFixed(2)}</span>
            </div>
        `;
    }).join('');

    const discountAmt = parseFloat(sessionStorage.getItem('wake_cake_checkout_discount') || '0.00');
    const deliveryFee = subtotal > 50 ? 0.00 : deliveryFeeDefault;
    const total = (subtotal - discountAmt) + deliveryFee;

    document.getElementById('checkout-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('checkout-discount').textContent = `-$${discountAmt.toFixed(2)}`;
    document.getElementById('checkout-delivery').textContent = deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`;
    document.getElementById('checkout-total').textContent = `$${total.toFixed(2)}`;
}

function populateCheckoutUser() {
    const currentUser = window.wakeCakeAPI.getStoredUser();
    if (!currentUser) return;

    document.getElementById('c-name').value = currentUser.name || '';
    document.getElementById('c-email').value = currentUser.email || '';
}

function bindCheckoutForm(cartItems) {
    const checkoutForm = document.getElementById('checkout-form');
    if (!checkoutForm) return;

    checkoutForm.onsubmit = async (event) => {
        event.preventDefault();

        const name = document.getElementById('c-name').value.trim();
        const email = document.getElementById('c-email').value.trim();
        const phone = document.getElementById('c-phone').value.trim();
        const address = document.getElementById('c-address').value.trim();
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

        if (!name || !email || !phone || !address) {
            window.showToast('Please fill out all checkout fields.', 'error');
            return;
        }

        try {
            const order = await window.wakeCakeAPI.createOrder({
                deliveryAddress: `${name}\n${phone}\n${email}\n${address}`,
                notes: `Checkout submitted from Wake Cake storefront. Coupon: ${sessionStorage.getItem('wake_cake_checkout_coupon') || 'None'}.`,
                paymentMethod
            });

            await window.updateCartCountBadge();
            sessionStorage.removeItem('wake_cake_checkout_discount');
            sessionStorage.removeItem('wake_cake_checkout_coupon');
            renderCheckoutSuccess({
                ...order,
                customerName: name,
                customerEmail: email,
                customerPhone: phone,
                address,
                paymentMethod,
                total: Number(order.total_amount || cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0))
            });
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    };
}

function renderCheckoutSuccess(order) {
    const container = document.getElementById('checkout-page-container');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align: center; padding: 80px 24px; background-color: var(--color-white); border: 1px solid var(--color-sand-border); border-radius: var(--border-radius-md); max-width: 650px; margin: 40px auto; box-shadow: var(--shadow-md);">
            <div style="font-size: 64px; margin-bottom: 24px;">&#127856;</div>
            <h1 style="font-family: var(--font-heading); font-size: 36px; margin-bottom: 16px; color: var(--color-primary-chocolate);">Order Placed Successfully!</h1>
            <p style="font-size: 16px; color: var(--color-text-muted); margin-bottom: 30px;">
                Thank you for your order. Your order reference is <strong>${order.order_number || order.id}</strong>. We have started preparing your freshly baked happiness!
            </p>
            <div style="background-color: var(--color-bg-cream); border: 1px solid var(--color-sand-border); padding: 24px; border-radius: var(--border-radius-sm); text-align: left; margin-bottom: 36px; font-size: 14px;">
                <h3 style="font-family: var(--font-heading); font-size: 18px; margin-bottom: 12px; color: var(--color-primary-chocolate);">Delivery Information</h3>
                <p style="margin-bottom: 6px;"><strong>Deliver To:</strong> ${order.customerName}</p>
                <p style="margin-bottom: 6px;"><strong>Contact Email:</strong> ${order.customerEmail}</p>
                <p style="margin-bottom: 6px;"><strong>Contact Phone:</strong> ${order.customerPhone}</p>
                <p style="margin-bottom: 6px;"><strong>Shipping Address:</strong> ${order.address}</p>
                <p style="margin-bottom: 6px;"><strong>Payment Mode:</strong> ${order.paymentMethod}</p>
                <p style="margin-bottom: 6px; font-size: 16px; margin-top: 12px; border-top: 1px solid var(--color-sand-border); padding-top: 12px;"><strong>Total Paid:</strong> $${order.total.toFixed(2)}</p>
            </div>
            <div style="display: flex; gap: 16px; justify-content: center;">
                <a href="products.html" class="btn btn-primary">Browse More Cakes</a>
                <a href="index.html" class="btn btn-secondary">Go to Home</a>
            </div>
        </div>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
