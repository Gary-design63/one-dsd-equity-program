/* ============================================================
   One DSD Equity Program — Azure AD Authentication
   Microsoft Authentication Library (MSAL) via CDN
   ============================================================ */
(function () {
  "use strict";

  const MSAL_CONFIG = {
    auth: {
      clientId: "73f7abd8-9de7-441c-9165-132d9dbce159",
      authority: "https://login.microsoftonline.com/d1813df1-3490-4fe6-97b9-2e4aa86dff74",
      redirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: "sessionStorage",
      storeAuthStateInCookie: false,
    },
  };

  const LOGIN_REQUEST = {
    scopes: ["openid", "profile", "email", "User.Read"],
  };

  let msalInstance = null;
  let currentAccount = null;

  /* ── Admin emails (you) ─────────────────────────────────── */
  const ADMIN_EMAILS = [
    "gary.bellows@state.mn.us",
    "garybellows@outlook.com",
    "garybellows@hotmail.com",
  ];

  function isAdmin(email) {
    if (!email) return false;
    return ADMIN_EMAILS.some(a => a.toLowerCase() === email.toLowerCase());
  }

  /* ── Init ───────────────────────────────────────────────── */
  async function initAuth() {
    // Localhost = owner machine, skip auth entirely, grant full admin access
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      currentAccount = { name: "Program Owner", username: "admin@localhost", _isLocalAdmin: true };
      window.dispatchEvent(new CustomEvent("auth:ready", { detail: { user: { name: "Program Owner", email: "admin@localhost", isAdmin: true } } }));
      return;
    }

    if (typeof msal === "undefined") {
      console.error("MSAL not loaded");
      return;
    }

    msalInstance = new msal.PublicClientApplication(MSAL_CONFIG);
    await msalInstance.initialize();

    // Handle redirect response
    try {
      const response = await msalInstance.handleRedirectPromise();
      if (response) {
        currentAccount = response.account;
      }
    } catch (e) {
      console.error("Redirect error:", e);
    }

    // Check for existing session
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      currentAccount = accounts[0];
    }

    renderAuthState();
  }

  /* ── Login ──────────────────────────────────────────────── */
  function login() {
    if (!msalInstance) return;
    msalInstance.loginRedirect(LOGIN_REQUEST);
  }

  /* ── Logout ─────────────────────────────────────────────── */
  function logout() {
    if (!msalInstance || !currentAccount) return;
    msalInstance.logoutRedirect({
      account: currentAccount,
      postLogoutRedirectUri: window.location.origin,
    });
  }

  /* ── Get current user ───────────────────────────────────── */
  function getUser() {
    if (!currentAccount) return null;
    if (currentAccount._isLocalAdmin) {
      return { name: 'Program Owner', email: 'admin@localhost', isAdmin: true };
    }
    return {
      name: currentAccount.name || currentAccount.username,
      email: currentAccount.username,
      isAdmin: isAdmin(currentAccount.username),
    };
  }

  /* ── Render auth state ──────────────────────────────────── */
  function renderAuthState() {
    const user = getUser();

    if (!user) {
      showLoginScreen();
      return;
    }

    // Inject user info into header
    renderUserBadge(user);

    // Show admin-only nav items based on role
    if (!user.isAdmin) {
      hideAdminItems();
    }

    // Fire event so app.js knows auth is ready
    window.dispatchEvent(new CustomEvent("auth:ready", { detail: { user } }));
  }

  /* ── Login screen ───────────────────────────────────────── */
  function showLoginScreen() {
    document.body.innerHTML = `
      <div class="login-screen">
        <div class="login-card">
          <div class="login-logo">
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.15"/>
              <path d="M8 16a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4h4v8H8V16z" fill="currentColor"/>
              <circle cx="20" cy="12" r="4" fill="currentColor"/>
              <rect x="18" y="18" width="8" height="4" rx="2" fill="currentColor" opacity="0.6"/>
            </svg>
          </div>
          <h1 class="login-title">One DSD Equity Program</h1>
          <p class="login-subtitle">Minnesota DHS — Disability Services Division</p>
          <button class="btn btn--primary btn--login" id="btn-login">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px">
              <path d="M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z"/>
            </svg>
            Sign in with Microsoft
          </button>
          <p class="login-note">Use your organization Microsoft account</p>
        </div>
      </div>
    `;

    document.getElementById("btn-login").addEventListener("click", login);
  }

  /* ── User badge in header ───────────────────────────────── */
  function renderUserBadge(user) {
    const headerRight = document.querySelector(".header__right");
    if (!headerRight) return;

    const existing = document.getElementById("user-badge");
    if (existing) existing.remove();

    const badge = document.createElement("div");
    badge.id = "user-badge";
    badge.className = "user-badge";
    badge.innerHTML = `
      <div class="user-badge__info">
        <span class="user-badge__name">${user.name}</span>
        <span class="user-badge__role">${user.isAdmin ? "Admin" : "Staff"}</span>
      </div>
      <button class="user-badge__logout btn btn--ghost btn--sm" id="btn-logout" title="Sign out">
        <i data-lucide="log-out" style="width:14px;height:14px"></i>
      </button>
    `;
    headerRight.appendChild(badge);
    document.getElementById("btn-logout").addEventListener("click", logout);

    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  /* ── Hide admin-only nav items for staff ────────────────── */
  function hideAdminItems() {
    const adminOnly = ["roles", "risks", "actions"];
    adminOnly.forEach(page => {
      const btn = document.querySelector(`[data-page="${page}"]`);
      if (btn) btn.closest("li").style.display = "none";
    });
  }

  /* ── Expose API ─────────────────────────────────────────── */
  window.AUTH = {
    init: initAuth,
    login,
    logout,
    getUser,
    isAdmin: () => { const u = getUser(); return u ? u.isAdmin : false; },
  };

})();
