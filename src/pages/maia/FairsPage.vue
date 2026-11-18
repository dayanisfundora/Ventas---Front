<template>
    <q-page class="maia-page">
        <PageHeader title="Ferias y tasas" section="Configuración">
            <q-input v-if="tab === 'fairs'" dense outlined debounce="400" v-model="search" placeholder="Buscar" class="maia-field">
                <template #prepend><q-icon name="search" /></template>
            </q-input>
            <q-btn v-if="tab === 'fairs' && can('ferias.crear')" unelevated round color="primary" icon="add" @click="openFairDialog()">
                <q-tooltip>Nueva feria</q-tooltip>
            </q-btn>
            <q-btn v-if="tab === 'methods' && can('ferias.crear')" unelevated round color="primary" icon="add" @click="openMethodDialog()">
                <q-tooltip>Nueva forma de pago</q-tooltip>
            </q-btn>
            <q-btn v-if="tab === 'accounts' && can('ferias.crear')" unelevated round color="primary" icon="add" @click="openAccountDialog()">
                <q-tooltip>Nueva tarjeta</q-tooltip>
            </q-btn>
        </PageHeader>

        <q-tabs v-model="tab" dense align="left" active-color="primary" indicator-color="primary" class="q-mb-md" no-caps>
            <q-tab name="accounts" icon="credit_card" label="Tarjetas" />
            <q-tab name="methods" icon="payments" label="Formas de pago" />
            <q-tab v-if="canInvestment" name="investment" icon="savings" label="Configurar inversión" />
            <q-tab name="fairs" icon="storefront" label="Ferias" />
        </q-tabs>

        <q-tab-panels v-model="tab" animated class="bg-transparent">
            <q-tab-panel name="fairs" class="q-pa-none">
                <q-table flat class="maia-card maia-table" :rows="fairs" :columns="fairColumns" row-key="id" :loading="loading"
                    v-model:pagination="pagination" @request="onRequest" :rows-per-page-options="[10, 20, 50]"
                    no-data-label="No hay ferias" rows-per-page-label="Filas por página">
                    <template #body-cell-name="props">
                        <q-td :props="props">
                            <div class="text-weight-medium">
                                {{ props.row.name }}
                                <q-badge v-if="props.row.id === fairStore.fairId" color="primary" class="q-ml-xs" label="En uso" />
                            </div>
                            <div class="text-caption text-grey">{{ props.row.place }}</div>
                        </q-td>
                    </template>
                    <template #body-cell-status="props">
                        <q-td :props="props">
                            <q-badge :color="props.value === 'open' ? 'positive' : 'grey-7'" :label="props.value === 'open' ? 'Abierta' : 'Cerrada'" />
                        </q-td>
                    </template>
                    <template #body-cell-action="props">
                        <q-td :props="props" class="text-no-wrap">
                            <q-btn flat round dense color="primary" icon="play_circle" :disable="props.row.id === fairStore.fairId"
                                @click="useFair(props.row)"><q-tooltip>Trabajar con esta feria</q-tooltip></q-btn>
                            <q-btn flat round dense color="primary" icon="calendar_month" @click="openDays(props.row)">
                                <q-tooltip>Días y tasas</q-tooltip></q-btn>
                            <q-btn v-if="can('ferias.editar')" flat round dense color="primary" icon="edit" @click="openFairDialog(props.row)">
                                <q-tooltip>Editar</q-tooltip></q-btn>
                            <q-btn v-if="can('ferias.editar')" flat round dense :color="props.row.status === 'open' ? 'orange-8' : 'positive'"
                                :icon="props.row.status === 'open' ? 'lock' : 'lock_open'" @click="toggleStatus(props.row)">
                                <q-tooltip>{{ props.row.status === 'open' ? 'Cerrar feria' : 'Reabrir feria' }}</q-tooltip></q-btn>
                            <q-btn v-if="can('ferias.eliminar')" flat round dense color="negative" icon="delete" @click="removeFair(props.row)">
                                <q-tooltip>Eliminar</q-tooltip></q-btn>
                        </q-td>
                    </template>
                </q-table>
            </q-tab-panel>

            <q-tab-panel name="methods" class="q-pa-none">
                <q-table flat class="maia-card maia-table" :rows="methods" :columns="methodColumns" row-key="id" hide-pagination
                    :pagination="{ rowsPerPage: 0 }" no-data-label="No hay formas de pago. Agregue al menos efectivo y transferencias.">
                    <template #body-cell-state="props">
                        <q-td :props="props">
                            <q-toggle :model-value="!!props.row.state" :disable="!can('ferias.editar')"
                                @update:model-value="(v) => patchMethod(props.row, { state: v })" />
                        </q-td>
                    </template>
                    <template #body-cell-action="props">
                        <q-td :props="props" class="text-no-wrap">
                            <q-btn v-if="can('ferias.editar')" flat round dense color="primary" icon="edit"
                                @click="openMethodDialog(props.row)">
                                <q-tooltip>Editar</q-tooltip>
                            </q-btn>
                            <q-btn v-if="can('ferias.eliminar')" flat round dense color="negative" icon="delete"
                                @click="removeMethod(props.row)">
                                <q-tooltip>Eliminar</q-tooltip>
                            </q-btn>
                        </q-td>
                    </template>
                </q-table>
                <div class="text-caption text-grey q-mt-sm">
                    Estas formas de pago alimentan el select del punto de venta y de propinas.
                    Las transferencias deben tener una tarjeta; el cierre del día verifica por esa tarjeta.
                </div>
            </q-tab-panel>

            <q-tab-panel name="accounts" class="q-pa-none">
                <q-table flat class="maia-card maia-table" :rows="accounts" :columns="accountColumns" row-key="id" hide-pagination
                    :pagination="{ rowsPerPage: 0 }" no-data-label="No hay tarjetas. Créelas según las cuentas de su negocio.">
                    <template #body-cell-report_key="props">
                        <q-td :props="props">{{ props.value === 'fcbc' ? 'FCBC' : '—' }}</q-td>
                    </template>
                    <template #body-cell-state="props">
                        <q-td :props="props">
                            <q-toggle :model-value="!!props.row.state" :disable="!can('ferias.editar')"
                                @update:model-value="(v) => patchAccount(props.row, { state: v })" />
                        </q-td>
                    </template>
                    <template #body-cell-action="props">
                        <q-td :props="props" class="text-no-wrap">
                            <q-btn v-if="can('ferias.editar')" flat round dense color="primary" icon="edit"
                                @click="openAccountDialog(props.row)">
                                <q-tooltip>Editar</q-tooltip>
                            </q-btn>
                            <q-btn v-if="can('ferias.eliminar')" flat round dense color="negative" icon="delete"
                                @click="removeAccount(props.row)">
                                <q-tooltip>Eliminar</q-tooltip>
                            </q-btn>
                        </q-td>
                    </template>
                </q-table>
                <div class="text-caption text-grey q-mt-sm">
                    Ejemplos: Maia CUP, Fiscal, Banco X. Marque “FCBC” solo en la tarjeta que entra en el cálculo FCBC del cierre de feria.
                </div>
            </q-tab-panel>

            <q-tab-panel v-if="canInvestment" name="investment" class="q-pa-none">
                <InvestmentSettingsPanel @saved="(c) => (businessInvestment = c)" />
            </q-tab-panel>
        </q-tab-panels>

        <q-dialog v-model="methodDialog" persistent>
            <q-card class="maia-dialog" style="min-width: 360px; max-width: 440px">
                <q-card-section class="row items-center">
                    <div class="text-h6">{{ methodForm.id ? 'Editar forma de pago' : 'Nueva forma de pago' }}</div>
                    <q-space />
                    <q-btn flat round dense icon="close" v-close-popup />
                </q-card-section>
                <q-card-section class="column q-gutter-md">
                    <q-input class="maia-field" outlined dense label="Nombre" v-model="methodForm.name"
                        :rules="[(v) => !!v || 'Requerido']" hide-bottom-space />
                    <div>
                        <div class="kind-picker__label">Tipo</div>
                        <div class="kind-picker" role="radiogroup" aria-label="Tipo">
                            <button v-for="opt in kindOptions" :key="opt.value" type="button" role="radio"
                                class="kind-picker__opt" :class="{ 'is-active': methodForm.kind === opt.value }"
                                :aria-checked="methodForm.kind === opt.value" @click="methodForm.kind = opt.value">
                                <q-icon :name="opt.icon" size="18px" />
                                <span>{{ opt.label }}</span>
                            </button>
                        </div>
                    </div>
                    <q-select v-if="methodForm.kind === 'transfer'" class="maia-field" outlined dense emit-value map-options
                        label="Tarjeta *" :options="accountOptions" v-model="methodForm.account"
                        :rules="[(v) => !!v || 'Requerido']"
                        :hint="accountOptions.length ? 'Tarjeta o cuenta a la que entra la transferencia.' : 'No hay tarjetas activas: créelas en la pestaña Tarjetas.'"
                        hide-bottom-space />
                    <q-select class="maia-field" outlined dense emit-value map-options label="Moneda"
                        :options="currencyOptions" v-model="methodForm.currency" hide-bottom-space />
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" v-close-popup />
                    <q-btn unelevated color="primary" label="Guardar" :loading="savingMethod" @click="saveMethod" />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <q-dialog v-model="accountDialog" persistent>
            <q-card class="maia-dialog" style="min-width: 360px; max-width: 440px">
                <q-card-section class="row items-center">
                    <div class="text-h6">{{ accountForm.id ? 'Editar tarjeta' : 'Nueva tarjeta' }}</div>
                    <q-space />
                    <q-btn flat round dense icon="close" v-close-popup />
                </q-card-section>
                <q-card-section class="column q-gutter-md">
                    <q-input class="maia-field" outlined dense label="Nombre" v-model="accountForm.name"
                        :rules="[(v) => !!v || 'Requerido']" hide-bottom-space />
                    <q-input class="maia-field" outlined dense label="Código" v-model="accountForm.code"
                        hint="Opcional. Si lo deja vacío se genera del nombre." hide-bottom-space />
                    <q-select class="maia-field" outlined dense emit-value map-options clearable
                        label="Uso en reportes" :options="reportKeyOptions" v-model="accountForm.report_key"
                        hide-bottom-space />
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" v-close-popup />
                    <q-btn unelevated color="primary" label="Guardar" :loading="savingAccount" @click="saveAccount" />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- Fair dialog -->
        <q-dialog v-model="fairDialog" persistent>
            <q-card class="maia-dialog-card" style="width: 760px; max-width: 95vw">
                <q-form @submit.prevent="saveFair">
                    <q-card-section class="text-h6">{{ fairForm.id ? 'Editar feria' : 'Nueva feria' }}</q-card-section>
                    <q-card-section class="row q-col-gutter-md">
                        <q-input class="col-12 col-sm-7 maia-field" outlined dense label="Nombre *" v-model="fairForm.name" maxlength="120"
                            :rules="[(v) => !!v || 'Requerido']" />
                        <q-input class="col-12 col-sm-5 maia-field" outlined dense label="Lugar" v-model="fairForm.place" maxlength="120" />
                        <q-input class="col-6 col-sm-3 maia-field" outlined dense type="date" label="Inicio *" stack-label
                            v-model="fairForm.start_date" :rules="[(v) => !!v || 'Requerido']" />
                        <q-input class="col-6 col-sm-3 maia-field" outlined dense type="date" label="Fin" stack-label
                            v-model="fairForm.end_date" />
                        <div class="col-12 col-sm-6 flex items-center">
                            <q-checkbox v-if="!fairForm.id" v-model="fairForm.create_days" label="Crear un día por cada fecha" />
                        </div>

                        <div class="col-12 text-subtitle2 text-grey-8">Porcentajes</div>
                        <q-input class="col-4 maia-field" outlined dense type="number" step="0.01" label="% vendedor"
                            v-model.number="fairForm.seller_percent" suffix="%" hint="Porción del vendedor sobre la venta" />
                        <q-input class="col-4 maia-field" outlined dense type="number" step="0.01" label="% Maia (ganancia ref.)"
                            v-model.number="fairForm.maia_percent" suffix="%" />
                        <q-input class="col-4 maia-field" outlined dense type="number" step="0.01" label="% FCBC"
                            v-model.number="fairForm.fcbc_percent" suffix="%" />

                        <div class="col-12 text-subtitle2 text-grey-8">Tasas iniciales (CUP por unidad)</div>
                        <q-input v-for="r in RATES" :key="r.field" class="col-6 col-sm maia-field" outlined dense type="number" step="0.0001"
                            :label="r.label" v-model.number="fairForm[r.field]" :rules="[(v) => v > 0 || '> 0']" />

                        <q-select class="col-12 maia-field" outlined dense multiple use-chips emit-value map-options label="Trabajadores de la feria"
                            :options="workerOptions" v-model="fairForm.worker_ids" />

                        <div class="col-12">
                            <div class="text-subtitle2 text-grey-8">Inversión</div>
                            <q-toggle v-model="investmentInherit" label="Usar la forma del negocio" />
                            <div v-if="investmentInherit" class="text-caption text-grey q-pl-sm">
                                {{ businessInvestmentLabel }} (pestaña Configurar inversión)
                            </div>
                            <InvestmentConfigForm v-else v-model="investmentConfig" :sources="investmentSources" class="q-mt-sm" />
                        </div>

                        <q-input class="col-12 maia-field" outlined dense type="textarea" autogrow label="Notas" v-model="fairForm.notes" />
                    </q-card-section>
                    <q-card-actions align="right">
                        <q-btn flat label="Cancelar" v-close-popup />
                        <q-btn unelevated color="primary" label="Guardar" type="submit" :loading="saving" />
                    </q-card-actions>
                </q-form>
            </q-card>
        </q-dialog>

        <!-- Days dialog -->
        <q-dialog v-model="daysDialog" maximized-on-mobile>
            <q-card class="maia-dialog-card" style="width: 1000px; max-width: 96vw">
                <q-card-section class="row items-center">
                    <div class="text-h6">Días de {{ daysFair?.name }}</div>
                    <q-space />
                    <template v-if="can('ferias.editar')">
                        <q-input dense outlined type="date" v-model="newDayDate" class="maia-field q-mr-sm" style="width: 170px" />
                        <q-btn unelevated color="primary" icon="add" label="Añadir día" no-caps :disable="!newDayDate" @click="addDay" />
                    </template>
                    <q-btn flat round dense icon="close" class="q-ml-sm" v-close-popup />
                </q-card-section>
                <q-card-section class="q-pt-none">
                    <q-table flat dense class="maia-table" :rows="days" :columns="dayColumns" row-key="id" :loading="daysLoading"
                        hide-pagination :pagination="{ rowsPerPage: 0 }" no-data-label="Sin días">
                        <template #body-cell-date="props">
                            <q-td :props="props">
                                <div class="text-weight-medium">{{ formatDate(props.row.date) }}</div>
                                <div class="text-caption text-grey">{{ weekday(props.row.date) }}</div>
                            </q-td>
                        </template>
                        <template v-for="r in RATES" :key="r.field" #[`body-cell-${r.field}`]="props">
                            <q-td :props="props">
                                {{ props.value }}
                                <q-popup-edit v-if="can('ferias.editar') && props.row.status === 'open'" :model-value="props.row[r.field]"
                                    v-slot="scope" buttons label-set="Guardar" label-cancel="Cancelar"
                                    @save="(v) => updateDay(props.row, { [r.field]: v })">
                                    <q-input v-model.number="scope.value" type="number" step="0.0001" dense autofocus :label="r.label"
                                        @keyup.enter="scope.set" />
                                </q-popup-edit>
                            </q-td>
                        </template>
                        <template #body-cell-status="props">
                            <q-td :props="props">
                                <q-badge :color="props.value === 'open' ? 'positive' : 'grey-7'" :label="props.value === 'open' ? 'Abierto' : 'Cerrado'" />
                            </q-td>
                        </template>
                        <template #body-cell-action="props">
                            <q-td :props="props">
                                <q-btn v-if="can('ferias.eliminar')" flat round dense color="negative" icon="delete" @click="removeDay(props.row)" />
                            </q-td>
                        </template>
                    </q-table>
                    <div class="text-caption text-grey q-mt-sm">
                        Haga clic sobre una tasa para modificarla. Un día nuevo copia las tasas del día anterior.
                        Las tasas de un día cerrado no se pueden cambiar.
                    </div>
                </q-card-section>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import PageHeader from 'src/components/maia/PageHeader.vue'
