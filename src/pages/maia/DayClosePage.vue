<template>
    <q-page class="maia-page">
        <PageHeader title="Cierre del día" section="Feria del día">
            <FairDaySelector @change="load" />
            <q-btn flat dense no-caps color="primary" icon="table_view" label="Excel" :disable="!fairStore.dayId"
                @click="downloadFile(`Report/Day/${fairStore.dayId}/Excel`, {}, 'cierre.xlsx')" />
            <q-btn flat dense no-caps color="primary" icon="picture_as_pdf" label="PDF" :disable="!fairStore.dayId"
                @click="downloadFile(`Report/Day/${fairStore.dayId}/PDF`, {}, 'cierre.pdf')" />
        </PageHeader>

        <q-inner-loading :showing="loading" color="primary" />
        <q-banner v-if="!fairStore.dayId" class="maia-card bg-orange-1 text-orange-9" rounded>Seleccione una feria y un día.</q-banner>

        <template v-else-if="summary">
            <q-banner v-if="closed" class="maia-card bg-grey-3 q-mb-md" rounded>
                <template #avatar><q-icon name="lock" /></template>
                Día cerrado{{ summary.day.closed_at ? ` el ${new Date(summary.day.closed_at).toLocaleString('es-ES')}` : '' }}.
                <template #action>
                    <q-btn v-if="can('cierre.reabrir')" flat color="primary" icon="lock_open" label="Reabrir" no-caps @click="reopen" />
                </template>
            </q-banner>

            <div class="row q-col-gutter-md q-mb-md">
                <div v-for="s in stats" :key="s.label" class="col-6 col-sm-4 col-md-2">
                    <div class="maia-stat">
                        <div class="maia-stat__label">{{ s.label }}</div>
                        <div class="maia-stat__value" :class="s.class">{{ s.value }}</div>
                        <div v-if="s.caption" class="stat-caption">{{ s.caption }}</div>
                    </div>
                </div>
            </div>

            <div class="day-close-grid">
                <div class="day-close-col">
                    <q-card flat class="maia-card">
                        <q-card-section class="row items-center q-pb-none">
                            <div class="text-subtitle1 text-weight-bold">Conteo de efectivo</div>
                            <q-space />
                            <span class="text-caption text-grey">Separe las propinas antes de contar.</span>
                        </q-card-section>
                        <q-card-section class="row q-col-gutter-md">
                            <div v-for="c in visibleCash" :key="c.currency" class="col-12 col-sm-6">
                                <q-card flat bordered class="q-pa-sm" style="border-radius: 10px">
                                    <div class="row items-center q-mb-xs">
                                        <div class="text-weight-bold">{{ c.currency }}</div>
                                        <span v-if="c.currency !== 'CUP'" class="text-caption text-grey q-ml-xs">tasa {{ c.rate }}</span>
                                        <q-space />
                                        <span class="text-caption">Esperado: <b>{{ money(c.expected) }}</b></span>
                                    </div>
                                    <div v-for="d in c.denominations" :key="d.denomination" class="row items-center q-mb-xs no-wrap">
                                        <div class="col-3 text-right q-pr-sm text-mono">{{ d.denomination }} ×</div>
                                        <q-input class="col-4" dense outlined type="number" min="0" input-class="text-right" :disable="closed || !canEdit"
                                            v-model.number="d.quantity" />
                                        <div class="col text-right text-mono">{{ money(d.denomination * (d.quantity || 0)) }}</div>
                                    </div>
                                    <q-separator class="q-my-xs" />
                                    <div class="row text-body2">
                                        <div>Contado: <b>{{ money(cashTotal(c)) }}</b></div>
                                        <q-space />
                                        <div :class="diffClass(cashTotal(c) - c.expected)">
                                            {{ signed(cashTotal(c) - c.expected) }}
                                        </div>
                                    </div>
                                </q-card>
                            </div>
                        </q-card-section>
                    </q-card>

                    <q-card flat class="maia-card">
                        <q-card-section class="text-subtitle1 text-weight-bold q-pb-none">Cobros por forma de pago</q-card-section>
                        <q-table flat dense class="maia-table" :rows="paymentRows" :columns="paymentColumns" row-key="payment_method_id"
                            hide-pagination :pagination="{ rowsPerPage: 0 }" no-data-label="Sin cobros" />
                    </q-card>
                </div>

                <div class="day-close-col">
                    <q-card flat class="maia-card">
                        <q-card-section class="text-subtitle1 text-weight-bold q-pb-none">Transferencias verificadas</q-card-section>
                        <q-card-section class="q-pb-none">
                            <div v-if="!transfers.length" class="text-caption text-grey q-mb-sm">
                                No hay cobros por transferencia en este día. En el POS use una forma de pago de tipo Transferencia con su agrupación.
                            </div>
                            <div v-for="t in transfers" :key="t.account" class="row items-center q-mb-sm no-wrap">
                                <div class="col-5">
                                    <div class="text-weight-medium">{{ t.name }}</div>
                                    <div class="text-caption text-grey">POS: {{ money(t.expected) }} {{ t.currency }}</div>
                                </div>
                                <q-input class="col" dense outlined type="number" min="0" step="0.01" :suffix="t.currency" clearable
                                    input-class="text-right" :disable="closed || !canEdit" v-model.number="t.verified"
                                    placeholder="Igual al POS" />
                                <div class="col-3 text-right" :class="diffClass(t.verified === null || t.verified === '' ? 0 : t.verified - t.expected)">
                                    {{ t.verified === null || t.verified === '' ? '' : signed(t.verified - t.expected) }}
                                </div>
                            </div>
                            <q-input dense outlined type="textarea" autogrow label="Notas del cierre" v-model="notes" :disable="closed || !canEdit" />
                        </q-card-section>

                        <q-separator class="q-mx-md" />

                        <q-card-section>
                            <div class="text-subtitle1 text-weight-bold q-mb-sm">Cuadre</div>
                            <div class="row q-mb-xs"><div>Venta bruta</div><q-space /><b>{{ money(summary.sales.gross) }}</b></div>
                            <div class="row q-mb-xs"><div>Efectivo contado (CUP)</div><q-space />{{ money(countedCashCup) }}</div>
                            <div class="row q-mb-xs"><div>Transferencias (CUP)</div><q-space />{{ money(countedTransferCup) }}</div>
                            <q-separator class="q-my-sm" />
                            <div class="row items-center">
                                <div class="text-weight-bold">{{ surplus >= 0 ? 'Sobrante' : 'Faltante' }}</div>
                                <q-space />
                                <div class="text-h6 text-weight-bold" :class="diffClass(surplus)">{{ signed(surplus) }} CUP</div>
                            </div>
                            <div v-if="summary.totals.inventory_debt" class="row q-mt-xs text-negative">
                                <div>Deuda por conteo de inventario</div><q-space />{{ money(summary.totals.inventory_debt) }}
                            </div>
                        </q-card-section>
                        <q-card-actions v-if="!closed && canEdit" class="q-pa-md q-pt-none">
                            <q-btn outline no-caps color="primary" icon="save" label="Guardar cuadre" :loading="saving" @click="save()" />
                            <q-space />
                            <q-btn unelevated no-caps color="primary" icon="lock" label="Cerrar día" :loading="closing" @click="closeDay" />
                        </q-card-actions>
                    </q-card>

                    <q-card flat class="maia-card">
                        <q-card-section class="row items-center q-pb-none">
                            <div class="text-subtitle1 text-weight-bold">Propinas (fuera del cuadre)</div>
                            <q-space />
                            <b>{{ money(summary.tips.total_cup) }} CUP</b>
                        </q-card-section>
                        <q-list dense separator>
                            <q-item v-for="t in summary.tips.by_worker" :key="t.worker">
                                <q-item-section>{{ t.worker }}</q-item-section>
                                <q-item-section side>{{ t.count }} · {{ money(t.amount_cup) }} CUP</q-item-section>
                            </q-item>
                            <q-item v-if="!summary.tips.by_worker.length" class="text-grey">Sin propinas</q-item>
                        </q-list>
                    </q-card>
                </div>
            </div>
        </template>
    </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import PageHeader from 'src/components/maia/PageHeader.vue'
