<template>
    <q-page class="maia-page">
        <PageHeader title="Cierre de feria" section="Feria del día">
            <FairDaySelector hide-day @change="load" />
            <q-btn flat dense no-caps color="primary" icon="table_view" label="Excel" :disable="!fairStore.fairId"
                @click="downloadFile(`Report/FairClose/${fairStore.fairId}/Excel`, {}, 'cierre_feria.xlsx')" />
            <q-btn flat dense no-caps color="primary" icon="picture_as_pdf" label="PDF" :disable="!fairStore.fairId"
                @click="downloadFile(`Report/FairClose/${fairStore.fairId}/PDF`, {}, 'cierre_feria.pdf')" />
        </PageHeader>

        <q-inner-loading :showing="loading" color="primary" />
        <q-banner v-if="!fairStore.fairId" class="maia-card bg-orange-1 text-orange-9" rounded>Seleccione una feria.</q-banner>

        <template v-else-if="summary">
            <q-banner v-if="closed" class="maia-card bg-grey-3 q-mb-md" rounded>
                <template #avatar><q-icon name="lock" /></template>
                Feria cerrada{{ summary.fair.closed_at ? ` el ${new Date(summary.fair.closed_at).toLocaleString('es-ES')}` : '' }}.
                Los gastos quedan bloqueados.
                <span v-if="distribution?.distributed">Ya se repartió a los bolsillos; deshaga el reparto para poder reabrirla.</span>
                <template #action>
                    <q-btn v-if="can('cierre_feria.reabrir')" flat color="primary" icon="lock_open" label="Reabrir" no-caps
                        :disable="!!distribution?.distributed" @click="reopen" />
                </template>
            </q-banner>
            <q-banner v-else-if="summary.open_days.length" class="maia-card bg-orange-1 text-orange-10 q-mb-md" rounded>
                <template #avatar><q-icon name="warning" color="warning" /></template>
                {{ summary.open_days.length }} {{ summary.open_days.length === 1 ? 'día abierto' : 'días abiertos' }}:
                {{ summary.open_days.map((d) => formatDate(d.date)).join(', ') }}. Cierre los días antes de cerrar la feria para que el cuadre de caja quede completo.
            </q-banner>

            <div class="row q-col-gutter-md q-mb-md">
                <div v-for="s in stats" :key="s.label" class="col-6 col-sm-4 col-md">
                    <div class="maia-stat">
                        <div class="maia-stat__label">{{ s.label }}</div>
                        <div class="maia-stat__value" :class="s.class">{{ s.value }}</div>
                        <div v-if="s.caption" class="stat-caption">{{ s.caption }}</div>
                    </div>
                </div>
            </div>

            <div class="fair-close-grid">
                <div class="fair-close-col">
                    <q-card flat class="maia-card">
                        <q-card-section>
                            <div class="text-subtitle1 text-weight-bold q-mb-sm">Saldo disponible</div>
                            <div v-for="line in balanceLines" :key="line.label" class="row q-mb-xs" :class="line.class">
                                <div>{{ line.label }}</div><q-space /><span class="text-mono">{{ line.value }}</span>
                            </div>
                            <q-separator class="q-my-sm" />
                            <div class="row items-center">
                                <div class="text-weight-bold">Disponible</div>
                                <q-space />
                                <div class="text-h6 text-weight-bold" :class="b.available < 0 ? 'text-negative' : ''">{{ money(b.available) }} CUP</div>
                            </div>
                            <div class="row text-caption text-grey-7">
                                <div>Días con conteo de caja: {{ b.counted_days }} de {{ b.days }}</div><q-space />{{ money(b.available_usd) }} USD
                            </div>
                            <div v-if="b.inventory_debt" class="row q-mt-xs text-caption text-negative">
                                <div>Deuda por inventario (informativa)</div><q-space />{{ money(b.inventory_debt) }}
                            </div>
                        </q-card-section>

                        <q-separator class="q-mx-md" />

                        <q-card-section>
                            <div class="row items-center q-mb-sm">
                                <div class="text-subtitle1 text-weight-bold">Presupuestos</div>
                                <q-space />
                                <router-link :to="{ name: 'Presupuestos' }" class="text-caption text-primary">Gestionar</router-link>
                            </div>
                            <div v-for="item in summary.budgets.items" :key="item.id" class="row items-center q-mb-xs no-wrap">
                                <div class="col">{{ item.name }} <span class="text-caption text-grey">({{ item.percent }}%)</span></div>
                                <div class="col-auto text-mono">{{ money(item.amount) }}</div>
                            </div>
                            <div v-if="!summary.budgets.items?.length" class="text-caption text-grey q-mb-xs">
                                No hay presupuestos activos.
                                <router-link :to="{ name: 'Presupuestos' }" class="text-primary">Crear en Catálogo</router-link>
                            </div>
                            <div class="row text-weight-bold q-mt-sm">
                                <div>Total presupuestos</div><q-space />{{ money(summary.budgets.total) }} CUP
                            </div>
                            <div class="text-caption text-grey-7 q-mt-xs">Se calculan sobre el disponible; si es negativo, no se reserva nada. Los % se definen en Catálogo › Presupuestos.</div>
                        </q-card-section>

                        <q-separator class="q-mx-md" />

                        <q-card-section>
                            <div class="text-subtitle1 text-weight-bold q-mb-sm">Resultado</div>
                            <div class="row q-mb-xs"><div>Disponible</div><q-space /><span class="text-mono">{{ money(b.available) }}</span></div>
                            <div class="row q-mb-xs"><div>Presupuestos</div><q-space /><span class="text-mono">-{{ money(summary.budgets.total) }}</span></div>
                            <div class="row q-mb-xs"><div>Gastos</div><q-space /><span class="text-mono">-{{ money(summary.expenses.total_cup) }}</span></div>
                            <div class="row q-mb-xs"><div>Salarios</div><q-space /><span class="text-mono">-{{ money(summary.salary.total) }}</span></div>
                            <div v-if="b.available > 0" class="split-bar q-my-sm">
                                <div v-for="seg in splitBar" :key="seg.label" class="split-bar__seg" :class="seg.class"
                                    :style="{ width: `${seg.pct}%` }">
                                    <q-tooltip>{{ seg.label }}: {{ money(seg.value) }} ({{ seg.pct.toFixed(1) }}%)</q-tooltip>
                                </div>
                            </div>
                            <q-separator class="q-my-sm" />
                            <div class="row items-center">
                                <div class="text-weight-bold">{{ r.is_profit ? 'Utilidad' : 'Déficit' }}</div>
                                <q-space />
                                <div class="text-h6 text-weight-bold" :class="r.is_profit ? 'text-positive' : 'text-negative'">
                                    {{ money(r.amount) }} CUP
                                </div>
                            </div>
                            <div class="row text-caption text-grey-7"><q-space />{{ money(r.amount_usd) }} USD (tasa {{ summary.fair.usd_rate }})</div>
                        </q-card-section>
                        <q-card-actions v-if="!closed && canEdit" class="q-pa-md q-pt-none">
                            <q-space />
                            <q-btn unelevated no-caps color="primary" icon="lock" label="Cerrar feria" :loading="closing" @click="closeFair" />
                        </q-card-actions>
                    </q-card>
                </div>

                <div class="fair-close-col">
                    <q-card flat class="maia-card">
                        <q-card-section class="row items-center q-pb-sm">
                            <div class="text-subtitle1 text-weight-bold">Gastos</div>
                            <q-space />
                            <q-toggle v-model="showEmpty" dense size="sm" label="Ver todos los conceptos" class="q-mr-md text-caption" />
                            <q-btn v-if="!locked" unelevated dense no-caps color="primary" icon="add" label="Gasto" class="q-px-sm"
                                @click="openExpense()" />
                        </q-card-section>
                        <q-list separator class="expense-list">
                            <q-expansion-item
                                v-for="cat in visibleCategories" :key="cat.id"
                                class="expense-cat"
                                header-class="expense-cat__header"
                                expand-icon-class="text-primary"
                                :hide-expand-icon="!catHasDetails(cat)"
                                :model-value="catHasDetails(cat) && isCatExpanded(cat.id)"
                                @update:model-value="(v) => catHasDetails(cat) && setCatExpanded(cat.id, v)"
                            >
                                <template #header>
                                    <q-item-section avatar class="text-mono text-grey-7">{{ cat.code }}</q-item-section>
                                    <q-item-section>
                                        <q-item-label class="text-weight-medium">
                                            {{ cat.description }}
                                            <q-badge v-if="!cat.state" color="grey-6" label="inactivo" class="q-ml-xs" />
                                            <span v-if="catHasDetails(cat)" class="text-caption text-grey-7 q-ml-xs">
                                                · {{ catDetailCount(cat) }}
                                            </span>
                                        </q-item-label>
                                    </q-item-section>
                                    <q-item-section side>
                                        <div class="text-weight-bold text-mono" :class="cat.total_cup ? 'text-dark-ink' : 'text-grey-5'">{{ money(cat.total_cup) }}</div>
                                    </q-item-section>
                                    <q-item-section v-if="!locked" side class="action-col" @click.stop>
                                        <q-btn flat round dense size="sm" color="primary" icon="add" @click="openExpense(null, cat)">
                                            <q-tooltip>Añadir gasto a {{ cat.description }}</q-tooltip>
                                        </q-btn>
                                    </q-item-section>
                                </template>
                                <q-item v-for="item in cat.items" :key="item.id" dense class="expense-item">
                                    <q-item-section>
                                        <q-item-label>{{ item.description || '—' }}</q-item-label>
                                        <q-item-label caption>
                                            {{ item.date ? formatDate(item.date) : 'Toda la feria' }}
                                            <span v-if="item.currency !== 'CUP'"> · {{ money(item.amount) }} {{ item.currency }}</span>
                                            <span v-if="item.user"> · {{ item.user }}</span>
                                        </q-item-label>
                                    </q-item-section>
                                    <q-item-section side class="text-mono">{{ money(item.amount_cup) }}</q-item-section>
                                    <q-item-section v-if="!locked" side class="action-col">
                                        <div class="row no-wrap">
                                            <q-btn flat round dense size="sm" color="primary" icon="edit" @click="openExpense(item, cat)" />
                                            <q-btn flat round dense size="sm" color="negative" icon="delete" @click="removeExpense(item)" />
                                        </div>
                                    </q-item-section>
                                </q-item>
                            </q-expansion-item>
                            <q-item v-if="!visibleCategories.length" class="text-grey">Sin gastos registrados.</q-item>
                        </q-list>
                        <q-separator />
                        <q-card-section class="row items-center">
                            <div class="text-weight-bold">Total de gastos</div>
                            <q-space />
                            <div class="text-right">
                                <div class="text-h6 text-weight-bold">{{ money(summary.expenses.total_cup) }} CUP</div>
                                <div class="text-caption text-grey-7">{{ money(summary.expenses.total_usd) }} USD</div>
                            </div>
                        </q-card-section>
                    </q-card>

                    <q-card flat class="maia-card fair-close-salary">
                        <q-card-section class="row items-center q-pb-none">
                            <div class="text-subtitle1 text-weight-bold">Salarios de trabajadores</div>
                            <q-space />
                            <b>{{ money(summary.salary.total) }} CUP</b>
                        </q-card-section>
                        <q-list dense separator>
                            <q-item v-for="w in summary.salary.workers" :key="w.worker_id">
                                <q-item-section>{{ w.name }}</q-item-section>
                                <q-item-section side>{{ w.days }} {{ w.days === 1 ? 'día' : 'días' }} · {{ money(w.amount) }} CUP</q-item-section>
                            </q-item>
                            <q-item v-if="!summary.salary.workers.length" class="text-grey">Sin asistencia registrada.</q-item>
                        </q-list>
                        <q-card-section class="text-caption text-grey-7">
                            Se toma de la asistencia diaria. Para modificarla vaya a
                            <router-link :to="{ name: 'Propinas' }" class="text-primary">Propinas y salarios</router-link>.
                        </q-card-section>
                    </q-card>
                </div>

                <q-card v-if="closed && distribution" flat class="maia-card maia-card--accent fair-close-full">
                    <q-card-section class="row items-center q-pb-sm">
                        <q-icon name="savings" size="22px" class="q-mr-sm text-primary" />
                        <div class="text-subtitle1 text-weight-bold">Reparto a bolsillos</div>
                        <q-space />
                        <q-badge v-if="distribution.distributed" color="positive" class="q-pa-xs">
                            Repartido{{ distribution.distributed_at ? ` el ${new Date(distribution.distributed_at).toLocaleDateString('es-ES')}` : '' }}
                        </q-badge>
                        <router-link v-if="distribution.distributed" :to="{ name: 'FlujoCaja' }" class="text-primary text-caption q-ml-md">
                            Ver flujo de caja
                        </router-link>
                    </q-card-section>

                    <template v-if="distribution.distributed">
                        <q-list dense separator>
                            <q-item v-for="line in distribution.lines" :key="line.id">
                                <q-item-section>
                                    <q-item-label class="text-weight-medium">{{ line.fund }}</q-item-label>
                                    <q-item-label caption>{{ line.concept }}</q-item-label>
                                </q-item-section>
                                <q-item-section side class="text-mono">{{ money(line.amount) }} {{ line.currency }}</q-item-section>
                            </q-item>
                        </q-list>
                        <q-card-actions class="q-pa-md">
                            <div class="text-weight-bold">Total repartido: {{ money(distribution.total) }} CUP</div>
                            <q-space />
                            <q-btn v-if="can('finanzas.editar')" outline no-caps color="negative" icon="undo" label="Deshacer reparto"
                                :loading="distributing" @click="undoDistribution" />
                        </q-card-actions>
                    </template>

                    <template v-else>
                        <q-card-section class="q-pt-none text-caption text-grey-7">
                            Propuesta: la inversión vuelve a su bolsillo, los presupuestos de depreciación y marketing a los suyos, y la
                            utilidad se reparte según el % de cada bolsillo. Ajuste lo que necesite antes de confirmar.
                            <span v-if="distribution.is_deficit" class="text-negative text-weight-medium">
                                La feria cerró con déficit, así que no hay utilidad que repartir.
                            </span>
                            <span v-if="distribution.missing_roles?.length" class="text-warning text-weight-medium">
                                Falta un bolsillo activo para: {{ distribution.missing_roles.map((r) => FUND_ROLES[r]?.label || r).join(', ') }}.
                            </span>
                            <span v-if="distribution.missing_budget_funds?.length" class="text-warning text-weight-medium">
                                Presupuestos sin bolsillo: {{ distribution.missing_budget_funds.join(', ') }}. Asígnelos en Catálogo › Presupuestos.
                            </span>
                        </q-card-section>
                        <q-card-section class="q-pt-none">
                            <div v-for="(line, i) in distLines" :key="i" class="row q-col-gutter-sm items-center q-mb-xs">
                                <q-select class="col-12 col-sm-4" dense outlined emit-value map-options options-dense label="Bolsillo"
                                    :options="fundOptions" v-model="line.cash_fund_id" :disable="!can('finanzas.editar')" />
                                <q-input class="col-12 col-sm-4" dense outlined label="Concepto" maxlength="100" v-model="line.concept"
                                    :disable="!can('finanzas.editar')" />
                                <q-input class="col-7 col-sm-2" dense outlined type="number" min="0" step="0.01" label="Importe"
                                    input-class="text-right" v-model.number="line.amount" :disable="!can('finanzas.editar')" />
                                <q-select class="col-3 col-sm-1" dense outlined options-dense :options="CURRENCIES" v-model="line.currency"
                                    :disable="!can('finanzas.editar')" />
                                <div class="col-2 col-sm-1 text-right">
                                    <q-btn v-if="can('finanzas.editar')" flat round dense size="sm" color="negative" icon="close" @click="distLines.splice(i, 1)" />
                                </div>
                            </div>
                            <q-btn v-if="can('finanzas.editar')" flat dense no-caps color="primary" icon="add" label="Añadir línea" class="q-mt-xs"
                                @click="distLines.push({ cash_fund_id: null, concept: '', amount: null, currency: 'CUP' })" />
                        </q-card-section>
                        <q-card-actions class="q-pa-md">
                            <div>
                                <div class="text-weight-bold">Total a repartir: {{ money(distTotal) }} CUP</div>
                                <div class="text-caption" :class="Math.abs(distTotal - distribution.total) > 0.009 ? 'text-warning' : 'text-grey-7'">
                                    Propuesta del sistema: {{ money(distribution.total) }} CUP
                                </div>
                            </div>
                            <q-space />
                            <q-btn v-if="can('finanzas.editar')" unelevated no-caps color="primary" icon="check" label="Confirmar reparto"
                                :loading="distributing" :disable="!distValid" @click="confirmDistribution" />
                        </q-card-actions>
                    </template>
                </q-card>
            </div>
        </template>

        <!-- Expense dialog -->
        <q-dialog v-model="expenseDialog" persistent>
            <q-card class="maia-dialog-card" style="width: 440px; max-width: 95vw">
                <q-card-section class="q-pb-none">
                    <div class="text-h6">{{ expenseForm.id ? 'Editar gasto' : 'Nuevo gasto' }}</div>
                </q-card-section>
                <q-card-section class="expense-dialog-body">
                    <q-select class="maia-field" dense outlined emit-value map-options options-dense label="Concepto *"
                        :options="categoryOptions" v-model="expenseForm.expense_category_id"
                        hint="El concepto solo clasifica; el importe se indica abajo."
                        hide-bottom-space />
                    <q-select class="maia-field" dense outlined emit-value map-options options-dense clearable
                        label="Día (opcional)" :options="dayOptions" v-model="expenseForm.fair_day_id"
                        hint="Vacío = gasto de toda la feria." hide-bottom-space />
                    <q-input class="maia-field" dense outlined label="Detalle (opcional)" maxlength="160"
                        v-model="expenseForm.description" placeholder="Ej. recibo, proveedor" hide-bottom-space />
                    <div class="expense-amount-row">
                        <q-input class="maia-field expense-amount-row__amount" dense outlined type="number" min="0" step="0.01"
                            label="Importe *" input-class="text-right" v-model.number="expenseForm.amount" autofocus
                            hide-bottom-space @keyup.enter="saveExpense" />
                        <q-select class="maia-field expense-amount-row__currency" dense outlined options-dense emit-value
                            map-options label="Moneda"
                            :options="[{ label: 'CUP', value: 'CUP' }, { label: 'USD', value: 'USD' }]"
                            v-model="expenseForm.currency" hide-bottom-space />
                    </div>
                    <div v-if="expenseForm.currency === 'USD'" class="text-caption text-grey-7">
                        Equivale a {{ money((Number(expenseForm.amount) || 0) * summary.fair.usd_rate) }} CUP
                        (tasa {{ summary.fair.usd_rate }})
                    </div>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat no-caps label="Cancelar" v-close-popup />
                    <q-btn unelevated no-caps color="primary" label="Guardar" :loading="savingExpense"
                        :disable="!expenseForm.expense_category_id || !(expenseForm.amount > 0)" @click="saveExpense" />
                </q-card-actions>
            </q-card>
        </q-dialog>
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
import { money, formatDate, weekday, notifyApiError, downloadFile } from 'src/assets/js/util/maia'
import { CURRENCIES, FUND_ROLES } from 'src/assets/js/util/finance'

