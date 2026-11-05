<template>
    <div class="lp-wrapper">
        <!-- Artistic panel -->
        <aside class="lp-art">
            <svg class="lp-art-svg" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <defs>
                    <filter id="lpWatercolor" x="-30%" y="-30%" width="160%" height="160%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="4" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="60" xChannelSelector="R" yChannelSelector="G" result="warp" />
                        <feGaussianBlur in="warp" stdDeviation="5" />
                    </filter>
                    <radialGradient id="lpWine" cx="50%" cy="50%" r="50%">
                        <stop offset="0" stop-color="#a33445" stop-opacity="0.95" />
                        <stop offset="0.6" style="stop-color: var(--maia-wine)" stop-opacity="0.55" />
                        <stop offset="1" style="stop-color: var(--maia-wine-deep)" stop-opacity="0" />
                    </radialGradient>
                    <radialGradient id="lpGold" cx="50%" cy="50%" r="50%">
                        <stop offset="0" stop-color="#ecd29a" stop-opacity="0.85" />
                        <stop offset="1" style="stop-color: var(--maia-gold)" stop-opacity="0" />
                    </radialGradient>
                    <radialGradient id="lpRose" cx="50%" cy="50%" r="50%">
                        <stop offset="0" stop-color="#d07c8a" stop-opacity="0.7" />
                        <stop offset="1" style="stop-color: var(--maia-wine)" stop-opacity="0" />
                    </radialGradient>
                    <linearGradient id="lpStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" style="stop-color: var(--maia-gold)" stop-opacity="0" />
                        <stop offset="0.4" style="stop-color: var(--maia-gold-light)" />
                        <stop offset="0.75" style="stop-color: var(--maia-gold-pale)" />
                        <stop offset="1" style="stop-color: var(--maia-gold)" stop-opacity="0" />
                    </linearGradient>
                </defs>
                <g filter="url(#lpWatercolor)">
                    <ellipse cx="470" cy="120" rx="260" ry="200" fill="url(#lpWine)" />
                    <ellipse cx="90" cy="60" rx="230" ry="150" fill="url(#lpGold)" opacity="0.55" />
                    <ellipse cx="520" cy="560" rx="200" ry="170" fill="url(#lpRose)" opacity="0.6" />
                    <ellipse cx="60" cy="700" rx="240" ry="150" fill="url(#lpWine)" opacity="0.6" />
                    <ellipse cx="300" cy="420" rx="120" ry="80" fill="url(#lpGold)" opacity="0.25" />
                </g>
                <path d="M -20 520 C 120 430, 240 610, 380 500 S 560 380, 640 450" fill="none" stroke="url(#lpStroke)" stroke-width="3" stroke-linecap="round" />
                <path d="M 0 555 C 140 470, 260 640, 400 540" fill="none" stroke="url(#lpStroke)" stroke-width="1.2" stroke-linecap="round" opacity="0.6" />
                <circle cx="470" cy="330" r="4" style="fill: var(--maia-gold-light)" opacity="0.8" />
                <circle cx="488" cy="346" r="2" style="fill: var(--maia-gold-pale)" opacity="0.7" />
                <circle cx="452" cy="352" r="1.6" style="fill: var(--maia-gold-light)" opacity="0.6" />
                <circle cx="120" cy="260" r="2.4" style="fill: var(--maia-gold-pale)" opacity="0.5" />
            </svg>

            <div class="lp-art-content">
                <img class="lp-logo" :src="brandStore.logoUrl" :alt="brandStore.name" />
                <BrandName class="lp-brand" />
                <MaiaOrnament :width="220" class="lp-ornament" />
                <p class="lp-quote">"El arte no es lo que ves, sino lo que haces ver a los demás."</p>
                <p class="lp-quote-author">Edgar Degas</p>
            </div>
            <p v-if="brandStore.tagline" class="lp-art-footer">{{ brandStore.tagline }}</p>
        </aside>

        <!-- Form -->
        <main class="lp-main">
            <div class="lp-card">
                <div class="lp-header">
                    <img class="lp-logo lp-logo--small lt-md" :src="brandStore.logoUrl" :alt="brandStore.name" />
                    <span class="lp-kicker">Gestión de ferias</span>
                    <span class="lp-title">Bienvenido</span>
                    <span class="lp-subtitle">Ingresa tus credenciales para continuar</span>
                </div>

                <form @submit.prevent="handleLogin" class="lp-form">
                    <div class="lp-field">
                        <label class="lp-label">Nombre de usuario</label>
                        <div class="lp-input-wrap">
                            <q-icon name="person" size="18px" class="lp-icon-left" />
                            <input
                                v-model="username"
                                type="text"
                                autocomplete="username"
                                :disabled="isLoading"
                                placeholder="Tu nombre de usuario"
                                class="lp-input"
                                :class="{ 'lp-input--error': usernameError }"
                            />
                        </div>
                        <span v-if="usernameError" class="lp-error">{{ usernameError }}</span>
                    </div>

                    <div class="lp-field">
                        <label class="lp-label">Contraseña</label>
                        <div class="lp-input-wrap">
                            <q-icon name="lock" size="18px" class="lp-icon-left" />
                            <input
                                v-model="password"
                                :type="showPassword ? 'text' : 'password'"
                                autocomplete="current-password"
                                :disabled="isLoading"
                                placeholder="Tu contraseña"
                                class="lp-input lp-input--pr"
                                :class="{ 'lp-input--error': passwordError }"
                            />
                            <button
                                type="button"
                                tabindex="-1"
                                @click="showPassword = !showPassword"
                                class="lp-toggle-pw"
                            >
                                <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" size="18px" />
                            </button>
                        </div>
                        <span v-if="passwordError" class="lp-error">{{ passwordError }}</span>
                    </div>

                    <button type="submit" :disabled="isLoading || !username || !password" class="lp-btn">
                        <q-spinner-dots v-if="isLoading" size="20px" />
                        <template v-else>Iniciar sesión</template>
                    </button>
                </form>
            </div>

            <p class="lp-footer">© {{ currentYear }} {{ brandStore.name }}. Todos los derechos reservados.</p>
        </main>
    </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth-store';
