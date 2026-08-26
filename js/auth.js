// Spicello - User Authentication & Session Management
// Spicello - User Authentication & Session Management

const AUTH_STORAGE_KEY = 'spicello_user';

function getUser() {
    try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        console.error('Failed to parse user session:', e);
        return null;
    }
}

function setUser(user) {
    try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        updateNavbarAuth();
    } catch (e) {
        console.error('Failed to save user session:', e);
    }
}

function logoutUser() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    updateNavbarAuth();
    if (typeof showToast === 'function') {
        showToast('Logged Out', 'You have been successfully logged out.', 'info');
    } else {
        alert('You have logged out.');
    }
    // Refresh page if on checkout or login page
    if (window.location.pathname.includes('login.html')) {
        window.location.reload();
    }
}

function updateNavbarAuth() {
    const user = getUser();
    const navAuthContainers = document.querySelectorAll('.nav-auth-btn');

    navAuthContainers.forEach(container => {
        if (user) {
            container.innerHTML = `
                <div class="dropdown d-inline-block">
                    <button class="btn btn-success text-white rounded-circle p-2 d-inline-flex align-items-center justify-content-center" 
                        type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false" 
                        style="width: 40px; height: 40px;" title="${user.name}">
                        <i class="bi bi-person-fill fs-5"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="userDropdown">
                        <li><span class="dropdown-item-text fw-bold text-success">${user.name}</span></li>
                        <li><span class="dropdown-item-text text-muted small">${user.email}</span></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="user.html"><i class="bi bi-speedometer2 text-success me-2"></i>My Dashboard</a></li>
                        <li><a class="dropdown-item" href="track.html"><i class="bi bi-geo-alt text-success me-2"></i>Track Order</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="logoutUser(); return false;"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                    </ul>
                </div>
            `;
        } else {
            container.innerHTML = `
                <a href="login.html"
                    class="btn btn-success text-white rounded-circle p-2 d-inline-flex align-items-center justify-content-center"
                    style="width: 40px; height: 40px;" title="Login / Sign Up">
                    <i class="bi bi-person-fill fs-5"></i>
                </a>
            `;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateNavbarAuth();
});