import InvestmentConfigForm from 'src/components/maia/InvestmentConfigForm.vue'
import InvestmentSettingsPanel from 'src/components/maia/InvestmentSettingsPanel.vue'
import { defaultInvestmentConfig, investmentLabel, normalizeInvestmentConfig } from 'src/assets/js/util/investment'
import { useAuthStore } from 'src/stores/auth-store'
import { useFairStore } from 'src/stores/fair-store'
import { Success } from 'src/assets/js/util/notify'
import { money, formatDate, weekday, notifyApiError } from 'src/assets/js/util/maia'

const $q = useQuasar()
const authStore = useAuthStore()
const fairStore = useFairStore()
const can = (p) => authStore.hasPermission(p)
const canInvestment = computed(() => can('inversion.ver') || can('inversion.editar'))

const RATES = [
    { field: 'cost_rate', label: 'Tasa costo' },
    { field: 'usd_rate', label: 'USD' },
    { field: 'eur_rate', label: 'EUR' },
    { field: 'mxn_rate', label: 'MXN' },
    { field: 'mlc_rate', label: 'MLC' },
]

const tab = ref('fairs')

/* ---------- Fairs ---------- */
const fairs = ref([])
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const pagination = ref({ page: 1, rowsPerPage: 10, rowsNumber: 0 })

