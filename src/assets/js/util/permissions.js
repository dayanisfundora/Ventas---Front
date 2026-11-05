import { useAuthStore } from 'src/stores/auth-store';

/**
 * Check if current user has a specific permission.
 *
 * @param {string} permission - Permission name to check
 * @returns {boolean} True if user has permission
 */
export function hasPermission(permission) {
  const authStore = useAuthStore();
  return authStore.hasPermission(permission);
}

/**
 * Check if current user has any of the specified permissions.
 *
 * @param {Array<string>} permissions - Array of permission names
 * @returns {boolean} True if user has at least one permission
 */
export function hasAnyPermission(permissions) {
  const authStore = useAuthStore();
  return authStore.hasAnyPermission(permissions);
}

/**
 * Check if current user has all specified permissions.
 *
 * @param {Array<string>} permissions - Array of permission names
 * @returns {boolean} True if user has all permissions
 */
export function hasAllPermissions(permissions) {
  const authStore = useAuthStore();
  return authStore.hasAllPermissions(permissions);
}

/**
 * Check if current user has a specific role.
 *
 * @param {string} role - Role name to check
 * @returns {boolean} True if user has role
 */
export function hasRole(role) {
  const authStore = useAuthStore();
  return authStore.hasRole(role);
}

/**
 * Check if current user has any of the specified roles.
 *
 * @param {Array<string>} roles - Array of role names
 * @returns {boolean} True if user has at least one role
 */
export function hasAnyRole(roles) {
  const authStore = useAuthStore();
  return authStore.hasAnyRole(roles);
}

/**
 * Filter items based on user permissions.
 *
 * @param {Array<Object>} items - Array of items with permission property
 * @param {string} permissionKey - Key to extract permission from items
 * @returns {Array<Object>} Filtered items user has access to
 */
export function filterByPermission(items, permissionKey = 'permission') {
  const authStore = useAuthStore();

  return items.filter(item => {
    if (item[permissionKey]) {
      return authStore.hasPermission(item[permissionKey]);
    }
    return true;
  });
}