const $q = useQuasar()
const authStore = useAuthStore()
const fairStore = useFairStore()
const can = (p) => authStore.hasPermission(p)
const canEdit = computed(() => can('cierre_feria.editar'))

const summary = ref(null)
const categories = ref([])
const loading = ref(false)
const closing = ref(false)
const showEmpty = ref(false)
const expandedCats = ref(new Set())

const closed = computed(() => summary.value?.fair?.status === 'closed')
const locked = computed(() => closed.value || !canEdit.value)
const b = computed(() => summary.value?.balance || {})
const r = computed(() => summary.value?.result || {})

const catHasDetails = (cat) => cat.items.length > 0
const catDetailCount = (cat) => {
    const n = cat.items.length
    return n === 1 ? '1 detalle' : `${n} detalles`
}
const isCatExpanded = (id) => expandedCats.value.has(id)
const setCatExpanded = (id, open) => {
    const next = new Set(expandedCats.value)
    if (open) next.add(id)
    else next.delete(id)
    expandedCats.value = next
}
/** Keep open/closed as the user left them across saves; on full page load start collapsed. */
const syncExpandedCats = (reset = false) => {
    if (reset) {
        expandedCats.value = new Set()
        return
    }
    const cats = summary.value?.expenses.categories || []
    const next = new Set()
    for (const cat of cats) {
        if (expandedCats.value.has(cat.id) && catHasDetails(cat)) next.add(cat.id)
    }
    expandedCats.value = next
}

