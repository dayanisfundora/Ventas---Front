<template>
    <q-page class="maia-page">
        <PageHeader title="Trabajadores" section="Catálogo">
            <q-input dense outlined debounce="400" v-model="filter" placeholder="Buscar" class="maia-field">
                <template #prepend><q-icon name="search" /></template>
            </q-input>
            <q-btn v-if="can('trabajadores.crear')" unelevated round color="primary" icon="add" @click="openDialog()">
                <q-tooltip>Adicionar</q-tooltip>
            </q-btn>
        </PageHeader>

        <q-table flat class="maia-card maia-table" :rows="items" :columns="columns" row-key="id" :loading="loading"
            v-model:pagination="pagination" @request="onRequest" :rows-per-page-options="[10, 20, 50]"
            no-data-label="No hay trabajadores" rows-per-page-label="Filas por página">
            <template #body-cell-state="props">
                <q-td :props="props">
                    <q-icon :name="props.value ? 'check_circle' : 'cancel'" :color="props.value ? 'positive' : 'grey-5'" size="20px" />
                </q-td>
            </template>
            <template #body-cell-action="props">
                <q-td :props="props">
                    <q-btn v-if="can('trabajadores.editar')" flat round dense color="primary" icon="edit" @click="openDialog(props.row)" />
                    <q-btn v-if="can('trabajadores.eliminar')" flat round dense color="negative" icon="delete"
                        @click="remove(props.row, props.row.name)" />
                </q-td>
            </template>
        </q-table>

        <q-dialog v-model="dialog" persistent>
            <q-card class="maia-dialog-card" style="width: 520px">
                <q-form @submit.prevent="submit">
                    <q-card-section class="text-h6">{{ form.id ? 'Editar trabajador' : 'Nuevo trabajador' }}</q-card-section>
                    <q-card-section class="row q-col-gutter-md">
                        <q-input class="col-12 maia-field" outlined dense label="Nombre *" v-model="form.name" maxlength="80"
                            :rules="[(v) => !!v || 'Requerido']" />
                        <q-input class="col-12 col-sm-6 maia-field" outlined dense label="Teléfono" v-model="form.phone" maxlength="30" />
                        <q-input class="col-12 col-sm-6 maia-field" outlined dense type="number" step="0.01" min="0"
                            label="Salario diario (CUP)" v-model.number="form.daily_salary" />
                        <q-toggle class="col-12" v-model="form.state" label="Activo" />
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
import { onMounted, reactive, ref } from 'vue'
import PageHeader from 'src/components/maia/PageHeader.vue'
import { useCrudTable } from 'src/composables/useCrudTable'
import { useAuthStore } from 'src/stores/auth-store'
import { money } from 'src/assets/js/util/maia'

const authStore = useAuthStore()
const can = (p) => authStore.hasPermission(p)

const { items, filter, loading, saving, pagination, load, onRequest, save, remove } = useCrudTable('Worker')

const columns = [
    { name: 'code', label: 'Código', field: 'code', align: 'left', sortable: true },
    { name: 'name', label: 'Nombre', field: 'name', align: 'left', sortable: true },
    { name: 'phone', label: 'Teléfono', field: 'phone', align: 'left' },
    { name: 'daily_salary', label: 'Salario diario', field: 'daily_salary', align: 'right', format: money, sortable: true },
    { name: 'state', label: 'Activo', field: 'state', align: 'center' },
    { name: 'action', label: 'Acciones', field: 'action', align: 'center' },
]

const empty = { id: null, name: '', phone: '', daily_salary: 0, state: true }
const dialog = ref(false)
const form = reactive({ ...empty })

const openDialog = (row = null) => {
    Object.assign(form, row ? { id: row.id, name: row.name, phone: row.phone || '', daily_salary: Number(row.daily_salary), state: !!row.state } : { ...empty })
    dialog.value = true
}

const submit = async () => {
    if (await save({ ...form })) dialog.value = false
}

onMounted(() => load(1))
</script>
