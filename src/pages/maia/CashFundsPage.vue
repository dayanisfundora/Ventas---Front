<template>
    <q-page class="maia-page">
        <PageHeader title="Bolsillos" section="Finanzas">
            <q-input dense outlined debounce="400" v-model="filter" placeholder="Buscar" class="maia-field">
                <template #prepend><q-icon name="search" /></template>
            </q-input>
            <q-btn v-if="canEdit" unelevated round color="primary" icon="add" @click="openDialog()">
                <q-tooltip>Adicionar</q-tooltip>
            </q-btn>
        </PageHeader>

        <q-banner v-if="profitWarning" class="maia-card bg-orange-1 text-orange-10 q-mb-md" rounded>
            <template #avatar><q-icon name="warning" color="warning" /></template>
            Los porcentajes de utilidad de los bolsillos activos suman {{ profitSum }}%. Al repartir una feria se
            prorratean, pero conviene que sumen 100%.
        </q-banner>

        <q-table flat class="maia-card maia-table" :rows="items" :columns="columns" row-key="id" :loading="loading"
            v-model:pagination="pagination" @request="onRequest" :rows-per-page-options="[10, 20, 50, 100]"
            no-data-label="No hay bolsillos" rows-per-page-label="Filas por página">
            <template #body-cell-role="props">
                <q-td :props="props">
                    <q-chip dense square :icon="FUND_ROLES[props.value].icon" :class="`role-chip role-chip--${props.value}`">
                        {{ FUND_ROLES[props.value].label }}
                    </q-chip>
                </q-td>
            </template>
            <template #body-cell-profit_percent="props">
                <q-td :props="props">{{ props.row.role === 'profit' ? `${props.value}%` : '—' }}</q-td>
            </template>
            <template #body-cell-state="props">
                <q-td :props="props">
                    <q-icon :name="props.value ? 'check_circle' : 'cancel'" :color="props.value ? 'positive' : 'grey-5'" size="20px" />
                </q-td>
            </template>
            <template #body-cell-action="props">
                <q-td :props="props">
                    <template v-if="canEdit">
                        <q-btn flat round dense color="primary" icon="edit" @click="openDialog(props.row)" />
                        <q-btn flat round dense color="negative" icon="delete" :disable="props.row.movements_count > 0"
                            @click="remove(props.row, `el bolsillo ${props.row.name}`)">
                            <q-tooltip v-if="props.row.movements_count > 0">Tiene movimientos; desactívelo en su lugar</q-tooltip>
                        </q-btn>
                    </template>
                </q-td>
            </template>
        </q-table>

        <q-dialog v-model="dialog" persistent>
            <q-card class="maia-dialog-card" style="width: 480px">
                <q-form @submit.prevent="submit">
                    <q-card-section class="text-h6">{{ form.id ? 'Editar bolsillo' : 'Nuevo bolsillo' }}</q-card-section>
                    <q-card-section class="q-gutter-md">
                        <q-input outlined dense class="maia-field" label="Nombre *" v-model="form.name"
                            maxlength="60" counter :rules="[(v) => !!v || 'Requerido']" />
                        <q-select outlined dense class="maia-field" emit-value map-options label="Uso en el reparto de ferias"
                            v-model="form.role" :options="roleOptions" :hint="FUND_ROLES[form.role].hint" />
                        <q-input v-if="form.role === 'profit'" outlined dense class="maia-field" type="number" min="0" max="100"
                            step="0.5" suffix="%" label="Porcentaje de la utilidad" v-model.number="form.profit_percent" />
                        <q-input outlined dense class="maia-field" type="number" label="Orden" v-model.number="form.sort"
                            hint="Posición en el flujo de caja (menor primero). Vacío = al final." />
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { api } from 'src/boot/axios'
import PageHeader from 'src/components/maia/PageHeader.vue'
import { useCrudTable } from 'src/composables/useCrudTable'
import { useAuthStore } from 'src/stores/auth-store'
import { FUND_ROLES } from 'src/assets/js/util/finance'

const roleOptions = Object.entries(FUND_ROLES).map(([value, r]) => ({ value, label: r.label }))

const authStore = useAuthStore()
const canEdit = computed(() => authStore.hasPermission('finanzas.editar'))

const { items, filter, loading, saving, pagination, load, onRequest, save, remove } = useCrudTable('CashFund')
pagination.value.sortBy = 'sort'

const columns = [
    { name: 'sort', label: 'Orden', field: 'sort', align: 'center', sortable: true },
    { name: 'code', label: 'Código', field: 'code', align: 'left', sortable: true },
    { name: 'name', label: 'Nombre', field: 'name', align: 'left', sortable: true },
    { name: 'role', label: 'Uso en el reparto', field: 'role', align: 'left', sortable: true },
    { name: 'profit_percent', label: '% utilidad', field: 'profit_percent', align: 'center' },
    { name: 'movements_count', label: 'Movimientos', field: 'movements_count', align: 'center' },
    { name: 'state', label: 'Activo', field: 'state', align: 'center' },
    { name: 'action', label: 'Acciones', field: 'action', align: 'center' },
]

// Profit split check over all active funds (not only the current page)
const allFunds = ref([])
const loadAll = async () => {
    try {
        const { data } = await api.get('CashFund')
        allFunds.value = data.data || []
    } catch (e) {
        allFunds.value = []
    }
}
const profitFunds = computed(() => allFunds.value.filter((f) => f.state && f.role === 'profit'))
const profitSum = computed(() => Math.round(profitFunds.value.reduce((s, f) => s + Number(f.profit_percent || 0), 0) * 100) / 100)
const profitWarning = computed(() => profitFunds.value.length > 0 && Math.abs(profitSum.value - 100) > 0.01)
watch(items, loadAll)

const dialog = ref(false)
const form = reactive({ id: null, name: '', role: 'none', profit_percent: 0, sort: null, state: true })

const openDialog = (row = null) => {
    Object.assign(form, row
        ? { id: row.id, name: row.name, role: row.role, profit_percent: row.profit_percent, sort: row.sort, state: !!row.state }
        : { id: null, name: '', role: 'none', profit_percent: 0, sort: null, state: true })
    dialog.value = true
}

const submit = async () => {
    if (await save({ ...form, sort: form.sort === '' ? null : form.sort })) dialog.value = false
}

onMounted(() => load(1))
</script>

<style lang="scss" scoped>
.role-chip {
    font-size: 12px;
    background: brand-a(gold-pale, 0.6);
    color: $maia-ink;

    &--investment {
        background: rgba($maia-blue, 0.14);
        color: mix(#000, $maia-blue, 25%);
    }

    &--depreciation {
        background: rgba($maia-violet, 0.14);
        color: $maia-violet;
    }

    &--marketing {
        background: rgba($maia-orange, 0.15);
        color: mix(#000, $maia-orange, 25%);
    }

    &--profit {
        background: rgba($maia-emerald, 0.15);
        color: mix(#000, $maia-emerald, 20%);
    }
}

body.body--dark .role-chip--none {
    background: brand-a(gold, 0.18);
    color: $maia-gold-light;
}
</style>
