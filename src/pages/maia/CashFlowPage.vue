<template>
    <q-page class="maia-page">
        <PageHeader title="Flujo de caja" section="Finanzas">
            <q-btn flat dense no-caps color="primary" icon="table_view" label="Excel"
                @click="downloadFile('Report/CashFlow/Excel', exportParams, 'flujo_de_caja.xlsx')" />
            <q-btn flat dense no-caps color="primary" icon="picture_as_pdf" label="PDF"
                @click="downloadFile('Report/CashFlow/PDF', exportParams, 'flujo_de_caja.pdf')" />
            <template v-if="canEdit">
                <q-btn unelevated dense no-caps color="positive" icon="south_west" label="Entrada" class="q-px-sm" @click="openMovement('in')" />
                <q-btn unelevated dense no-caps color="negative" icon="north_east" label="Salida" class="q-px-sm" @click="openMovement('out')" />
                <q-btn unelevated dense no-caps color="primary" icon="swap_horiz" label="Traspaso" class="q-px-sm" @click="openMovement('transfer')" />
            </template>
        </PageHeader>

        <!-- Balances -->
        <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                <div class="maia-stat fund-card fund-card--total">
                    <div class="maia-stat__label">Total en bolsillos</div>
                    <div v-for="c in usedCurrencies(balances.totals)" :key="c" class="fund-line">
                        <span class="fund-amount" :class="balances.totals[c] < 0 ? 'text-negative' : ''">{{ money(balances.totals[c]) }}</span>
                        <small>{{ c }}</small>
                    </div>
                    <div class="stat-caption">≈ {{ money(balances.total_cup) }} CUP</div>
                </div>
            </div>
            <div v-for="f in balances.funds" :key="f.id" class="col-6 col-sm-6 col-md-4 col-lg-3">
                <div class="maia-stat fund-card" :class="{ 'fund-card--active': filters.fund_id === f.id, 'fund-card--off': !f.state }"
                    @click="toggleFund(f.id)">
                    <div class="row items-center no-wrap">
                        <div class="maia-stat__label ellipsis">{{ f.name }}</div>
                        <q-space />
                        <q-icon :name="FUND_ROLES[f.role]?.icon" size="16px" class="text-grey-6">
                            <q-tooltip>{{ FUND_ROLES[f.role]?.label }}{{ f.role === 'profit' ? ` · ${f.profit_percent}%` : '' }}</q-tooltip>
                        </q-icon>
                    </div>
                    <div v-for="c in usedCurrencies(f.balances)" :key="c" class="fund-line">
                        <span class="fund-amount" :class="f.balances[c] < 0 ? 'text-negative' : ''">{{ money(f.balances[c]) }}</span>
                        <small>{{ c }}</small>
                    </div>
                    <div v-if="usedCurrencies(f.balances).length > 1 || !f.balances.CUP" class="stat-caption">≈ {{ money(f.total_cup) }} CUP</div>
                </div>
            </div>
        </div>

        <!-- Movements -->
        <q-card flat class="maia-card">
            <q-card-section class="row items-center q-col-gutter-sm">
                <div class="col-12 col-md-auto text-subtitle1 text-weight-bold q-mr-md">Movimientos</div>
                <q-select class="col-6 col-md-2" dense outlined emit-value map-options clearable options-dense label="Bolsillo"
                    :options="fundOptions" v-model="filters.fund_id" />
                <q-select class="col-6 col-md-1" dense outlined clearable options-dense label="Moneda" :options="CURRENCIES" v-model="filters.currency" />
                <q-select class="col-6 col-md-2" dense outlined emit-value map-options clearable options-dense label="Origen"
                    :options="sourceOptions" v-model="filters.source" />
                <q-input class="col-6 col-md-2" dense outlined type="date" stack-label label="Desde" v-model="filters.from" clearable />
                <q-input class="col-6 col-md-2" dense outlined type="date" stack-label label="Hasta" v-model="filters.to" clearable />
                <q-input class="col-6 col-md" dense outlined debounce="400" v-model="filter" placeholder="Buscar concepto">
                    <template #prepend><q-icon name="search" /></template>
                </q-input>
            </q-card-section>
            <q-table flat class="maia-table" :rows="items" :columns="columns" row-key="id" :loading="loading"
                v-model:pagination="pagination" @request="onRequest" :rows-per-page-options="[20, 50, 100]"
                no-data-label="Sin movimientos" rows-per-page-label="Filas por página">
                <template #body-cell-source="props">
                    <q-td :props="props">
                        <q-chip dense square :icon="SOURCES[props.value].icon" :class="`source-chip source-chip--${props.value}`">
                            {{ SOURCES[props.value].label }}
                        </q-chip>
                    </q-td>
                </template>
                <template #body-cell-concept="props">
                    <q-td :props="props">
                        <div>{{ props.value }}</div>
                        <div v-if="props.row.user" class="text-caption text-grey-6">{{ props.row.user.name }}</div>
                    </q-td>
                </template>
                <template #body-cell-in="props">
                    <q-td :props="props" class="text-positive text-mono">
                        {{ props.row.direction === 'in' ? `${money(props.row.amount)} ${props.row.currency}` : '' }}
                    </q-td>
                </template>
                <template #body-cell-out="props">
                    <q-td :props="props" class="text-negative text-mono">
                        {{ props.row.direction === 'out' ? `${money(props.row.amount)} ${props.row.currency}` : '' }}
                    </q-td>
                </template>
                <template #body-cell-action="props">
                    <q-td :props="props">
                        <q-btn v-if="canEdit && ['manual', 'transfer'].includes(props.row.source)" flat round dense color="negative" icon="delete"
                            @click="remove(props.row, props.row.source === 'transfer' ? 'este traspaso (se borran sus dos movimientos)' : 'este movimiento')" />
                        <q-icon v-else-if="props.row.source !== 'manual' && props.row.source !== 'transfer'" name="lock" color="grey-5" size="18px">
                            <q-tooltip>{{ props.row.source === 'fair' ? 'Se deshace desde el cierre de feria' : 'Se anula desde Pagos programados' }}</q-tooltip>
                        </q-icon>
                    </q-td>
                </template>
            </q-table>
        </q-card>

        <!-- Movement dialog -->
        <q-dialog v-model="dialog" persistent>
            <q-card class="maia-dialog-card" style="width: 480px">
                <q-form @submit.prevent="submit">
                    <q-card-section class="text-h6">{{ TYPE_TITLES[form.type] }}</q-card-section>
                    <q-card-section class="q-pt-none">
                        <q-btn-toggle v-model="form.type" spread no-caps unelevated toggle-color="primary" color="grey-3" text-color="dark"
                            :options="[{ label: 'Entrada', value: 'in' }, { label: 'Salida', value: 'out' }, { label: 'Traspaso', value: 'transfer' }]" />
                    </q-card-section>
                    <q-card-section class="row q-col-gutter-md">
                        <q-select :class="form.type === 'transfer' ? 'col-6' : 'col-12'" class="maia-field" outlined dense emit-value map-options
                            :label="form.type === 'transfer' ? 'Desde *' : 'Bolsillo *'" :options="activeFundOptions" v-model="form.cash_fund_id"
                            :hint="form.cash_fund_id && form.type !== 'in' ? `Saldo: ${money(balanceOf(form.cash_fund_id, form.currency))} ${form.currency}` : ''" />
                        <q-select v-if="form.type === 'transfer'" class="col-6 maia-field" outlined dense emit-value map-options label="Hacia *"
                            :options="activeFundOptions.filter((o) => o.value !== form.cash_fund_id)" v-model="form.to_fund_id" />
                        <q-input class="col-7 maia-field" outlined dense type="number" min="0" step="0.01" label="Importe *" input-class="text-right"
                            v-model.number="form.amount" :rules="[(v) => v > 0 || 'Mayor que 0']" />
                        <q-select class="col-5 maia-field" outlined dense label="Moneda" :options="CURRENCIES" v-model="form.currency" />
                        <q-input class="col-12 col-sm-5 maia-field" outlined dense type="date" stack-label label="Fecha *" v-model="form.date" />
                        <q-input class="col-12 col-sm-7 maia-field" outlined dense label="Concepto *" maxlength="160" v-model="form.concept"
                            :rules="[(v) => !!v || 'Requerido']" />
                    </q-card-section>
                    <q-card-actions align="right">
                        <q-btn flat no-caps label="Cancelar" v-close-popup />
                        <q-btn unelevated no-caps color="primary" label="Guardar" type="submit" :loading="saving"
                            :disable="!form.cash_fund_id || (form.type === 'transfer' && !form.to_fund_id)" />
                    </q-card-actions>
                </q-form>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { api } from 'src/boot/axios'
