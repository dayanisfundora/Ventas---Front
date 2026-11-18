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
        <q-banner v-if="!fairStore.dayId" class="maia-card maia-banner--warning" rounded>Seleccione una feria y un día.</q-banner>

        <template v-else-if="summary">
            <q-banner v-if="closed" class="maia-card maia-banner--muted q-mb-md" rounded>
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
                            <div class="text-subtitle1 text-weight-bold">Arqueo de efectivo</div>
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
                                    <div v-if="c.currency === 'CUP' && isSuperAdmin" class="row items-center no-wrap q-mb-sm">
                                        <div class="col text-caption">
                                            Vuelto en CUP (ajuste)
                                            <q-tooltip max-width="280px">
                                                Vuelto dado en CUP que las ventas no registran. Se resta del CUP esperado. Solo lo ve y lo cambia el Super Admin.
                                            </q-tooltip>
                                        </div>
                                        <q-input class="col-5" dense outlined type="number" min="0" step="0.01" input-class="text-right"
                                            prefix="-" v-model.number="changeAdjustment" :loading="savingAdjustment"
                                            @blur="saveChangeAdjustment" @keyup.enter="$event.target.blur()" />
                                    </div>
                                    <div v-else-if="c.currency === 'CUP' && c.change_adjustment" class="text-caption text-grey-7 q-mb-xs">
                                        Incluye un ajuste de vuelto en CUP de -{{ money(c.change_adjustment) }}
                                    </div>
                                    <div v-if="c.currency === 'CUP' && c.currency_adjustment" class="text-caption text-grey-7 q-mb-xs">
                                        {{ money(-c.currency_adjustment) }} CUP se cobraron en otra moneda (ajuste)
                                    </div>
                                    <div v-if="c.currency !== 'CUP' && isSuperAdmin" class="row items-center no-wrap q-mb-sm">
                                        <div class="col text-caption">
                                            Cobrado en {{ c.currency }} registrado como CUP
                                            <q-tooltip max-width="280px">
                                                {{ c.currency }} que entraron a la caja pero en las ventas quedaron como pago en CUP. Pasa ese monto
                                                de lo esperado en CUP a lo esperado en {{ c.currency }}; el total del día no cambia. Solo lo ve y lo cambia el Super Admin.
                                            </q-tooltip>
                                        </div>
                                        <q-input class="col-5" dense outlined type="number" step="0.01" input-class="text-right"
                                            :suffix="c.currency" v-model.number="currencyAdjustment[c.currency]" :loading="savingCurrency === c.currency"
                                            @blur="saveCurrencyAdjustment(c.currency)" @keyup.enter="$event.target.blur()" />
                                    </div>
                                    <div v-else-if="c.currency !== 'CUP' && c.currency_adjustment" class="text-caption text-grey-7 q-mb-xs">
                                        Incluye {{ money(c.currency_adjustment) }} {{ c.currency }} registrados como CUP (ajuste)
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
                        <q-card-section class="row items-center q-pb-none">
                            <div class="text-subtitle1 text-weight-bold">Transferencias verificadas</div>
                            <q-space />
                            <span v-if="unverifiedTransfers.length" class="text-caption text-warning">
                                Faltan {{ unverifiedTransfers.length }} por comprobar
                                <q-tooltip max-width="260px">
                                    Revise en el banco o la app que cada transferencia llegó y escriba el importe recibido.
                                    Si lo deja en blanco, se cuenta lo mismo que se registró en las ventas.
                                </q-tooltip>
                            </span>
                        </q-card-section>
                        <q-card-section class="q-pb-none">
                            <div v-if="!transfers.length" class="text-caption text-grey q-mb-sm">
                                No hay cobros por transferencia en este día. En el POS use una forma de pago de tipo Transferencia con su tarjeta.
                            </div>
                            <div v-for="t in transfers" :key="t.account" class="row items-center q-mb-sm no-wrap">
                                <div class="col-5">
                                    <div class="text-weight-medium">{{ t.name }}</div>
                                    <div class="text-caption text-grey">POS: {{ money(t.expected) }} {{ t.currency }}</div>
                                </div>
                                <q-input class="col" dense outlined type="number" min="0" step="0.01" :suffix="t.currency" clearable
                                    input-class="text-right" :disable="closed || !canEdit" v-model.number="t.verified"
                                    placeholder="Importe recibido" />
                                <div class="col-3 text-right">
                                    <template v-if="isUnverified(t)">
                                        <q-btn v-if="!closed && canEdit" flat dense no-caps size="sm" color="warning" icon="help_outline"
                                            label="Sin comprobar" @click="t.verified = t.expected">
                                            <q-tooltip>Toque si ya comprobó que llegó completa (lo mismo que se registró en las ventas).</q-tooltip>
                                        </q-btn>
                                        <span v-else class="text-caption text-warning">Sin comprobar</span>
                                    </template>
                                    <span v-else-if="Math.abs(t.verified - t.expected) < 0.005" class="text-positive text-weight-medium">
                                        <q-icon name="check_circle" size="18px" /> Coincide
                                    </span>
                                    <span v-else :class="diffClass(t.verified - t.expected)">{{ signed(t.verified - t.expected) }}</span>
                                </div>
                            </div>
                            <q-input class="day-close-notes" dense outlined type="textarea" autogrow label="Notas del cierre" v-model="notes"
                                :disable="closed || !canEdit" />
                        </q-card-section>

                        <q-separator class="q-mx-md" />

                        <q-card-section>
                            <div class="text-subtitle1 text-weight-bold q-mb-sm">Cuadre</div>
                            <div class="row q-mb-xs"><div>Venta bruta</div><q-space /><b>{{ money(summary.sales.gross) }}</b></div>
                            <div class="row q-mb-xs"><div>Arqueo de efectivo (CUP)</div><q-space />{{ money(countedCashCup) }}</div>
                            <div class="row q-mb-xs"><div>Transferencias (CUP)</div><q-space />{{ money(countedTransferCup) }}</div>
                            <div v-if="changeAdjustmentCup" class="row q-mb-xs">
                                <div>Vuelto dado en CUP (ajuste)</div><q-space />{{ money(changeAdjustmentCup) }}
                            </div>
                            <q-separator class="q-my-sm" />
                            <div class="row items-start">
                                <div class="text-weight-bold">{{ surplusLabel }}</div>
                                <q-space />
                                <div class="text-right">
                                    <template v-if="!surplusBalanced">
                                        <div v-for="r in surplusByCurrency" :key="r.currency" class="text-h6 text-weight-bold" :class="diffClass(r.amount)">
                                            {{ signed(r.amount) }} {{ r.currency }}
                                        </div>
                                    </template>
                                    <div v-if="surplusBalanced || !surplusByCurrency.length" class="text-h6 text-weight-bold text-grey-7">{{ money(0) }} CUP</div>
                                    <div v-if="surplusInForeign" class="text-caption text-grey-7">Equivale a {{ signed(surplus) }} CUP</div>
                                    <div v-if="surplusOffset" class="text-caption text-grey-7" style="max-width: 260px">{{ surplusOffset }}</div>
                                </div>
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
import { computed, reactive, ref } from 'vue'
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
const isUnverified = (t) => t.verified === null || t.verified === '' || t.verified === undefined
const unverifiedTransfers = computed(() => transfers.value.filter(isUnverified))
const countedTransferCup = computed(() => transfers.value.reduce((s, t) => {
    const v = isUnverified(t) ? t.expected : Number(t.verified)
    return s + v * transferRate(t)
}, 0))
const hasCount = computed(() => cash.value.some((c) => c.denominations.some((d) => Number(d.quantity) > 0)))
const changeAdjustmentCup = computed(() => Number(summary.value?.day?.change_adjustment_cup) || 0)
const surplus = computed(() => (hasCount.value
    ? countedCashCup.value + countedTransferCup.value - Number(summary.value?.sales.gross || 0) + changeAdjustmentCup.value
    : 0))

