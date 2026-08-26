// Spicello - E-Commerce Shopping Cart & Checkout Logic

const CART_STORAGE_KEY = 'spicello_cart';
const COUPON_STORAGE_KEY = 'spicello_applied_coupon';

// Utility to fetch cart from localStorage
function getCart() {
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Failed to load cart from localStorage:', e);
        return [];
    }
}

// Utility to save cart to localStorage and refresh UI
function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error('Failed to save cart to localStorage:', e);
    }
    renderCart();
}

// Fetch applied coupon
function getAppliedCoupon() {
    try {
        const stored = localStorage.getItem(COUPON_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
}

// Save applied coupon
function setAppliedCoupon(coupon) {
    if (coupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
    } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
    }
    renderCart();
}

// Helper to check if logged-in user has already placed any orders
function hasUserPlacedOrders() {
    if (typeof getUser !== 'function') return false;
    const user = getUser();
    if (!user) return false;

    const userEmailKey = user.email.toLowerCase();

    // 1. Check user-specific history key
    const userHistoryKey = `spicello_order_history_${userEmailKey}`;
    const storedUserOrders = localStorage.getItem(userHistoryKey);
    if (storedUserOrders) {
        try {
            const userOrders = JSON.parse(storedUserOrders);
            if (userOrders.length > 0) return true;
        } catch (e) {
            console.error(e);
        }
    }

    // 2. Check global history key as fallback
    const globalOrdersRaw = localStorage.getItem('spicello_order_history');
    if (globalOrdersRaw) {
        try {
            const globalOrders = JSON.parse(globalOrdersRaw);
            const userOrders = globalOrders.filter(o => 
                (o.userEmail && o.userEmail === userEmailKey) || 
                (o.email && o.email.toLowerCase() === userEmailKey)
            );
            if (userOrders.length > 0) return true;
        } catch (e) {
            console.error(e);
        }
    }

    return false;
}

// Calculate totals (Subtotal, Discount, Shipping, Total)
function getCartTotals() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let coupon = getAppliedCoupon();
    
    // Validate first-order restriction for SPICE10
    if (coupon && coupon.code === 'SPICE10' && hasUserPlacedOrders()) {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('spicello_applied_coupon');
        }
        coupon = null;
    }
    
    let discount = 0;
    if (coupon && coupon.code === 'SPICE10') {
        discount = subtotal * 0.10; // 10% discount
    }

    // Free shipping over Rs 200, otherwise Rs 30
    const shipping = (subtotal > 0 && subtotal < 200) ? 30.00 : 0.00;
    const grandTotal = Math.max(0, subtotal - discount + shipping);

    return {
        subtotal,
        discount,
        shipping,
        grandTotal,
        coupon
    };
}

// Add item to cart
function addToCart(product, qtyToAdd = 1) {
    let cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === product.id);
    const count = parseInt(qtyToAdd) || 1;

    if (existingIndex > -1) {
        cart[existingIndex].quantity += count;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            weight: product.weight || '100gm',
            price: parseFloat(product.price),
            image: product.image,
            quantity: count
        });
    }

    saveCart(cart);
    showToast(`Added to Cart`, `${count}x ${product.name} added to your shopping bag.`);
}

// Change quantity (+1 / -1)
function updateQuantity(productId, delta) {
    let cart = getCart();
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(item => item.id !== productId);
            showToast('Item Removed', `${item.name} removed from your cart.`, 'warning');
        }
        saveCart(cart);
    }
}

// Remove item completely
function removeFromCart(productId) {
    let cart = getCart();
    const item = cart.find(item => item.id === productId);
    if (item) {
        cart = cart.filter(item => item.id !== productId);
        saveCart(cart);
        showToast('Item Removed', `${item.name} removed from your cart.`, 'warning');
    }
}

// Clear all items from cart
function clearCart() {
    saveCart([]);
    setAppliedCoupon(null);
    showToast('Cart Cleared', 'All items have been removed from your cart.', 'info');
}

