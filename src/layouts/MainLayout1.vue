<template style="background-color: #686262">
    <q-layout view="lHh Lpr lff" id="mainLayout">
        <q-header class="main-header text-white">
            <q-toolbar class="main-toolbar">
                <div class="toolbar-left">
                    <q-btn class="toolbar-icon-btn" flat @click="drawer = !drawer" round dense icon="menu">
                        <q-tooltip>{{ drawer ? "Cerrar Menú" : "Abrir Menú" }}</q-tooltip>
                    </q-btn>
                    <div class="brand-block">

                        <div class="brand-copy">
                            <span class="brand-title">Sistema de gestión de almacén y ventas</span>
                            <span class="brand-subtitle">SAV</span>
                        </div>
                    </div>
                </div>
                <q-space />

                <!-- User info and logout -->
                <div class="toolbar-right">
                    <div v-if="authStore.user" class="user-chip row items-center q-gutter-xs">
                        <q-icon name="person_outline" size="16px" />
                        <span class="text-caption text-weight-medium">{{ authStore.user.name }}</span>
                        <q-menu class="user-menu-card">
                            <q-list style="min-width: 200px">
                                <q-item clickable v-close-popup @click="goToProfile">
                                    <q-item-section avatar>
                                        <q-icon name="manage_accounts" color="primary" />
                                    </q-item-section>
                                    <q-item-section>Administrar Perfil</q-item-section>
                                </q-item>
                            </q-list>
                        </q-menu>
                    </div>

                    <q-btn class="toolbar-icon-btn" flat round dense icon="notifications" @click="showBanner = !showBanner">
                        <q-badge v-if="notifications.length" color="orange-6" floating rounded>{{ notifications.length }}</q-badge>
                        <q-tooltip>Notificaciones</q-tooltip>
                    </q-btn>

                    <q-btn class="toolbar-icon-btn" flat round dense icon="logout" @click="handleLogout">
                        <q-tooltip>Cerrar Sesión</q-tooltip>
                    </q-btn>
                </div>
            </q-toolbar>
        </q-header>

        <q-drawer
            v-model="drawer"
            show-if-above
            :width="300"
            :breakpoint="800"
            class="main-drawer"
        >
            <!-- ─── BANNER HEADER ─── -->
            <div class="dbh-wrap">
                <div class="dbh-shape-teal"></div>
                <div class="dbh-shape-teal-sm"></div>
                <div class="dbh-shape-orange"></div>
                <div class="dbh-dots-grid">
                    <span v-for="n in 9" :key="n" class="dbh-dot" :class="`dbh-dot-col-${(n - 1) % 3}`"></span>
                </div>
                <div class="dbh-icon-card">
                    <q-icon name="storefront" size="40px" color="white" />
                </div>
                <div class="dbh-copy">
                    <p class="dbh-hello">BIENVENIDO</p>
                    <div class="dbh-title">SISTEMA<br /><span class="dbh-accent">DE GESTIÓN</span><br /><span class="dbh-accent">DE ALMACÉN</span><br /><span class="dbh-accent">Y VENTAS</span></div>
                    <!-- <p class="dbh-tagline">Administración integral de almacén y ventas</p> -->
                </div>
                <div class="dbh-divider">
                    <span class="dbh-div-dot"></span>
                    <span class="dbh-div-line"></span>
                    <span class="dbh-div-dot"></span>
                </div>

                <q-scroll-area class="drawer-scroll-area">
                    <q-list padding class="menu-list modern-menu-list">
                        <EssentialLink />
                    </q-list>
                </q-scroll-area>

                <div class="dbh-user-bar" v-if="authStore.user">
                    <div class="dbh-user-avatar">
                        <q-icon name="person" size="14px" color="white" />
                    </div>
                    <span class="dbh-user-name">{{ authStore.user.name }}</span>
                    <q-space />
                    <div class="dbh-online-badge">
                        <span class="dbh-online-dot"></span>
                        <span>En línea</span>
                    </div>
                </div>
            </div>
        </q-drawer>

        <q-page-container>
            <router-view />
        </q-page-container>

        <!-- Panel de notificaciones simple -->
        <div v-if="showBanner" class="notifications-panel">
            <div class="panel-header">
                <div class="panel-header-copy">
                    <span class="header-title">
                        <q-icon name="notifications" class="q-mr-sm" />
                        Notificaciones
                    </span>
                    <span class="header-subtitle">{{ notifications.length }} pendientes</span>
                </div>
                <q-btn flat round dense icon="close" class="toolbar-icon-btn panel-close-btn" @click="showBanner = false" />
            </div>

            <!-- Lista de notificaciones -->
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
                            <q-btn size="sm" flat round icon="delete" color="negative"
                                @click="deleteNotification(notif.id)" />
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

        <div v-if="showBanner" class="simple-overlay" @click="showBanner = false"></div>

        <DialogLogout
            :isOpen="showLogoutDialog"
            @confirmar="confirmarLogout"
            @closeDialog="showLogoutDialog = false"
        />
    </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import EssentialLink from 'src/components/EssentialLink.vue'
