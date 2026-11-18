<template>
    <div>
        <q-card flat class="maia-card investment-card">
            <q-inner-loading :showing="loading" />
            <q-form v-if="config" @submit.prevent="save">
                <q-card-section>
                    <InvestmentConfigForm v-model="config" :sources="sources" :disable="!canEdit" />
                </q-card-section>
                <q-card-actions v-if="canEdit" align="right">
                    <q-btn flat label="Restablecer" @click="config = defaultInvestmentConfig()">
                        <q-tooltip>Volver a la forma por defecto: costo de lo vendido, transferencias primero</q-tooltip>
                    </q-btn>
                    <q-btn unelevated color="primary" label="Guardar" type="submit" :loading="saving" />
                </q-card-actions>
            </q-form>
        </q-card>
        <div class="text-caption text-grey q-mt-sm">
            Cómo el cierre de feria saca la inversión de lo vendido. Es la forma por defecto del negocio; cada feria puede
            usar la suya al editarla en la pestaña Ferias.
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from 'src/boot/axios'
import InvestmentConfigForm from 'src/components/maia/InvestmentConfigForm.vue'
import { useAuthStore } from 'src/stores/auth-store'
import { Success } from 'src/assets/js/util/notify'
import { notifyApiError } from 'src/assets/js/util/maia'
import { defaultInvestmentConfig, normalizeInvestmentConfig } from 'src/assets/js/util/investment'

const emit = defineEmits(['saved'])

const authStore = useAuthStore()
const canEdit = computed(() => authStore.hasPermission('inversion.editar'))

const config = ref(null)
const sources = ref([])
const loading = ref(false)
const saving = ref(false)

const load = async () => {
    loading.value = true
    try {
        const { data } = await api.get('Settings/Investment')
        config.value = normalizeInvestmentConfig(data.config)
        sources.value = data.sources || []
    } catch (error) {
        notifyApiError(error)
    } finally {
        loading.value = false
    }
}

const save = async () => {
    saving.value = true
    try {
        const { data } = await api.put('Settings/Investment', { investment_config: config.value })
        config.value = normalizeInvestmentConfig(data.config)
        Success(data.message || 'Guardado')
        emit('saved', config.value)
    } catch (error) {
        notifyApiError(error)
    } finally {
        saving.value = false
    }
}

onMounted(load)
</script>

<style lang="scss" scoped>
.investment-card {
    max-width: 640px;
    min-height: 120px;
}
</style>