const stats = computed(() => {
    const s = summary.value
    return [
        { label: 'Venta bruta', value: money(s.balance.gross), caption: `${s.balance.sales_count} ventas` },
        { label: 'Ganancia', value: money(s.balance.profit), class: s.balance.profit < 0 ? 'text-negative' : '' },
        { label: 'Disponible', value: money(s.balance.available), caption: `${money(s.balance.available_usd)} USD` },
        {
            label: 'Presupuestos',
            value: money(s.budgets.total),
            caption: (s.budgets.items || []).map((i) => `${i.percent}%`).join(' + ') || 'Sin conceptos',
        },
        { label: 'Gastos', value: money(s.expenses.total_cup), caption: `${money(s.expenses.total_usd)} USD` },
        { label: 'Salarios', value: money(s.salary.total), caption: `${s.salary.workers.length} trabajadores` },
        {
            label: s.result.is_profit ? 'Utilidad' : 'Déficit',
            value: money(s.result.amount),
            caption: `${money(s.result.amount_usd)} USD`,
            class: s.result.is_profit ? 'text-positive' : 'text-negative',
        },
    ]
})

const balanceLines = computed(() => {
    const x = b.value
    const f = summary.value.fair
    return [
        { label: `Venta bruta (${x.sales_count} ventas)`, value: money(x.gross) },
        { label: `Porción vendedor (${f.seller_percent}%)`, value: `-${money(x.seller_portion)}` },
        { label: 'Inversión', value: `-${money(x.investment)}` },
        { label: 'Ganancia', value: money(x.profit), class: 'text-weight-bold' },
        { label: `Descuento FCBC (${f.fcbc_percent}%)`, value: `-${money(x.fcbc_discount)}` },
        { label: x.surplus < 0 ? 'Faltante de caja' : 'Sobrante de caja', value: money(x.surplus), class: x.surplus < 0 ? 'text-negative' : '' },
    ]
})

