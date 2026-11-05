<template>
    <q-dialog v-model="abrirDialog" persistent>
        <q-card class="delete-dialog-card" :class="{ 'is-dark': $q.dark.isActive }" :style="dialogCardStyle">
            <q-card-section class="delete-dialog-header row items-center no-wrap">
                <q-avatar size="42px" class="delete-dialog-icon">
                    <q-icon name="warning" size="22px" color="primary" />
                </q-avatar>
                <div class="q-ml-md delete-dialog-title">
                    ¿Está seguro que desea eliminar el elemento seleccionado?
                </div>
            </q-card-section>

            <q-card-actions class="delete-dialog-actions" align="right">
                <q-btn color="primary" no-caps size="md" label="Aceptar"
                    class="q-px-md q-py-sm text-body1 entity-action-btn" @click="confirmarEliminacion" />
                <q-btn outline color="primary" no-caps size="md" label="Cancelar"
                    class="q-px-md q-py-sm text-body1 entity-action-btn" v-close-popup />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, computed } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true
    },
    idElemento: {
        type: Number,
        required: true
    }
})

const emit = defineEmits(['eliminar', 'closeDialog'])

const abrirDialog = ref(props.isOpen)

watch(() => props.isOpen, (value) => {
    abrirDialog.value = value
})

watch(abrirDialog, (newVal) => {
    if (!newVal) {
        emit('closeDialog')
    }
})

const dialogCardStyle = computed(() => {
    if ($q.dark.isActive) {
        return {
            background: '#242424',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        }
    }

    return {
        background: '#ffffff',
        color: '#1a1a2e',
        border: '1px solid rgba(15, 23, 42, 0.06)',
        boxShadow: '0 8px 32px rgba(15, 23, 42, 0.1)',
    }
})

const confirmarEliminacion = () => {
    emit('eliminar', props.idElemento)
    abrirDialog.value = false
    emit('closeDialog')
}
</script>

<style scoped lang="scss">
.delete-dialog-card {
    --dialog-text: #252932;
    --dialog-kicker: #9aa0ab;
    --dialog-divider: #eceef2;

    width: 560px;
    max-width: 92vw;
    border-radius: 14px;
    overflow: hidden;
}

.delete-dialog-card.is-dark {
    --dialog-text: #ffffff;
    --dialog-kicker: #888888;
    --dialog-divider: rgba(255, 255, 255, 0.06);
}

.delete-dialog-header {
    padding: 24px 28px 20px;
    border-bottom: 1px solid var(--dialog-divider);
}

.delete-dialog-icon {
    background: rgba(0, 0, 0, 0.05);
}

.delete-dialog-card.is-dark .delete-dialog-icon {
    background: rgba(255, 255, 255, 0.06);
}

.delete-dialog-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--dialog-text);
    line-height: 1.4;
}

.delete-dialog-actions {
    padding: 12px 28px 24px;
    gap: 10px;
}

.entity-action-btn {
    border-radius: 8px;
    box-shadow: none !important;
    font-weight: 600;
    letter-spacing: 0.01em;
}

.delete-dialog-card.is-dark .entity-action-btn.q-btn--outline {
    color: var(--dialog-kicker) !important;

    &:before {
        border-color: rgba(255, 255, 255, 0.12) !important;
    }

    &:hover:before {
        border-color: rgba(255, 255, 255, 0.2) !important;
    }
}

@media (max-width: 599px) {
    .delete-dialog-header,
    .delete-dialog-actions {
        padding-left: 20px;
        padding-right: 20px;
    }
}
</style>
