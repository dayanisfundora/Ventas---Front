import { defineStore } from 'pinia';
import { api } from 'boot/axios';

const readJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value === null || value === 'undefined' ? fallback : JSON.parse(value) ?? fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
};

/**
 * Authentication store for managing user state and authentication.
 * Handles login, logout, and token persistence.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    is_loading: false,
    error: null,
    permissions: readJson('permissions', []),
    permissions_detailed: readJson('permissions_detailed', []),
    operador: readJson('operador', null),
    juego_datos: readJson('juego_datos', null),
    roles: readJson('roles', []),
  }),

  getters: {
    /**
     * Check if user is authenticated.
     *
     * @param {Object} state - Current state
     * @returns {boolean} True if user is authenticated
     */
    isAuthenticated: (state) => !!state.token && !!state.user,

    /**
     * Get current user.
     *
     * @param {Object} state - Current state
     * @returns {Object|null} Current user or null
     */
    currentUser: (state) => state.user,

    /**
     * Get current token.
     *
     * @param {Object} state - Current state
     * @returns {string|null} Current token or null
     */
    currentToken: (state) => state.token,

    /**
     * Get user permissions.
     *
     * @param {Object} state - Current state
     * @returns {Array<string>} Array of permission names
     */
    userPermissions: (state) => state.permissions,

    /**
     * Get user permissions detailed.
     *
     * @param {Object} state - Current state
     * @returns {Array<Object>} Array of detailed permission objects
     */
    userPermissionsDetailed: (state) => state.permissions_detailed,

    /**
     * Get operator info.
     *
     * @param {Object} state - Current state
     * @returns {Object|null} Operator info or null
     */
    currentOperador: (state) => state.operador,

    /**
     * Get juego de datos info.
     *
     * @param {Object} state - Current state
     * @returns {Object|null} Juego de datos info or null
     */
    currentJuegoDatos: (state) => state.juego_datos,

    /**
     * Get user roles.
     *
     * @param {Object} state - Current state
     * @returns {Array<string>} Array of role names
     */
    userRoles: (state) => state.roles,
  },

  actions: {
    /**
     * Login user with username and password.
     *
     * @param {string} username - Username
     * @param {string} password - User password
     * @returns {Promise<Object>} User data and token
     */
    async login(username, password) {
      this.is_loading = true;
      this.error = null;

      try {
        const response = await api.post('/login', {
          username,
          password,
        });

        this.token = response.data.access_token;
        this.user = response.data.user;

        // Ensure permissions is always an array
        const permissions = response.data.permissions || [];
        this.permissions = Array.isArray(permissions) ? permissions : [];

        const permissions_detailed = response.data.permissions_detailed || [];
        this.permissions_detailed = Array.isArray(permissions_detailed) ? permissions_detailed : [];
        const roles = response.data.roles || [];
        this.roles = Array.isArray(roles) ? roles : [];

        this.operador = response.data.operador || null;
        this.juego_datos = response.data.juego_datos || null;

        // Persist in localStorage
        localStorage.setItem('token', this.token);
        localStorage.setItem('permissions', JSON.stringify(this.permissions));
        localStorage.setItem('permissions_detailed', JSON.stringify(this.permissions_detailed));
        localStorage.setItem('roles', JSON.stringify(this.roles));
        localStorage.setItem('operador', JSON.stringify(this.operador));
        localStorage.setItem('juego_datos', JSON.stringify(this.juego_datos));

        // Set default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;

        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'No se pudo iniciar sesión';
        throw error;
      } finally {
        this.is_loading = false;
      }
    },

    /**
     * Register new user.
     *
     * @param {Object} userData - User registration data
     * @param {string} userData.name - User name
     * @param {string} userData.email - User email
     * @param {string} userData.password - User password
     * @param {string} userData.password_confirmation - Password confirmation
     * @returns {Promise<Object>} User data and token
     */
    async register(userData) {
      this.is_loading = true;
      this.error = null;

      try {
        const response = await api.post('/register', userData);

        this.token = response.data.access_token;
        this.user = response.data.user;

        // Persist token in localStorage
        localStorage.setItem('token', this.token);

        // Set default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;

        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'No se pudo registrar el usuario';
        throw error;
      } finally {
        this.is_loading = false;
      }
    },

    /**
     * Logout current user.
     *
     * @returns {Promise<void>}
     */
    async logout() {
      this.is_loading = true;

      try {
        if (this.token) {
          await api.post('/logout');
        }
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.clearAuth();
        this.is_loading = false;
      }
    },

    /**
     * Fetch current authenticated user with local application permissions.
     *
     * @returns {Promise<Object>} User data
     */
    async fetchUser() {
      if (!this.token) {
        return null;
      }

      this.is_loading = true;

      try {
        const response = await api.get('/user');
        this.user = response.data.user;

        // Ensure permissions is always an array
        const permissions = response.data.permissions || [];
        this.permissions = Array.isArray(permissions) ? permissions : [];
        const permissions_detailed = response.data.permissions_detailed || [];
        this.permissions_detailed = Array.isArray(permissions_detailed) ? permissions_detailed : [];
        const roles = response.data.roles || [];
        this.roles = Array.isArray(roles) ? roles : [];
        this.operador = response.data.operador || null;
        this.juego_datos = response.data.juego_datos || null;

        // Persist permissions
        localStorage.setItem('permissions', JSON.stringify(this.permissions));
        localStorage.setItem('permissions_detailed', JSON.stringify(this.permissions_detailed));
        localStorage.setItem('roles', JSON.stringify(this.roles));
        localStorage.setItem('operador', JSON.stringify(this.operador));
        localStorage.setItem('juego_datos', JSON.stringify(this.juego_datos));

        return this.user;
      } catch (error) {
        this.clearAuth();
        throw error;
      } finally {
        this.is_loading = false;
      }
    },

    /**
     * Fetch user permissions and roles.
     *
     * @param {number} userId - User ID
     * @returns {Promise<void>}
     * @deprecated Use permissions from login response instead
     */
    async fetchUserPermissions(userId) {
      // This method is deprecated because permissions already come in the auth payload.
      console.warn('fetchUserPermissions is deprecated. Permissions are loaded in the login response.');
      return;
    },

    /**
     * Initialize auth from stored token.
     *
     * @returns {Promise<void>}
     */
    async initAuth() {
      if (this.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        try {
          await this.fetchUser();
        } catch (error) {
          this.clearAuth();
        }
      }
    },

    /**
     * Clear authentication data.
     */
    clearAuth() {
      this.user = null;
      this.token = null;
      this.error = null;
      this.permissions = [];
      this.permissions_detailed = [];
      this.operador = null;
      this.juego_datos = null;
      this.roles = [];
      localStorage.removeItem('token');
      localStorage.removeItem('permissions');
      localStorage.removeItem('permissions_detailed');
      localStorage.removeItem('roles');
      localStorage.removeItem('operador');
      localStorage.removeItem('juego_datos');
      delete api.defaults.headers.common['Authorization'];
    },

    /**
     * Check if user has a specific permission or multiple permissions.
     * Supports both string and array input.
     * When array is provided, checks if user has ALL permissions (AND logic).
     *
     * @param {string|Array<string>} permission - Permission name(s) to check
     * @returns {boolean} True if user has permission(s)
     */
    hasPermission(permission) {
      // Ensure permissions is an array
      if (!Array.isArray(this.permissions)) {
        console.error('Permissions is not an array:', this.permissions);
        return false;
      }

      // Handle array of permissions - user must have ALL of them
      if (Array.isArray(permission)) {
        return permission.every(perm => this.permissions.includes(perm));
      }

      // Handle single permission string
      const hasIt = this.permissions.includes(permission);
      return hasIt;
    },

    /**
     * Check if user has any of the specified permissions.
     *
     * @param {Array<string>} permissions - Array of permission names
     * @returns {boolean} True if user has at least one permission
     */
    hasAnyPermission(permissions) {
      // Ensure permissions is an array
      if (!Array.isArray(this.permissions)) {
        console.error('Store permissions is not an array:', this.permissions);
        return false;
      }

      if (!Array.isArray(permissions)) {
        console.error('Parameter is not an array:', permissions);
        return false;
      }

      return permissions.some(permission => this.permissions.includes(permission));
    },

    /**
     * Check if user has all specified permissions.
     *
     * @param {Array<string>} permissions - Array of permission names
     * @returns {boolean} True if user has all permissions
     */
    hasAllPermissions(permissions) {
      // Ensure permissions is an array
      if (!Array.isArray(this.permissions)) {
        console.error('Store permissions is not an array:', this.permissions);
        return false;
      }

      if (!Array.isArray(permissions)) {
        console.error('Parameter is not an array:', permissions);
        return false;
      }

      return permissions.every(permission => this.permissions.includes(permission));
    },

    /**
     * Check if user has a specific role.
     *
     * @param {string} role - Role name to check
     * @returns {boolean} True if user has role
     */
    hasRole(role) {
      return this.roles.includes(role);
    },

    /**
     * Check if user has any of the specified roles.
     *
     * @param {Array<string>} roles - Array of role names
     * @returns {boolean} True if user has at least one role
     */
    hasAnyRole(roles) {
      return roles.some(role => this.roles.includes(role));
    },

    /**
     * Update user profile information.
     *
     * @param {Object} userData - User data to update
     * @param {string} userData.name - User name
     * @param {string} userData.email - User email
     * @param {string} userData.phone - User phone (optional)
     * @returns {Promise<Object>} Updated user data
     */
    async updateProfile(userData) {
      this.is_loading = true;
      this.error = null;

      try {
        const response = await api.put('/user/profile', userData);
        this.user = response.data.user;

        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'No se pudo actualizar el perfil';
        throw error;
      } finally {
        this.is_loading = false;
      }
    },

    /**
     * Update user password.
     *
     * @param {Object} passwordData - Password update data
     * @param {string} passwordData.current_password - Current password
     * @param {string} passwordData.new_password - New password
     * @param {string} passwordData.new_password_confirmation - New password confirmation
     * @returns {Promise<Object>} Response data
     */
    async updatePassword(passwordData) {
      this.is_loading = true;
      this.error = null;

      try {
        const response = await api.put('/user/password', passwordData);

        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'No se pudo actualizar la contraseña';
        throw error;
      } finally {
        this.is_loading = false;
      }
    },
  },
});
