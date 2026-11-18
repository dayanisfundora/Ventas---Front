<template>
    <q-page class="maia-page">
        <PageHeader title="Presupuestos" section="Configuración">
            <q-input dense outlined debounce="250" v-model="filter" placeholder="Buscar" class="maia-field" clearable>
                <template #prepend><q-icon name="search" /></template>
            </q-input>
            <q-btn v-if="canEdit" unelevated round color="primary" icon="add" @click="openDialog()">
                <q-tooltip>Adicionar presupuesto principal</q-tooltip>
            </q-btn>
        </PageHeader>

        <div class="text-caption text-grey q-mb-md">
            Porcentajes sobre el disponible del cierre de feria. Un presupuesto desglosado en partes suma el % de sus partes.<template
                v-if="financeEnabled"> Cada concepto puede enviarse a un bolsillo al repartir (las partes sin bolsillo usan el del presupuesto principal).</template>
        </div>

        <q-card v-if="budgetForeign" flat class="maia-card budget-foreign q-mb-md">
            <q-card-section>
                <div class="text-subtitle2 q-mb-xs">¿Y lo cobrado en otra moneda (USD, EUR…)?</div>
                <q-option-group :model-value="budgetForeign" :options="foreignOptions" dense :disable="!canEdit || savingForeign"
                    @update:model-value="saveForeign" />
                <div class="text-caption text-grey q-mt-xs">{{ FOREIGN_HELP[budgetForeign] }}</div>
                <div class="text-caption text-grey-7 q-mt-xs">
                    Es la forma general. Si un presupuesto debe ir distinto (por ejemplo, que solo uno tome de los USD), edítelo y elija su
                    forma en «Moneda extranjera».
                </div>
            </q-card-section>
        </q-card>

        <q-table flat class="maia-card maia-table" :rows="visibleRows" :columns="columns" row-key="id" :loading="loading"
            :pagination="{ rowsPerPage: 0 }" hide-pagination no-data-label="No hay presupuestos">
            <template #body="props">
                <q-tr :props="props" :class="{ 'budget-child': props.row.parent_id, 'budget-off': !props.row.state || props.row.parentOff }">
                    <q-td key="name" :props="props">
                        <div class="row items-center no-wrap" :class="{ 'q-pl-lg': props.row.parent_id }">
                            <q-btn v-if="props.row.children.length" flat round dense size="sm" class="q-mr-xs"
                                :icon="isOpen(props.row) ? 'expand_more' : 'chevron_right'" @click="toggle(props.row)" />
                            <q-icon v-else-if="props.row.parent_id" name="subdirectory_arrow_right" size="16px" class="text-grey-6 q-mr-xs" />
                            <span v-else class="budget-spacer" />
                            <span class="text-grey-6 text-mono q-mr-sm">{{ props.row.code }}</span>
                            <span :class="{ 'text-weight-bold': !props.row.parent_id }">{{ props.row.name }}</span>
                            <q-badge v-if="props.row.children.length" outline color="primary" class="q-ml-sm"
                                :label="`${props.row.children.length} ${props.row.children.length === 1 ? 'parte' : 'partes'}`" />
                            <q-badge v-if="props.row.foreign_mode" outline color="accent" class="q-ml-sm"
                                :label="`USD/EUR: ${FOREIGN_SHORT[props.row.foreign_mode]}`">
                                <q-tooltip>Forma propia para la moneda extranjera: {{ foreignLabelOf(props.row.foreign_mode) }}</q-tooltip>
                            </q-badge>
                        </div>
                    </q-td>
                    <q-td key="percent" :props="props">
                        <span :class="{ 'text-weight-bold': props.row.children.length }">{{ fmtPercent(percentOf(props.row)) }}%</span>
                        <q-tooltip v-if="props.row.children.length">Suma de sus partes activas</q-tooltip>
                    </q-td>
                    <q-td v-if="financeEnabled" key="cash_fund" :props="props">
                        <span v-if="props.row.cash_fund">{{ props.row.cash_fund.name }}</span>
                        <span v-else-if="props.row.parent_id && parentOf(props.row)?.cash_fund" class="text-grey-6">
                            {{ parentOf(props.row).cash_fund.name }} (del principal)
                        </span>
                        <span v-else>—</span>
                    </q-td>
                    <q-td key="sort" :props="props">{{ props.row.sort }}</q-td>
                    <q-td key="state" :props="props">
                        <q-icon :name="props.row.state ? 'check_circle' : 'cancel'" :color="props.row.state ? 'positive' : 'grey-5'" size="20px" />
                    </q-td>
                    <q-td key="action" :props="props">
                        <template v-if="canEdit">
                            <q-btn v-if="!props.row.parent_id" flat round dense color="primary" icon="playlist_add"
                                @click="openDialog(null, props.row)">
                                <q-tooltip>Desglosar: agregar una parte</q-tooltip>
                            </q-btn>
                            <q-btn flat round dense color="primary" icon="edit" @click="openDialog(props.row)" />
                            <q-btn flat round dense color="negative" icon="delete" :disable="props.row.children.length > 0"
                                @click="remove(props.row)">
                                <q-tooltip v-if="props.row.children.length">Elimine primero sus partes</q-tooltip>
                            </q-btn>
                        </template>
                    </q-td>
                </q-tr>
            </template>
        </q-table>

        <q-dialog v-model="dialog" persistent>
            <q-card class="maia-dialog-card" style="width: 480px">
                <q-form @submit.prevent="submit">
                    <q-card-section class="text-h6">{{ dialogTitle }}</q-card-section>
                    <q-card-section class="q-gutter-md">
                        <q-select outlined dense class="maia-field" emit-value map-options clearable options-dense
                            label="Pertenece a" :options="parentOptions" v-model="form.parent_id" :disable="editingHasChildren"
                            :hint="editingHasChildren ? 'Tiene partes: debe seguir siendo principal.' : 'Vacío = presupuesto principal.'" />
                        <q-input outlined dense class="maia-field" label="Nombre *" v-model="form.name"
                            maxlength="80" counter :rules="[(v) => !!v || 'Requerido']" />
                        <q-input v-if="editingHasChildren" outlined dense class="maia-field" readonly label="Porcentaje"
                            suffix="%" :model-value="fmtPercent(childrenPercent(form.id))" hint="Suma de sus partes activas." />
                        <q-input v-else outlined dense class="maia-field" type="number" min="0" max="100" step="0.5" label="Porcentaje *"
                            suffix="%" v-model.number="form.percent" :rules="[(v) => v >= 0 && v <= 100 || '0–100']"
                            :hint="form.parent_id ? 'Sobre el disponible; se suma al % del presupuesto principal.' : ''" />
                        <q-select v-if="financeEnabled" outlined dense class="maia-field" emit-value map-options clearable options-dense
                            label="Bolsillo destino" :options="fundOptions" v-model="form.cash_fund_id"
                            :hint="form.parent_id ? 'Vacío = el bolsillo del presupuesto principal.' : 'Al repartir la feria, este importe va a ese bolsillo.'" />
                        <q-select outlined dense class="maia-field" emit-value map-options options-dense
                            label="Moneda extranjera (USD, EUR…)" :options="foreignOptions" v-model="conceptForeign"
                            :hint="FOREIGN_HELP[conceptForeign]" />
                        <q-input outlined dense class="maia-field" type="number" label="Orden" v-model.number="form.sort"
                            hint="Posición dentro de su nivel (menor primero). Vacío = al final." />
                        <q-toggle v-model="form.state" label="Activo" />
                    </q-card-section>
                    <q-card-actions align="right">
                        <q-btn flat label="Cancelar" v-close-popup />
                        <q-btn unelevated color="primary" label="Guardar" type="submit" :loading="saving" />
                    </q-card-actions>
                </q-form>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import PageHeader from 'src/components/maia/PageHeader.vue'