// Apply promo code
function applyCouponCode(codeStr) {
    const code = (codeStr || '').trim().toUpperCase();
    if (!code) {
        showToast('Coupon Error', 'Please enter a valid promo code.', 'warning');
        return;
    }

    if (code === 'SPICE10') {
        if (hasUserPlacedOrders()) {
            showToast('Coupon Invalid', 'The promo code SPICE10 is only valid for your first order.', 'warning');
            return;
        }
        setAppliedCoupon({ code: 'SPICE10', discountPercent: 10 });
        showToast('Coupon Applied!', '10% discount has been applied to your order.');
    } else {
        showToast('Invalid Coupon', 'Code not recognized. Use "SPICE10" for 10% off.', 'warning');
    }
}

// Remove promo code
function removeCouponCode() {
    setAppliedCoupon(null);
    showToast('Coupon Removed', 'Promo code removed from your order.', 'info');
}

// Render Cart UI across Offcanvas drawer, cart.html page, and checkout.html page
function renderCart() {
    const cart = getCart();
    const totals = getCartTotals();
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // 1. Update Badge across all pages
    const badge = document.getElementById('cart-count-badge');
    if (badge) {
        badge.textContent = totalCount;
        if (totalCount > 0) {
            badge.classList.remove('d-none');
        } else {
            badge.classList.add('d-none');
        }
    }

    // 2. Offcanvas Cart Drawer (if present)
    const cartItemsContainer = document.getElementById('cart-items-list');
    const emptyState = document.getElementById('cart-empty-state');
    const cartFooter = document.getElementById('cart-footer');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartGrandTotalEl = document.getElementById('cart-grand-total');

    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '';
            if (emptyState) emptyState.classList.remove('d-none');
            if (cartFooter) cartFooter.classList.add('d-none');
        } else {
            if (emptyState) emptyState.classList.add('d-none');
            if (cartFooter) cartFooter.classList.remove('d-none');

            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item d-flex align-items-center justify-content-between p-3 mb-2 rounded shadow-sm border bg-white">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img rounded" style="width: 60px; height: 60px; object-fit: cover;">
                    <div class="cart-item-details flex-grow-1 ms-3">
                        <h6 class="mb-0 fw-bold text-dark">${item.name}</h6>
                        <small class="text-muted d-block">${item.weight} • Rs. ${item.price.toFixed(2)}</small>
                        <div class="d-flex align-items-center mt-2">
                            <button class="btn btn-sm btn-outline-secondary px-2 py-0" onclick="updateQuantity('${item.id}', -1)" aria-label="Decrease quantity">-</button>
                            <span class="mx-2 fw-semibold fs-6" aria-label="Quantity">${item.quantity}</span>
                            <button class="btn btn-sm btn-outline-secondary px-2 py-0" onclick="updateQuantity('${item.id}', 1)" aria-label="Increase quantity">+</button>
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="fw-bold text-success d-block mb-2">Rs. ${(item.price * item.quantity).toFixed(2)}</span>
                        <button class="btn btn-sm btn-link text-danger p-0 border-0" onclick="removeFromCart('${item.id}')" title="Remove Item">
                            <i class="bi bi-trash fs-5"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            if (cartSubtotalEl) cartSubtotalEl.textContent = `Rs. ${totals.subtotal.toFixed(2)}`;
            if (cartGrandTotalEl) cartGrandTotalEl.textContent = `Rs. ${totals.grandTotal.toFixed(2)}`;
        }
    }

    // 3. Full Cart Page (cart.html)
    const fullCartContainer = document.getElementById('full-cart-items');
    const fullCartEmpty = document.getElementById('full-cart-empty');
    const fullCartSummary = document.getElementById('full-cart-summary');

    if (fullCartContainer) {
        if (cart.length === 0) {
            fullCartContainer.innerHTML = '';
            if (fullCartEmpty) fullCartEmpty.classList.remove('d-none');
            if (fullCartSummary) fullCartSummary.classList.add('d-none');
        } else {
            if (fullCartEmpty) fullCartEmpty.classList.add('d-none');
            if (fullCartSummary) fullCartSummary.classList.remove('d-none');

            fullCartContainer.innerHTML = cart.map(item => `
                <div class="card mb-3 border-0 shadow-sm rounded-4 overflow-hidden">
                    <div class="card-body p-3 p-md-4">
                        <div class="row align-items-center">
                            <div class="col-3 col-md-2 text-center">
                                <img src="${item.image}" alt="${item.name}" class="img-fluid rounded-3" style="max-height: 80px; object-fit: cover;">
                            </div>
                            <div class="col-9 col-md-4 mb-2 mb-md-0">
                                <h5 class="fw-bold mb-1">${item.name}</h5>
                                <span class="badge bg-light text-dark border me-2">${item.weight}</span>
                                <span class="text-success fw-semibold">Rs. ${item.price.toFixed(2)} per unit</span>
                            </div>
                            <div class="col-6 col-md-3">
                                <div class="input-group input-group-sm w-75 mx-auto mx-md-0">
                                    <button class="btn btn-outline-secondary" type="button" onclick="updateQuantity('${item.id}', -1)" aria-label="Decrease quantity">-</button>
                                    <input type="text" class="form-control text-center bg-white fw-bold" value="${item.quantity}" readonly aria-label="Quantity">
                                    <button class="btn btn-outline-secondary" type="button" onclick="updateQuantity('${item.id}', 1)" aria-label="Increase quantity">+</button>
                                </div>
                            </div>
                            <div class="col-6 col-md-3 text-end">
                                <h5 class="fw-bold text-success mb-1">Rs. ${(item.price * item.quantity).toFixed(2)}</h5>
                                <button class="btn btn-sm btn-outline-danger border-0 p-0" onclick="removeFromCart('${item.id}')">
                                    <i class="bi bi-trash me-1"></i> Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

            // Summary figures on cart.html
            const elSubtotal = document.getElementById('summary-subtotal');
            const elDiscountRow = document.getElementById('summary-discount-row');
            const elDiscount = document.getElementById('summary-discount');
            const elShipping = document.getElementById('summary-shipping');
            const elTotal = document.getElementById('summary-total');
            const couponInput = document.getElementById('coupon-input');
            const couponAppliedBadge = document.getElementById('coupon-applied-badge');

            if (elSubtotal) elSubtotal.textContent = `Rs. ${totals.subtotal.toFixed(2)}`;
            
            if (totals.discount > 0) {
                if (elDiscountRow) elDiscountRow.classList.remove('d-none');
                if (elDiscount) elDiscount.textContent = `- Rs. ${totals.discount.toFixed(2)}`;
                if (couponAppliedBadge) {
                    couponAppliedBadge.classList.remove('d-none');
                    couponAppliedBadge.innerHTML = `<i class="bi bi-tag-fill me-1"></i>SPICE10 (10% Off) <button type="button" class="btn-close btn-close-white ms-2" style="font-size:0.65rem;" onclick="removeCouponCode()"></button>`;
                }
            } else {
                if (elDiscountRow) elDiscountRow.classList.add('d-none');
                if (couponAppliedBadge) couponAppliedBadge.classList.add('d-none');
            }

            if (elShipping) {
                elShipping.textContent = totals.shipping === 0 ? 'FREE' : `Rs. ${totals.shipping.toFixed(2)}`;
                elShipping.className = totals.shipping === 0 ? 'fw-bold text-success' : 'fw-semibold';
            }

            if (elTotal) elTotal.textContent = `Rs. ${totals.grandTotal.toFixed(2)}`;
        }
    }

    // 4. Checkout Page Summary (checkout.html)
    const checkoutItemsContainer = document.getElementById('checkout-items-list');
    if (checkoutItemsContainer) {
        if (cart.length === 0) {
            checkoutItemsContainer.innerHTML = '<p class="text-muted">No items in your cart. <a href="index.html">Shop Spices</a></p>';
        } else {
            checkoutItemsContainer.innerHTML = cart.map(item => `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="d-flex align-items-center">
                        <img src="${item.image}" alt="${item.name}" class="rounded me-3" style="width: 45px; height: 45px; object-fit: cover;">
                        <div>
                            <h6 class="mb-0 fw-semibold">${item.name}</h6>
                            <small class="text-muted">Qty: ${item.quantity} • ${item.weight}</small>
                        </div>
                    </div>
                    <span class="fw-semibold text-dark">Rs. ${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('');

            const chkSubtotal = document.getElementById('checkout-subtotal');
            const chkDiscountRow = document.getElementById('checkout-discount-row');
            const chkDiscount = document.getElementById('checkout-discount');
            const chkShipping = document.getElementById('checkout-shipping');
            const chkTotal = document.getElementById('checkout-total');
            const chkCouponAppliedBadge = document.getElementById('checkout-coupon-applied-badge');
            const chkCouponInput = document.getElementById('checkout-coupon-input');

            if (chkSubtotal) chkSubtotal.textContent = `Rs. ${totals.subtotal.toFixed(2)}`;
            if (totals.discount > 0) {
                if (chkDiscountRow) chkDiscountRow.classList.remove('d-none');
                if (chkDiscount) chkDiscount.textContent = `- Rs. ${totals.discount.toFixed(2)}`;
                if (chkCouponAppliedBadge) {
                    chkCouponAppliedBadge.classList.remove('d-none');
                    chkCouponAppliedBadge.innerHTML = `<i class="bi bi-tag-fill me-1"></i>SPICE10 (10% Off) <button type="button" class="btn-close btn-close-white ms-2" style="font-size:0.65rem;" onclick="removeCouponCode()"></button>`;
                }
                if (chkCouponInput) {
                    chkCouponInput.value = 'SPICE10';
                }
            } else {
                if (chkDiscountRow) chkDiscountRow.classList.add('d-none');
                if (chkCouponAppliedBadge) chkCouponAppliedBadge.classList.add('d-none');
                if (chkCouponInput) {
                    chkCouponInput.value = '';
                }
            }

            if (chkShipping) {
                chkShipping.textContent = totals.shipping === 0 ? 'FREE' : `Rs. ${totals.shipping.toFixed(2)}`;
            }

            if (chkTotal) chkTotal.textContent = `Rs. ${totals.grandTotal.toFixed(2)}`;
        }
    }
}

// Toast Notification
function showToast(title, message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toastId = 'toast-' + Date.now();
    const bgHeaderClass = type === 'warning' ? 'bg-warning text-dark' : (type === 'info' ? 'bg-info text-white' : 'bg-success text-white');

    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center show shadow-lg border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgHeaderClass}">
                <i class="bi ${type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2"></i>
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close ${type !== 'warning' ? 'btn-close-white' : ''}" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body bg-white text-dark">
                ${message}
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);

    setTimeout(() => {
        const toastEl = document.getElementById(toastId);
        if (toastEl) {
            toastEl.classList.remove('show');
            setTimeout(() => toastEl.remove(), 300);
        }
    }, 3000);
}

