<template>
    <q-page class="profile-page" :class="{ 'is-dark': $q.dark.isActive }">
        <div class="profile-container">
            <!-- Header Section -->
            <div class="profile-header-section">
                <div class="header-content">
                    <q-avatar size="90px" class="profile-avatar">
                        <img v-if="userData.avatar" :src="userData.avatar" />
                        <div v-else class="avatar-placeholder">
                            {{ getInitials(userData.name) }}
                        </div>
                    </q-avatar>
                    <div class="header-info">
                        <h1 class="user-name">{{ userData.name }}</h1>
                        <p class="user-email">{{ userData.email || 'Sin correo electrónico' }}</p>
                        <div class="user-meta">
                            <q-chip icon="verified_user" color="primary" text-color="white" size="sm">
                                Usuario Activo
                            </q-chip>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Navigation Tabs -->
            <div class="profile-tabs">
                <button :class="['tab-button', { active: tab === 'info' }]" @click="tab = 'info'">
                    <q-icon name="person" size="20px" />
                    <span>Información Personal</span>
                </button>
                <button :class="['tab-button', { active: tab === 'password' }]" @click="tab = 'password'">
                    <q-icon name="lock" size="20px" />
                    <span>Seguridad</span>
                </button>
            </div>

            <!-- Content Section -->
            <div class="profile-content">
                <transition name="fade" mode="out-in">
                    <!-- Personal Info Section -->
                    <div v-if="tab === 'info'" key="info" class="content-section">
                        <h2 class="section-title">Información Personal</h2>
                        <p class="section-subtitle">Actualiza tu información de perfil</p>

                        <q-form @submit="updateProfile" class="profile-form">
                            <div class="form-grid">
                                <div class="form-field">
                                    <label class="field-label">Nombre completo *</label>
                                    <q-input v-model="userData.name" outlined dense class="profile-field"
                                        :dark="$q.dark.isActive" placeholder="Ingresa tu nombre completo"
                                        :rules="[val => !!val || 'Campo requerido']">
                                        <template v-slot:prepend>
                                            <q-icon name="person" color="primary" />
                                        </template>
                                    </q-input>
                                </div>

                                <div class="form-field">
                                    <label class="field-label">Usuario *</label>
                                    <q-input v-model="userData.username" outlined dense class="profile-field"
                                        :dark="$q.dark.isActive" placeholder="Nombre de usuario"
                                        :rules="[val => !!val || 'Campo requerido']">
                                        <template v-slot:prepend>
                                            <q-icon name="account_circle" color="primary" />
                                        </template>
                                    </q-input>
                                </div>

                                <div class="form-field">
                                    <label class="field-label">Correo electrónico</label>
                                    <q-input v-model="userData.email" type="email" outlined dense class="profile-field"
                                        :dark="$q.dark.isActive" placeholder="correo@ejemplo.com" :rules="[
                                            val => !val || /.+@.+\..+/.test(val) || 'Email inválido'
                                        ]">
                                        <template v-slot:prepend>
                                            <q-icon name="email" color="primary" />
                                        </template>
                                    </q-input>
                                </div>
                            </div>

                            <div class="form-actions">
                                <q-btn label="Cancelar" outline color="primary" no-caps size="md" icon="cancel"
                                    class="q-px-md q-py-sm text-body1 entity-action-btn" @click="resetUserData" />
                                <q-btn label="Guardar Cambios" type="submit" color="primary" icon="save" no-caps
                                    size="md" :loading="loadingProfile"
                                    class="q-px-md q-py-sm text-body1 entity-action-btn" />
                            </div>
                        </q-form>
                    </div>

                    <!-- Password Change Section -->
                    <div v-else-if="tab === 'password'" key="password" class="content-section">
                        <h2 class="section-title">Seguridad y Contraseña</h2>
                        <p class="section-subtitle">Cambia tu contraseña regularmente para mantener tu cuenta segura.
                        </p>

                        <div class="password-card">
                            <q-form @submit="updatePassword" class="profile-form">
                                <div class="form-grid">
                                    <div class="form-field">
                                        <label class="field-label">Contraseña actual *</label>
                                        <q-input v-model="passwordData.current_password"
                                            :type="showCurrentPassword ? 'text' : 'password'" outlined dense
                                            class="profile-field" :dark="$q.dark.isActive"
                                            placeholder="Ingresa tu contraseña actual"
                                            :rules="[val => !!val || 'Campo requerido']">
                                            <template v-slot:prepend>
                                                <q-icon name="lock" color="primary" />
                                            </template>
                                            <template v-slot:append>
                                                <q-icon :name="showCurrentPassword ? 'visibility_off' : 'visibility'"
                                                    class="cursor-pointer" color="grey-6"
                                                    @click="showCurrentPassword = !showCurrentPassword" />
                                            </template>
                                        </q-input>
                                    </div>

                                    <div class="form-field">
                                        <label class="field-label">Nueva contraseña *</label>
                                        <q-input v-model="passwordData.new_password"
                                            :type="showNewPassword ? 'text' : 'password'" outlined dense
                                            class="profile-field" :dark="$q.dark.isActive"
                                            placeholder="Mínimo 8 caracteres" :rules="[
                                                val => !!val || 'Campo requerido',
                                                val => val.length >= 8 || 'Mínimo 8 caracteres'
                                            ]">
                                            <template v-slot:prepend>
                                                <q-icon name="lock_open" color="primary" />
                                            </template>
                                            <template v-slot:append>
                                                <q-icon :name="showNewPassword ? 'visibility_off' : 'visibility'"
                                                    class="cursor-pointer" color="grey-6"
                                                    @click="showNewPassword = !showNewPassword" />
                                            </template>
                                        </q-input>
                                        <div class="password-hint">Usa al menos 8 caracteres, combinando mayúsculas,
                                            minúsculas, números y símbolos.</div>
                                    </div>

                                    <div class="form-field">
                                        <label class="field-label">Confirmar nueva contraseña *</label>
                                        <q-input v-model="passwordData.new_password_confirmation"
                                            :type="showConfirmPassword ? 'text' : 'password'" outlined dense
                                            class="profile-field" :dark="$q.dark.isActive"
                                            placeholder="Repite tu nueva contraseña" :rules="[
                                                val => !!val || 'Campo requerido',
                                                val => val === passwordData.new_password || 'Las contraseñas no coinciden'
                                            ]">
                                            <template v-slot:prepend>
                                                <q-icon name="lock_open" color="primary" />
                                            </template>
                                            <template v-slot:append>
                                                <q-icon :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                                                    class="cursor-pointer" color="grey-6"
                                                    @click="showConfirmPassword = !showConfirmPassword" />
                                            </template>
                                        </q-input>
                                    </div>
                                </div>

                                <div v-if="passwordData.new_password" class="password-strength">
                                    <div class="strength-label">Fortaleza de la contraseña</div>
                                    <q-linear-progress :value="passwordStrength.value" :color="passwordStrength.color"
                                        size="8px" rounded class="strength-bar" />
                                    <div class="strength-text" :class="`text-${passwordStrength.color}`">
                                        {{ passwordStrength.label }}
                                    </div>
                                </div>

                                <div class="form-actions">
                                    <q-btn label="Cancelar" outline color="primary" no-caps size="md" icon="cancel"
                                        class="q-px-md q-py-sm text-body1 entity-action-btn"
                                        @click="resetPasswordData" />
                                    <q-btn label="Cambiar Contraseña" type="submit" color="primary" icon="vpn_key"
                                        no-caps size="md" :loading="loadingPassword"
                                        class="q-px-md q-py-sm text-body1 entity-action-btn" />
                                </div>
                            </q-form>
                        </div>
                    </div>
                </transition>
            </div>
        </div>
    </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth-store'