const splitBar = computed(() => {
    const total = b.value.available
    const parts = [
        { label: 'Presupuestos', value: summary.value.budgets.total, class: 'seg--budget' },
        { label: 'Gastos', value: summary.value.expenses.total_cup, class: 'seg--expense' },
        { label: 'Salarios', value: summary.value.salary.total, class: 'seg--salary' },
        { label: 'Utilidad', value: Math.max(r.value.amount, 0), class: 'seg--profit' },
    ]
    const sum = Math.max(total, parts.reduce((s, p) => s + p.value, 0))
    return parts.filter((p) => p.value > 0).map((p) => ({ ...p, pct: (p.value / sum) * 100 }))
})

const visibleCategories = computed(() => (summary.value?.expenses.categories || [])
    .filter((c) => showEmpty.value || c.total_cup !== 0 || c.items.length))

const categoryOptions = computed(() => categories.value
    .filter((c) => c.kind !== 'salary' && (c.state || c.id === expenseForm.expense_category_id))
    .map((c) => ({ label: `${c.code} · ${c.description}`, value: c.id })))

const dayOptions = computed(() => fairStore.days.map((d) => ({ label: `${weekday(d.date)} ${formatDate(d.date)}`, value: d.id })))

const load = async (spinner = true) => {
    if (!fairStore.fairId) {
        summary.value = null
        expandedCats.value = new Set()
        return
    }
    if (spinner) loading.value = true
    try {
        const { data } = await api.get(`FairClose/${fairStore.fairId}`)
        summary.value = data.data
        syncExpandedCats(spinner)
        await loadDistribution()
        if (!categories.value.length) {
            const res = await api.get('ExpenseCategory')
            categories.value = res.data.data || []
        }
    } catch (error) {
        notifyApiError(error)
    } finally {
        loading.value = false
    }
}

