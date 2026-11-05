<template>
    <q-layout view="lHh Lpr lff" id="mainLayout" class="main-layout">
        <q-header class="app-header">
            <div class="header-texture" aria-hidden="true"></div>
            <q-toolbar class="main-toolbar">
                <div class="toolbar-left">
                    <q-btn class="toolbar-icon-btn" flat @click="toggleDrawer" round dense icon="menu">
                        <q-tooltip>{{ drawerTooltip }}</q-tooltip>
                    </q-btn>
                    <div class="brand-block cursor-pointer" @click="router.push('/Inicio')">
                        <img class="brand-logo" :src="brandStore.logoUrl" :alt="brandStore.name" />
                        <div class="brand-copy">
                            <BrandName class="brand-title" />
                            <span class="brand-subtitle">Gestión de ferias</span>
                        </div>
                    </div>
                </div>

                <q-space />

                <div v-if="fairStore.fair" class="fair-chip gt-sm">
                    <q-icon name="storefront" size="16px" class="fair-chip-icon" />
                    <span class="fair-chip-name cursor-pointer" @click="goToPos">{{ fairStore.fair.name }}</span>
                    <template v-if="fairStore.day">
                        <span class="fair-chip-sep">·</span>
                        <span class="cursor-pointer" @click="goToPos">{{ weekday(fairStore.day.date) }} {{ formatDate(fairStore.day.date) }}</span>
                        <span class="fair-chip-dot" :class="fairStore.isDayClosed ? 'is-closed' : 'is-open'"></span>
                    </template>
                    <q-btn flat dense round size="sm" icon="swap_horiz" class="fair-chip-switch" @click.stop>
                        <q-tooltip>Cambiar feria</q-tooltip>
                        <q-menu anchor="bottom middle" self="top middle">
                            <q-list style="min-width: 240px">
                                <q-item-label header>Ferias abiertas</q-item-label>
                                <q-item
                                    v-for="f in openFairs"
                                    :key="f.id"
                                    clickable
                                    v-close-popup
                                    :active="f.id === fairStore.fairId"
                                    active-class="bg-primary text-white"
                                    @click="switchFair(f.id)"
                                >
                                    <q-item-section>{{ f.name }}</q-item-section>
                                    <q-item-section side>
                                        <q-icon v-if="f.id === fairStore.fairId" name="check" size="18px" />
                                    </q-item-section>
                                </q-item>
                                <template v-if="closedFairs.length">
                                    <q-separator />
                                    <q-item-label header>Cerradas</q-item-label>
                                    <q-item
                                        v-for="f in closedFairs"
                                        :key="f.id"
                                        clickable
                                        v-close-popup
                                        :active="f.id === fairStore.fairId"
                                        @click="switchFair(f.id)"
                                    >
                                        <q-item-section class="text-grey-7">{{ f.name }}</q-item-section>
                                    </q-item>
                                </template>
                                <q-item v-if="!fairStore.fairs.length" dense>
                                    <q-item-section class="text-grey-7">No hay ferias</q-item-section>
                                </q-item>
                            </q-list>
                        </q-menu>
                    </q-btn>
                    <q-tooltip v-if="canSell">Clic en el nombre para ir al punto de venta</q-tooltip>
                </div>

                <q-space />

                <q-btn class="toolbar-icon-btn q-mr-xs" flat round dense :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'" @click="toggleDarkMode">
                    <q-tooltip>{{ $q.dark.isActive ? 'Modo claro' : 'Modo oscuro' }}</q-tooltip>
                </q-btn>

                <!-- User info and logout -->
                <div class="row items-center no-wrap q-gutter-xs">
                    <div v-if="authStore.user" class="q-mr-xs cursor-pointer">
                        <q-btn flat dense no-caps class="user-chip">
                            <div class="user-avatar">{{ userInitials }}</div>
                            <span class="user-name gt-xs">{{ authStore.user.name }}</span>
                            <q-icon name="expand_more" size="18px" class="q-ml-xs" />
                            <q-menu>
                                <q-list style="min-width: 200px">
                                    <q-item clickable v-close-popup @click="goToProfile">
                                        <q-item-section avatar>
                                            <q-icon name="manage_accounts" color="primary" />
                                        </q-item-section>
                                        <q-item-section>Administrar Perfil</q-item-section>
                                    </q-item>

                                    <q-separator />

                                    <q-item clickable v-close-popup @click="handleLogout">
                                        <q-item-section avatar>
                                            <q-icon name="logout" color="negative" />
                                        </q-item-section>
                                        <q-item-section>Cerrar Sesión</q-item-section>
                                    </q-item>
                                </q-list>
                            </q-menu>
                        </q-btn>
                    </div>

                    <q-btn class="toolbar-icon-btn" flat round dense icon="notifications" @click="toggleNotificationsPanel">
                        <q-badge v-if="notifications.length" color="accent" text-color="dark" floating>{{ notifications.length }}</q-badge>
                        <q-tooltip>Notificaciones</q-tooltip>
                    </q-btn>
                </div>
            </q-toolbar>
            <div class="header-gold-line" aria-hidden="true"></div>
        </q-header>

        <q-drawer
            v-model="drawer"
            show-if-above
            bordered
            :mini="drawerMini"
            :width="300"
            :mini-width="72"
            :breakpoint="800"
            class="main-drawer"
            :class="{ 'main-drawer--mini': drawerMini }"
        >
            <div class="dbh-wrap">
                <div class="maia-banner">
                    <img class="maia-banner-logo" :src="brandStore.logoUrl" :alt="brandStore.name" />
                    <svg class="maia-banner-art" viewBox="0 0 300 230" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                        <defs>
                            <filter id="mbWatercolor" x="-30%" y="-30%" width="160%" height="160%">
                                <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="11" result="noise" />
                                <feDisplacementMap in="SourceGraphic" in2="noise" scale="26" xChannelSelector="R" yChannelSelector="G" result="warp" />
                                <feGaussianBlur in="warp" stdDeviation="2.5" />
                            </filter>
                            <radialGradient id="mbWine" cx="50%" cy="50%" r="50%">
                                <stop offset="0" style="stop-color: var(--maia-wine-light)" stop-opacity="0.95" />
                                <stop offset="0.6" style="stop-color: var(--maia-wine)" stop-opacity="0.55" />
                                <stop offset="1" style="stop-color: var(--maia-wine-deep)" stop-opacity="0" />
                            </radialGradient>
                            <radialGradient id="mbGold" cx="50%" cy="50%" r="50%">
                                <stop offset="0" style="stop-color: var(--maia-gold-bright)" stop-opacity="0.85" />
                                <stop offset="1" style="stop-color: var(--maia-gold)" stop-opacity="0" />
                            </radialGradient>
                            <radialGradient id="mbRose" cx="50%" cy="50%" r="50%">
                                <stop offset="0" style="stop-color: var(--maia-wine-on-dark)" stop-opacity="0.7" />
                                <stop offset="1" style="stop-color: var(--maia-wine)" stop-opacity="0" />
                            </radialGradient>
                            <linearGradient id="mbStroke" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0" style="stop-color: var(--maia-gold)" stop-opacity="0" />
                                <stop offset="0.35" style="stop-color: var(--maia-gold-light)" />
                                <stop offset="0.7" style="stop-color: var(--maia-gold-pale)" />
                                <stop offset="1" style="stop-color: var(--maia-gold)" stop-opacity="0.1" />
                            </linearGradient>
                        </defs>
                        <g filter="url(#mbWatercolor)">
                            <ellipse cx="236" cy="38" rx="118" ry="82" fill="url(#mbWine)" />
                            <ellipse cx="54" cy="6" rx="96" ry="62" fill="url(#mbGold)" opacity="0.6" />
                            <ellipse cx="276" cy="160" rx="72" ry="58" fill="url(#mbRose)" opacity="0.65" />
                            <ellipse cx="16" cy="182" rx="80" ry="44" fill="url(#mbWine)" opacity="0.55" />
                            <ellipse cx="160" cy="120" rx="40" ry="26" fill="url(#mbGold)" opacity="0.25" />
                        </g>
                        <path d="M -10 168 C 60 126, 122 206, 200 156 S 292 104, 320 134" fill="none" stroke="url(#mbStroke)" stroke-width="2.2" stroke-linecap="round" />
                        <path d="M 6 184 C 78 148, 140 214, 214 172" fill="none" stroke="url(#mbStroke)" stroke-width="0.9" stroke-linecap="round" opacity="0.6" />
                        <circle cx="252" cy="96" r="2.2" style="fill: var(--maia-gold-light)" opacity="0.8" />
                        <circle cx="262" cy="104" r="1.2" style="fill: var(--maia-gold-pale)" opacity="0.7" />
                        <circle cx="244" cy="108" r="1" style="fill: var(--maia-gold-light)" opacity="0.6" />
                        <circle cx="40" cy="70" r="1.6" style="fill: var(--maia-gold-pale)" opacity="0.5" />
                    </svg>
                    <div class="maia-banner-copy">
                        <p class="maia-banner-hello">Bienvenido</p>
                        <BrandName class="maia-banner-title" />
                        <p v-if="brandStore.tagline" class="maia-banner-tagline">{{ brandStore.tagline }}</p>
                    </div>
                </div>
                <div v-show="!drawerMini" class="maia-banner-ornament">
                    <MaiaOrnament :width="220" />
                </div>

                <q-scroll-area class="drawer-scroll-area">
                    <q-list padding class="menu-list modern-menu-list">
                        <EssentialLink :mini="drawerMini" />
                    </q-list>
                </q-scroll-area>

                <div v-if="authStore.user" class="dbh-user-bar">
                    <div class="dbh-user-avatar">{{ userInitials }}</div>
                    <div v-show="!drawerMini" class="column dbh-user-copy">
                        <span class="dbh-user-name">{{ authStore.user.name }}</span>
                        <span class="dbh-user-role">{{ userSubtitle }}</span>
                    </div>
                    <q-space v-if="!drawerMini" />
                    <div v-show="!drawerMini" class="dbh-online-badge">
                        <span class="dbh-online-dot"></span>
                        <span>En línea</span>
                    </div>
                    <q-tooltip
                        v-if="drawerMini"
                        anchor="center right"
                        self="center left"
                        :offset="[12, 0]"
                        class="dbh-user-tooltip"
                    >
                        <div class="dbh-user-tooltip-name">{{ authStore.user.name }}</div>
                        <div v-if="userSubtitle" class="dbh-user-tooltip-sub">{{ userSubtitle }}</div>
                    </q-tooltip>
                </div>
            </div>
        </q-drawer>

        <!-- <div v-show="drawer" class="app-sidebar-rail" aria-hidden="true" /> -->

        <q-drawer v-model="rightPanelOpen" side="right" bordered :width="430" class="right-drawer">
            <div class="column fit no-wrap right-panel-surface">
                <div class="panel-header">
                    <div class="panel-header-copy">
                        <span class="header-title">
                            <q-icon name="notifications" class="q-mr-sm" />
                            Notificaciones
                        </span>
                        <span class="header-subtitle">{{ notifications.length }} pendientes</span>
                    </div>
                    <q-btn flat round dense icon="close" class="toolbar-icon-btn panel-close-btn" @click="closeRightPanel" />
                </div>

                <div class="panel-content">
                    <div v-if="notifications.length === 0" class="empty-state">
                        <div class="empty-state-icon">
                            <q-icon name="notifications_none" size="32px" color="primary" />
                        </div>
                        <p class="empty-state-title">No hay notificaciones</p>
                        <p class="empty-state-text">Cuando se generen avisos del sistema aparecerán aquí.</p>
                    </div>

                    <div v-else>
                        <div v-for="notif in notifications" :key="notif.id" class="notification-item">
                            <div class="notification-content">
                                <div class="notification-icon-wrap">
                                    <q-icon name="info" color="primary" class="notification-icon" />
                                </div>
                                <div class="notification-text">
                                    <p class="message">{{ notif.message }}</p>
                                    <span class="time">{{ formatTime(notif.created_at) }}</span>
                                </div>
                            </div>

                            <div class="notification-actions">
                                <q-btn size="sm" flat round icon="done" color="positive" @click="markAsRead(notif.id)" />
                                <q-btn size="sm" flat round icon="delete" color="negative" @click="deleteNotification(notif.id)" />
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="notifications.length > 0" class="panel-footer">
                    <q-btn
                        unelevated
                        color="primary"
                        icon="done_all"
                        label="Marcar todas como leídas"
                        @click="markAllAsRead"
                        class="full-width notifications-action-btn"
                    />
                </div>
            </div>
        </q-drawer>

        <q-page-container class="main-page-container">
            <router-view />
        </q-page-container>

        <DialogLogout
            :isOpen="showLogoutDialog"
            @confirmar="confirmarLogout"
            @closeDialog="showLogoutDialog = false"
        />

    </q-layout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import EssentialLink from 'src/components/EssentialLink.vue'
