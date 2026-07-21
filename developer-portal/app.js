// Developer Portal Master Application Logic
const getBackendUrl = () => {
  if (window.location.port === '5000' && window.location.hostname === 'localhost') {
    return '';
  }
  return 'http://localhost:5000';
};

const API_BASE = `${getBackendUrl()}/api/v1/super-admin`;
let developerKey = sessionStorage.getItem('developer_access_key') || '';

// Application State
let currentTab = 'tab-analytics';
let onboardingFilter = 'pending';
let userRoleFilter = '';
let userSearchQuery = '';

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  initAuthModal();
  initTabs();
  initOnboardingFilters();
  initUserFilters();
  initBroadcastComposer();
  initLockPortal();
  initAnalyticsRefreshBtn();

  // Check stored developer key
  if (developerKey) {
    verifyAndUnlockPortal(developerKey, true);
  } else {
    showAuthModal();
  }
});

/* ==========================================================================
   DEVELOPER AUTHENTICATION & PORTAL LOCK
   ========================================================================== */
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-super-admin-key': developerKey || 'Sonukumarray@93418',
  };
}

function initAuthModal() {
  const loginForm = document.getElementById('developer-login-form');
  const errorMsg = document.getElementById('auth-error-msg');
  const toggleBtn = document.getElementById('toggle-password-btn');
  const passwordInput = document.getElementById('dev-secret-key');
  const passwordIcon = document.getElementById('toggle-password-icon');

  // Password Visibility Toggle Feature
  if (toggleBtn && passwordInput && passwordIcon) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      passwordIcon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inputKey = passwordInput.value.trim();
    if (!inputKey) return;

    errorMsg.classList.remove('visible');
    const result = await verifyAndUnlockPortal(inputKey, false);
    if (!result.success) {
      errorMsg.textContent = result.error || 'Invalid Developer Secret Key. Please try again.';
      errorMsg.classList.add('visible');
    }
  });
}

async function verifyAndUnlockPortal(key, isSilent = false) {
  try {
    const res = await fetch(`${API_BASE}/analytics`, {
      headers: {
        'Content-Type': 'application/json',
        'x-super-admin-key': key,
      },
    });

    if (res.status === 200) {
      developerKey = key;
      sessionStorage.setItem('developer_access_key', key);
      hideAuthModal();
      document.getElementById('main-portal-container').style.display = 'block';

      // Load initial portal data once
      loadAnalytics();
      loadOnboardingRequests();
      loadUsers();

      return { success: true };
    } else {
      if (!isSilent) {
        sessionStorage.removeItem('developer_access_key');
        developerKey = '';
        showAuthModal();
      }

      let msg = 'Invalid Developer Secret Key. Please try again.';
      if (res.status !== 401) {
        msg = `Server returned error (${res.status}). Please check backend.`;
      }
      return { success: false, error: msg };
    }
  } catch (err) {
    if (!isSilent) {
      sessionStorage.removeItem('developer_access_key');
      developerKey = '';
      showAuthModal();
    }

    return {
      success: false,
      error: 'Cannot connect to backend server at http://localhost:5000. Ensure backend is running.',
    };
  }
}

function showAuthModal() {
  document.getElementById('developer-auth-modal').style.display = 'flex';
  document.getElementById('main-portal-container').style.display = 'none';
}

function hideAuthModal() {
  document.getElementById('developer-auth-modal').style.display = 'none';
}

function initLockPortal() {
  document.getElementById('btn-lock-portal').addEventListener('click', () => {
    sessionStorage.removeItem('developer_access_key');
    developerKey = '';
    showAuthModal();
    showToast('Developer Portal Locked', 'info');
  });
}

function initAnalyticsRefreshBtn() {
  const refreshBtn = document.getElementById('btn-refresh-analytics');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadAnalytics();
      showToast('Refreshed platform analytics data', 'success');
    });
  }
}

/* ==========================================================================
   NAVIGATION & TABS
   ========================================================================== */
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      const targetTabId = tab.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach((sec) => {
        sec.classList.remove('active');
      });
      document.getElementById(targetTabId).classList.add('active');
      currentTab = targetTabId;

      if (targetTabId === 'tab-analytics') loadAnalytics();
      if (targetTabId === 'tab-onboarding') loadOnboardingRequests();
      if (targetTabId === 'tab-users') loadUsers();
    });
  });
}

/* ==========================================================================
   1. TELEMETRY & ANALYTICS
   ========================================================================== */