// Expenses
const expenseDialog = ref(false)
const savingExpense = ref(false)
const expenseForm = reactive({ id: null, expense_category_id: null, fair_day_id: null, description: '', amount: null, currency: 'CUP' })

const openExpense = (item = null, cat = null) => {
    Object.assign(expenseForm, {
        id: item?.id || null,
        expense_category_id: item?.expense_category_id || cat?.id || null,
        fair_day_id: item?.fair_day_id || null,
        description: item?.description || '',
        amount: item ? Number(item.amount) : null,
        currency: item?.currency || 'CUP',
    })
    expenseDialog.value = true
}

const saveExpense = async () => {
    if (!expenseForm.expense_category_id || !(expenseForm.amount > 0)) return
    savingExpense.value = true
    try {
        const payload = { ...expenseForm }
        delete payload.id
        const { data } = expenseForm.id
            ? await api.put(`FairClose/Expense/${expenseForm.id}`, payload)
            : await api.post(`FairClose/${fairStore.fairId}/Expense`, payload)
        Success(data.message)
        const catId = expenseForm.expense_category_id
        expenseDialog.value = false
        await load(false)
        if (catId) setCatExpanded(catId, true)
    } catch (error) {
        notifyApiError(error)
    } finally {
        savingExpense.value = false
    }
}