import MaiaOrnament from 'src/components/maia/MaiaOrnament.vue';
import BrandName from 'src/components/maia/BrandName.vue';
import { useBrandStore } from 'src/stores/brand-store';
import { apiErrorMessage } from 'src/assets/js/util/maia';

export default {
    name: 'LoginPage',
    components: { MaiaOrnament, BrandName },

    setup() {
        const router = useRouter();
        const $q = useQuasar();
        const authStore = useAuthStore();
        const brandStore = useBrandStore();
        const currentYear = new Date().getFullYear();

        const username = ref('');
        const password = ref('');
        const showPassword = ref(false);
        const isLoading = ref(false);
        const usernameError = ref('');
        const passwordError = ref('');

        /**
         * Validate form fields and set error messages.
         *
         * @returns {boolean} True if valid, false otherwise.
         */
        const validate_form = () => {
            usernameError.value = '';
            passwordError.value = '';
            let is_valid = true;

            if (!username.value.trim()) {
                usernameError.value = 'Nombre de usuario es requerido.';
                is_valid = false;
            }
            if (!password.value) {
                passwordError.value = 'Contraseña es requerida.';
                is_valid = false;
            }
            return is_valid;
        };

        /**
         * Handle login form submission.
         *
         * @returns {Promise<void>}
         */
        const handleLogin = async () => {
            if (!validate_form()) return;

            isLoading.value = true;

            try {
                await authStore.login(username.value, password.value);

                $q.notify({
                    type: 'positive',
                    message: '¡Inicio de sesión exitoso!',
                    position: 'top-right',
                    timeout: 2000,
                });

                const redirectTo = router.currentRoute.value.query.redirect || '/';
                router.push(redirectTo);
            } catch (error) {
                const errorMessage = error.response?.data?.errors?.username?.[0] ||
                    (error.response ? apiErrorMessage(error) : 'No se pudo conectar con el servidor. Verifique que esté encendido.');

                $q.notify({
                    type: 'negative',
                    message: errorMessage,
                    position: 'top-right',
                    timeout: 3000,
                });
            } finally {
                isLoading.value = false;
            }
        };

        return {
            brandStore,
            currentYear,
            username,
            password,
            showPassword,
            isLoading,
            usernameError,
            passwordError,
            handleLogin,
        };
    },
};
</script>

<style scoped lang="scss">
.lp-wrapper {
    position: fixed;
    inset: 0;
    display: flex;
    font-family: $maia-sans;
    background: $maia-ivory;
}

/* === Artistic panel === */
.lp-art {
    position: relative;
    flex: 0 0 46%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: linear-gradient(160deg, #{$maia-ink} 0%, #{$maia-wine-deep} 55%, #{$maia-ink-2} 100%);
    color: var(--maia-ivory);

    @media (max-width: 1023px) {
        display: none;
    }
}

.lp-art-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}

.lp-art-content {
    position: relative;
    z-index: 1;
    padding: 0 12%;
}

.lp-logo {
    width: 148px;
    height: 148px;
    object-fit: contain;
    margin-bottom: 18px;
    filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.45));

    &--small {
        width: 64px;
        height: 64px;
        margin: 0 auto 14px;
        display: block;
        border-radius: 50%;
        object-fit: cover;
        object-position: center 28%;
        border: 2px solid $maia-gold-light;
        background: #0a0a0a;
    }
}

.lp-brand {
    display: block;
    font-family: $maia-serif;
    font-size: clamp(2.8rem, 4.5vw, 4rem);
    font-weight: 600;
    line-height: 1;
    text-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);

    :deep(em) {
        font-weight: 500;
        color: var(--maia-gold-bright);
    }
}

.lp-ornament {
    margin: 22px 0 22px -8px;
}