async function loadAnalytics() {
  if (!developerKey) return;
  try {
    const res = await fetch(`${API_BASE}/analytics`, { headers: getHeaders() });
    const json = await res.json();

    if (json.success && json.data) {
      const d = json.data;
      document.getElementById('stat-societies').textContent = d.totalSocieties || 0;
      document.getElementById('stat-admins').textContent = d.totalAdmins || 0;
      document.getElementById('stat-guards').textContent = d.totalGuards || 0;
      document.getElementById('stat-residents').textContent = d.totalResidents || 0;
      
      const pendingElem = document.getElementById('stat-pending');
      pendingElem.textContent = d.pendingOnboarding || 0;
      document.getElementById('onboarding-badge').textContent = d.pendingOnboarding || 0;

      // Format Uptime
      const uptimeSec = Math.floor(d.systemUptime || 0);
      const hours = Math.floor(uptimeSec / 3600);
      const mins = Math.floor((uptimeSec % 3600) / 60);
      document.getElementById('stat-uptime').textContent = `${hours}h ${mins}m`;
    }
  } catch (err) {
    console.error('Failed to load telemetry analytics:', err);
  }
}

/* ==========================================================================
   2. SOCIETY ONBOARDING APPLICATIONS
   ========================================================================== */
function initOnboardingFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      onboardingFilter = btn.getAttribute('data-filter');
      loadOnboardingRequests();
    });
  });

  document.getElementById('btn-refresh-onboarding').addEventListener('click', () => {
    loadOnboardingRequests();
    showToast('Refreshed onboarding applications list', 'success');
  });
}

async function loadOnboardingRequests() {
  if (!developerKey) return;
  const container = document.getElementById('onboarding-cards-container');
  container.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</div>';

  try {
    const url = onboardingFilter
      ? `${API_BASE}/onboarding-requests?status=${onboardingFilter}`
      : `${API_BASE}/onboarding-requests`;

    const res = await fetch(url, { headers: getHeaders() });
    const json = await res.json();

    if (json.success && Array.isArray(json.data)) {
      renderOnboardingCards(json.data);
    } else {
      container.innerHTML = '<div class="text-muted">No onboarding applications found.</div>';
    }
  } catch (err) {
    console.error('Failed loading onboarding requests:', err);
    container.innerHTML = '<div class="text-danger">Failed to connect to super-admin API.</div>';
  }
}

function renderOnboardingCards(requests) {
  const container = document.getElementById('onboarding-cards-container');
  if (requests.length === 0) {
    container.innerHTML = '<div class="text-muted" style="grid-column: 1/-1; padding: 2rem; text-align: center;">No onboarding applications matching filter criteria.</div>';
    return;
  }

  container.innerHTML = requests
    .map((req) => {
      const isPending = req.status === 'pending';
      const badgeClass =
        req.status === 'pending'
          ? 'badge-pending'
          : req.status === 'approved'
          ? 'badge-approved'
          : 'badge-rejected';

      return `
        <div class="onboard-card glass-card glass-hover">
          <div class="onboard-header">
            <div>
              <div class="onboard-title">${escapeHtml(req.societyName)}</div>
              <div class="onboard-location"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(req.city)}, ${escapeHtml(req.state)}</div>
            </div>
            <span class="badge-status ${badgeClass}">${req.status}</span>
          </div>

          <div class="onboard-body">
            <div class="info-row">
              <span class="info-label">Admin Name:</span>
              <span class="info-val">${escapeHtml(req.adminName)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Admin Email:</span>
              <span class="info-val">${escapeHtml(req.adminEmail)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Admin Phone:</span>
              <span class="info-val">${escapeHtml(req.adminPhone)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Est. Towers / Flats:</span>
              <span class="info-val">${req.totalTowers || 0} Towers / ${req.totalFlats || 0} Flats</span>
            </div>
          </div>

          ${
            isPending
              ? `
            <div class="onboard-actions">
              <button class="btn btn-success btn-block" onclick="approveRequest('${req._id}')"><i class="fa-solid fa-check"></i> Approve Society</button>
              <button class="btn btn-danger btn-block" onclick="rejectRequest('${req._id}')"><i class="fa-solid fa-xmark"></i> Reject</button>
            </div>
          `
              : `<div class="text-muted" style="font-size: 0.8rem; text-align: right;">Processed on ${new Date(req.processedAt || req.updatedAt).toLocaleDateString()}</div>`
          }
        </div>
      `;
    })
    .join('');
}