const fairColumns = [
    { name: 'name', label: 'Feria', field: 'name', align: 'left' },
    { name: 'start_date', label: 'Inicio', field: 'start_date', align: 'left', format: formatDate },
    { name: 'end_date', label: 'Fin', field: 'end_date', align: 'left', format: formatDate },
    { name: 'days_count', label: 'Días', field: 'days_count', align: 'center' },
    { name: 'gross_total', label: 'Venta bruta CUP', field: 'gross_total', align: 'right', format: money },
    { name: 'status', label: 'Estado', field: 'status', align: 'center' },
    { name: 'action', label: 'Acciones', field: 'action', align: 'center' },
]

const loadFairs = async (page = pagination.value.page, perPage = pagination.value.rowsPerPage) => {
    loading.value = true
    try {
        const { data } = await api.get('Fair/GetPagedList', { params: { page, per_page: perPage, search: search.value || undefined } })
        fairs.value = data.data || []
        pagination.value = { ...pagination.value, page: data.meta.current_page, rowsPerPage: data.meta.per_page, rowsNumber: data.meta.total }
    } catch (error) {
        notifyApiError(error)
    } finally {
        loading.value = false
    }
}
const onRequest = ({ pagination: p }) => loadFairs(p.page, p.rowsPerPage)
watch(search, () => loadFairs(1))