const removeExpense = (item) => {
    $q.dialog({
        title: 'Eliminar gasto',
        message: `¿Eliminar "${item.description || 'gasto'}" por ${money(item.amount_cup)} CUP?`,
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Eliminar', unelevated: true, color: 'negative' },
    }).onOk(async () => {
        try {
            const { data } = await api.delete(`FairClose/Expense/${item.id}`)
            Success(data.message)
            await load(false)
        } catch (error) {
            notifyApiError(error)
        }
    })
}

// Distribution to cash funds (only for closed fairs)
const distribution = ref(null)
const distLines = ref([])
const distributing = ref(false)
const funds = ref([])
const fundOptions = computed(() => funds.value.filter((f) => f.state).map((f) => ({ label: f.name, value: f.id })))
const distTotal = computed(() => distLines.value.filter((l) => l.currency === 'CUP').reduce((s, l) => s + (Number(l.amount) || 0), 0))
const distValid = computed(() => distLines.value.length > 0 && distLines.value.every((l) => l.cash_fund_id && Number(l.amount) > 0))

const loadDistribution = async () => {
    if (!closed.value || !can('finanzas.ver')) {
        distribution.value = null
        return
    }
    try {
        const requests = [api.get(`FairDistribution/${fairStore.fairId}`)]
        if (!funds.value.length) requests.push(api.get('CashFund'))
        const [dist, fundRes] = await Promise.all(requests)
        if (fundRes) funds.value = fundRes.data.data || []
        distribution.value = dist.data.data
        distLines.value = dist.data.data.distributed
            ? []
            : dist.data.data.lines.map((l) => ({ cash_fund_id: l.cash_fund_id, concept: l.concept, amount: l.amount, currency: l.currency }))
    } catch (error) {
        distribution.value = null
        notifyApiError(error)
    }
}

