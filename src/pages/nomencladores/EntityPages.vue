<template>
    <div class="q-pa-lg page-container" :class="{ 'is-dark': $q.dark.isActive }">
        <nav class="entity-breadcrumbs q-pb-md" aria-label="Ruta de navegación">
            <q-breadcrumbs :active-color="breadcrumbLinkColor" separator-color="grey-6">
                <q-breadcrumbs-el label="Inicio" to="/Inicio" />
                <q-breadcrumbs-el label="Datos de la Entidad" />
                <template #separator>
                    <q-icon name="chevron_right" size="15px" class="breadcrumb-separator" />
                </template>
            </q-breadcrumbs>
        </nav>

        <!-- Main Content -->
        <div class="row justify-center q-pt-md">
            <div class="col-12 col-md-10 col-lg-9">
                <q-card flat class="entity-card" :style="entityCardStyle">
                    <q-card-section class="entity-card-body">
                        <q-form ref="myForm">

                            <!-- Form Header -->
                            <div class="row items-center q-mb-md q-pb-sm border-bottom">
                                <div class="col-auto">
                                    <q-avatar size="48px" class="entity-header-icon">
                                        <q-icon name="business" size="26px" color="primary" />
                                    </q-avatar>
                                </div>
                                <div class="col q-ml-md">
                                    <div class="text-h5 text-weight-medium q-mb-xs header-title">Datos de la Entidad</div>
                                    <div class="text-body2 header-subtitle">Complete la información requerida</div>
                                </div>
                            </div>

                            <div class="entity-form-layout q-mb-md q-pt-md">
                                <div class="entity-logo-column">
                                    <q-file ref="logoFileInput" v-model="logo" label="Seleccionar logo"
                                        max-file-size="2097152" max-files="1" accept=".jpg, .png, .svg"
                                        @update:model-value="onFileSelected" @rejected="onRejected"
                                        class="entity-logo-hidden-input" :display-value="logoDisplayValue" dense
                                        :error="!!logoError" :error-message="logoError" />

                                    <div class="entity-logo-frame cursor-pointer" @click="triggerLogoPicker">
                                        <q-img v-if="previewUrl" :src="previewUrl" spinner-color="primary"
                                            class="entity-logo-image" @error="handleImageError">
                                            <template v-slot:error>
                                                <div class="entity-logo-placeholder text-center text-red">
                                                    <q-icon name="error" size="28px" />
                                                    <div class="text-caption">Error al cargar</div>
                                                </div>
                                            </template>
                                        </q-img>
                                        <div v-else class="entity-logo-placeholder">
                                            <q-icon name="image" size="58px" color="grey-5" />
                                        </div>

                                        <button type="button" class="entity-logo-action"
                                            @click.stop="hasLogo ? removeLogo() : triggerLogoPicker()"
                                            :aria-label="hasLogo ? 'Quitar logo' : 'Agregar logo'">
                                            <q-icon :name="hasLogo ? 'close' : 'add'" :size="hasLogo ? '12px' : '16px'"
                                                color="white" />
                                        </button>
                                    </div>

                                    <div class="entity-logo-caption">Logo de la entidad</div>

                                    <div v-if="logoError" class="entity-logo-error text-negative text-caption">
                                        {{ logoError }}
                                    </div>
                                </div>

                                <div class="entity-fields-column">
                                    <div class="row q-col-gutter-md q-pt-xs">
                                        <div class="col-12 col-md-6">
                                            <q-input outlined v-model="object.code" label="Código *"
                                                :dark="$q.dark.isActive"
                                                :rules="[string, onlyLetter_Number]" maxlength="5" counter
                                                class="entity-field text-body1"
                                                input-style="font-size: 13px;" label-style="font-size: 14px;" dense>
                                                <template v-slot:prepend>
                                                    <q-icon name="vpn_key" color="primary" size="22px" />
                                                </template>
                                            </q-input>
                                        </div>

                                        <div class="col-12 col-md-6">
                                            <q-input outlined v-model="object.abbr" label="Abreviatura *"
                                                :dark="$q.dark.isActive"
                                                :rules="[string, onlyLetter_Number]" maxlength="10" counter
                                                class="entity-field text-body1"
                                                input-style="font-size: 13px;" label-style="font-size: 14px;" dense>
                                                <template v-slot:prepend>
                                                    <q-icon name="short_text" color="primary" size="22px" />
                                                </template>
                                            </q-input>
                                        </div>
                                    </div>

                                    <div class="row q-col-gutter-md q-mt-sm">
                                        <div class="col-12 col-md-12">
                                            <q-input outlined v-model="object.name" label="Nombre de la entidad *"
                                                :dark="$q.dark.isActive"
                                                :rules="[string, onlyLetter_Number]" maxlength="60" counter
                                                class="entity-field text-body1"
                                                input-style="font-size: 13px;" label-style="font-size: 14px;" dense>
                                                <template v-slot:prepend>
                                                    <q-icon name="business" color="primary" size="22px" />
                                                </template>
                                            </q-input>
                                        </div>


                                        <div class="col-12 col-md-12">
                                            <q-input outlined v-model="object.email" label="Correo electrónico *"
                                                :dark="$q.dark.isActive"
                                                :rules="[string, email]" maxlength="60" counter type="email"
                                                class="entity-field text-body1"
                                                input-style="font-size: 13px;" label-style="font-size: 14px;" dense>
                                                <template v-slot:prepend>
                                                    <q-icon name="email" color="primary" size="22px" />
                                                </template>
                                            </q-input>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Form Actions -->
                            <div class="row justify-end q-gutter-md q-pt-md">
                                <q-btn color="primary" label="Guardar" @click="save" :disable="!allFieldsFilled"
                                    icon="save" no-caps size="md" class="q-px-md q-py-sm text-body1 entity-action-btn" />
                                <q-btn outline color="primary" type="reset" label="Cancelar" @click="resetForm"
                                    icon="cancel" no-caps size="md" class="q-px-md q-py-sm text-body1 entity-action-btn" />
                            </div>
                        </q-form>
                    </q-card-section>
                </q-card>
            </div>
        </div>
        <!-- DialogLoad component for loading indicator -->
        <DialogLoad :dialogLoad="dialogLoad" />
    </div>