import PageHeader from 'src/components/maia/PageHeader.vue'
import { useCrudTable } from 'src/composables/useCrudTable'
import { useAuthStore } from 'src/stores/auth-store'
import { Success } from 'src/assets/js/util/notify'
import { money, formatDate, notifyApiError, downloadFile } from 'src/assets/js/util/maia'
import { CURRENCIES, SOURCES, FUND_ROLES, today, withFundsCheck } from 'src/assets/js/util/finance'

const TYPE_TITLES = { in: 'Registrar entrada', out: 'Registrar salida', transfer: 'Traspaso entre bolsillos' }

const authStore = useAuthStore()
const canEdit = computed(() => authStore.hasPermission('finanzas.editar'))

const filters = reactive({ fund_id: null, currency: null, source: null, from: null, to: null })
const cleanFilters = () => Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== null && v !== ''))
const { items, filter, loading, saving, pagination, load, onRequest, remove } = useCrudTable('CashMovement', {
    extraParams: cleanFilters,
    rowsPerPage: 20,
})
const exportParams = computed(() => ({ ...cleanFilters(), ...(filter.value ? { search: filter.value } : {}) }))
watch(filters, () => load(1))

const columns = [
    { name: 'date', label: 'Fecha', field: 'date', align: 'left', format: formatDate },
    { name: 'fund', label: 'Bolsillo', field: (r) => r.fund?.name, align: 'left' },
    { name: 'source', label: 'Origen', field: 'source', align: 'left' },
    { name: 'concept', label: 'Concepto', field: 'concept', align: 'left' },
    { name: 'in', label: 'Entrada', field: 'amount', align: 'right' },
    { name: 'out', label: 'Salida', field: 'amount', align: 'right' },
    { name: 'action', label: '', field: 'id', align: 'center' },
]
const sourceOptions = Object.entries(SOURCES).map(([value, s]) => ({ value, label: s.label }))