const refreshAll = async () => {
    await loadFairs()
    await fairStore.loadFairs(true)
}

const workers = ref([])
const workerOptions = ref([])

const emptyFair = () => ({
    id: null, name: '', place: '', start_date: new Date().toISOString().substring(0, 10), end_date: null,
    seller_percent: 10, maia_percent: 10, fcbc_percent: 20,
    cost_rate: 600, usd_rate: 600, eur_rate: 600, mxn_rate: 16, mlc_rate: 235,
    notes: '', worker_ids: [], create_days: true,
})
const fairDialog = ref(false)
const fairForm = reactive(emptyFair())

const businessInvestment = ref(defaultInvestmentConfig())
const investmentSources = ref([])
const investmentInherit = ref(true)
const investmentConfig = ref(defaultInvestmentConfig())
const businessInvestmentLabel = computed(() => investmentLabel(businessInvestment.value))

const loadInvestmentSettings = async () => {
    try {
        const { data } = await api.get('Settings/Investment')
        businessInvestment.value = normalizeInvestmentConfig(data.config)
        investmentSources.value = data.sources || []
    } catch (error) {
        investmentSources.value = []
    }
}

const openFairDialog = async (row = null) => {
    Object.assign(fairForm, emptyFair())
    await loadInvestmentSettings()
    investmentInherit.value = true
    investmentConfig.value = normalizeInvestmentConfig(businessInvestment.value)
    if (row) {
        try {
            const { data } = await api.get(`Fair/GetById/${row.id}`)
            const f = data.data
            Object.assign(fairForm, {
                id: f.id, name: f.name, place: f.place || '', start_date: f.start_date?.substring(0, 10),
                end_date: f.end_date?.substring(0, 10) || null, notes: f.notes || '',
                worker_ids: (f.workers || []).map((w) => w.id),
                ...Object.fromEntries(['seller_percent', 'maia_percent', 'fcbc_percent', ...RATES.map((r) => r.field)].map((k) => [k, Number(f[k])])),
            })
            if (f.investment_config) {
                investmentInherit.value = false
                investmentConfig.value = normalizeInvestmentConfig(f.investment_config)
            }
        } catch (error) {
            notifyApiError(error)
            return
        }
    }
    fairDialog.value = true
}