</template>

<script setup>
// IMPORT LIBRERIES
import {
    loadGet,
    saveData,
    deleteItem,
    getItem,
    closeDialog,
} from 'src/assets/js/util/funciones'
import { onlyLetter_Number, string, email } from 'src/assets/js/util/validator_form'
import { Error } from "src/assets/js/util/notify";
import { Error_Notify_DelecteObject } from "src/assets/js/util/dicc_notify";
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

// IMPORT COMPONENTS
import DialogLoad from 'src/components/dialog_boxes/DialogLoad.vue';

// IMPORT HOOKS
import { ref, onMounted, reactive, computed, nextTick } from "vue";
import { useAuthStore } from 'src/stores/auth-store'

const $q = useQuasar();
const authStore = useAuthStore()

const items = ref([]);
const dialog = ref(false);
const dialogLoad = ref(false);
const isDeleteDialogOpen = ref(false);
const myForm = ref(null);
const logoFileInput = ref(null);
const selectedElementId = ref('');
const tab = ref('datos');
const logo = ref(null);
const previewUrl = ref(null);
const logoFileName = ref('');
const logoError = ref('');
const current_logo_string = ref(null);

const getApiBaseUrl = () => {
    const fullUrl = import.meta.env.VITE_API_URL ||
        process.env.VITE_API_URL ||
        api.defaults.baseURL ||
        'http://127.0.0.1:8000/api'
    return fullUrl.replace(/\/api\/?$/, '')
}

const buildLogoUrl = (logoPath) => {
    if (!logoPath) {
        return null;
    }

    if (/^https?:\/\//.test(logoPath)) {
        return logoPath;
    }

    const fileName = logoPath.split('/').pop();
    const fullUrl = `${getApiBaseUrl()}/entity_logos/${fileName}`;
    return fullUrl;
}

/**
 * Opens the native file picker from the avatar area.
 */