/** Surplus/shortage in the currency where it actually happened (e.g. +3.50 USD instead of +2,100 CUP). */
const surplusByCurrency = computed(() => {
    if (!hasCount.value) return []
    const map = new Map()
    const add = (currency, rate, amount) => {
        const row = map.get(currency) || { currency, rate, amount: 0 }
        row.amount += amount
        map.set(currency, row)
    }
    for (const c of cash.value) add(c.currency, Number(c.rate) || 1, cashTotal(c) - Number(c.expected || 0))
    for (const t of transfers.value) {
        add(t.currency, transferRate(t), (isUnverified(t) ? Number(t.expected) : Number(t.verified)) - Number(t.expected))
    }
    const residualCup = surplus.value - [...map.values()].reduce((s, r) => s + r.amount * r.rate, 0)
    if (Math.abs(residualCup) > 0.004) add('CUP', 1, residualCup)
    return [...map.values()]
        .filter((r) => Math.abs(r.amount) > 0.004)
        .sort((a, b) => (a.currency === 'CUP' ? -1 : b.currency === 'CUP' ? 1 : a.currency.localeCompare(b.currency)))
})
/** Differences that cancel out between currencies (e.g. a USD payment recorded as CUP): the day balances. */
const surplusBalanced = computed(() => Math.abs(surplus.value) < 0.005)
const surplusOffset = computed(() => (surplusBalanced.value && surplusByCurrency.value.length
    ? `Se compensa: ${surplusByCurrency.value.map((r) => `${signed(r.amount)} ${r.currency}`).join(' · ')} (algún cobro quedó registrado en otra moneda)`
    : ''))