const $q = useQuasar()
const authStore = useAuthStore()

const tab = ref('info')
const loadingProfile = ref(false)
const loadingPassword = ref(false)

// User data
const userData = ref({
    name: '',
    email: '',
    username: ''
})

// Password data
const passwordData = ref({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
})

// Password visibility
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

/**
 * Calculates password strength based on length and complexity
 * @returns {Object} Object with value (0-1), color and label
 */
const passwordStrength = computed(() => {
    const password = passwordData.value.new_password
    if (!password) return { value: 0, color: 'grey', label: '' }

    let strength = 0
    if (password.length >= 8) strength += 0.25
    if (password.length >= 12) strength += 0.25
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 0.25
    if (/\d/.test(password)) strength += 0.125
    if (/[^a-zA-Z0-9]/.test(password)) strength += 0.125

    if (strength < 0.4) return { value: strength, color: 'negative', label: 'Débil' }
    if (strength < 0.7) return { value: strength, color: 'warning', label: 'Media' }
    return { value: strength, color: 'positive', label: 'Fuerte' }
})

/**
 * Get user initials from name
 * @param {string} name - User's full name
 * @returns {string} User initials
 */
function getInitials(name) {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return parts[0].substring(0, 2).toUpperCase()
}

/**
 * Initializes user data from auth store
 */