const triggerLogoPicker = () => {
    const fileInput = logoFileInput.value?.$el?.querySelector('input[type="file"]');
    fileInput?.click();
}

const onFileSelected = (file) => {
    logoError.value = ''; // Clear previous error

    if (file instanceof File) {
        if (file.size > 2097152) { // 2MB bytes
            logoError.value = 'El tamaño del archivo del logotipo no debe superar los 2 MB.';
            previewUrl.value = null;
            logoFileName.value = file.name;
            logo.value = null;
            current_logo_string.value = null;
            return;
        }
        // New file selected by the user
        logo.value = file;
        current_logo_string.value = null;
        logoFileName.value = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            previewUrl.value = e.target.result;
        };
        reader.readAsDataURL(file);
    } else if (file === null || file === undefined) {
        // Removed file by user
        logoFileName.value = '';
        previewUrl.value = null;
        logoError.value = '';
        logo.value = null;
        current_logo_string.value = null;
    }
}

const onRejected = (rejectedEntries) => {
    if (rejectedEntries && rejectedEntries.length > 0) {
        if (rejectedEntries[0].failedPropValidation === 'max-file-size') {
            logoError.value = 'El tamaño del archivo del logotipo no debe superar los 2 MB.';
        } else {
            logoError.value = 'Archivo no válido';
        }
    }
};

const removeLogo = () => {
    logo.value = null;
    current_logo_string.value = null;
    previewUrl.value = null;
    logoFileName.value = '';
    logoError.value = '';
}

const handleImageError = (error) => {
    console.error('Image load error:', error);
}

const initialObject = {
    name: null,
    abbr: null,
    code: null,
    email: null,
    state: true
}

const object = reactive({ ...initialObject });
const originalEntity = ref(null);

// Computed properties
const hasLogo = computed(() => {
    return (logo.value instanceof File) || (!!current_logo_string.value);
});

const logoDisplayValue = computed(() => {
    if (logo.value instanceof File) {
        return logo.value.name;
    } else if (current_logo_string.value) {
        return logoFileName.value || current_logo_string.value.split('/').pop();
    }
    return '';
});

const isChanged = computed(() => {
    if (!originalEntity.value) return true;
    if (object.name !== originalEntity.value.name) return true;
    if (object.abbr !== originalEntity.value.abbr) return true;
    if (object.code !== originalEntity.value.code) return true;
    if (object.email !== originalEntity.value.email) return true;
    if (object.state !== originalEntity.value.state) return true;

    // Logo changed if a new File is selected
    if (logo.value instanceof File) return true;

    // Or if the stored logo string differs from the original
    const original_logo = originalEntity.value.logo || null;
    const current_logo = current_logo_string.value || null;
    if (original_logo !== current_logo) return true;

    return false;
});

const allFieldsFilled = computed(() => {
    return object.name && object.abbr && object.code && object.email && isChanged.value;
});

const canSeeEntity = computed(() => {
    return authStore.hasAnyPermission(['entidads.crear', 'entidads.editar'])
})

const breadcrumbLinkColor = computed(() => (
    $q.dark.isActive ? 'white' : 'grey-7'
))

const entityCardStyle = computed(() => {
    if ($q.dark.isActive) {
        return {
            background: '#242424',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.35)',
        }
    }

    return {
        background: '#ffffff',
        color: '#1a1a2e',
        border: '1px solid rgba(15, 23, 42, 0.06)',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
    }
})

// Function to load the existing entity
const loadExistingEntity = async () => {
    try {
        const entities = await loadGet('entities');
        items.value = entities ?? [];

        if (entities && entities.length > 0) {
            const entity = entities[0];

            Object.assign(object, entity);
            originalEntity.value = { ...entity };

            if (entity.logo) {

                // Store the original logo path separately and don't assign it to QFile model
                current_logo_string.value = entity.logo;
                logoFileName.value = entity.logo.split('/').pop();
                previewUrl.value = buildLogoUrl(entity.logo);

                await nextTick();
                // Ensure QFile model is null (QFile expects File/FileList/Array/null)
                logo.value = null;
            } else {
                current_logo_string.value = null;
                resetLogoValues();
            }
        } else {
            originalEntity.value = { ...initialObject };
            resetLogoValues();
        }
    } catch (error) {
        console.error('Error loading entity:', error);
        resetLogoValues();
    }
};

