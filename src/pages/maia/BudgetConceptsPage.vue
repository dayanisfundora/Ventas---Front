<template>
    <q-page class="maia-page">
        <PageHeader title="Presupuestos" section="Catálogo">
            <q-input dense outlined debounce="400" v-model="filter" placeholder="Buscar" class="maia-field">
                <template #prepend><q-icon name="search" /></template>
            </q-input>
            <q-btn v-if="canEdit" unelevated round color="primary" icon="add" @click="openDialog()">
                <q-tooltip>Adicionar</q-tooltip>
            </q-btn>
        </PageHeader>

        <div class="text-caption text-grey q-mb-md">
            Porcentajes sobre el disponible del cierre de feria.<template v-if="financeEnabled"> Cada concepto puede enviarse a un bolsillo al repartir.</template>
        </div>

        <q-table flat class="maia-card maia-table" :rows="items" :columns="columns" row-key="id" :loading="loading"
            v-model:pagination="pagination" @request="onRequest" :rows-per-page-options="[10, 20, 50, 100]"
            no-data-label="No hay presupuestos" rows-per-page-label="Filas por página">
            <template #body-cell-percent="props">
                <q-td :props="props">{{ props.value }}%</q-td>
            </template>
            <template #body-cell-cash_fund="props">
                <q-td :props="props">{{ props.row.cash_fund?.name || '—' }}</q-td>
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
                        <q-btn flat round dense color="negative" icon="delete"
                            @click="remove(props.row, `el presupuesto ${props.row.name}`)" />
                    </template>
                </q-td>
            </template>
        </q-table>

        <q-dialog v-model="dialog" persistent>
            <q-card class="maia-dialog-card" style="width: 480px">
                <q-form @submit.prevent="submit">
                    <q-card-section class="text-h6">{{ form.id ? 'Editar presupuesto' : 'Nuevo presupuesto' }}</q-card-section>
                    <q-card-section class="q-gutter-md">
                        <q-input outlined dense class="maia-field" label="Nombre *" v-model="form.name"
                            maxlength="80" counter :rules="[(v) => !!v || 'Requerido']" />
                        <q-input outlined dense class="maia-field" type="number" min="0" max="100" step="0.5" label="Porcentaje *"
                            suffix="%" v-model.number="form.percent" :rules="[(v) => v >= 0 && v <= 100 || '0–100']" />
                        <q-select v-if="financeEnabled" outlined dense class="maia-field" emit-value map-options clearable options-dense
                            label="Bolsillo destino" :options="fundOptions" v-model="form.cash_fund_id"
                            hint="Al repartir la feria, este importe va a ese bolsillo." />
                        <q-input outlined dense class="maia-field" type="number" label="Orden" v-model.number="form.sort"
                            hint="Posición en el cierre de feria (menor primero). Vacío = al final." />
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
import { api } from 'src/boot/axios'
import PageHeader from 'src/components/maia/PageHeader.vue'
import { useCrudTable } from 'src/composables/useCrudTable'
import { useAuthStore } from 'src/stores/auth-store'
import { notifyApiError } from 'src/assets/js/util/maia'
import { featureEnabled } from 'src/assets/js/util/features'

const authStore = useAuthStore()
const financeEnabled = featureEnabled('finance')
const canEdit = computed(() => authStore.hasPermission('cierre_feria.editar'))

const { items, filter, loading, saving, pagination, load, onRequest, save, remove } = useCrudTable('BudgetConcept')
pagination.value.sortBy = 'sort'

const fundOptions = ref([])

const columns = [
    { name: 'sort', label: 'Orden', field: 'sort', align: 'center', sortable: true },
    { name: 'code', label: 'Código', field: 'code', align: 'left', sortable: true },
    { name: 'name', label: 'Nombre', field: 'name', align: 'left', sortable: true },
    { name: 'percent', label: '%', field: 'percent', align: 'right', sortable: true },
    ...(financeEnabled ? [{ name: 'cash_fund', label: 'Bolsillo', field: 'cash_fund', align: 'left' }] : []),
    { name: 'state', label: 'Activo', field: 'state', align: 'center' },
    { name: 'action', label: 'Acciones', field: 'action', align: 'center' },
]

const dialog = ref(false)
const form = reactive({ id: null, name: '', percent: 10, cash_fund_id: null, sort: null, state: true })

const openDialog = (row = null) => {
    Object.assign(form, row
        ? {
            id: row.id,
            name: row.name,
            percent: Number(row.percent),
            cash_fund_id: row.cash_fund_id || null,
            sort: row.sort,
            state: !!row.state,
        }
        : { id: null, name: '', percent: 10, cash_fund_id: null, sort: null, state: true })
    dialog.value = true
}

const submit = async () => {
    if (await save({
        ...form,
        sort: form.sort === '' || form.sort === null ? null : form.sort,
        cash_fund_id: form.cash_fund_id || null,
    })) dialog.value = false
}

const loadFunds = async () => {
    try {
        const { data } = await api.get('CashFund/')
        const list = data.data || []
        fundOptions.value = list
            .filter((f) => f.state)
            .map((f) => ({ label: f.name, value: f.id }))
    } catch (error) {
        fundOptions.value = []
        notifyApiError(error)
    }
}

onMounted(async () => {
    if (financeEnabled) await loadFunds()
    load(1)
})
</script>