async function approveRequest(id) {
  if (!confirm('Are you sure you want to approve this society application and auto-provision the Admin account?')) return;

  try {
    const res = await fetch(`${API_BASE}/onboarding-requests/${id}/approve`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    const json = await res.json();

    if (json.success) {
      showToast('Society Onboarding Approved & Admin Created!', 'success');
      loadOnboardingRequests();
      loadAnalytics();
    } else {
      showToast(json.message || 'Failed to approve request', 'error');
    }
  } catch (err) {
    showToast('Server connection error during approval', 'error');
  }
}

async function rejectRequest(id) {
  const reason = prompt('Enter rejection reason for prospective society admin:');
  if (reason === null) return;

  try {
    const res = await fetch(`${API_BASE}/onboarding-requests/${id}/reject`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();

    if (json.success) {
      showToast('Society application rejected', 'success');
      loadOnboardingRequests();
      loadAnalytics();
    } else {
      showToast(json.message || 'Failed to reject request', 'error');
    }
  } catch (err) {
    showToast('Server connection error', 'error');
  }
}

/* ==========================================================================
   3. CUSTOM BROADCAST DISPATCHER
   ========================================================================== */
function initBroadcastComposer() {
  const titleInput = document.getElementById('bc-title');
  const msgInput = document.getElementById('bc-message');
  const prevTitle = document.getElementById('prev-title');
  const prevMsg = document.getElementById('prev-message');

  titleInput.addEventListener('input', (e) => {
    prevTitle.textContent = e.target.value.trim() || 'Custom Title Preview';
  });

  msgInput.addEventListener('input', (e) => {
    prevMsg.textContent = e.target.value.trim() || 'Your custom system broadcast message will appear here on target devices.';
  });

  document.getElementById('broadcast-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const message = msgInput.value.trim();
    const targetRole = document.getElementById('bc-role').value;
    const priority = document.getElementById('bc-priority').value;

    if (!title || !message) return;

    try {
      const res = await fetch(`${API_BASE}/broadcast-notification`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title, message, targetRole, priority }),
      });
      const json = await res.json();

      if (json.success) {
        showToast(`Dispatched broadcast to ${json.data.dispatchedCount || 0} target devices!`, 'success');
        titleInput.value = '';
        msgInput.value = '';
        prevTitle.textContent = 'Custom Title Preview';
        prevMsg.textContent = 'Your custom system broadcast message will appear here on target devices.';
      } else {
        showToast(json.message || 'Broadcast dispatch failed', 'error');
      }
    } catch (err) {
      showToast('Failed to dispatch notification via API', 'error');
    }
  });
}

/* ==========================================================================
   4. MASTER USER DATA CONTROL
   ========================================================================== */
function initUserFilters() {
  const searchInput = document.getElementById('user-search');
  let searchDebounce = null;

  searchInput.addEventListener('input', (e) => {
    userSearchQuery = e.target.value.trim();
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      loadUsers();
    }, 350);
  });

  const roleBtns = document.querySelectorAll('.user-role-btn');
  roleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      roleBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      userRoleFilter = btn.getAttribute('data-role');
      loadUsers();
    });
  });
}

async function loadUsers() {
  if (!developerKey) return;
  const tbody = document.getElementById('user-table-body');

  try {
    let url = `${API_BASE}/users?`;
    if (userRoleFilter) url += `role=${userRoleFilter}&`;
    if (userSearchQuery) url += `q=${encodeURIComponent(userSearchQuery)}&`;

    const res = await fetch(url, { headers: getHeaders() });
    const json = await res.json();

    if (json.success && Array.isArray(json.data)) {
      renderUserTable(json.data);
    } else {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No user accounts found.</td></tr>';
    }
  } catch (err) {
    console.error('Failed loading user master list:', err);
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to fetch users across collections.</td></tr>';
  }
}

function renderUserTable(users) {
  const tbody = document.getElementById('user-table-body');
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;">No matching accounts in MongoDB collections.</td></tr>';
    return;
  }

  tbody.innerHTML = users
    .map((u) => {
      const roleBadgeClass =
        u.role === 'admin'
          ? 'role-admin'
          : u.role === 'guard'
          ? 'role-guard'
          : 'role-resident';

      const societyName = u.society?.name || 'Global Platform';
      const flatNo = u.flat?.flatNumber ? ` (Flat ${u.flat.flatNumber})` : '';

      return `
        <tr>
          <td>
            <div class="user-name-cell">
              <span class="user-name">${escapeHtml(u.name)}</span>
              <span class="user-email">${escapeHtml(u.email)}</span>
            </div>
          </td>
          <td><span class="role-badge ${roleBadgeClass}">${u.role}</span></td>
          <td>${escapeHtml(societyName)}${flatNo}</td>
          <td>${escapeHtml(u.phone || 'N/A')}</td>
          <td>
            <span class="${u.isActive ? 'text-accent' : 'text-danger'}" style="font-weight: 700;">
              <i class="fa-solid fa-circle" style="font-size: 0.5rem; vertical-align: middle;"></i> ${u.isActive ? 'Active' : 'Deactivated'}
            </span>
          </td>
          <td>
            <button class="btn ${u.isActive ? 'btn-danger' : 'btn-success'}" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="toggleUserStatus('${u._id}')">
              ${u.isActive ? '<i class="fa-solid fa-user-slash"></i> Disable' : '<i class="fa-solid fa-user-check"></i> Enable'}
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
}

async function toggleUserStatus(userId) {
  try {
    const res = await fetch(`${API_BASE}/users/${userId}/toggle-status`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    const json = await res.json();

    if (json.success) {
      showToast(json.message || 'User status updated', 'success');
      loadUsers();
      loadAnalytics();
    } else {
      showToast(json.message || 'Failed to update user status', 'error');
    }
  } catch (err) {
    showToast('Server connection error', 'error');
  }
}

/* ==========================================================================
   UTILITY & TOASTS
   ========================================================================== */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-accent' : 'fa-circle-exclamation text-danger'}"></i>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