const saveFair = async () => {
    saving.value = true
    try {
        const payload = { ...fairForm, investment_config: investmentInherit.value ? null : investmentConfig.value }
        if (!payload.end_date) payload.end_date = null
        if (payload.id) {
            delete payload.create_days
            await api.put(`Fair/Update/${payload.id}`, payload)
            Success('Feria actualizada')
        } else {
            const { data } = await api.post('Fair/Create', payload)
            Success('Feria creada')
            await fairStore.loadFairs(true)
            await fairStore.selectFair(data.data.id)
        }
        fairDialog.value = false
        await refreshAll()
    } catch (error) {
        notifyApiError(error)
    } finally {
        saving.value = false
    }
}

const useFair = async (row) => {
    await fairStore.loadFairs(true)
    await fairStore.selectFair(row.id)
    Success(`Trabajando con "${row.name}"`)
}

const toggleStatus = (row) => {
    $q.dialog({
        title: row.status === 'open' ? 'Cerrar feria' : 'Reabrir feria',
        message: row.status === 'open'
            ? 'Con la feria cerrada no se podrán registrar ventas ni movimientos. ¿Continuar?'
            : '¿Desea reabrir la feria?',
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Aceptar', unelevated: true, color: 'primary' },
    }).onOk(async () => {
        try {
            const { data } = await api.post(`Fair/${row.id}/ToggleStatus`)
            Success(data.message)
            await refreshAll()
        } catch (error) {
            notifyApiError(error)
        }
    })
}