import DialogLogout from 'src/components/dialog_boxes/DialogLogout.vue'
import { api } from 'boot/axios'
import { useAuthStore } from 'src/stores/auth-store'

defineOptions({
    name: 'MainLayout'
})

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

const drawer = ref(false);
const notifications = ref([]);
const showBanner = ref(false);
const showLogoutDialog = ref(false);

async function fetchNotifications() {
    try {
        const res = await api.get('/notifications');
        notifications.value = res.data.notifications || [];
    } catch (e) {
        notifications.value = [];
    }
}

async function markAsRead(id) {
    await api.post(`/notifications/${id}/read`);
    await fetchNotifications();
}

async function deleteNotification(id) {
    await api.delete(`/notifications/${id}`);
    await fetchNotifications();
}

async function markAllAsRead() {
    try {
        const promises = notifications.value.map(notif =>
            api.post(`/notifications/${notif.id}/read`)
        );
        await Promise.all(promises);
        await fetchNotifications();
    } catch (e) {
        console.error('Error marking all as read:', e);
    }
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
    return date.toLocaleDateString();
}

function goToProfile() {
    router.push('/profile')
}

function handleLogout() {
    showLogoutDialog.value = true
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
});
</script>

<style scoped>
.main-layout-shell {
    background:
        radial-gradient(circle at top left, rgba(99, 102, 241, 0.10), transparent 24%),
        linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
}

.main-header {
    height: 68px;
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 35%, #2d2d2d 68%, #111111 100%);
    box-shadow: 0 4px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0 0 20px 20px;
}

