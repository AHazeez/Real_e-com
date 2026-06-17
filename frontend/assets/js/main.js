// Wake Cake - Customer Front-end Utility Module

document.addEventListener('DOMContentLoaded', () => {
    // 1. Navbar Hamburger Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            // Animate hamburger lines
            const spans = hamburger.querySelectorAll('span');
            spans[0].style.transform = navMenu.classList.contains('active') ? 'rotate(45deg) translate(6px, 6px)' : 'none';
            spans[1].style.opacity = navMenu.classList.contains('active') ? '0' : '1';
            spans[2].style.transform = navMenu.classList.contains('active') ? 'rotate(-45deg) translate(5px, -5px)' : 'none';
        });
    }

    // 2. Active Page Highlighting
    highlightActivePage();

    // 3. Sync and Display Cart Item Counts
    updateCartCountBadge();

    // 4. Toast Notifications Setup
    initToastNotifications();

    // 5. Auth Navigation Changes
    setupAuthNavbar();
});

// Update the Cart count badge in the header
async function updateCartCountBadge() {
    const badge = document.querySelector('.cart-count');
    if (badge && window.wakeCakeAPI) {
        if (!window.wakeCakeAPI.getAuthToken()) {
            badge.textContent = '0';
            badge.style.display = 'none';
            return;
        }

        try {
            const cart = await window.wakeCakeAPI.getCart();
            const totalQty = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            badge.textContent = totalQty;
            badge.style.display = totalQty > 0 ? 'flex' : 'none';
        } catch (error) {
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }
}

// Highlight current menu link based on file path
function highlightActivePage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === page || (page === 'index.html' && href === './') || (href === 'products.html' && page === 'product-details.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Toast Notification Engine
function initToastNotifications() {
    // Create container if not exists
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
}

function showToast(message, type = 'success', duration = 3000) {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '🎂'; // default
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Remove toast after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

// Update authentication nodes in header
function setupAuthNavbar() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions || !window.wakeCakeAPI) return;

    const currentUser = window.wakeCakeAPI.getStoredUser();
    
    // Select or create auth container
    let authContainer = document.querySelector('.nav-auth-container');
    if (!authContainer) {
        authContainer = document.createElement('div');
        authContainer.className = 'nav-auth-container';
        authContainer.style.display = 'flex';
        authContainer.style.alignItems = 'center';
        authContainer.style.gap = '15px';
        navActions.insertBefore(authContainer, navActions.firstChild);
    }

    if (currentUser) {
        const dashboardLink = currentUser.role === 'Admin' ? 
            `<a href="admin/dashboard.html" class="btn btn-secondary" style="padding: 6px 14px; font-size: 13px;">Admin Panel</a>` : 
            `<span style="font-size: 13px; font-weight: 500;">Hi, ${currentUser.name}</span>`;


        authContainer.innerHTML = `
            ${dashboardLink}
            <button id="logoutBtn" class="btn-text" style="font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: none;">Logout</button>
        `;

        document.getElementById('logoutBtn').addEventListener('click', () => {
            window.wakeCakeAPI.logoutUser();
            showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    } else {
        authContainer.innerHTML = `
            <a href="login.html" class="nav-link" style="font-size: 14px; font-weight: 600;">Login</a>
            <a href="register.html" class="btn btn-primary" style="padding: 8px 16px; font-size: 13px;">Sign Up</a>
        `;
    }
}

// Make globally accessible
window.showToast = showToast;
window.updateCartCountBadge = updateCartCountBadge;
