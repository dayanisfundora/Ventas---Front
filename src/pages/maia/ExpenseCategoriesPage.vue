<template>
    <q-page class="maia-page">
        <PageHeader title="Conceptos de gasto" section="Catálogo">
            <q-input dense outlined debounce="400" v-model="filter" placeholder="Buscar" class="maia-field">
                <template #prepend><q-icon name="search" /></template>
            </q-input>
            <q-btn v-if="canEdit" unelevated round color="primary" icon="add" @click="openDialog()">
                <q-tooltip>Adicionar</q-tooltip>
            </q-btn>
        </PageHeader>

        <q-table flat class="maia-card maia-table" :rows="items" :columns="columns" row-key="id" :loading="loading"
            v-model:pagination="pagination" @request="onRequest" :rows-per-page-options="[10, 20, 50, 100]"
            no-data-label="No hay conceptos" rows-per-page-label="Filas por página">
            <template #body-cell-kind="props">
                <q-td :props="props">
                    <q-chip dense square :icon="KINDS[props.value].icon" :class="`kind-chip kind-chip--${props.value}`">
                        {{ KINDS[props.value].label }}
                    </q-chip>
                </q-td>
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
                        <q-btn flat round dense color="negative" icon="delete" :disable="props.row.expenses_count > 0"
                            @click="remove(props.row, `el concepto ${props.row.description}`)">
                            <q-tooltip v-if="props.row.expenses_count > 0">Tiene gastos registrados; desactívelo en su lugar</q-tooltip>
                        </q-btn>
                    </template>
                </q-td>
            </template>
        </q-table>

        <q-dialog v-model="dialog" persistent>
            <q-card class="maia-dialog-card" style="width: 480px">
                <q-form @submit.prevent="submit">
                    <q-card-section class="text-h6">{{ form.id ? 'Editar concepto' : 'Nuevo concepto' }}</q-card-section>
                    <q-card-section class="q-gutter-md">
                        <q-input outlined dense class="maia-field" label="Descripción *" v-model="form.description"
                            maxlength="80" counter :rules="[(v) => !!v || 'Requerido']" />
                        <q-select outlined dense class="maia-field" emit-value map-options label="Tipo" v-model="form.kind"
                            :options="kindOptions" :hint="KINDS[form.kind].hint" />
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
import PageHeader from 'src/components/maia/PageHeader.vue'
import { useCrudTable } from 'src/composables/useCrudTable'
import { useAuthStore } from 'src/stores/auth-store'

const KINDS = {
    manual: { label: 'Manual', icon: 'edit_note', hint: 'Los importes se registran a mano en el cierre de feria.' },
    fuel: { label: 'Combustible', icon: 'local_gas_station', hint: 'Los importes se registran a mano en el cierre de feria (como Manual).' },
    salary: { label: 'Salarios', icon: 'badge', hint: 'Suma automáticamente los salarios de la asistencia diaria.' },
}
const authStore = useAuthStore()
const canEdit = computed(() => authStore.hasPermission('cierre_feria.editar'))

const { items, filter, loading, saving, pagination, load, onRequest, save, remove } = useCrudTable('ExpenseCategory')
pagination.value.sortBy = 'sort'

const columns = [
    { name: 'sort', label: 'Orden', field: 'sort', align: 'center', sortable: true },
    { name: 'code', label: 'Código', field: 'code', align: 'left', sortable: true },
    { name: 'description', label: 'Descripción', field: 'description', align: 'left', sortable: true },
    { name: 'kind', label: 'Tipo', field: 'kind', align: 'left', sortable: true },
    { name: 'expenses_count', label: 'Gastos', field: 'expenses_count', align: 'center' },
    { name: 'state', label: 'Activo', field: 'state', align: 'center' },
    { name: 'action', label: 'Acciones', field: 'action', align: 'center' },
]

const dialog = ref(false)
const form = reactive({ id: null, description: '', kind: 'manual', sort: null, state: true })
const kindOptions = computed(() => Object.entries(KINDS)
    .filter(([value]) => value !== 'fuel' || form.kind === 'fuel')
    .map(([value, k]) => ({ value, label: k.label })))

const openDialog = (row = null) => {
    Object.assign(form, row
        ? { id: row.id, description: row.description, kind: row.kind, sort: row.sort, state: !!row.state }
        : { id: null, description: '', kind: 'manual', sort: null, state: true })
    dialog.value = true
}

const submit = async () => {
    if (await save({ ...form, sort: form.sort === '' ? null : form.sort })) dialog.value = false
}

onMounted(() => load(1))
</script>

<style lang="scss" scoped>
.kind-chip {
    font-size: 12px;

    &--manual {
        background: brand-a(gold-pale, 0.6);
        color: $maia-ink;
    }

    &--fuel {
        background: rgba($maia-orange, 0.15);
        color: mix(#000, $maia-orange, 25%);
    }

    &--salary {
        background: rgba($maia-teal, 0.15);
        color: mix(#000, $maia-teal, 25%);
    }
}

body.body--dark .kind-chip--manual {
    background: brand-a(gold, 0.18);
    color: $maia-gold-light;
}
</style>