const removeFair = (row) => {
    $q.dialog({
        title: 'Eliminar feria',
        message: `¿Desea eliminar "${row.name}" con sus días e inventario?`,
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Eliminar', unelevated: true, color: 'negative' },
    }).onOk(async () => {
        try {
            await api.delete(`Fair/Delete/${row.id}`)
            Success('Feria eliminada')
            await refreshAll()
        } catch (error) {
            notifyApiError(error)
        }
    })
}

/* ---------- Days ---------- */
const daysDialog = ref(false)
const daysFair = ref(null)
const days = ref([])
const daysLoading = ref(false)
const newDayDate = ref(null)

const dayColumns = [
    { name: 'date', label: 'Fecha', field: 'date', align: 'left' },
    ...RATES.map((r) => ({ name: r.field, label: r.label, field: (row) => Number(row[r.field]), align: 'right' })),
    { name: 'status', label: 'Estado', field: 'status', align: 'center' },
    { name: 'action', label: '', field: 'action', align: 'center' },
]

const loadDays = async () => {
    daysLoading.value = true
    try {
        const { data } = await api.get(`Fair/GetById/${daysFair.value.id}`)
        days.value = data.data.days || []
        const last = days.value.at(-1)?.date
        if (last) {
            const next = new Date(`${last.substring(0, 10)}T12:00:00`)
            next.setDate(next.getDate() + 1)
            newDayDate.value = next.toISOString().substring(0, 10)
        }
    } catch (error) {
        notifyApiError(error)
    } finally {
        daysLoading.value = false
    }
}

const openDays = async (row) => {
    daysFair.value = row
    days.value = []
    daysDialog.value = true
    await loadDays()
}

const addDay = async () => {
    try {
        await api.post('FairDay/Create', { fair_id: daysFair.value.id, date: newDayDate.value })
        Success('Día añadido')
        await loadDays()
        await refreshAll()
    } catch (error) {
        notifyApiError(error)
    }
}

const updateDay = async (row, changes) => {
    try {
        const { data } = await api.put(`FairDay/Update/${row.id}`, changes)
        Object.assign(row, data.data)
        Success('Tasa actualizada')
    } catch (error) {
        notifyApiError(error)
    }
}

const removeDay = (row) => {
    $q.dialog({
        title: 'Eliminar día',
        message: `¿Eliminar el día ${formatDate(row.date)}?`,
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Eliminar', unelevated: true, color: 'negative' },
    }).onOk(async () => {
        try {
            await api.delete(`FairDay/Delete/${row.id}`)
            Success('Día eliminado')
            await loadDays()
            await refreshAll()
        } catch (error) {
            notifyApiError(error)
        }
    })
}

