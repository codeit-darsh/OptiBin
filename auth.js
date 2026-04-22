/**
 * auth.js – Role & session management (localStorage-based)
 * Roles: 'admin' | 'driver' | 'citizen'
 */
const Auth = (() => {
  const KEY_ROLE = 'optibin_role';
  const KEY_DRIVER = 'optibin_driver_id';
  const KEY_NAME = 'optibin_user_name';

  function setRole(role, extra = {}) {
    localStorage.setItem(KEY_ROLE, role);
    if (extra.driverId) localStorage.setItem(KEY_DRIVER, extra.driverId);
    if (extra.name) localStorage.setItem(KEY_NAME, extra.name);
  }

  function getRole() { return localStorage.getItem(KEY_ROLE); }
  function getDriverId() { return localStorage.getItem(KEY_DRIVER); }
  function getName() { return localStorage.getItem(KEY_NAME) || 'User'; }

  function logout() {
    localStorage.removeItem(KEY_ROLE);
    localStorage.removeItem(KEY_DRIVER);
    localStorage.removeItem(KEY_NAME);
    window.location.href = 'login.html';
  }

  /**
   * Guard a page — redirect to login if wrong role.
   * Call at top of each portal's script.
   */
  function requireRole(expected) {
    const role = getRole();
    if (!role) { window.location.href = 'login.html'; return false; }
    if (expected && role !== expected) {
      const map = { admin: 'index.html', driver: 'driver.html', citizen: 'citizen.html' };
      window.location.href = map[role] || 'login.html';
      return false;
    }
    return true;
  }

  function isLoggedIn() { return !!getRole(); }

  return { setRole, getRole, getDriverId, getName, logout, requireRole, isLoggedIn };
})();
