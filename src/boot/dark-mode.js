import { boot } from 'quasar/wrappers'

export default boot(({ app }) => {
  const $q = app.config.globalProperties.$q

  // Determine saved preference or system preference
  try {
    const saved = localStorage.getItem('darkMode')

    if (saved !== null) {
      $q.dark.set(saved === 'true')
    } else if (window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      $q.dark.set(prefersDark)
    }
  } catch (e) {
    // ignore localStorage read errors
  }

  // Provide a small helper available globally to toggle and persist preference
  app.config.globalProperties.$toggleDark = () => {
    $q.dark.toggle()
    try {
      localStorage.setItem('darkMode', String($q.dark.isActive))
    } catch (e) {
      // ignore
    }
  }

  // Also expose on window for easier access from non-component code
  try {
    if (typeof window !== 'undefined') {
      window.$toggleDark = app.config.globalProperties.$toggleDark
    }
  } catch (e) {
    // ignore
  }
})