function initUserData() {
    if (authStore.user) {
        userData.value = {
            name: authStore.user.name || '',
            email: authStore.user.email || '',
            username: authStore.user.username || ''
        }
    }
}

/**
 * Resets user data to original values from store
 */
function resetUserData() {
    initUserData()
}

/**
 * Resets password form data
 */
function resetPasswordData() {
    passwordData.value = {
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    }
}

/**
 * Updates user profile information
 */
async function updateProfile() {
    try {
        loadingProfile.value = true

        await authStore.updateProfile({
            name: userData.value.name,
            email: userData.value.email,
            username: userData.value.username
        })

        $q.notify({
            type: 'positive',
            message: 'Perfil actualizado exitosamente',
            position: 'top-right',
            icon: 'check_circle'
        })
    } catch (error) {
        console.error('Error updating profile:', error)

        $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'Error al actualizar el perfil',
            position: 'top-right',
            icon: 'error'
        })
    } finally {
        loadingProfile.value = false
    }
}

/**
 * Updates user password
 */
async function updatePassword() {
    try {
        loadingPassword.value = true

        await authStore.updatePassword({
            current_password: passwordData.value.current_password,
            new_password: passwordData.value.new_password,
            new_password_confirmation: passwordData.value.new_password_confirmation
        })

        $q.notify({
            type: 'positive',
            message: 'Contraseña actualizada exitosamente',
            position: 'top-right',
            icon: 'check_circle'
        })

        resetPasswordData()
        tab.value = 'info'
    } catch (error) {
        console.error('Error updating password:', error)

        $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'Error al actualizar la contraseña',
            position: 'top-right',
            icon: 'error'
        })
    } finally {
        loadingPassword.value = false
    }
}

onMounted(() => {
    initUserData()
})
</script>

<style scoped lang="scss">
.profile-page {
    --profile-surface: #ffffff;
    --profile-card: #ffffff;
    --profile-input-bg: #ffffff;
    --profile-text: #202124;
    --profile-text-muted: #5f6368;
    --profile-border: rgba(0, 0, 0, 0.06);
    --profile-strength-bg: #f8f9fa;
    --profile-icon-bg-start: color-mix(in srgb, var(--q-primary) 12%, white);
    --profile-icon-bg-end: color-mix(in srgb, var(--q-primary) 22%, white);

    background: #f5f7fa;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 2rem 1rem;
}

.profile-page.is-dark {
    --profile-surface: #1e1e1e;
    --profile-card: #242424;
    --profile-input-bg: #1a1a1a;
    --profile-text: #ffffff;
    --profile-text-muted: #888888;
    --profile-border: rgba(255, 255, 255, 0.06);
    --profile-strength-bg: #1a1a1a;
    --profile-icon-bg-start: rgba(255, 255, 255, 0.06);
    --profile-icon-bg-end: rgba(255, 255, 255, 0.1);

    background: var(--profile-surface);
}

.profile-container {
    max-width: 890px;
    width: 100%;
    margin: 0 auto;
}

