<template>
    <q-page class="maia-page">
        <PageHeader title="Categorías de productos" section="Catálogo">
            <q-input dense outlined debounce="400" v-model="filter" placeholder="Buscar" class="maia-field">
                <template #prepend><q-icon name="search" /></template>
            </q-input>
            <q-btn v-if="can('categorias.crear')" unelevated round color="primary" icon="add" @click="openDialog()">
                <q-tooltip>Adicionar</q-tooltip>
            </q-btn>
        </PageHeader>

        <q-table flat class="maia-card maia-table" :rows="items" :columns="columns" row-key="id" :loading="loading"
            v-model:pagination="pagination" @request="onRequest" :rows-per-page-options="[10, 20, 50, 100]"
            no-data-label="No hay categorías" rows-per-page-label="Filas por página">
            <template #body-cell-state="props">
                <q-td :props="props">
                    <q-icon :name="props.value ? 'check_circle' : 'cancel'" :color="props.value ? 'positive' : 'grey-5'" size="20px" />
                </q-td>
            </template>
            <template #body-cell-action="props">
                <q-td :props="props">
                    <q-btn v-if="can('categorias.editar')" flat round dense color="primary" icon="edit" @click="openDialog(props.row)" />
                    <q-btn v-if="can('categorias.eliminar')" flat round dense color="negative" icon="delete"
                        @click="remove(props.row, `la categoría ${props.row.description}`)" />
                </q-td>
            </template>
        </q-table>

        <q-dialog v-model="dialog" persistent>
            <q-card class="maia-dialog-card" style="width: 480px">
                <q-form @submit.prevent="submit">
                    <q-card-section class="text-h6">{{ form.id ? 'Editar categoría' : 'Nueva categoría' }}</q-card-section>
                    <q-card-section class="q-gutter-md">
                        <q-input outlined dense class="maia-field" label="Descripción *" v-model="form.description"
                            maxlength="80" counter :rules="[(v) => !!v || 'Requerido']" />
                        <q-toggle v-model="form.state" label="Activa" />
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

const authStore = useAuthStore()
const can = (p) => authStore.hasPermission(p)

const { items, filter, loading, saving, pagination, load, onRequest, save, remove } = useCrudTable('ProductCategory')

const columns = [
    { name: 'code', label: 'Código', field: 'code', align: 'left', sortable: true },
    { name: 'description', label: 'Descripción', field: 'description', align: 'left', sortable: true },
    { name: 'products_count', label: 'Productos', field: 'products_count', align: 'center' },
    { name: 'state', label: 'Activa', field: 'state', align: 'center' },
    { name: 'action', label: 'Acciones', field: 'action', align: 'center' },
]

const dialog = ref(false)
const form = reactive({ id: null, description: '', state: true })

const openDialog = (row = null) => {
    Object.assign(form, row ? { id: row.id, description: row.description, state: !!row.state } : { id: null, description: '', state: true })
    dialog.value = true
}

const submit = async () => {
    if (await save({ ...form })) dialog.value = false
}

onMounted(() => load(1))
</script>