import { useAuthStore } from 'src/stores/auth-store'
import { Success } from 'src/assets/js/util/notify'
import { notifyApiError } from 'src/assets/js/util/maia'
import { featureEnabled } from 'src/assets/js/util/features'

const $q = useQuasar()
const authStore = useAuthStore()
const financeEnabled = featureEnabled('finance')
const canEdit = computed(() => authStore.hasAnyPermission(['presupuestos.crear', 'presupuestos.editar', 'presupuestos.eliminar']))

const concepts = ref([])
const loading = ref(false)
const saving = ref(false)
const filter = ref('')
const fundOptions = ref([])
const collapsed = reactive({})

const columns = [
    { name: 'name', label: 'Presupuesto', field: 'name', align: 'left' },
    { name: 'percent', label: '%', field: 'percent', align: 'right' },
    ...(financeEnabled ? [{ name: 'cash_fund', label: 'Bolsillo', field: 'cash_fund', align: 'left' }] : []),
    { name: 'sort', label: 'Orden', field: 'sort', align: 'center' },
    { name: 'state', label: 'Activo', field: 'state', align: 'center' },
    { name: 'action', label: 'Acciones', field: 'action', align: 'center' },
]

const bySort = (a, b) => (a.sort - b.sort) || String(a.code).localeCompare(String(b.code))
const normalize = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const fmtPercent = (v) => Number(v || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })

const tree = computed(() => {
    const roots = concepts.value.filter((c) => !c.parent_id).sort(bySort)
    return roots.map((root) => ({
        ...root,
        children: concepts.value
            .filter((c) => c.parent_id === root.id)
            .sort(bySort)
            .map((c) => ({ ...c, children: [], parentOff: !root.state })),
    }))
})

const parentOf = (row) => concepts.value.find((c) => c.id === row.parent_id)
const childrenPercent = (id) => concepts.value
    .filter((c) => c.parent_id === id && c.state)
    .reduce((s, c) => s + Number(c.percent), 0)
const percentOf = (row) => (row.children.length ? childrenPercent(row.id) : Number(row.percent))

const isOpen = (row) => !collapsed[row.id] || !!filter.value?.trim()
const toggle = (row) => { collapsed[row.id] = !collapsed[row.id] }

const visibleRows = computed(() => {
    const term = normalize(filter.value).trim()
    const matches = (c) => !term || normalize(`${c.code} ${c.name}`).includes(term)
    const rows = []
    for (const root of tree.value) {
        const kids = root.children.filter((c) => matches(c) || matches(root))
        if (!matches(root) && !kids.length) continue
        rows.push(root)
        if (isOpen(root)) rows.push(...kids)
    }
    return rows
})

/* ---------- Dialog ---------- */
const dialog = ref(false)
const empty = () => ({ id: null, parent_id: null, name: '', percent: 10, cash_fund_id: null, foreign_mode: null, sort: null, state: true })
const form = reactive(empty())

const editingHasChildren = computed(() => !!form.id && concepts.value.some((c) => c.parent_id === form.id))
const parentOptions = computed(() => concepts.value
    .filter((c) => !c.parent_id && c.id !== form.id)
    .sort(bySort)
    .map((c) => ({ label: `${c.code} · ${c.name}`, value: c.id })))
const dialogTitle = computed(() => {
    if (form.id) return 'Editar presupuesto'
    const parent = concepts.value.find((c) => c.id === form.parent_id)
    return parent ? `Nuevo desglose de ${parent.name}` : 'Nuevo presupuesto'
})

// The parent's own % stops counting once it has children; the first one inherits it.
const firstChildPercent = (parent) => (parent.children.length ? 0 : Number(parent.percent))

const openDialog = (row = null, parent = null) => {
    Object.assign(form, row
        ? {
            id: row.id,
            parent_id: row.parent_id || null,
            name: row.name,
            percent: Number(row.percent),
            cash_fund_id: row.cash_fund_id || null,
            foreign_mode: row.foreign_mode || null,
            sort: row.sort,
            state: !!row.state,
        }
        : { ...empty(), parent_id: parent?.id || null, percent: parent ? firstChildPercent(parent) : 10 })
    if (parent) collapsed[parent.id] = false
    dialog.value = true
}