const resetLogoValues = () => {
    logo.value = null;
    previewUrl.value = null;
    logoFileName.value = '';
};

onMounted(async () => {
    dialogLoad.value = true;

    try {
        await loadExistingEntity();
    } finally {
        dialogLoad.value = false;
    }
});

const save = async () => {
    dialogLoad.value = true; // Show loading dialog
    try {
        // Create a shallow copy (payload) so we don't mutate the reactive `object` while saving
        const payload = { ...object };
        // Prepare logo to send: File when user selected one, otherwise send stored string or null
        if (logo.value instanceof File) {
            payload.logo = logo.value;
        } else if (!hasLogo.value && originalEntity.value && originalEntity.value.logo) {
            // User removed existing logo -> send delete flag so backend removes it
            payload.logo = null;
            payload.delete_logo = '1';
        } else {
            payload.logo = current_logo_string.value ?? null;
        }
        const url = payload.id ? `entities` : 'entities';
        // Pass `false` for shouldClose so the form isn't reset while we reload
        await saveData(url, payload, load, close, dialogLoad, false);
        // After save, reload entity to get fresh stored values
        await loadExistingEntity();
    } finally {
        dialogLoad.value = false; // Hide loading dialog
    }
}

const load = async () => {
    items.value = await loadGet('entities');
}

const close = async () => {
    closeDialog(object, initialObject, myForm, dialog);
}

const resetForm = () => {
    object.name = null;
    object.abbr = null;
    object.code = null;
    object.email = null;
    object.state = true;
    resetLogoValues();
    if (myForm.value && typeof myForm.value.resetValidation === 'function') {
        myForm.value.resetValidation();
    }
};

</script>

<style scoped lang="scss">
.page-container {
    --entity-surface: #ffffff;
    --entity-surface-muted: #f4f6fa;
    --entity-text: #1a1a2e;
    --entity-text-muted: #64748b;
    --entity-divider: rgba(15, 23, 42, 0.08);
    --entity-card-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);
    --entity-input-bg: #f4f6fa;
    --entity-input-border: rgba(15, 23, 42, 0.1);
    --entity-logo-ring: rgba(255, 255, 255, 0.95);
    --entity-logo-bg: radial-gradient(circle at top, #ffffff 0%, #eef3f8 100%);
    --entity-logo-placeholder-bg: linear-gradient(180deg, #f9fbfd 0%, #eef3f8 100%);
    --breadcrumb-link: #475569;
    --breadcrumb-link-hover: #1e293b;
    --breadcrumb-active: var(--q-primary);
    --breadcrumb-separator: #94a3b8;

    min-height: 100%;
    background: transparent;
    transition: color 0.25s ease;
}

.page-container.is-dark {
    --entity-surface: #242424;
    --entity-surface-muted: #1a1a1a;
    --entity-text: #ffffff;
    --entity-text-muted: #888888;
    --entity-divider: rgba(255, 255, 255, 0.06);
    --entity-card-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
    --entity-input-bg: #1a1a1a;
    --entity-input-border: rgba(255, 255, 255, 0.06);
    --entity-logo-ring: rgba(255, 255, 255, 0.04);
    --entity-logo-bg: #1a1a1a;
    --entity-logo-placeholder-bg: #1a1a1a;
    --breadcrumb-link: rgba(255, 255, 255, 0.72);
    --breadcrumb-link-hover: #ffffff;
    --breadcrumb-active: var(--q-primary);
    --breadcrumb-separator: rgba(255, 255, 255, 0.28);
}

.entity-breadcrumbs {
    :deep(.q-breadcrumbs) {
        font-size: 0.875rem;
        line-height: 1.2;
    }

    /* Quasar pinta los enlaces intermedios con active-color (text-white / text-grey-7) */
    :deep(.q-breadcrumbs__el) {
        font-weight: 500;
        letter-spacing: 0.01em;
        transition: color 0.2s ease, opacity 0.2s ease;
    }

    :deep(.q-link) {
        cursor: pointer;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
            text-underline-offset: 3px;
            opacity: 0.9;
        }
    }

    /* Solo la página actual: color primario */
    :deep(.q-breadcrumbs--last) {
        color: var(--breadcrumb-active) !important;

        .q-breadcrumbs__el {
            color: inherit !important;
            font-weight: 600;
            cursor: default;
            pointer-events: none;
        }
    }

    :deep(.q-breadcrumbs__separator) {
        color: var(--breadcrumb-separator) !important;
        opacity: 1;
    }

    .breadcrumb-separator {
        color: var(--breadcrumb-separator) !important;
        margin: 0 2px;
    }
}