.lp-quote {
    max-width: 380px;
    margin: 0;
    font-family: $maia-serif;
    font-style: italic;
    font-size: 1.12rem;
    line-height: 1.55;
    color: rgba(var(--maia-ivory-rgb), 0.88);
}

.lp-quote-author {
    margin: 10px 0 0;
    font-size: 0.72rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: $maia-gold-light;
}

.lp-art-footer {
    position: absolute;
    left: 12%;
    bottom: 28px;
    margin: 0;
    font-size: 0.7rem;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: rgba(var(--maia-gold-light-rgb), 0.75);
}

/* === Form side === */
.lp-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background:
        radial-gradient(ellipse 600px 400px at 100% 0%, rgba(var(--maia-gold-light-rgb), 0.14), transparent 70%),
        radial-gradient(ellipse 500px 380px at 0% 100%, rgba(var(--maia-wine-rgb), 0.08), transparent 70%),
        $maia-ivory;
}

.lp-card {
    width: 100%;
    max-width: 410px;
    padding: 40px 38px 34px;
    border-radius: 20px;
    background: #ffffff;
    border: 1px solid rgba(var(--maia-gold-rgb), 0.25);
    border-top: 3px solid $maia-gold;
    box-shadow: 0 24px 60px rgba(var(--maia-wine-deep-rgb), 0.12), 0 2px 6px rgba(var(--maia-wine-deep-rgb), 0.05);
}

.lp-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 30px;
}

.lp-kicker {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: $maia-gold;
}

.lp-title {
    margin-top: 6px;
    font-family: $maia-serif;
    font-size: 2rem;
    font-weight: 600;
    color: $maia-wine;
}

.lp-subtitle {
    margin-top: 6px;
    font-size: 0.86rem;
    color: #7b6a62;
}

.lp-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.lp-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.lp-label {
    font-size: 0.74rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #5c4a45;
}

.lp-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
}

.lp-icon-left {
    position: absolute;
    left: 14px;
    color: $maia-gold;
    pointer-events: none;
}

.lp-input {
    width: 100%;
    height: 48px;
    padding: 0 14px 0 42px;
    border-radius: 12px;
    border: 1px solid rgba(var(--maia-gold-rgb), 0.35);
    background: #fdfaf5;
    font-size: 0.95rem;
    color: #2b1d1f;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

    &::placeholder {
        color: #b3a597;
    }

    &:focus {
        border-color: $maia-gold;
        background: #ffffff;
        box-shadow: 0 0 0 4px rgba(var(--maia-gold-light-rgb), 0.2);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    &--pr {
        padding-right: 44px;
    }

    &--error {
        border-color: $negative;

        &:focus {
            box-shadow: 0 0 0 4px rgba(179, 38, 30, 0.15);
        }
    }
}

.lp-toggle-pw {
    position: absolute;
    right: 10px;
    display: flex;
    align-items: center;
    padding: 6px;
    border: none;
    background: none;
    color: #9c8a7f;
    cursor: pointer;
    border-radius: 8px;

    &:hover {
        color: $maia-wine;
    }
}

.lp-error {
    font-size: 0.76rem;
    color: $negative;
}

.lp-btn {
    position: relative;
    height: 50px;
    margin-top: 8px;
    border: none;
    border-radius: 12px;
    font-family: $maia-sans;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--maia-ivory);
    cursor: pointer;
    overflow: hidden;
    background: linear-gradient(135deg, #{$maia-wine-light} 0%, #{$maia-wine} 55%, #{$maia-wine-deep} 100%);
    box-shadow: 0 10px 24px rgba(var(--maia-wine-rgb), 0.3), inset 0 1px 0 rgba(var(--maia-gold-pale-rgb), 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: -60%;
        width: 40%;
        height: 100%;
        background: linear-gradient(100deg, transparent, rgba(var(--maia-gold-pale-rgb), 0.35), transparent);
        transform: skewX(-20deg);
        transition: left 0.6s ease;
    }

    &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 14px 30px rgba(var(--maia-wine-rgb), 0.36), 0 0 0 1px rgba(var(--maia-gold-light-rgb), 0.6);

        &::after {
            left: 120%;
        }
    }

    &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        box-shadow: none;
    }
}

.lp-footer {
    margin: 26px 0 0;
    font-size: 0.74rem;
    letter-spacing: 0.04em;
    color: #9c8a7f;
}

/* === Dark mode === */
body.body--dark {
    .lp-main {
        background:
            radial-gradient(ellipse 600px 400px at 100% 0%, rgba(var(--maia-gold-light-rgb), 0.08), transparent 70%),
            var(--q-dark-page);
    }

    .lp-card {
        background: var(--q-dark);
        border-color: rgba(var(--maia-gold-light-rgb), 0.2);
    }

    .lp-title {
        color: $maia-gold-light;
    }

    .lp-subtitle,
    .lp-label {
        color: #b3a597;
    }

    .lp-input {
        background: #2c2023;
        color: #f1e8dc;
        border-color: rgba(var(--maia-gold-light-rgb), 0.25);

        &:focus {
            background: #33262a;
        }
    }
}
</style>