const confirmDistribution = () => {
    $q.dialog({
        title: 'Confirmar reparto',
        message: `Se registrarán ${distLines.value.length} entradas en los bolsillos por ${money(distTotal.value)} CUP. ¿Continuar?`,
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Confirmar', unelevated: true, color: 'primary' },
    }).onOk(async () => {
        distributing.value = true
        try {
            const { data } = await api.post(`FairDistribution/${fairStore.fairId}`, { lines: distLines.value })
            Success(data.message)
            await loadDistribution()
        } catch (error) {
            notifyApiError(error)
        } finally {
            distributing.value = false
        }
    })
}

const undoDistribution = () => {
    $q.dialog({
        title: 'Deshacer reparto',
        message: 'Se borrarán las entradas que este reparto creó en los bolsillos. ¿Continuar?',
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Deshacer', unelevated: true, color: 'negative' },
    }).onOk(async () => {
        distributing.value = true
        try {
            const { data } = await api.delete(`FairDistribution/${fairStore.fairId}`)
            Success(data.message)
            await loadDistribution()
        } catch (error) {
            notifyApiError(error)
        } finally {
            distributing.value = false
        }
    })
}

// Close / reopen
const setFairStatus = (status) => {
    const fair = fairStore.fairs.find((f) => f.id === fairStore.fairId)
    if (fair) fair.status = status
}