import FairDaySelector from 'src/components/maia/FairDaySelector.vue'
import { useAuthStore } from 'src/stores/auth-store'
import { useFairStore } from 'src/stores/fair-store'
import { Success } from 'src/assets/js/util/notify'
import { money, notifyApiError, downloadFile } from 'src/assets/js/util/maia'

const $q = useQuasar()
const authStore = useAuthStore()
const fairStore = useFairStore()
const can = (p) => authStore.hasPermission(p)
const canEdit = computed(() => can('cierre.editar'))

const summary = ref(null)
const cash = ref([])
const transfers = ref([])
const notes = ref('')
const loading = ref(false)
const saving = ref(false)
const closing = ref(false)

const closed = computed(() => summary.value?.day?.status === 'closed' || fairStore.fair?.status === 'closed')

const signed = (v) => `${v > 0.004 ? '+' : ''}${money(v)}`
const diffClass = (v) => (v < -0.004 ? 'text-negative text-weight-bold' : v > 0.004 ? 'text-positive text-weight-bold' : 'text-grey-7')

const cashTotal = (c) => c.denominations.reduce((s, d) => s + d.denomination * (Number(d.quantity) || 0), 0)
const visibleCash = computed(() => cash.value.filter((c) => (
    c.currency === 'CUP'
    || Number(c.expected) > 0
    || c.denominations.some((d) => Number(d.quantity) > 0)
)))
const countedCashCup = computed(() => cash.value.reduce((s, c) => s + cashTotal(c) * c.rate, 0))
const transferRate = (t) => (t.currency === 'CUP' ? 1 : Number(summary.value?.day?.[`${t.currency.toLowerCase()}_rate`]) || 1)
const countedTransferCup = computed(() => transfers.value.reduce((s, t) => {
    const v = t.verified === null || t.verified === '' ? t.expected : Number(t.verified)
    return s + v * transferRate(t)
}, 0))
const hasCount = computed(() => cash.value.some((c) => c.denominations.some((d) => Number(d.quantity) > 0)))
const surplus = computed(() => (hasCount.value ? countedCashCup.value + countedTransferCup.value - Number(summary.value?.sales.gross || 0) : 0))

