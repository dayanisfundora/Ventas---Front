<template>
    <q-page class="maia-page">
        <PageHeader title="Activos fijos" section="Finanzas">
            <q-input dense outlined debounce="400" v-model="filter" placeholder="Buscar" class="maia-field">
                <template #prepend><q-icon name="search" /></template>
            </q-input>
            <q-btn flat dense no-caps color="primary" icon="table_view" label="Excel"
                @click="downloadFile('Report/FixedAssets/Excel', {}, 'activos_fijos.xlsx')" />
            <q-btn v-if="canEdit" unelevated round color="primary" icon="add" @click="openDialog()">
                <q-tooltip>Adicionar</q-tooltip>
            </q-btn>
        </PageHeader>

        <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6 col-sm-4">
                <div class="maia-stat">
                    <div class="maia-stat__label">Activos en uso</div>
                    <div class="maia-stat__value">{{ int(totals.items) }}</div>
                    <div class="stat-caption">{{ int(totals.units) }} unidades</div>
                </div>
            </div>
            <div class="col-6 col-sm-4">
                <div class="maia-stat">
                    <div class="maia-stat__label">Valor total</div>
                    <div class="maia-stat__value">{{ money(totals.value) }}</div>
                    <div class="stat-caption">CUP, sin contar los de baja</div>
                </div>
            </div>
        </div>

        <q-table flat class="maia-card maia-table" :rows="items" :columns="columns" row-key="id" :loading="loading"
            v-model:pagination="pagination" @request="onRequest" :rows-per-page-options="[10, 20, 50, 100]"
            no-data-label="No hay activos" rows-per-page-label="Filas por página">
            <template #body-cell-condition="props">
                <q-td :props="props">
                    <q-badge :color="CONDITIONS[props.value].color" :label="CONDITIONS[props.value].label" />
                </q-td>
            </template>
            <template #body-cell-action="props">
                <q-td :props="props">
                    <template v-if="canEdit">
                        <q-btn flat round dense color="primary" icon="edit" @click="openDialog(props.row)" />
                        <q-btn flat round dense color="negative" icon="delete" @click="remove(props.row, `el activo ${props.row.name}`)" />
                    </template>
                </q-td>
            </template>
        </q-table>

        <q-dialog v-model="dialog" persistent>
            <q-card class="maia-dialog-card" style="width: 520px">
                <q-form @submit.prevent="submit">
                    <q-card-section class="text-h6">{{ form.id ? 'Editar activo' : 'Nuevo activo' }}</q-card-section>
                    <q-card-section class="row q-col-gutter-md">
                        <q-input class="col-12 maia-field" outlined dense label="Nombre *" v-model="form.name" maxlength="120"
                            :rules="[(v) => !!v || 'Requerido']" />
                        <q-input class="col-6 col-sm-4 maia-field" outlined dense type="number" min="0" label="Cantidad *"
                            input-class="text-right" v-model.number="form.quantity" :rules="[(v) => v !== '' && v >= 0 || 'Requerido']" />
                        <q-input class="col-6 col-sm-4 maia-field" outlined dense type="number" min="0" step="0.01" label="Valor unitario"
                            suffix="CUP" input-class="text-right" v-model.number="form.unit_value" />
                        <div class="col-12 col-sm-4 text-right self-center">
                            <div class="text-caption text-grey-7">Valor total</div>
                            <div class="text-weight-bold">{{ money((Number(form.quantity) || 0) * (Number(form.unit_value) || 0)) }} CUP</div>
                        </div>
                        <q-select class="col-6 maia-field" outlined dense emit-value map-options label="Estado" v-model="form.condition"
                            :options="conditionOptions" />
                        <q-input class="col-6 maia-field" outlined dense label="Ubicación" maxlength="80" v-model="form.location" />
                        <q-input class="col-6 maia-field" outlined dense type="date" stack-label label="Fecha de adquisición"
                            v-model="form.acquired_at" />
                        <div class="col-6 self-center"><q-toggle v-model="form.state" label="Activo" /></div>
                        <q-input class="col-12 maia-field" outlined dense type="textarea" autogrow label="Notas" maxlength="255"
                            v-model="form.notes" />
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
import { money, int, formatDate, downloadFile } from 'src/assets/js/util/maia'

const CONDITIONS = {
    good: { label: 'Bueno', color: 'positive' },
    damaged: { label: 'Dañado', color: 'warning' },
    retired: { label: 'De baja', color: 'grey-6' },
}
const conditionOptions = Object.entries(CONDITIONS).map(([value, c]) => ({ value, label: c.label }))

const authStore = useAuthStore()
const canEdit = computed(() => authStore.hasPermission('activos.editar'))

const { items, filter, loading, saving, pagination, load, onRequest, save, remove } = useCrudTable('FixedAsset')
pagination.value.sortBy = 'code'

const columns = [
    { name: 'code', label: 'Código', field: 'code', align: 'left', sortable: true },
    { name: 'name', label: 'Nombre', field: 'name', align: 'left', sortable: true },
    { name: 'quantity', label: 'Cantidad', field: 'quantity', align: 'right', sortable: true },
    { name: 'unit_value', label: 'Valor unitario', field: 'unit_value', align: 'right', sortable: true, format: money },
    { name: 'total_value', label: 'Valor total', field: 'total_value', align: 'right', format: money },
    { name: 'condition', label: 'Estado', field: 'condition', align: 'center', sortable: true },
    { name: 'location', label: 'Ubicación', field: 'location', align: 'left', sortable: true },
    { name: 'acquired_at', label: 'Adquirido', field: 'acquired_at', align: 'left', sortable: true, format: formatDate },
    { name: 'action', label: 'Acciones', field: 'action', align: 'center' },
]

const totals = ref({ items: 0, units: 0, value: 0 })
const loadTotals = async () => {
    try {
        const { data } = await api.get('FixedAsset/Totals')
        totals.value = data.data
    } catch (e) {
        // the table already reports API errors
    }
}
watch(items, loadTotals)

const dialog = ref(false)
const empty = () => ({ id: null, name: '', quantity: 1, unit_value: 0, condition: 'good', location: '', acquired_at: '', notes: '', state: true })
const form = reactive(empty())

const openDialog = (row = null) => {
    Object.assign(form, row
        ? {
            id: row.id, name: row.name, quantity: row.quantity, unit_value: row.unit_value, condition: row.condition,
            location: row.location || '', acquired_at: row.acquired_at || '', notes: row.notes || '', state: !!row.state,
        }
        : empty())
    dialog.value = true
}

const submit = async () => {
    const payload = { ...form, acquired_at: form.acquired_at || null, location: form.location || null, notes: form.notes || null }
    if (await save(payload)) dialog.value = false
}

onMounted(() => load(1))
</script>