/* ---------- Transfer accounts (agrupaciones) ---------- */
const accounts = ref([])
const accountDialog = ref(false)
const savingAccount = ref(false)
const reportKeyOptions = [{ label: 'FCBC (cierre de feria)', value: 'fcbc' }]
const emptyAccount = () => ({ id: null, name: '', code: '', report_key: null, state: true })
const accountForm = reactive(emptyAccount())
const accountNameByCode = computed(() => Object.fromEntries(accounts.value.map((a) => [a.code, a.name])))
const accountOptions = computed(() => accounts.value
    .filter((a) => a.state)
    .map((a) => ({ label: a.name, value: a.code })))

const accountColumns = [
    { name: 'code', label: 'Código', field: 'code', align: 'left' },
    { name: 'name', label: 'Nombre', field: 'name', align: 'left' },
    { name: 'report_key', label: 'Reportes', field: 'report_key', align: 'left' },
    { name: 'state', label: 'Activa', field: 'state', align: 'center' },
    { name: 'action', label: '', field: 'action', align: 'center' },
]

const loadAccounts = async () => {
    try {
        const { data } = await api.get('TransferAccount')
        accounts.value = data.data || []
    } catch (error) {
        notifyApiError(error)
    }
}

const openAccountDialog = (row = null) => {
    if (row) {
        Object.assign(accountForm, {
            id: row.id,
            name: row.name || '',
            code: row.code || '',
            report_key: row.report_key || null,
            state: !!row.state,
        })
    } else {
        Object.assign(accountForm, emptyAccount())
    }
    accountDialog.value = true
}

const saveAccount = async () => {
    if (!accountForm.name?.trim()) return
    savingAccount.value = true
    try {
        const payload = {
            name: accountForm.name.trim(),
            code: accountForm.code?.trim() || null,
            report_key: accountForm.report_key || null,
            state: accountForm.id ? accountForm.state : true,
        }
        if (accountForm.id) {
            await api.put(`TransferAccount/Update/${accountForm.id}`, payload)
            Success('Tarjeta actualizada')
        } else {
            await api.post('TransferAccount/Create', payload)
            Success('Tarjeta creada')
        }
        accountDialog.value = false
        await loadAccounts()
    } catch (error) {
        notifyApiError(error)
    } finally {
        savingAccount.value = false
    }
}

const patchAccount = async (row, changes) => {
    try {
        const { data } = await api.put(`TransferAccount/Update/${row.id}`, changes)
        Object.assign(row, data.data)
        Success('Tarjeta actualizada')
    } catch (error) {
        notifyApiError(error)
    }
}

const removeAccount = (row) => {
    $q.dialog({
        title: 'Eliminar tarjeta',
        message: `¿Desea eliminar "${row.name}"?`,
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Eliminar', unelevated: true, color: 'negative' },
    }).onOk(async () => {
        try {
            await api.delete(`TransferAccount/Delete/${row.id}`)
            Success('Tarjeta eliminada')
            await loadAccounts()
        } catch (error) {
            notifyApiError(error)
        }
    })
}

/* ---------- Payment methods ---------- */
const methods = ref([])
const methodDialog = ref(false)
const savingMethod = ref(false)
const currencyOptions = ['CUP', 'USD', 'EUR', 'MXN', 'MLC']
const kindOptions = [
    { label: 'Efectivo', value: 'cash', icon: 'payments' },
    { label: 'Transferencia', value: 'transfer', icon: 'account_balance' },
]
const emptyMethod = () => ({ id: null, name: '', currency: 'CUP', kind: 'cash', account: null, state: true })
const methodForm = reactive(emptyMethod())

// A new method named "Transferencia…" is almost always a transfer.
watch(() => methodForm.name, (name) => {
    if (!methodForm.id && methodForm.kind === 'cash' && /transf/i.test(name || '')) methodForm.kind = 'transfer'
})
watch(() => methodForm.kind, (kind) => {
    if (kind === 'cash') methodForm.account = null
    else if (!methodForm.account && accountOptions.value.length === 1) methodForm.account = accountOptions.value[0].value
})

const methodColumns = [
    { name: 'code', label: 'Código', field: 'code', align: 'left' },
    { name: 'name', label: 'Nombre', field: 'name', align: 'left' },
    { name: 'currency', label: 'Moneda', field: 'currency', align: 'center' },
    { name: 'kind', label: 'Tipo', field: (r) => (r.kind === 'cash' ? 'Efectivo' : 'Transferencia'), align: 'center' },
    { name: 'account', label: 'Tarjeta', field: (r) => accountNameByCode.value[r.account] || r.account || '—', align: 'center' },
    { name: 'state', label: 'Activa', field: 'state', align: 'center' },
    { name: 'action', label: '', field: 'action', align: 'center' },
]