.profile-header-section {
    background: var(--q-primary);
    border-radius: 14px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 6px color-mix(in srgb, var(--q-primary) 25%, transparent);
}

.header-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
}

.profile-avatar {
    border: 2px solid rgba(255, 255, 255, 0.25);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.10);
    width: 90px;
    height: 90px;
    font-size: 1.1rem;
    flex-shrink: 0;
}

.avatar-placeholder {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 700;
    color: white;
}

.header-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.35rem;
}

.user-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin: 0;
    letter-spacing: -0.5px;
    line-height: 1.2;
}

.user-email {
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
    line-height: 1.3;
}

.user-meta {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-top: 0.25rem;
}

.profile-tabs {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    background: var(--profile-card);
    padding: 0.5rem;
    border-radius: 14px;
    border: 1px solid var(--profile-border);
    box-shadow: none;
}

.tab-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1rem;
    border: none;
    background: transparent;
    color: var(--profile-text-muted);
    font-size: 0.95rem;
    font-weight: 500;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.tab-button:hover {
    background: color-mix(in srgb, var(--q-primary) 8%, transparent);
    color: var(--q-primary);
}

.tab-button.active {
    background: var(--q-primary);
    color: white;
    box-shadow: 0 1px 4px color-mix(in srgb, var(--q-primary) 35%, transparent);
}

.profile-content {
    background: var(--profile-card);
    border-radius: 14px;
    padding: 2rem;
    border: 1px solid var(--profile-border);
    box-shadow: none;
    min-height: 550px;
    display: flex;
    flex-direction: column;
}

.content-section {
    animation: fadeIn 0.3s ease;
    flex: 1;
    display: flex;
    flex-direction: column;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.section-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--profile-text);
    margin: 0 0 0.5rem 0;
    text-align: center;
}

.section-subtitle {
    font-size: 0.95rem;
    color: var(--profile-text-muted);
    margin: 0 0 2rem 0;
    text-align: center;
}

/* Password Card */
/* Centrado del icono de contraseña */
.password-card {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.password-icon-wrap {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--profile-icon-bg-start) 0%, var(--profile-icon-bg-end) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
}

/* Form Styles */
.profile-form {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.field-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--profile-text);
}

.password-hint {
    font-size: 0.8rem;
    color: var(--profile-text-muted);
    margin-top: 0.25rem;
    line-height: 1.4;
}

.password-strength {
    margin: 1.5rem 0;
    padding: 1rem;
    background: var(--profile-strength-bg);
    border-radius: 8px;
    border: 1px solid var(--profile-border);
}

.strength-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--profile-text-muted);
    margin-bottom: 0.5rem;
}

.strength-bar {
    margin-bottom: 0.5rem;
}

.strength-text {
    font-size: 0.85rem;
    font-weight: 600;
    text-align: center;
}

.form-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: auto;
    padding-top: 1.5rem;
}

.entity-action-btn {
    border-radius: 8px;
    box-shadow: none !important;
    font-weight: 600;
    letter-spacing: 0.01em;
}

.profile-field {
    :deep(.q-field__input) {
        color: var(--profile-text);
    }

    :deep(.q-field__marginal),
    :deep(.q-field__counter) {
        color: var(--profile-text-muted);
    }
}

