<template>
    <q-page class="maia-page">
        <PageHeader title="Productos" section="Catálogo">
            <q-select dense outlined clearable emit-value map-options options-dense class="maia-field" style="min-width: 200px"
                label="Categoría" :options="categoryOptions" v-model="categoryFilter" />
            <q-select dense outlined clearable emit-value map-options options-dense class="maia-field" style="min-width: 150px"
                label="Propietario" :options="OWNER_OPTIONS" v-model="ownerFilter" />
            <q-input dense outlined debounce="400" v-model="filter" placeholder="Código o nombre" class="maia-field">
                <template #prepend><q-icon name="search" /></template>
            </q-input>
            <q-btn v-if="fairStore.fairId && can('reportes.ver')" flat round color="primary" icon="download"
                @click="downloadFile(`Report/Catalog/${fairStore.fairId}/Excel`, {}, 'catalogo.xlsx')">
                <q-tooltip>Exportar lista de precios (Excel)</q-tooltip>
            </q-btn>
            <q-btn v-if="can('productos.crear')" outline no-caps color="primary" icon="upload_file" label="Importar"
                @click="importDialog = true">
                <q-tooltip>Importar productos desde Excel</q-tooltip>
            </q-btn>
            <q-btn v-if="can('productos.crear')" unelevated round color="primary" icon="add" @click="openDialog()">
                <q-tooltip>Adicionar</q-tooltip>
            </q-btn>
        </PageHeader>

        <q-table flat class="maia-card maia-table" :rows="items" :columns="columns" row-key="id" :loading="loading"
            v-model:pagination="pagination" @request="onRequest" :rows-per-page-options="[20, 50, 100]"
            no-data-label="No hay productos" rows-per-page-label="Filas por página">
            <template #body-cell-name="props">
                <q-td :props="props">
                    <div class="text-weight-medium">{{ props.row.name }}</div>
                    <div class="text-caption text-grey">{{ props.row.category?.description || 'Sin categoría' }}</div>
                </q-td>
            </template>
            <template #body-cell-owner="props">
                <q-td :props="props">
                    <q-badge :color="ownerColor(props.row.owner)" :label="ownerLabel(props.row.owner)" />
                    <span v-if="props.row.owner_name" class="text-caption q-ml-xs">{{ props.row.owner_name }}</span>
                </q-td>
            </template>
            <template #body-cell-state="props">
                <q-td :props="props">
                    <q-icon :name="props.value ? 'check_circle' : 'cancel'" :color="props.value ? 'positive' : 'grey-5'" size="20px" />
                </q-td>
            </template>
            <template #body-cell-action="props">
                <q-td :props="props">
                    <q-btn v-if="can('productos.editar')" flat round dense color="primary" icon="edit" @click="openDialog(props.row)" />
                    <q-btn v-if="can('productos.eliminar')" flat round dense color="negative" icon="delete"
                        @click="remove(props.row, props.row.name)" />
                </q-td>
            </template>
        </q-table>

        <q-dialog v-model="dialog" persistent>
            <q-card class="maia-dialog-card">
                <q-form @submit.prevent="submit">
                    <q-card-section class="text-h6">{{ form.id ? 'Editar producto' : 'Nuevo producto' }}</q-card-section>
                    <q-card-section class="row q-col-gutter-md">
                        <q-input class="col-12 col-sm-3 maia-field" outlined dense label="Código *" v-model="form.code" maxlength="10"
                            :rules="[(v) => !!v || 'Requerido']" />
                        <q-input class="col-12 col-sm-9 maia-field" outlined dense label="Nombre *" v-model="form.name" maxlength="150"
                            :rules="[(v) => !!v || 'Requerido']" />
                        <q-select class="col-12 col-sm-6 maia-field" outlined dense emit-value map-options clearable label="Categoría"
                            :options="categoryOptions" v-model="form.product_category_id" />
                        <q-input class="col-12 col-sm-6 maia-field" outlined dense type="number" step="0.01" min="0"
                            label="Precio de venta (CUP) *" v-model.number="form.price_cup" :rules="[(v) => v !== '' && v !== null || 'Requerido']"
                            hint="Las ventas anteriores conservan el precio con el que se cobraron." />

                        <div class="col-12">
                            <q-btn-toggle v-model="form.cost_type" unelevated toggle-color="primary" no-caps
                                :options="[{ label: 'Costo en USD (x tasa)', value: 'factor' }, { label: 'Costo fijo CUP', value: 'fixed' }]" />
                        </div>
                        <q-input v-if="form.cost_type === 'factor'" class="col-12 col-sm-6 maia-field" outlined dense type="number"
                            step="0.000001" min="0" label="Costo en USD" v-model.number="form.cost_factor"
                            :hint="`Costo CUP con tasa ${costRate}: ${money(costPreview)}`" />
                        <q-input v-else class="col-12 col-sm-6 maia-field" outlined dense type="number" step="0.01" min="0"
                            label="Costo fijo (CUP)" v-model.number="form.fixed_cost" />
                        <div class="col-12 col-sm-6 text-caption q-pt-md">
                            Ganancia -{{ maiaPercent }}%: <b>{{ money(referenceProfit) }}</b> CUP
                        </div>

                        <q-select class="col-12 col-sm-6 maia-field" outlined dense emit-value map-options label="Propietario"
                            :options="OWNER_OPTIONS" v-model="form.owner" />
                        <q-input v-if="form.owner !== 'own'" class="col-12 col-sm-6 maia-field" outlined dense
                            label="Nombre del propietario (MH, Lydia...)" v-model="form.owner_name" maxlength="80" />
                        <q-toggle class="col-12" v-model="form.state" label="Activo (visible en el POS)" />
                    </q-card-section>
                    <q-card-actions align="right">
                        <q-btn flat label="Cancelar" v-close-popup />
                        <q-btn unelevated color="primary" label="Guardar" type="submit" :loading="saving" />
                    </q-card-actions>
                </q-form>
            </q-card>
        </q-dialog>

        <ProductImportDialog v-model="importDialog" @imported="onImported" />
    </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { api } from 'src/boot/axios'