const surplusLabel = computed(() => {
    if (surplusBalanced.value) return 'Cuadra'
    const rows = surplusByCurrency.value
    if (rows.some((r) => r.amount > 0) && rows.some((r) => r.amount < 0)) return 'Diferencia'
    return surplus.value >= 0 ? 'Sobrante' : 'Faltante'
})
const surplusText = computed(() => (surplusByCurrency.value.length && !surplusBalanced.value
    ? surplusByCurrency.value.map((r) => `${signed(r.amount)} ${r.currency}`).join(' · ')
    : `${money(0)} CUP`))
const surplusInForeign = computed(() => !surplusBalanced.value && surplusByCurrency.value.some((r) => r.currency !== 'CUP'))

/** What was actually charged in each currency (payments are stored net of tips). */
const grossByCurrency = computed(() => {
    const map = new Map()
    for (const p of summary.value?.payments || []) {
        if (!Number(p.amount)) continue
        const row = map.get(p.currency) || { currency: p.currency, amount: 0, amount_cup: 0 }
        row.amount += Number(p.amount)
        row.amount_cup += Number(p.amount_cup)
        map.set(p.currency, row)
    }
    return [...map.values()].sort((a, b) => (a.currency === 'CUP' ? -1 : b.currency === 'CUP' ? 1 : a.currency.localeCompare(b.currency)))
})
const hasForeignSales = computed(() => grossByCurrency.value.some((c) => c.currency !== 'CUP'))

const stats = computed(() => {
    const s = summary.value.sales
    const byCurrency = hasForeignSales.value
        ? grossByCurrency.value.map((c) => ({
            label: `Cobrado en ${c.currency}`,
            value: money(c.amount),
            caption: c.currency === 'CUP' ? 'Efectivo y transferencias' : `= ${money(c.amount_cup)} CUP`,
        }))
        : []
    return [
        { label: 'Ventas', value: s.count, caption: `${s.units} unidades${s.voided ? ` · ${s.voided} anuladas` : ''}` },
        {
            label: hasForeignSales.value ? 'Venta bruta (total en CUP)' : 'Venta bruta CUP',
            value: money(s.gross),
            caption: `${money(s.gross_usd)} USD`,
        },
        ...byCurrency,
        { label: 'Porción vendedor', value: money(s.seller_portion) },
        { label: 'Ingreso', value: money(s.income) },
        { label: 'Ganancia', value: money(s.profit), class: s.profit < 0 ? 'text-negative' : 'text-positive' },
        {
            label: surplusLabel.value,
            value: surplusText.value,
            class: diffClass(surplus.value),
            caption: [
                surplusInForeign.value ? `= ${signed(surplus.value)} CUP` : '',
                surplusOffset.value,
                changeAdjustmentCup.value ? `Descontado vuelto CUP: ${money(changeAdjustmentCup.value)}` : '',
            ].filter(Boolean).join(' · '),
        },
    ]
})

const paymentColumns = [
    { name: 'name', label: 'Forma de pago', field: 'name', align: 'left' },
    { name: 'kind', label: 'Tipo', field: (r) => (r.kind === 'cash' ? 'Efectivo' : 'Transferencia'), align: 'left' },
    { name: 'amount', label: 'Importe', field: (r) => `${money(r.amount)} ${r.currency}`, align: 'right' },
    { name: 'amount_cup', label: 'Equivalente CUP', field: 'amount_cup', align: 'right', format: money },
]
const paymentRows = computed(() => (summary.value?.payments || []).filter((p) => p.amount !== 0))

