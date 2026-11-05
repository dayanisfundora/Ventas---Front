<template>
    <q-page class="maia-page">
        <PageHeader title="Pagos programados" section="Finanzas">
            <q-input dense outlined debounce="400" v-model="filter" placeholder="Buscar" class="maia-field">
                <template #prepend><q-icon name="search" /></template>
            </q-input>
            <q-btn v-if="canEdit" unelevated round color="primary" icon="add" @click="openDialog()">
                <q-tooltip>Nuevo pago</q-tooltip>
            </q-btn>
        </PageHeader>

        <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6 col-md-3">
                <div class="maia-stat">
                    <div class="maia-stat__label">Pendientes</div>
                    <div class="maia-stat__value">{{ summary.pending }}</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="maia-stat">
                    <div class="maia-stat__label">Vencidos</div>
                    <div class="maia-stat__value" :class="summary.overdue ? 'text-negative' : ''">{{ summary.overdue }}</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="maia-stat">
                    <div class="maia-stat__label">Vencen en 7 días</div>
                    <div class="maia-stat__value" :class="summary.due_soon ? 'text-warning' : ''">{{ summary.due_soon }}</div>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="maia-stat">
                    <div class="maia-stat__label">Por pagar</div>
                    <div v-if="!pendingTotals.length" class="maia-stat__value">0,00</div>
                    <div v-for="t in pendingTotals" :key="t.currency" class="pending-total">{{ money(t.amount) }} <small>{{ t.currency }}</small></div>
                </div>
            </div>
        </div>

        <q-tabs v-model="tab" dense align="left" active-color="primary" indicator-color="primary" class="q-mb-md" no-caps>
            <q-tab name="pending" icon="schedule" :label="`Pendientes (${summary.counts.pending || 0})`" />
            <q-tab name="paid" icon="task_alt" :label="`Pagados (${summary.counts.paid || 0})`" />
            <q-tab name="cancelled" icon="block" :label="`Cancelados (${summary.counts.cancelled || 0})`" />
        </q-tabs>

        <q-table flat class="maia-card maia-table" :rows="items" :columns="columns" row-key="id" :loading="loading"
            v-model:pagination="pagination" @request="onRequest" :rows-per-page-options="[10, 20, 50, 100]"
            :no-data-label="tab === 'pending' ? 'No hay pagos pendientes' : 'Sin registros'" rows-per-page-label="Filas por página">
            <template #body-cell-due_date="props">
                <q-td :props="props">
                    <span :class="dueClass(props.row)">{{ props.value ? formatDate(props.value) : '—' }}</span>
                    <q-badge v-if="tab === 'pending' && isOverdue(props.row)" color="negative" label="vencido" class="q-ml-xs" />
                    <q-badge v-else-if="tab === 'pending' && isDueSoon(props.row)" color="warning" text-color="dark" label="pronto" class="q-ml-xs" />
                </q-td>
            </template>
            <template #body-cell-concept="props">
                <q-td :props="props">
                    <div class="text-weight-medium">{{ props.value }}</div>
                    <div v-if="props.row.notes" class="text-caption text-grey-7 ellipsis" style="max-width: 320px">{{ props.row.notes }}</div>
                </q-td>
            </template>
            <template #body-cell-action="props">
                <q-td :props="props">
                    <template v-if="canEdit">
                        <template v-if="tab === 'pending'">
                            <q-btn unelevated dense no-caps color="primary" icon="payments" label="Pagar" class="q-px-sm q-mr-xs" @click="openPay(props.row)" />
                            <q-btn flat round dense color="primary" icon="edit" @click="openDialog(props.row)" />
                            <q-btn flat round dense color="grey-7" icon="block" @click="action(props.row, 'Cancel', 'Cancelar pago', '¿Cancelar este pago? Podrá reactivarlo después.')">
                                <q-tooltip>Cancelar</q-tooltip>
                            </q-btn>
                            <q-btn flat round dense color="negative" icon="delete" @click="remove(props.row, `el pago ${props.row.concept}`)" />
                        </template>
                        <q-btn v-else-if="tab === 'paid'" flat dense no-caps color="negative" icon="undo" label="Anular pago"
                            @click="action(props.row, 'Unpay', 'Anular pago', 'El pago volverá a pendientes y el dinero regresará al bolsillo. ¿Continuar?')" />
                        <template v-else>
                            <q-btn flat dense no-caps color="primary" icon="restore" label="Reactivar"
                                @click="action(props.row, 'Reactivate', 'Reactivar pago', '¿Volver a poner este pago como pendiente?')" />
                            <q-btn flat round dense color="negative" icon="delete" @click="remove(props.row, `el pago ${props.row.concept}`)" />
                        </template>
                    </template>
                </q-td>
            </template>
        </q-table>

        <!-- Create / edit -->
        <q-dialog v-model="dialog" persistent>
            <q-card class="maia-dialog-card" style="width: 500px">
                <q-form @submit.prevent="submit">
                    <q-card-section class="text-h6">{{ form.id ? 'Editar pago' : 'Nuevo pago programado' }}</q-card-section>
                    <q-card-section class="row q-col-gutter-md">
                        <q-input class="col-12 maia-field" outlined dense label="Concepto *" maxlength="160" v-model="form.concept"
                            :rules="[(v) => !!v || 'Requerido']" />
                        <q-input class="col-7 maia-field" outlined dense type="number" min="0" step="0.01" label="Importe *"
                            input-class="text-right" v-model.number="form.amount" :rules="[(v) => v > 0 || 'Mayor que 0']" />
                        <q-select class="col-5 maia-field" outlined dense label="Moneda" :options="CURRENCIES" v-model="form.currency" />
                        <q-input class="col-6 maia-field" outlined dense type="date" stack-label label="Vence" v-model="form.due_date" />
                        <q-select class="col-6 maia-field" outlined dense emit-value map-options clearable label="Bolsillo sugerido"
                            :options="fundOptions" v-model="form.cash_fund_id" />
                        <q-input class="col-12 maia-field" outlined dense type="textarea" autogrow label="Notas" maxlength="255" v-model="form.notes" />
                    </q-card-section>
                    <q-card-actions align="right">
                        <q-btn flat label="Cancelar" v-close-popup />
                        <q-btn unelevated color="primary" label="Guardar" type="submit" :loading="saving" />
                    </q-card-actions>
                </q-form>
            </q-card>
        </q-dialog>

        <!-- Pay -->
        <q-dialog v-model="payDialog" persistent>
            <q-card class="maia-dialog-card" style="width: 440px">
                <q-card-section>
                    <div class="text-h6">Pagar</div>
                    <div class="text-body2">{{ payForm.concept }} · <b>{{ money(payForm.amount) }} {{ payForm.currency }}</b></div>
                </q-card-section>
                <q-card-section class="q-gutter-md">
                    <q-select outlined dense emit-value map-options class="maia-field" label="Sale del bolsillo *" :options="fundOptions"
                        v-model="payForm.cash_fund_id">
                        <template #option="scope">
                            <q-item v-bind="scope.itemProps">
                                <q-item-section>{{ scope.opt.label }}</q-item-section>
                                <q-item-section side :class="fundBalance(scope.opt.value) < payForm.amount ? 'text-negative' : ''">
                                    {{ money(fundBalance(scope.opt.value)) }} {{ payForm.currency }}
                                </q-item-section>
                            </q-item>
                        </template>
                    </q-select>
                    <div v-if="payForm.cash_fund_id" class="text-caption" :class="fundBalance(payForm.cash_fund_id) < payForm.amount ? 'text-negative' : 'text-grey-7'">
                        Saldo disponible: {{ money(fundBalance(payForm.cash_fund_id)) }} {{ payForm.currency }}
                    </div>
                    <q-input outlined dense type="date" stack-label class="maia-field" label="Fecha del pago *" v-model="payForm.date" />
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat no-caps label="Cancelar" v-close-popup />
                    <q-btn unelevated no-caps color="primary" icon="payments" label="Registrar pago" :loading="paying"
                        :disable="!payForm.cash_fund_id || !payForm.date" @click="pay" />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import PageHeader from 'src/components/maia/PageHeader.vue'