const closeFair = () => {
    const s = summary.value
    const openDays = s.open_days.length
        ? `\n\nAtención: hay ${s.open_days.length} ${s.open_days.length === 1 ? 'día abierto' : 'días abiertos'}; se recomienda cerrarlos primero.`
        : ''
    $q.dialog({
        title: 'Cerrar feria',
        message: `${s.result.is_profit ? 'Utilidad' : 'Déficit'}: ${money(s.result.amount)} CUP. Al cerrar, no se podrán registrar ventas ni modificar gastos de esta feria.${openDays}`,
        style: 'white-space: pre-line',
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Cerrar feria', unelevated: true, color: 'primary' },
    }).onOk(async () => {
        closing.value = true
        try {
            const { data } = await api.post(`FairClose/${fairStore.fairId}/Close`)
            setFairStatus('closed')
            Success(data.message)
            await load(false)
        } catch (error) {
            notifyApiError(error)
        } finally {
            closing.value = false
        }
    })
}

const reopen = () => {
    $q.dialog({
        title: 'Reabrir feria',
        message: '¿Desea reabrir la feria para registrar cambios?',
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Reabrir', unelevated: true, color: 'primary' },
    }).onOk(async () => {
        try {
            const { data } = await api.post(`FairClose/${fairStore.fairId}/Reopen`)
            setFairStatus('open')
            Success(data.message)
            await load(false)
        } catch (error) {
            notifyApiError(error)
        }
    })
}

</script>

<style lang="scss" scoped>
.expense-dialog-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-sizing: border-box;
}

.expense-amount-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
    box-sizing: border-box;

    &__amount {
        flex: 1 1 auto;
        min-width: 0;
    }

    &__currency {
        flex: 0 0 108px;
        max-width: 108px;
    }
}

.fair-close-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    align-items: start;
}

.fair-close-col {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    min-width: 0;
    width: 100%;

    > .maia-card {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
    }
}

.fair-close-salary {
    flex: 1 1 auto;
}

.fair-close-full {
    grid-column: 1 / -1;
}

@media (min-width: 1024px) {
    .fair-close-grid {
        grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    }
}

.expense-list {
    width: 100%;
    min-width: 0;
}

.expense-cat {
    background: brand-a(gold-pale, 0.25);

    :deep(.expense-cat__header) {
        min-height: 48px;
        cursor: pointer;
    }

    :deep(.q-item__section--main),
    :deep(.q-item__label) {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    :deep(.q-expansion-item__toggle-icon) {
        color: var(--maia-wine);
    }
}

.expense-item {
    min-height: 36px;
    padding-left: 12px;
}

.action-col {
    flex: 0 0 auto;
    width: 72px;
    align-items: flex-end;
}

.text-dark-ink {
    color: $maia-ink;
}

body.body--dark {
    .expense-cat {
        background: brand-a(gold, 0.08);
    }

    .text-dark-ink {
        color: inherit;
    }
}

.split-bar {
    display: flex;
    height: 10px;
    border-radius: 6px;
    overflow: hidden;
    background: brand-a(gold-pale, 0.5);

    &__seg {
        height: 100%;
    }

    .seg--budget {
        background: $maia-gold;
    }

    .seg--expense {
        background: $maia-wine-light;
    }

    .seg--salary {
        background: $maia-teal;
    }

    .seg--profit {
        background: $maia-emerald;
    }
}
</style>