const submit = async () => {
    const payload = {
        ...form,
        percent: editingHasChildren.value ? childrenPercent(form.id) : form.percent,
        parent_id: form.parent_id || null,
        sort: form.sort === '' || form.sort === null ? null : form.sort,
        cash_fund_id: form.cash_fund_id || null,
        foreign_mode: form.foreign_mode || null,
    }
    saving.value = true
    try {
        if (payload.id) await api.put(`BudgetConcept/Update/${payload.id}`, payload)
        else await api.post('BudgetConcept/Create', payload)
        Success(payload.id ? 'Presupuesto modificado' : 'Presupuesto creado')
        dialog.value = false
        await load()
    } catch (error) {
        notifyApiError(error)
    } finally {
        saving.value = false
    }
}

const remove = (row) => {
    $q.dialog({
        title: 'Eliminar',
        message: `¿Desea eliminar el presupuesto ${row.name}?`,
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Eliminar', color: 'negative', unelevated: true },
        persistent: true,
    }).onOk(async () => {
        try {
            await api.delete(`BudgetConcept/Delete/${row.id}`)
            Success('Presupuesto eliminado')
            await load()
        } catch (error) {
            notifyApiError(error)
        }
    })
}

/* ---------- Data ---------- */
const load = async () => {
    loading.value = true
    try {
        const { data } = await api.get('BudgetConcept/')
        concepts.value = data.data || []
    } catch (error) {
        concepts.value = []
        notifyApiError(error)
    } finally {
        loading.value = false
    }
}

const loadFunds = async () => {
    try {
        const { data } = await api.get('CashFund/')
        fundOptions.value = (data.data || []).filter((f) => f.state).map((f) => ({ label: f.name, value: f.id }))
    } catch (error) {
        fundOptions.value = []
        notifyApiError(error)
    }
}

/* ---------- Foreign currency ---------- */
const FOREIGN_HELP = {
    income: 'Cada moneda calcula su % (CUP del disponible; USD/EUR de la venta). Si una no tiene disponible, ese monto pasa a otra moneda extranjera que sí tenga (ej. EUR → USD) y, si no alcanza, a CUP.',
    available: 'Cada presupuesto reserva su % de lo que queda en esa moneda después de reponer la inversión; si no queda nada, no se reserva.',
    cup_only: 'Los presupuestos se reservan solo del disponible en CUP; lo cobrado en moneda extranjera no aporta a los presupuestos.',
    cup_total: 'Los presupuestos se calculan sobre todo el disponible (todas las monedas pasadas a CUP) y se reservan en CUP.',
}
const FOREIGN_SHORT = {
    income: 'Excel: CUP disponible / venta extranjera',
    available: '% del disponible',
    cup_only: 'solo CUP',
    cup_total: 'todo en CUP',
}
const budgetForeign = ref(null)
const foreignOptions = ref([])
const savingForeign = ref(false)
const foreignLabelOf = (mode) => foreignOptions.value.find((o) => o.value === mode)?.label || mode

const inheritedForeign = computed(() => ({
    mode: concepts.value.find((c) => c.id === form.parent_id)?.foreign_mode || budgetForeign.value,
}))
// Choosing what it would inherit anyway is stored as "no own mode", so it follows later changes.
const conceptForeign = computed({
    get: () => form.foreign_mode || inheritedForeign.value.mode,
    set: (value) => { form.foreign_mode = value === inheritedForeign.value.mode ? null : value },
})

const loadForeign = async () => {
    try {
        const { data } = await api.get('Settings/Budgets')
        budgetForeign.value = data.config.foreign
        foreignOptions.value = Object.entries(data.foreign).map(([value, label]) => ({ value, label }))
    } catch (error) {
        notifyApiError(error)
    }
}

const saveForeign = async (value) => {
    const previous = budgetForeign.value
    budgetForeign.value = value
    savingForeign.value = true
    try {
        const { data } = await api.put('Settings/Budgets', { foreign: value })
        budgetForeign.value = data.config.foreign
        Success(data.message)
    } catch (error) {
        budgetForeign.value = previous
        notifyApiError(error)
    } finally {
        savingForeign.value = false
    }
}

onMounted(async () => {
    loadForeign()
    if (financeEnabled) await loadFunds()
    load()
})
</script>

<style lang="scss" scoped>
.budget-spacer {
    display: inline-block;
    width: 28px;
}

.budget-child td {
    font-size: 0.92em;
}

.budget-off {
    opacity: 0.55;
}

.budget-foreign {
    max-width: 640px;
}</style>