import PageHeader from 'src/components/maia/PageHeader.vue'
import ProductImportDialog from 'src/components/maia/ProductImportDialog.vue'
import { useCrudTable } from 'src/composables/useCrudTable'
import { useAuthStore } from 'src/stores/auth-store'
import { useFairStore } from 'src/stores/fair-store'
import { money, OWNER_OPTIONS, ownerLabel, downloadFile } from 'src/assets/js/util/maia'

const authStore = useAuthStore()
const fairStore = useFairStore()
const can = (p) => authStore.hasPermission(p)

const categoryFilter = ref(null)
const ownerFilter = ref(null)

const { items, filter, loading, saving, pagination, load, onRequest, save, remove } = useCrudTable('Product', {
    extraParams: () => ({
        ...(categoryFilter.value ? { product_category_id: categoryFilter.value } : {}),
        ...(ownerFilter.value ? { owner: ownerFilter.value } : {}),
        sort_by: pagination.value.sortBy || 'code',
    }),
    rowsPerPage: 50,
})

watch([categoryFilter, ownerFilter], () => load(1))

const categories = ref([])
const categoryOptions = computed(() => categories.value.map((c) => ({ label: c.description, value: c.id })))

const costRate = computed(() => Number(fairStore.days.at(-1)?.cost_rate || fairStore.fair?.cost_rate || 600))
const usdRate = computed(() => Number(fairStore.fair?.usd_rate || 600))
const maiaPercent = computed(() => Number(fairStore.fair?.maia_percent ?? 10))

const productCost = (p) => (p.cost_type === 'fixed' ? Number(p.fixed_cost || 0) : Number(p.cost_factor || 0) * costRate.value)

const columns = [
    { name: 'code', label: 'Código', field: 'code', align: 'left', sortable: true },
    { name: 'name', label: 'Producto', field: 'name', align: 'left', sortable: true },
    { name: 'cost', label: 'Costo CUP', field: (r) => productCost(r), align: 'right', format: money },
    { name: 'price_cup', label: 'Precio CUP', field: 'price_cup', align: 'right', format: money, sortable: true },
    { name: 'price_usd', label: 'USD', field: (r) => Number(r.price_cup) / usdRate.value, align: 'right', format: money },
    { name: 'owner', label: 'Propietario', field: 'owner', align: 'left' },
    { name: 'state', label: 'Activo', field: 'state', align: 'center' },
    { name: 'action', label: 'Acciones', field: 'action', align: 'center' },
]

const ownerColor = (owner) => ({ own: 'primary', consignment: 'orange-8' }[owner] || 'grey')

const empty = {
    id: null, code: '', name: '', product_category_id: null, cost_type: 'factor', cost_factor: null,
    fixed_cost: null, price_cup: null, owner: 'own', owner_name: '', state: true,
}
const dialog = ref(false)
const form = reactive({ ...empty })

const costPreview = computed(() => productCost(form))
const referenceProfit = computed(() => {
    const price = Number(form.price_cup || 0)
    return price - price * maiaPercent.value / 100 - costPreview.value
})

const openDialog = (row = null) => {
    Object.assign(form, row
        ? {
            id: row.id, code: row.code, name: row.name, product_category_id: row.product_category_id,
            cost_type: row.cost_type, cost_factor: row.cost_factor, fixed_cost: row.fixed_cost,
            price_cup: Number(row.price_cup), owner: row.owner, owner_name: row.owner_name || '', state: !!row.state,
        }
        : { ...empty })
    dialog.value = true
}

const submit = async () => {
    const payload = { ...form }
    if (payload.owner === 'own') payload.owner_name = null
    if (await save(payload)) dialog.value = false
}

const importDialog = ref(false)

const loadCategories = async () => {
    const { data } = await api.get('ProductCategory/GetPagedList', { params: { per_page: 100, sort_by: 'description' } })
    categories.value = data.data || []
}

const onImported = async () => {
    await Promise.all([loadCategories(), load(1)])
}

onMounted(async () => {
    fairStore.loadFairs()
    await loadCategories()
    await load(1)
})
</script>