.profile-page.is-dark {
    .profile-header-section {
        background: var(--profile-card);
        border: 1px solid var(--profile-border);
        box-shadow: none;
    }

    .tab-button:hover {
        background: color-mix(in srgb, var(--q-primary) 14%, transparent);
    }

    .entity-action-btn.q-btn--outline {
        color: var(--profile-text-muted) !important;

        &:before {
            border-color: rgba(255, 255, 255, 0.12) !important;
        }

        &:hover:before {
            border-color: rgba(255, 255, 255, 0.2) !important;
        }
    }

    .profile-field {
        :deep(.q-field--outlined .q-field__control) {
            background: var(--profile-input-bg);
        }

        :deep(.q-field--outlined .q-field__control:before) {
            border-color: rgba(255, 255, 255, 0.08);
        }

        :deep(.q-field--error .q-field__control) {
            background: rgba(248, 113, 113, 0.07) !important;
        }

        :deep(.q-field--error .q-field__control:before) {
            border-color: rgba(252, 165, 165, 0.85) !important;
        }

        :deep(.q-field--error .q-field__label) {
            color: #fca5a5 !important;
        }

        :deep(.q-field__messages),
        :deep(.q-field__messages .text-negative),
        :deep(.q-field--error .q-field__bottom) {
            color: #fca5a5 !important;
            font-weight: 500;
        }

        :deep(.q-field__append .q-icon.text-negative) {
            color: #f87171 !important;
        }
    }
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Agregando media queries para pantallas menores de 15" (1366px) */
@media (max-width: 1366px) {

    /* Reducir padding general de la página */
    .profile-page {
        padding: 1rem 0.75rem;
    }

    /* Reducir espaciado del header */
    .profile-header-section {
        padding: 1rem;
        margin-bottom: 1rem;
    }

    /* Avatar más pequeño */
    .profile-avatar {
        width: 65px;
        height: 65px;
        font-size: 0.9rem;
    }

    .avatar-placeholder {
        font-size: 1.5rem;
    }

    /* Reducir gap del header content */
    .header-content {
        gap: 1rem;
    }

    /* Reducir tamaños de fuente del header */
    .user-name {
        font-size: 1.15rem;
    }

    .user-email {
        font-size: 0.85rem;
    }

    /* Tabs más compactos */
    .profile-tabs {
        gap: 0.5rem;
        margin-bottom: 1rem;
        padding: 0.4rem;
    }

    .tab-button {
        padding: 0.6rem 0.75rem;
        font-size: 0.85rem;
        gap: 0.35rem;
    }

    /* Contenido más compacto */
    .profile-content {
        padding: 1.25rem;
        min-height: auto;
    }

    /* Títulos más pequeños */
    .section-title {
        font-size: 1.15rem;
        margin: 0 0 0.35rem 0;
    }

    .section-subtitle {
        font-size: 0.85rem;
        margin: 0 0 1.25rem 0;
    }

    /* Form grid más compacto */
    .form-grid {
        gap: 1rem;
        margin-bottom: 1.25rem;
    }

    .field-label {
        font-size: 0.8rem;
    }

    .password-hint {
        font-size: 0.75rem;
    }

    /* Password strength más compacto */
    .password-strength {
        margin: 1rem 0;
        padding: 0.75rem;
    }

    .strength-label {
        font-size: 0.8rem;
        margin-bottom: 0.35rem;
    }

    .strength-text {
        font-size: 0.8rem;
    }

    /* Form actions más compactos */
    .form-actions {
        gap: 0.75rem;
        padding-top: 1rem;
    }

    .entity-action-btn {
        padding: 0.5rem 1.15rem;
        font-size: 0.85rem;
    }

    /* Password icon más pequeño */
    .password-icon-wrap {
        width: 60px;
        height: 60px;
        margin-bottom: 1.25rem;
    }
}

/* Media query adicional para pantallas aún más pequeñas (tablets y móviles) */
@media (max-width: 768px) {
    .profile-page {
        padding: 0.75rem 0.5rem;
    }

    .profile-header-section {
        padding: 0.875rem;
    }

    .profile-avatar {
        width: 55px;
        height: 55px;
    }

    .avatar-placeholder {
        font-size: 1.25rem;
    }

    .user-name {
        font-size: 1rem;
    }

    .user-email {
        font-size: 0.8rem;
    }

    .profile-content {
        padding: 1rem;
    }

    .section-title {
        font-size: 1rem;
    }

    .section-subtitle {
        font-size: 0.8rem;
        margin: 0 0 1rem 0;
    }

    .form-grid {
        gap: 0.875rem;
        margin-bottom: 1rem;
    }

    .tab-button span {
        display: none;
    }

    .tab-button {
        padding: 0.6rem;
    }

    .form-actions {
        flex-direction: column;
    }

    .entity-action-btn {
        width: 100%;
    }
}
</style>