const loadMethods = async () => {
    try {
        const { data } = await api.get('PaymentMethod')
        methods.value = data.data || []
    } catch (error) {
        notifyApiError(error)
    }
}

const openMethodDialog = async (row = null) => {
    if (!accounts.value.length) await loadAccounts()
    if (row) {
        Object.assign(methodForm, {
            id: row.id,
            name: row.name || '',
            currency: row.currency || 'CUP',
            kind: row.kind || 'cash',
            account: row.account || null,
            state: !!row.state,
        })
    } else {
        Object.assign(methodForm, emptyMethod())
    }
    methodDialog.value = true
}

const saveMethod = async () => {
    if (!methodForm.name?.trim()) return
    if (methodForm.kind === 'transfer' && !methodForm.account) return
    savingMethod.value = true
    try {
        const payload = {
            name: methodForm.name.trim(),
            currency: methodForm.currency,
            kind: methodForm.kind,
            account: methodForm.kind === 'transfer' ? methodForm.account : null,
            state: methodForm.id ? methodForm.state : true,
        }
        if (methodForm.id) {
            await api.put(`PaymentMethod/Update/${methodForm.id}`, payload)
            Success('Forma de pago actualizada')
        } else {
            await api.post('PaymentMethod/Create', payload)
            Success('Forma de pago creada')
        }
        methodDialog.value = false
        await loadMethods()
    } catch (error) {
        notifyApiError(error)
    } finally {
        savingMethod.value = false
    }
}

const patchMethod = async (row, changes) => {
    try {
        const { data } = await api.put(`PaymentMethod/Update/${row.id}`, changes)
        Object.assign(row, data.data)
        Success('Forma de pago actualizada')
    } catch (error) {
        notifyApiError(error)
    }
}

const removeMethod = (row) => {
    $q.dialog({
        title: 'Eliminar forma de pago',
        message: `¿Desea eliminar "${row.name}"?`,
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Eliminar', unelevated: true, color: 'negative' },
    }).onOk(async () => {
        try {
            await api.delete(`PaymentMethod/Delete/${row.id}`)
            Success('Forma de pago eliminada')
            await loadMethods()
        } catch (error) {
            notifyApiError(error)
        }
    })
}

onMounted(async () => {
    loadFairs(1)
    await loadAccounts()
    loadMethods()
    fairStore.loadFairs()
    try {
        const { data } = await api.get('Worker/')
        workers.value = Array.isArray(data) ? data : data.data || []
        workerOptions.value = workers.value.filter((w) => w.state).map((w) => ({ label: w.name, value: w.id }))
    } catch (e) {
        workerOptions.value = []
    }
})
</script>

<style lang="scss" scoped>
.kind-picker__label {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
    margin: 0 0 4px 2px;
}

.kind-picker {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    padding: 3px;
    border: 1px solid rgba(0, 0, 0, 0.24);
    border-radius: 10px;
}

.kind-picker__opt {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 0;
    height: 34px;
    padding: 0 10px;
    border: 1px solid transparent;
    border-radius: 7px;
    background: transparent;
    color: rgba(0, 0, 0, 0.62);
    font: inherit;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;

    &:hover:not(.is-active) {
        background: brand-a(wine, 0.06);
        color: var(--maia-wine);
    }

    &:focus-visible {
        outline: 2px solid var(--maia-gold-light);
        outline-offset: 1px;
    }

    &.is-active {
        background: brand-a(wine, 0.1);
        border-color: brand-a(wine, 0.35);
        color: var(--maia-wine);
        font-weight: 600;
    }
}

body.body--dark {
    .kind-picker__label {
        color: rgba(255, 255, 255, 0.6);
    }

    .kind-picker {
        border-color: rgba(255, 255, 255, 0.24);
    }

    .kind-picker__opt {
        color: rgba(255, 255, 255, 0.65);

        &:hover:not(.is-active) {
            background: brand-a(gold-light, 0.08);
            color: var(--maia-gold-light);
        }

        &.is-active {
            background: brand-a(gold-light, 0.14);
            border-color: brand-a(gold-light, 0.45);
            color: var(--maia-gold-bright);
        }
    }
}
</style>