import { useCrudTable } from 'src/composables/useCrudTable'
import { useAuthStore } from 'src/stores/auth-store'
import { Success } from 'src/assets/js/util/notify'
import { money, formatDate, notifyApiError } from 'src/assets/js/util/maia'
import { CURRENCIES, today, withFundsCheck } from 'src/assets/js/util/finance'

const $q = useQuasar()
const authStore = useAuthStore()
const canEdit = computed(() => authStore.hasPermission('finanzas.editar'))

const tab = ref('pending')
const { items, filter, loading, saving, pagination, load, onRequest, save, remove } = useCrudTable('ScheduledPayment', {
    extraParams: () => ({ status: tab.value }),
})

const columns = computed(() => [
    { name: 'due_date', label: 'Vence', field: 'due_date', align: 'left' },
    { name: 'concept', label: 'Concepto', field: 'concept', align: 'left' },
    { name: 'amount', label: 'Importe', field: (r) => `${money(r.amount)} ${r.currency}`, align: 'right' },
    tab.value === 'paid'
        ? { name: 'paid', label: 'Pagado', field: (r) => `${formatDate(r.paid_at)} · ${r.fund?.name || ''}`, align: 'left' }
        : { name: 'fund', label: 'Bolsillo sugerido', field: (r) => r.fund?.name || '—', align: 'left' },
    { name: 'action', label: 'Acciones', field: 'id', align: 'right' },
])