const stats = computed(() => {
    const s = summary.value.sales
    return [
        { label: 'Ventas', value: s.count, caption: `${s.units} unidades${s.voided ? ` · ${s.voided} anuladas` : ''}` },
        { label: 'Venta bruta CUP', value: money(s.gross), caption: `${money(s.gross_usd)} USD` },
        { label: 'Porción vendedor', value: money(s.seller_portion) },
        { label: 'Ingreso', value: money(s.income) },
        { label: 'Ganancia', value: money(s.profit), class: s.profit < 0 ? 'text-negative' : 'text-positive' },
        { label: surplus.value >= 0 ? 'Sobrante' : 'Faltante', value: money(surplus.value), class: diffClass(surplus.value) },
    ]
})

const paymentColumns = [
    { name: 'name', label: 'Forma de pago', field: 'name', align: 'left' },
    { name: 'kind', label: 'Tipo', field: (r) => (r.kind === 'cash' ? 'Efectivo' : 'Transferencia'), align: 'left' },
    { name: 'amount', label: 'Importe', field: (r) => `${money(r.amount)} ${r.currency}`, align: 'right' },
    { name: 'amount_cup', label: 'Equivalente CUP', field: 'amount_cup', align: 'right', format: money },
]
const paymentRows = computed(() => (summary.value?.payments || []).filter((p) => p.amount !== 0))

const applySummary = (data) => {
    summary.value = data
    cash.value = (data.cash || []).map((c) => ({ ...c, denominations: c.denominations.map((d) => ({ ...d, quantity: d.quantity || null })) }))
    transfers.value = (data.transfers || []).map((t) => ({ ...t, verified: t.verified === null ? null : Number(t.verified) }))
    notes.value = data.day?.notes || ''
}

const load = async () => {
    if (!fairStore.dayId) {
        summary.value = null
        return
    }
    loading.value = true
    try {
        const { data } = await api.get(`FairDay/${fairStore.dayId}/Summary`)
        applySummary(data.data)
    } catch (error) {
        notifyApiError(error)
    } finally {
        loading.value = false
    }
}

const save = async (silent = false) => {
    saving.value = true
    try {
        const payload = {
            counts: cash.value.flatMap((c) => c.denominations.map((d) => ({ currency: c.currency, denomination: d.denomination, quantity: Number(d.quantity) || 0 }))),
            notes: notes.value || null,
        }
        payload.transfer_verifications = transfers.value.map((t) => ({
            account: t.account,
            verified: t.verified === '' || t.verified === null || t.verified === undefined ? null : Number(t.verified),
        }))
        const { data } = await api.post(`FairDay/${fairStore.dayId}/CashCount`, payload)
        applySummary(data.data)
        if (!silent) Success('Cuadre guardado')
        return true
    } catch (error) {
        notifyApiError(error)
        return false
    } finally {
        saving.value = false
    }
}

const closeDay = () => {
    const message = hasCount.value
        ? `${surplus.value >= 0 ? 'Sobrante' : 'Faltante'}: ${money(surplus.value)} CUP. Después de cerrar no se podrán registrar ventas ni movimientos en este día. ¿Cerrar?`
        : 'No se ha contado el efectivo. ¿Desea cerrar el día de todas formas?'
    $q.dialog({
        title: 'Cerrar día',
        message,
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Cerrar día', unelevated: true, color: 'primary' },
    }).onOk(async () => {
        closing.value = true
        try {
            if (canEdit.value && !(await save(true))) return
            const { data } = await api.post(`FairDay/${fairStore.dayId}/Close`)
            fairStore.setDayStatus(fairStore.dayId, 'closed')
            Success(data.message)
            await load()
        } catch (error) {
            notifyApiError(error)
        } finally {
            closing.value = false
        }
    })
}

const reopen = () => {
    $q.dialog({
        title: 'Reabrir día',
        message: '¿Desea reabrir el día para registrar cambios?',
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Reabrir', unelevated: true, color: 'primary' },
    }).onOk(async () => {
        try {
            const { data } = await api.post(`FairDay/${fairStore.dayId}/Reopen`)
            fairStore.setDayStatus(fairStore.dayId, 'open')
            Success(data.message)
            await load()
        } catch (error) {
            notifyApiError(error)
        }
    })
}
</script>

<style scoped lang="scss">
.day-close-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    align-items: start;
}

.day-close-col {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

@media (min-width: 1024px) {
    .day-close-grid {
        grid-template-columns: 1.4fr 1fr;
    }
}
</style>