// Temporary CUP change adjustment (Super Admin only)
const isSuperAdmin = computed(() => authStore.hasRole('Super Admin'))
const changeAdjustment = ref(null)
const savingAdjustment = ref(false)
const saveChangeAdjustment = async () => {
    const amount = Number(changeAdjustment.value) > 0 ? Number(changeAdjustment.value) : null
    if (amount === (Number(summary.value?.day?.change_adjustment_cup) || null)) return
    savingAdjustment.value = true
    try {
        const { data } = await api.put(`FairDay/${fairStore.dayId}/ChangeAdjustment`, { amount })
        applyExpected(data.data)
        Success(data.message)
    } catch (error) {
        notifyApiError(error)
    } finally {
        changeAdjustment.value = Number(summary.value?.day?.change_adjustment_cup) || null
        savingAdjustment.value = false
    }
}

/** Keep the bills typed but not saved yet: only the expected amounts and the day adjustments change. */
const applyExpected = (data) => {
    summary.value = { ...data, cash: summary.value.cash }
    for (const row of data.cash || []) {
        const local = cash.value.find((c) => c.currency === row.currency)
        if (local) {
            Object.assign(local, {
                expected: row.expected,
                expected_cup: row.expected_cup,
                change_adjustment: row.change_adjustment,
                currency_adjustment: row.currency_adjustment,
            })
        }
    }
}

// Temporary: foreign cash recorded as CUP in the sales (Super Admin only)
const currencyAdjustment = reactive({})
const savingCurrency = ref(null)
const savedCurrencyAdjustment = (currency) => Number(summary.value?.day?.currency_adjustments?.[currency]) || null
const fillCurrencyAdjustment = () => {
    for (const key of Object.keys(currencyAdjustment)) delete currencyAdjustment[key]
    for (const c of cash.value) {
        if (c.currency !== 'CUP') currencyAdjustment[c.currency] = savedCurrencyAdjustment(c.currency)
    }
}
const saveCurrencyAdjustment = async (currency) => {
    const amount = Number(currencyAdjustment[currency]) || null
    if (amount === savedCurrencyAdjustment(currency)) return
    savingCurrency.value = currency
    try {
        const { data } = await api.put(`FairDay/${fairStore.dayId}/CurrencyAdjustment`, { currency, amount })
        applyExpected(data.data)
        Success(data.message)
    } catch (error) {
        notifyApiError(error)
    } finally {
        currencyAdjustment[currency] = savedCurrencyAdjustment(currency)
        savingCurrency.value = null
    }
}

const applySummary = (data) => {
    summary.value = data
    cash.value = (data.cash || []).map((c) => ({ ...c, denominations: c.denominations.map((d) => ({ ...d, quantity: d.quantity || null })) }))
    transfers.value = (data.transfers || []).map((t) => ({ ...t, verified: t.verified === null ? null : Number(t.verified) }))
    notes.value = data.day?.notes || ''
    changeAdjustment.value = Number(data.day?.change_adjustment_cup) || null
    fillCurrencyAdjustment()
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
    const pending = unverifiedTransfers.value
    const transferWarning = pending.length
        ? ` Transferencias sin comprobar: ${pending.map((t) => t.name).join(', ')} (se cuenta lo registrado en las ventas).`
        : ''
    const message = hasCount.value
        ? `${surplusLabel.value}: ${surplusText.value}${surplusInForeign.value ? ` (= ${signed(surplus.value)} CUP)` : ''}.${surplusOffset.value ? ` ${surplusOffset.value}.` : ''}${transferWarning} Después de cerrar no se podrán registrar ventas ni movimientos en este día. ¿Cerrar?`
        : `No se ha contado el efectivo.${transferWarning} ¿Desea cerrar el día de todas formas?`
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

.day-close-notes {
    margin: 8px 0 16px;

    :deep(textarea) {
        min-height: 64px;
        line-height: 1.5;
    }
}

@media (max-width: 599px) {
    .day-close-notes {
        margin: 12px 0 20px;

        :deep(textarea) {
            min-height: 88px;
        }
    }
}

@media (min-width: 1024px) {
    .day-close-grid {
        grid-template-columns: 1.4fr 1fr;
    }
}
</style>