.main-toolbar {
    min-height: 68px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.toolbar-left,
.toolbar-right {
    display: flex;
    align-items: center;
}

.toolbar-left {
    gap: 14px;
}

.toolbar-right {
    gap: 10px;
}

.toolbar-icon-btn {
    color: #fff;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.24);
    backdrop-filter: blur(8px);
    transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.toolbar-icon-btn:hover {
    background: rgba(255, 255, 255, 0.28);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
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
    font-size: 0.98rem;
    font-weight: 700;
    line-height: 1.1;
}

.brand-subtitle,
.drawer-subtitle,
.header-subtitle {
    font-size: 0.76rem;
    opacity: 0.8;
}

.user-chip {
    padding: 6px 14px;
    border-radius: 999px;
    color: #fff;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.24);
    backdrop-filter: blur(8px);
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;
}

.user-chip:hover {
    background: rgba(255, 255, 255, 0.26);
    transform: translateY(-1px);
}

.user-menu-card {
    border-radius: 16px;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
}

.main-drawer {
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    backdrop-filter: blur(18px);
    border-right: 1px solid rgba(148, 163, 184, 0.12);
    box-shadow: 16px 0 40px rgba(15, 23, 42, 0.06);
    border-radius: 0 20px 20px 0;
    overflow: hidden;
}

.drawer-top {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 24px 18px 14px;
    margin: 12px 12px 0;
    border-radius: 22px;
    background: linear-gradient(135deg, #eef2ff 0%, #eff6ff 100%);
    border: 1px solid #e2e8f0;
}

.drawer-logo {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%);
}

.modern-menu-list {
    padding: 14px 12px 20px;
}

/* ── DRAWER BANNER HEADER ── */
.dbh-wrap {
    position: relative;
    height: 100%;
    overflow: hidden;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    padding: 0 16px;
}

.dbh-shape-teal {
    position: absolute;
    top: -40px;
    right: -50px;
    width: 190px;
    height: 210px;
    /* changed to black tones per request */
    background: linear-gradient(140deg, #000000 0%, #1f1f1f 100%);
    border-radius: 50% 0 60% 30%;
    transform: rotate(-12deg);
    z-index: 0;
}

.dbh-shape-teal-sm {
    position: absolute;
    top: 50px;
    right: -15px;
    width: 84px;
    height: 130px;
    /* changed to darker black/gray tones */
    background: linear-gradient(140deg, #0b0b0b 0%, #3a3a3a 100%);
    border-radius: 50% 20% 60% 30%;
    transform: rotate(-20deg);
    opacity: 0.4;
    z-index: 0;
}

.dbh-shape-orange {
    position: absolute;
    top: 80px;
    left: -28px;
    width: 68px;
    height: 250px;
    background: linear-gradient(160deg, #7f1d1d 0%, #dc2626 55%, #b91c1c 100%);
    border-radius: 0 50% 50% 0;
    transform: rotate(-8deg);
    opacity: 0.92;
    z-index: 0;
}

.dbh-dots-grid {
    position: absolute;
    top: 14px;
    left: 16px;
    display: grid;
    grid-template-columns: repeat(3, 10px);
    gap: 6px;
    z-index: 1;
}

.dbh-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(13, 148, 136, 0.35);
}
.dbh-dot-col-0 { background: rgba(231, 9, 9, 0.65); }
.dbh-dot-col-1 { background: rgba(0, 0, 0, 0.40); }
.dbh-dot-col-2 { background: rgba(0, 0, 0, 0.20); }

.dbh-icon-card {
    position: relative;
    z-index: 2;
    width: 64px;
    height: 64px;
    border-radius: 20px;
    margin: 24px auto 0;
    background: linear-gradient(135deg, #1a0000 0%, #7f1d1d 50%, #dc2626 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 28px rgba(220, 38, 38, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);
    border: 3px solid rgba(255, 255, 255, 0.7);
    transform: rotate(4deg);
}

.dbh-copy {
    position: relative;
    z-index: 2;
    padding: 12px 0 0 52px;
}

.dbh-hello {
    margin: 0 0 2px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 3px;
    color: #1a1a1a;
    text-transform: uppercase;
}

.dbh-title {
    font-size: 22px;
    font-weight: 900;
    font-style: italic;
    line-height: 1.05;
    color: #0f172a;
    margin: 0 0 5px;
}

.dbh-accent {
    background: linear-gradient(90deg, #f53232, #ee1d1d);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.dbh-tagline {
    margin: 0;
    font-size: 12px;
    color: #0f1011;
    line-height: 1.4;
    max-width: 170px;
}

.dbh-divider {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 0 10px;
}

.dbh-div-line {
    flex: 1;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, #000000, #3d3d3d, #dc2626);
}

.dbh-div-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #1a1a1a;
    flex-shrink: 0;
}

.dbh-user-bar {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    border-radius: 16px;
    margin-bottom: 14px;
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 60%, #2d2d2d 100%);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
}

.dbh-user-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.35);
    flex-shrink: 0;
}

.dbh-user-name {
    font-weight: 700;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
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
    background: #4ade80;
    box-shadow: 0 0 6px rgba(74, 222, 128, 0.7);
    flex-shrink: 0;
}

.drawer-scroll-area {
    flex: 1;
    min-height: 0;
}

.drawer-scroll-area :deep(.q-scrollarea__thumb) {
    width: 4px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.35);
    opacity: 0.6;
}

.drawer-scroll-area :deep(.q-scrollarea__bar) {
    width: 6px;
    background: transparent;
}

.page-surface {
    background: transparent;
}

.notifications-panel {
    position: fixed;
    top: 84px;
    right: 20px;
    bottom: 20px;
    width: 400px;
    background: rgba(255, 255, 255, 0.97);
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 28px;
    box-shadow: 0 28px 70px rgba(0, 0, 0, 0.22), 0 8px 24px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(20px);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.panel-header {
    padding: 20px 22px 18px;
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #c23030 100%);
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #ffffff;
}

.header-title {
    font-weight: 700;
    font-size: 16px;
    color: #ffffff;
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
    border-top: 1px solid #eef2f7;
    background: #ffffff;
}

.empty-state {
    text-align: center;
    padding: 44px 22px;
    color: #64748b;
}

.empty-state-icon {
    width: 72px;
    height: 72px;
    margin: 0 auto 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 22px;
    background: linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.15);
}

.empty-state-title {
    margin: 0 0 6px;
    font-size: 0.95rem;
    font-weight: 700;
    color: #0f172a;
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
    border: 1px solid #e8efff;
    border-left: 4px solid #818cf8;
    border-radius: 22px;
    background: linear-gradient(135deg, #ffffff 0%, #f5f8ff 100%);
    transition: all 0.2s ease;
}

.notification-item:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.14);
    background: linear-gradient(135deg, #fafbff 0%, #eef1ff 100%);
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
    background: linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.16);
}

.notification-text {
    flex: 1;
}

.message {
    margin: 0 0 4px 0;
    font-size: 14px;
    line-height: 1.4;
    color: #1e293b;
}

.time {
    font-size: 12px;
    color: #64748b;
}

.notification-actions {
    display: flex;
    gap: 4px;
    margin-left: 10px;
}

.simple-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.18);
    z-index: 1999;
}

.notifications-action-btn {
    border-radius: 999px !important;
    font-weight: 700 !important;
    letter-spacing: 0.3px;
    background: linear-gradient(135deg, #4338ca 0%, #2563eb 100%) !important;
    box-shadow: 0 4px 14px rgba(67, 56, 202, 0.3) !important;
    transition: all 0.2s ease !important;
}

.notifications-action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(67, 56, 202, 0.45) !important;
}

@media (max-width: 768px) {
    .main-toolbar {
        padding: 0 12px;
    }

    .brand-subtitle,
    .user-chip {
        display: none;
    }

    .notifications-panel {
        width: 100%;
        height: calc(100vh - 68px);
        top: 68px;
        right: 0;
        bottom: 0;
        border-radius: 28px 28px 0 0;
    }

    .drawer-top {
        margin: 10px 10px 0;
    }

    .modern-menu-list {
        padding: 12px 10px 18px;
    }
}
</style>