import DialogLogout from 'src/components/dialog_boxes/DialogLogout.vue'
import MaiaOrnament from 'src/components/maia/MaiaOrnament.vue'
import BrandName from 'src/components/maia/BrandName.vue'
import { api } from 'boot/axios'
import { useAuthStore } from 'src/stores/auth-store'
import { useFairStore } from 'src/stores/fair-store'
import { useBrandStore } from 'src/stores/brand-store'
import { formatDate, weekday } from 'src/assets/js/util/maia'

defineOptions({
    name: 'MainLayout'
})

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const authStore = useAuthStore()
const fairStore = useFairStore()
const brandStore = useBrandStore()

const userInitials = computed(() => {
    const name = String(authStore.user?.name || '').trim()
    if (!name) return '?'
    const parts = name.split(/\s+/)
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
})
const userRole = computed(() => authStore.roles?.[0] || 'Usuario')
const userSubtitle = computed(() => {
    const name = String(authStore.user?.name || '').trim().toLowerCase()
    if (userRole.value.toLowerCase() !== name) return userRole.value
    return authStore.user?.username ? `@${authStore.user.username}` : ''
})
const canSell = computed(() => authStore.hasPermission('pos.vender'))
const openFairs = computed(() => fairStore.fairs.filter((f) => f.status === 'open'))
const closedFairs = computed(() => fairStore.fairs.filter((f) => f.status !== 'open'))

