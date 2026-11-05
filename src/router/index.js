import { route } from 'quasar/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'src/stores/auth-store'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  // Navigation guards
  Router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // Initialize auth if token exists but user is not loaded
    if (authStore.token && !authStore.user) {
      try {
        await authStore.initAuth()
      } catch (error) {
        console.error('Auth initialization failed:', error)
      }
    }

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
    const requiresPermission = to.meta.permission
    const requiresRole = to.meta.role

    // Check authentication
    if (requiresAuth && !authStore.isAuthenticated) {
      // Redirect to login if route requires auth and user is not authenticated
      return next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }

    if (requiresGuest && authStore.isAuthenticated) {
      // Redirect to home if route is for guests only and user is authenticated
      return next('/')
    }

    // Check permissions
    if (requiresPermission && authStore.isAuthenticated) {
      const hasPermission = Array.isArray(requiresPermission)
        ? authStore.hasAnyPermission(requiresPermission)
        : authStore.hasPermission(requiresPermission)

      if (!hasPermission) {
        console.warn(`Access denied: missing permission ${requiresPermission}`)
        return next({
          path: '/',
          query: { error: 'permission_denied' }
        })
      }
    }

    // Check roles
    if (requiresRole && authStore.isAuthenticated) {
      const hasRole = Array.isArray(requiresRole)
        ? authStore.hasAnyRole(requiresRole)
        : authStore.hasRole(requiresRole)

      if (!hasRole) {
        console.warn(`Access denied: missing role ${requiresRole}`)
        return next({
          path: '/',
          query: { error: 'role_denied' }
        })
      }
    }

    next()
  })

  return Router
})