// Redirect to Checkout Page
function proceedToCheckoutPage() {
    const cart = getCart();
    if (cart.length === 0) {
        showToast('Cart Empty', 'Add some products to your cart before checking out.', 'warning');
        return;
    }
    
    // Check if user is logged in
    if (typeof getUser === 'function' && !getUser()) {
        showToast('Login Required', 'Please login to proceed to checkout.', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=checkout.html';
        }, 1000);
        return;
    }
    
    window.location.href = 'checkout.html';
}

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initial Render
    renderCart();

    // Attach click handlers to all "Add To Cart" buttons
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            const price = btn.getAttribute('data-price');
            const weight = btn.getAttribute('data-weight') || '100gm';
            const image = btn.getAttribute('data-image');

            if (id && name && price) {
                addToCart({ id, name, price, weight, image });
            }
        });
    });

    // Make Navbar Bag icon open Offcanvas or go to cart page
    const bagIcon = document.getElementById('bag');
    if (bagIcon) {
        bagIcon.style.cursor = 'pointer';
        bagIcon.setAttribute('data-bs-toggle', 'offcanvas');
        bagIcon.setAttribute('data-bs-target', '#cartOffcanvas');
        bagIcon.setAttribute('aria-controls', 'cartOffcanvas');
    }

    // Dynamic Sticky Sidebar Offset Based on Navbar Height
    const navbar = document.querySelector('.navbar');
    const stickySidebars = document.querySelectorAll('.sticky-top:not(.navbar)');
    
    if (navbar && stickySidebars.length > 0) {
        const updateStickyOffset = () => {
            const navbarHeight = navbar.offsetHeight;
            stickySidebars.forEach(sidebar => {
                sidebar.style.top = `${navbarHeight + 20}px`;
            });
        };
        
        // Run initially
        updateStickyOffset();
        
        // Run on window resize to ensure responsiveness
        window.addEventListener('resize', updateStickyOffset);
    }
});