function goToPos() {
    if (canSell.value) router.push({ name: 'PuntoVenta' })
}

async function switchFair(id) {
    if (!id || id === fairStore.fairId) return
    await fairStore.selectFair(id)
}
const drawer = ref(true)
const drawerMini = ref(false)
const notifications = ref([])

const drawerTooltip = computed(() => {
    if ($q.screen.width > 800) {
        return drawerMini.value ? 'Expandir menú' : 'Contraer menú'
    }
    return drawer.value ? 'Cerrar menú' : 'Abrir menú'
})

function toggleDrawer() {
    if ($q.screen.width > 800) {
        drawerMini.value = !drawerMini.value
        drawer.value = true
        return
    }
    drawer.value = !drawer.value
}

watch(
    () => route.name,
    (name) => {
        if (name === 'PuntoVenta' && $q.screen.width > 800) {
            drawerMini.value = true
            drawer.value = true
        }
    },
    { immediate: true },
)
const showLogoutDialog = ref(false)
const rightPanelOpen = ref(false)

async function fetchNotifications() {
    try {
        const res = await api.get('/notifications')
        notifications.value = res.data.notifications || []
    } catch (e) {
        notifications.value = []
    }
}

async function markAsRead(id) {
    await api.post(`/notifications/${id}/read`)
    await fetchNotifications()
}