const summary = ref({ pending: 0, overdue: 0, due_soon: 0, totals: {}, counts: {} })
const pendingTotals = computed(() => Object.entries(summary.value.totals || {}).map(([currency, amount]) => ({ currency, amount })))
const loadSummary = async () => {
    try {
        const { data } = await api.get('ScheduledPayment/Summary')
        summary.value = { ...data.data, totals: Array.isArray(data.data.totals) ? {} : data.data.totals, counts: Array.isArray(data.data.counts) ? {} : data.data.counts }
    } catch (e) {
        // the table already reports API errors
    }
}
watch(items, loadSummary)
watch(tab, () => load(1))

const isOverdue = (r) => r.due_date && r.due_date < today()
const isDueSoon = (r) => {
    if (!r.due_date || isOverdue(r)) return false
    const limit = new Date()
    limit.setDate(limit.getDate() + 7)
    return new Date(`${r.due_date}T00:00:00`) <= limit
}
const dueClass = (r) => (tab.value !== 'pending' ? '' : isOverdue(r) ? 'text-negative text-weight-bold' : isDueSoon(r) ? 'text-warning text-weight-bold' : '')

// Funds and balances
const funds = ref([])
const balances = ref({})
const fundOptions = computed(() => funds.value.filter((f) => f.state).map((f) => ({ label: f.name, value: f.id })))
const loadFunds = async () => {
    try {
        const [f, b] = await Promise.all([api.get('CashFund'), api.get('CashMovement/Balances')])
        funds.value = f.data.data || []
        balances.value = Object.fromEntries((b.data.data.funds || []).map((x) => [x.id, x.balances]))
    } catch (error) {
        notifyApiError(error)
    }
}
const fundBalance = (id) => Number(balances.value[id]?.[payForm.currency] || 0)

// Create / edit
const dialog = ref(false)
const empty = () => ({ id: null, concept: '', amount: null, currency: 'CUP', due_date: '', cash_fund_id: null, notes: '' })
const form = reactive(empty())
const openDialog = (row = null) => {
    Object.assign(form, row
        ? { id: row.id, concept: row.concept, amount: row.amount, currency: row.currency, due_date: row.due_date || '', cash_fund_id: row.cash_fund_id, notes: row.notes || '' }
        : empty())
    dialog.value = true
}
const submit = async () => {
    if (await save({ ...form, due_date: form.due_date || null, notes: form.notes || null })) dialog.value = false
}

// Pay
const payDialog = ref(false)
const paying = ref(false)
const payForm = reactive({ id: null, concept: '', amount: 0, currency: 'CUP', cash_fund_id: null, date: today() })
const openPay = async (row) => {
    Object.assign(payForm, { id: row.id, concept: row.concept, amount: Number(row.amount), currency: row.currency, cash_fund_id: row.cash_fund_id, date: today() })
    payDialog.value = true
    await loadFunds()
}
const pay = async () => {
    paying.value = true
    try {
        const res = await withFundsCheck((allowNegative) => api.post(`ScheduledPayment/${payForm.id}/Pay`, {
            cash_fund_id: payForm.cash_fund_id,
            date: payForm.date,
            allow_negative: allowNegative,
        }))
        if (!res) return
        Success(res.data.message)
        payDialog.value = false
        await load()
    } catch (error) {
        notifyApiError(error)
    } finally {
        paying.value = false
    }
}

const action = (row, endpoint, title, message) => {
    $q.dialog({
        title,
        message,
        cancel: { label: 'No', flat: true },
        ok: { label: 'Sí', unelevated: true, color: endpoint === 'Unpay' ? 'negative' : 'primary' },
    }).onOk(async () => {
        try {
            const { data } = await api.post(`ScheduledPayment/${row.id}/${endpoint}`)
            Success(data.message)
            await load()
        } catch (error) {
            notifyApiError(error)
        }
    })
}

onMounted(() => {
    load(1)
    loadFunds()
})
</script>

<style lang="scss" scoped>
.pending-total {
    font-family: $maia-serif;
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.3;

    small {
        font-family: $maia-sans;
        font-size: 0.7rem;
        color: var(--app-text-muted);
    }
}
</style>