.page-container.is-dark .entity-breadcrumbs {
    :deep(.text-white) {
        opacity: 0.78;

        &:hover {
            opacity: 1;
        }
    }
}

.entity-card {
    border-radius: 14px;
    overflow: hidden;
    transition: background-color 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.entity-card-body {
    padding: 28px 32px;
}

.entity-header-icon {
    background: rgba(0, 0, 0, 0.05);
}

.page-container.is-dark .entity-header-icon {
    background: rgba(255, 255, 255, 0.04);
}

.entity-field {
    :deep(.q-field__control) {
        border-radius: 10px;
    }

    :deep(.q-field--outlined .q-field__control) {
        background: var(--entity-input-bg) !important;
    }

    :deep(.q-field--outlined .q-field__control:before) {
        border-color: var(--entity-input-border) !important;
    }

    :deep(.q-field--focused .q-field__control:before) {
        border-color: var(--q-primary) !important;
    }

    :deep(.q-field__label),
    :deep(.q-field__native),
    :deep(.q-field__input) {
        color: var(--entity-text) !important;
    }

    :deep(.q-field__marginal),
    :deep(.q-field__counter) {
        color: var(--entity-text-muted) !important;
    }
}

.entity-action-btn {
    border-radius: 8px;
    box-shadow: none !important;
    font-weight: 600;
    letter-spacing: 0.01em;
}

.page-container.is-dark .entity-action-btn.q-btn--outline {
    color: var(--entity-text-muted) !important;

    &:before {
        border-color: rgba(255, 255, 255, 0.12) !important;
    }

    &:hover:before {
        border-color: rgba(255, 255, 255, 0.2) !important;
    }
}

.header-title {
    color: var(--entity-text) !important;
    transition: color 0.25s ease;
}

.header-subtitle {
    color: var(--entity-text-muted);
    transition: color 0.25s ease;
}

.border-bottom {
    border-bottom: 1px solid var(--entity-divider);
}

.entity-form-layout {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 28px;
    align-items: start;
}

.entity-logo-column {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.entity-logo-frame {
    position: relative;
    width: 184px;
    height: 184px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--entity-logo-bg);
    border: 6px solid var(--entity-logo-ring);
    box-shadow: none;
    transition: background 0.25s ease, border-color 0.25s ease;
}

.entity-logo-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.entity-logo-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 8px;
    color: var(--entity-text-muted);
    background: var(--entity-logo-placeholder-bg);
}

.entity-logo-caption {
    margin-top: 16px;
    margin-bottom: 12px;
    font-size: 14px;
    color: var(--entity-text-muted);
    text-align: center;
}

.entity-logo-hidden-input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
    pointer-events: none;
}

.entity-fields-column {
    min-width: 0;
}

.entity-logo-action {
    position: absolute;
    left: 50%;
    bottom: 12px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: transform 0.15s ease;
    background: var(--q-primary);
    box-shadow: none;
}

.entity-logo-action:hover {
    transform: translateX(-50%) scale(1.06);
}

.entity-logo-error {
    max-width: 220px;
    text-align: center;
}

@media (max-width: 767px) {
    .entity-form-layout {
        grid-template-columns: 1fr;
        gap: 20px;
    }

    .entity-logo-frame {
        width: 156px;
        height: 156px;
    }
}
</style>