async function deleteNotification(id) {
    await api.delete(`/notifications/${id}`)
    await fetchNotifications()
}

async function markAllAsRead() {
    try {
        const promises = notifications.value.map(notif =>
            api.post(`/notifications/${notif.id}/read`)
        )
        await Promise.all(promises)
        await fetchNotifications()
    } catch (e) {
        console.error('Error marking all as read:', e)
    }
}

/**
 * Close the shared right-side panel.
 *
 * @returns {void}
 */
function closeRightPanel() {
    rightPanelOpen.value = false
}

function toggleNotificationsPanel() {
    rightPanelOpen.value = !rightPanelOpen.value
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
    return date.toLocaleDateString()
}

function goToProfile() {
    router.push('/profile')
}

function handleLogout() {
    showLogoutDialog.value = true
}

function toggleDarkMode() {
    $q.dark.toggle()
    try {
        localStorage.setItem('darkMode', String($q.dark.isActive))
    } catch {
        // ignore storage errors
    }
}

async function confirmarLogout() {
    try {
        await authStore.logout()

        $q.notify({
            type: 'positive',
            message: 'Sesión cerrada exitosamente',
            position: 'top-right',
            timeout: 2000
        })

        router.push('/login')
    } catch (error) {
        console.error('Logout error:', error)

        $q.notify({
            type: 'negative',
            message: 'Error al cerrar sesión',
            position: 'top-right'
        })
    }
}

