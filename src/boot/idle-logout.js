import { boot } from 'quasar/wrappers'
import { Notify } from 'quasar'
import { watch } from 'vue'
import { api } from 'boot/axios'
import { useAuthStore } from 'src/stores/auth-store'

// Shared through localStorage so activity in one tab keeps the others open.
const ACTIVITY_KEY = 'last_activity'
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll']
const MARK_THROTTLE_MS = 5000
const CHECK_EVERY_MS = 5000
const WARN_BEFORE_MS = 60 * 1000
// The server closes tokens unused for the same time: ping while the user works without requests.
const PING_AFTER_MS = 4 * 60 * 1000

export default boot(({ router, store }) => {
    const auth = useAuthStore(store)
    const idleMs = () => Number(auth.idleMinutes || 0) * 60 * 1000
    const lastActivity = () => Number(localStorage.getItem(ACTIVITY_KEY)) || 0

    let lastMark = 0
    let lastRequest = Date.now()
    let dismissWarning = null
    let expiring = false

    api.interceptors.request.use((config) => {
        lastRequest = Date.now()
        return config
    })

    const hideWarning = () => {
        if (dismissWarning) dismissWarning()
        dismissWarning = null
    }

    const mark = (force = false) => {
        const now = Date.now()
        if (!force && now - lastMark < MARK_THROTTLE_MS) return
        lastMark = now
        localStorage.setItem(ACTIVITY_KEY, String(now))
        hideWarning()
        if (auth.token && now - lastRequest > PING_AFTER_MS) {
            api.post('/ping', null, { skipAuthRedirect: true }).catch(() => {})
        }
    }

    const expire = async () => {
        if (expiring) return
        expiring = true
        hideWarning()
        localStorage.removeItem(ACTIVITY_KEY)
        try {
            await api.post('/logout', null, { skipAuthRedirect: true })
        } catch {
            // the server may have closed the token already
        }
        auth.clearAuth()
        expiring = false
        Notify.create({
            type: 'warning',
            message: 'Su sesión se cerró por inactividad. Inicie sesión nuevamente.',
            position: 'top-right',
            timeout: 0,
            actions: [{ label: 'Entendido', color: 'dark' }],
        })
        const current = router.currentRoute.value
        router.push({ path: '/login', query: current.path !== '/login' ? { redirect: current.fullPath } : {} })
    }

    const check = () => {
        if (!auth.token) return
        if (!localStorage.getItem('token')) {
            // another tab closed the session
            auth.clearAuth()
            hideWarning()
            router.push('/login')
            return
        }
        if (!idleMs()) return
        const last = lastActivity()
        if (!last) {
            mark(true)
            return
        }
        const left = idleMs() - (Date.now() - last)
        if (left <= 0) {
            expire()
        } else if (left <= WARN_BEFORE_MS && !dismissWarning) {
            dismissWarning = Notify.create({
                type: 'warning',
                message: 'Su sesión se cerrará en un minuto por inactividad.',
                position: 'top-right',
                timeout: 0,
                actions: [{ label: 'Seguir conectado', color: 'dark', handler: () => { dismissWarning = null; mark(true) } }],
            })
        }
    }

    // A session left idle while the app was closed does not come back on reload.
    if (auth.token && idleMs() && lastActivity() && Date.now() - lastActivity() > idleMs()) {
        auth.clearAuth()
        localStorage.removeItem(ACTIVITY_KEY)
    }

    watch(() => auth.token, (token) => {
        if (token) mark(true)
        else hideWarning()
    })

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, () => mark(), { passive: true, capture: true }))
    setInterval(check, CHECK_EVERY_MS)
})