// Balances
const balances = ref({ funds: [], totals: {}, total_cup: 0 })
const fundOptions = computed(() => balances.value.funds.map((f) => ({ label: f.name, value: f.id })))
const activeFundOptions = computed(() => balances.value.funds.filter((f) => f.state).map((f) => ({ label: f.name, value: f.id })))
const usedCurrencies = (b) => {
    const used = CURRENCIES.filter((c) => Number(b?.[c] || 0) !== 0)
    return used.length ? used : ['CUP']
}
const balanceOf = (fundId, currency) => Number(balances.value.funds.find((f) => f.id === fundId)?.balances?.[currency] || 0)
const loadBalances = async () => {
    try {
        const { data } = await api.get('CashMovement/Balances')
        balances.value = data.data
    } catch (error) {
        notifyApiError(error)
    }
}
watch(items, loadBalances)
const toggleFund = (id) => { filters.fund_id = filters.fund_id === id ? null : id }

// Movement dialog
const dialog = ref(false)
const form = reactive({ type: 'in', cash_fund_id: null, to_fund_id: null, currency: 'CUP', amount: null, date: today(), concept: '' })
const openMovement = (type) => {
    Object.assign(form, { type, cash_fund_id: filters.fund_id, to_fund_id: null, currency: filters.currency || 'CUP', amount: null, date: today(), concept: '' })
    dialog.value = true
}

const submit = async () => {
    saving.value = true
    try {
        const payload = { ...form }
        if (form.type !== 'transfer') delete payload.to_fund_id
        const res = await withFundsCheck((allowNegative) => api.post('CashMovement/Create', { ...payload, allow_negative: allowNegative }))
        if (!res) return
        Success(res.data.message)
        dialog.value = false
        await load()
    } catch (error) {
        notifyApiError(error)
    } finally {
        saving.value = false
    }
}

onMounted(() => load(1))
</script>

<style lang="scss" scoped>
.fund-card {
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 26px brand-a(wine-deep, 0.1);
    }

    &--active {
        border-color: $maia-gold;
        box-shadow: 0 0 0 2px brand-a(gold, 0.35);
    }

    &--off {
        opacity: 0.6;
    }

    &--total {
        cursor: default;
        background: linear-gradient(135deg, brand-a(gold-pale, 0.55), transparent 70%), var(--app-card-bg);

        &:hover {
            transform: none;
        }
    }
}

.fund-line {
    line-height: 1.25;
}

.fund-amount {
    font-family: $maia-serif;
    font-size: 1.25rem;
    font-weight: 600;
}

.fund-line small {
    margin-left: 4px;
    font-size: 0.7rem;
    color: var(--app-text-muted);
}

.source-chip {
    font-size: 12px;
    background: brand-a(gold-pale, 0.6);
    color: $maia-ink;

    &--transfer {
        background: rgba($maia-blue, 0.14);
        color: mix(#000, $maia-blue, 25%);
    }

    &--fair {
        background: rgba($maia-teal, 0.15);
        color: mix(#000, $maia-teal, 25%);
    }

    &--payment {
        background: rgba($maia-flame, 0.12);
        color: $maia-flame;
    }
}

body.body--dark .source-chip--manual {
    background: brand-a(gold, 0.18);
    color: $maia-gold-light;
}
</style>