onMounted(async () => {
    await fetchNotifications()

    // Initialize auth if not already initialized
    if (authStore.token && !authStore.user) {
        await authStore.initAuth()
    }

    if (authStore.token) {
        fairStore.loadFairs().catch(() => {})
    }
})
</script>

<style scoped lang="scss">
.app-header {
    overflow: hidden;
}

.header-texture {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.2;
    background:
        radial-gradient(ellipse 320px 90px at 12% -20%, rgba(var(--maia-gold-pale-rgb), 0.55), transparent 70%),
        radial-gradient(ellipse 260px 120px at 78% 130%, rgba(var(--maia-gold-light-rgb), 0.45), transparent 70%),
        radial-gradient(ellipse 180px 60px at 55% 10%, rgba(199, 106, 120, 0.5), transparent 70%),
        repeating-linear-gradient(115deg, rgba(255, 255, 255, 0.05) 0 2px, transparent 2px 9px);
}

.header-gold-line {
    height: 3px;
    background: var(--app-spectrum);
    opacity: 0.92;
}

.main-toolbar {
    position: relative;
    min-height: 62px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.brand-logo {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: cover;
    object-position: center 28%;
    border: 1.5px solid var(--maia-gold-light);
    box-shadow: 0 0 0 3px rgba(var(--maia-gold-light-rgb), 0.18), 0 6px 16px rgba(0, 0, 0, 0.25);
    background: #0a0a0a;
    flex-shrink: 0;
}

.brand-title :deep(em) {
    color: var(--maia-gold-bright);
}

.fair-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    border-radius: 999px;
    font-size: 0.82rem;
    color: #f7efe3;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(var(--maia-gold-light-rgb), 0.45);
    backdrop-filter: blur(6px);
    max-width: 46vw;
    white-space: nowrap;
    transition: background 0.2s ease, box-shadow 0.2s ease;

    &.cursor-pointer:hover {
        background: rgba(var(--maia-gold-light-rgb), 0.16);
        box-shadow: 0 0 18px rgba(var(--maia-gold-light-rgb), 0.25);
    }
}

.fair-chip-icon {
    color: var(--maia-gold-bright);
}

.fair-chip-name {
    font-family: 'Playfair Display', Georgia, serif;
    font-weight: 600;
    font-size: 0.92rem;
    overflow: hidden;
    text-overflow: ellipsis;
}

.fair-chip-sep {
    color: var(--maia-gold-light);
}

.fair-chip-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &.is-open {
        background: #7fd4a8;
        box-shadow: 0 0 8px rgba(127, 212, 168, 0.8);
    }

    &.is-closed {
        background: #b3a597;
    }
}

.fair-chip-switch {
    color: var(--maia-gold-bright);
    margin-left: 2px;
}

.user-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--maia-wine-deep);
    background: linear-gradient(135deg, var(--maia-gold-pale) 0%, var(--maia-gold-light) 60%, var(--maia-gold) 100%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.user-name {
    margin-left: 8px;
    font-weight: 500;
}

.toolbar-left,
.toolbar-right {
    display: flex;
    align-items: center;
}

.toolbar-left {
    gap: 10px;
}

.toolbar-right {
    gap: 6px;
}

.toolbar-icon-btn {
    color: #f7efe3;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(8px);
    transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.toolbar-icon-btn:hover {
    background: rgba(var(--maia-gold-light-rgb), 0.18);
    border-color: rgba(var(--maia-gold-light-rgb), 0.7);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
}

.brand-block {
    display: flex;
    align-items: center;
    gap: 12px;
}

.brand-badge {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    color: #fff;
    background: rgba(255, 255, 255, 0.22);
    border: 1px solid rgba(255, 255, 255, 0.32);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.brand-copy,
.drawer-copy,
.panel-header-copy {
    display: flex;
    flex-direction: column;
}

.brand-title,
.drawer-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.28rem;
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: 0.01em;
}

.brand-subtitle,
.drawer-subtitle,
.header-subtitle {
    font-size: 0.68rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(var(--maia-gold-pale-rgb), 0.8);
}

.user-chip {
    padding: 3px 10px 3px 4px;
    border-radius: 999px;
    color: #f7efe3;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(8px);
    transition: background 0.2s ease, border-color 0.2s ease;
}

.user-chip:hover {
    background: rgba(var(--maia-gold-light-rgb), 0.16);
    border-color: rgba(var(--maia-gold-light-rgb), 0.6);
}

.user-menu-card {
    border-radius: 16px;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
}

.main-drawer :deep(.q-drawer__content) {
    background: var(--app-sidebar-bg);
}

.right-panel-surface,
.main-page-container {
    min-height: 100%;
}

.modern-menu-list {
    padding: 14px 12px 20px;
}

.dbh-wrap {
    position: relative;
    height: 100%;
    overflow: hidden;
    background: var(--app-sidebar-bg);
    display: flex;
    flex-direction: column;
    padding: 0 14px;
}

.maia-banner-logo {
    position: absolute;
    right: 10px;
    top: 18px;
    width: 108px;
    height: 108px;
    object-fit: contain;
    opacity: 0.92;
    filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.45));
    z-index: 1;
    pointer-events: none;
}

.maia-banner {
    position: relative;
    flex-shrink: 0;
    height: 196px;
    margin: 0 -14px;
    overflow: hidden;
}

.maia-banner-art {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}

.maia-banner-copy {
    position: absolute;
    left: 26px;
    bottom: 26px;
    z-index: 1;
}

.maia-banner-hello {
    margin: 0 0 4px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: var(--maia-gold-light);
}

.maia-banner-title {
    display: block;
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 2.15rem;
    font-weight: 600;
    line-height: 1;
    color: var(--maia-ivory);
    text-shadow: 0 2px 14px rgba(0, 0, 0, 0.35);
    overflow-wrap: anywhere;

    :deep(em) {
        font-weight: 500;
        color: var(--maia-gold-bright);
    }
}

.maia-banner-tagline {
    margin: 6px 0 0;
    font-family: 'Playfair Display', Georgia, serif;
    font-style: italic;
    font-size: 0.86rem;
    letter-spacing: 0.06em;
    color: rgba(241, 230, 214, 0.8);
}

.maia-banner-ornament {
    display: flex;
    justify-content: center;
    padding: 6px 0 2px;
    flex-shrink: 0;
}

.main-drawer--mini .dbh-wrap {
    padding: 0 6px;
}

.main-drawer--mini .maia-banner {
    height: 72px;
    margin: 0 -6px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.main-drawer--mini .maia-banner-art,
.main-drawer--mini .maia-banner-copy {
    display: none;
}

.main-drawer--mini .maia-banner-logo {
    position: static;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    object-position: center 28%;
    border: 1.5px solid var(--maia-gold-light);
    filter: none;
}

.main-drawer--mini .dbh-user-bar {
    justify-content: center;
    padding: 8px;
    margin: 6px 0 10px;
}

.main-drawer--mini .modern-menu-list {
    padding: 8px 0 12px;
}

.dbh-user-bar {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 14px;
    margin: 8px 0 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(var(--maia-gold-light-rgb), 0.25);
    color: #f1e6d6;
    font-size: 12px;
}

.dbh-user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--maia-wine-deep);
    background: linear-gradient(135deg, var(--maia-gold-pale) 0%, var(--maia-gold-light) 60%, var(--maia-gold) 100%);
}

.dbh-user-copy {
    min-width: 0;
}

.dbh-user-name {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12.5px;
}

.dbh-user-role {
    font-size: 10.5px;
    color: rgba(var(--maia-gold-light-rgb), 0.85);
}

.dbh-online-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    opacity: 0.9;
    white-space: nowrap;
}

.dbh-online-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #7fd4a8;
    opacity: 0.92;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.12), 0 0 6px rgba(255, 255, 255, 0.06);
    flex-shrink: 0;
    transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.dbh-online-dot:hover,
.dbh-online-dot:focus {
    transform: scale(1.15);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.12), 0 0 10px rgba(255, 255, 255, 0.08);
}

.drawer-scroll-area {
    flex: 1;
    min-height: 0;
}

.drawer-scroll-area :deep(.q-scrollarea__thumb) {
    width: 4px;
    border-radius: 999px;
    background: rgba(var(--maia-gold-light-rgb), 0.45);
    opacity: 0.6;
}

.drawer-scroll-area :deep(.q-scrollarea__bar) {
    width: 6px;
    background: transparent;
}

.panel-header {
    padding: 20px 22px 18px;
    background: var(--app-header-bg);
    border-bottom: 2px solid var(--maia-gold);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #f7efe3;
}

.header-title {
    font-weight: 700;
    font-size: 16px;
    display: flex;
    align-items: center;
}

.panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    scrollbar-width: thin;
    scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
}

.panel-content::-webkit-scrollbar {
    width: 6px;
}

.panel-content::-webkit-scrollbar-track {
    background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.45);
}

.panel-footer {
    padding: 14px 16px 16px;
    border-top: 1px solid var(--panel-footer-border);
}

.empty-state {
    text-align: center;
    padding: 44px 22px;
}

.empty-state-icon {
    width: 72px;
    height: 72px;
    margin: 0 auto 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 22px;
    background: var(--empty-icon-bg);
}

.empty-state-title {
    margin: 0 0 6px;
    font-size: 0.95rem;
    font-weight: 700;
}

.empty-state-text {
    margin: 0;
    font-size: 0.82rem;
}

.notification-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 14px 16px;
    margin-bottom: 10px;
    border: 1px solid var(--notification-border);
    border-left: 4px solid var(--q-primary);
    border-radius: 16px;
    background: var(--notification-bg);
    transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.notification-item:hover {
    transform: translateX(4px);
    background: var(--notification-hover-bg);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.notification-content {
    display: flex;
    flex: 1;
    align-items: flex-start;
    gap: 12px;
}

.notification-icon-wrap {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: var(--empty-icon-bg);
}

.notification-text {
    flex: 1;
}

.message {
    margin: 0 0 4px;
    font-size: 14px;
    line-height: 1.4;
}

.notification-actions {
    display: flex;
    gap: 4px;
    margin-left: 10px;
}

.notifications-action-btn {
    border-radius: 999px;
    font-weight: 700;
    letter-spacing: 0.3px;
}

@media (max-width: 768px) {
    .main-toolbar {
        padding: 0 10px;
    }

    .brand-subtitle,
    .user-chip {
        display: none;
    }

    .modern-menu-list {
        padding: 12px 10px 18px;
    }
}
</style>
