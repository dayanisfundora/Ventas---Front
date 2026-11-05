<template>
    <q-page class="maia-page">
        <PageHeader title="Inventario" section="Feria del día">
            <FairDaySelector @change="reload" />
        </PageHeader>

        <q-tabs v-model="tab" dense align="left" active-color="primary" indicator-color="primary" class="q-mb-md" no-caps>
            <q-tab name="sheet" icon="fact_check" label="Hoja del día y conteo" />
            <q-tab name="movements" icon="swap_vert" label="Entradas y salidas" />
        </q-tabs>

        <q-tab-panels v-model="tab" animated class="bg-transparent">
            <q-tab-panel name="sheet" class="q-pa-none">
                <div class="row q-col-gutter-md q-mb-md">
                    <div v-for="s in stats" :key="s.label" class="col-6 col-sm-4 col-md-2">
                        <div class="maia-stat">
                            <div class="maia-stat__label">{{ s.label }}</div>
                            <div class="maia-stat__value" :class="s.class">{{ s.value }}</div>
                        </div>
                    </div>
                </div>

                <q-card flat class="maia-card">
                    <q-card-section class="row items-center q-gutter-sm q-py-sm">
                        <q-input dense outlined debounce="250" v-model="search" placeholder="Buscar producto" class="maia-field" clearable>
                            <template #prepend><q-icon name="search" /></template>
                        </q-input>
                        <q-toggle dense v-model="onlyActivity" label="Solo con movimiento" @update:model-value="loadSheet" />
                        <q-toggle dense v-model="onlyDifferences" label="Solo diferencias" />
                        <q-space />
                        <q-btn flat dense no-caps color="primary" icon="table_view" label="Excel" :disable="!fairStore.dayId"
                            @click="downloadFile(`Report/Day/${fairStore.dayId}/Excel`, {}, 'hoja-del-dia.xlsx')" />
                        <q-btn flat dense no-caps color="primary" icon="picture_as_pdf" label="PDF" :disable="!fairStore.dayId"
                            @click="downloadFile(`Report/Day/${fairStore.dayId}/PDF`, {}, 'hoja-del-dia.pdf')" />
                        <template v-if="canCount">
                            <q-btn outline no-caps color="primary" icon="content_copy" label="Conteo = final" @click="fillCountsWithFinal" />
                            <q-btn unelevated no-caps color="primary" icon="save" label="Guardar conteo" :loading="savingCounts"
                                :disable="!dirty" @click="saveCounts" />
                        </template>
                        <q-btn v-if="canAdjust" unelevated no-caps color="orange-8" icon="published_with_changes"
                            label="Ajustar stock al conteo" :disable="!savedDifferences" @click="applyCounts" />
                    </q-card-section>
                    <q-table flat dense class="maia-table maia-sticky" :rows="visibleRows" :columns="sheetColumns" row-key="product_id"
                        :loading="sheetLoading" :pagination="{ rowsPerPage: 0 }" hide-pagination
                        style="max-height: calc(100vh - 340px)" no-data-label="Sin productos">
                        <template #body-cell-name="props">
                            <q-td :props="props">
                                <span class="text-grey-7 text-mono q-mr-xs">#{{ props.row.code }}</span>{{ props.row.name }}
                            </q-td>
                        </template>
                        <template #body-cell-counted="props">
                            <q-td :props="props" style="width: 100px">
                                <q-input v-if="canCount" dense outlined type="number" min="0" input-class="text-right"
                                    :model-value="counts[props.row.product_id]" placeholder="—"
                                    @update:model-value="(v) => (counts[props.row.product_id] = v)" />
                                <span v-else>{{ props.row.counted ?? '—' }}</span>
                            </q-td>
                        </template>
                        <template #body-cell-difference="props">
                            <q-td :props="props">
                                <span v-if="difference(props.row) !== null" class="text-weight-bold"
                                    :class="difference(props.row) < 0 ? 'text-negative' : difference(props.row) > 0 ? 'text-positive' : 'text-grey-6'">
                                    {{ difference(props.row) > 0 ? '+' : '' }}{{ difference(props.row) }}
                                </span>
                                <span v-else class="text-grey-5">—</span>
                            </q-td>
                        </template>
                        <template #body-cell-debt="props">
                            <q-td :props="props" :class="debt(props.row) > 0 ? 'text-negative' : ''">
                                {{ debt(props.row) ? money(debt(props.row)) : '' }}
                            </q-td>
                        </template>
                    </q-table>
                </q-card>
                <div class="text-caption text-grey q-mt-sm">
                    La existencia final es teórica (inicial + entradas/salidas − vendido). El conteo físico calcula la diferencia y la deuda;
                    use "Ajustar stock al conteo" para que el día siguiente parta del conteo real.
                </div>
            </q-tab-panel>

            <q-tab-panel name="movements" class="q-pa-none">
                <q-card flat class="maia-card">
                    <q-card-section class="row items-center q-gutter-sm q-py-sm">
                        <q-select dense outlined clearable emit-value map-options options-dense class="maia-field" style="min-width: 180px"
                            label="Tipo" :options="movementTypeOptions" v-model="movementType" @update:model-value="loadMovements" />
                        <q-toggle dense v-model="movementsOnlyDay" label="Solo el día seleccionado" @update:model-value="loadMovements" />
                        <q-space />
                        <q-btn v-if="can('inventario.editar')" unelevated no-caps color="primary" icon="add" label="Nuevo movimiento"
                            :disable="!fairStore.fairId" @click="openMovementDialog" />
                    </q-card-section>
                    <q-table flat dense class="maia-table" :rows="movements" :columns="movementColumns" row-key="id"
                        :loading="movementsLoading" :pagination="{ rowsPerPage: 25 }" no-data-label="Sin movimientos"
                        rows-per-page-label="Filas por página">
                        <template #body-cell-type="props">
                            <q-td :props="props">
                                <q-badge :color="typeColor(props.value)" :label="MOVEMENT_TYPES[props.value] || props.value" />
                            </q-td>
                        </template>
                        <template #body-cell-quantity="props">
                            <q-td :props="props" class="text-weight-bold" :class="props.value < 0 ? 'text-negative' : 'text-positive'">
                                {{ props.value > 0 ? '+' : '' }}{{ props.value }}
                            </q-td>
                        </template>
                        <template #body-cell-action="props">
                            <q-td :props="props">
                                <q-btn v-if="can('inventario.editar')" flat round dense color="negative" icon="delete"
                                    @click="removeMovement(props.row)" />
                            </q-td>
                        </template>
                    </q-table>
                </q-card>
            </q-tab-panel>
        </q-tab-panels>

        <q-dialog v-model="movementDialog" persistent>
            <q-card class="maia-dialog-card" style="width: 720px; max-width: 95vw">
                <q-form @submit.prevent="saveMovement">
                    <q-card-section class="text-h6">Nuevo movimiento de inventario</q-card-section>
                    <q-card-section class="row q-col-gutter-md">
                        <div class="col-12">
                            <q-btn-toggle v-model="movement.type" unelevated no-caps toggle-color="primary" spread :options="typeToggle" />
                        </div>
                        <q-select class="col-12 col-sm-6 maia-field" outlined dense emit-value map-options clearable label="Día"
                            :options="dayOptions" v-model="movement.fair_day_id"
                            :hint="movement.type === 'initial' ? 'Vacío = inventario antes de iniciar la feria' : 'Requerido'" />
                        <q-input class="col-12 col-sm-6 maia-field" outlined dense label="Nota" v-model="movement.notes" maxlength="255" />
                        <div class="col-12">
                            <div v-for="(item, i) in movement.items" :key="i" class="row q-col-gutter-sm items-center q-mb-xs">
                                <q-select class="col" dense outlined emit-value map-options use-input input-debounce="150" options-dense
                                    label="Producto" :options="productFilterOptions" v-model="item.product_id" @filter="filterProducts" />
                                <q-input class="col-3" dense outlined type="number" min="1" label="Cantidad" v-model.number="item.quantity" />
                                <div class="col-auto">
                                    <q-btn flat round dense icon="close" color="negative" :disable="movement.items.length === 1"
                                        @click="movement.items.splice(i, 1)" />
                                </div>
                            </div>
                            <q-btn flat dense no-caps color="primary" icon="add" label="Agregar producto"
                                @click="movement.items.push({ product_id: null, quantity: 1 })" />
                        </div>
                    </q-card-section>
                    <q-card-actions align="right">
                        <q-btn flat label="Cancelar" v-close-popup />
                        <q-btn unelevated color="primary" label="Registrar" type="submit" :loading="savingMovement" />
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
import FairDaySelector from 'src/components/maia/FairDaySelector.vue'
import { useAuthStore } from 'src/stores/auth-store'
import { useFairStore } from 'src/stores/fair-store'
import { Success } from 'src/assets/js/util/notify'
import { money, int, formatDate, weekday, notifyApiError, downloadFile, MOVEMENT_TYPES } from 'src/assets/js/util/maia'

const $q = useQuasar()
const authStore = useAuthStore()
const fairStore = useFairStore()
const can = (p) => authStore.hasPermission(p)

const tab = ref('sheet')
const canCount = computed(() => can('inventario.contar') && !fairStore.isDayClosed)
const canAdjust = computed(() => can('inventario.editar') && !fairStore.isDayClosed)

/* ---------- Daily sheet ---------- */
const rows = ref([])
const totals = ref({})
const sheetLoading = ref(false)
const search = ref('')
const onlyActivity = ref(false)
const onlyDifferences = ref(false)
const counts = reactive({})
const savingCounts = ref(false)

const sheetColumns = [
    { name: 'name', label: 'Producto', field: 'name', align: 'left' },
    { name: 'price_cup', label: 'Precio', field: 'price_cup', align: 'right', format: money },
    { name: 'initial', label: 'Inicial', field: 'initial', align: 'right' },
    { name: 'in_out', label: 'Entr./Sal.', field: 'in_out', align: 'right', format: (v) => (v ? (v > 0 ? `+${v}` : v) : '') },
    { name: 'sold', label: 'Vendido', field: 'sold', align: 'right', format: (v) => v || '' },
    { name: 'gross', label: 'Venta CUP', field: 'gross', align: 'right', format: (v) => (v ? money(v) : '') },
    { name: 'final', label: 'Final', field: 'final', align: 'right', classes: 'text-weight-bold' },
    { name: 'counted', label: 'Conteo', field: 'counted', align: 'center' },
    { name: 'difference', label: 'Dif.', field: 'difference', align: 'right' },
    { name: 'debt', label: 'Deuda CUP', field: 'debt', align: 'right' },
]

const normalize = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const toCount = (v) => (v === '' || v === null || v === undefined ? null : Math.max(0, Math.floor(Number(v))))

const difference = (row) => {
    const c = toCount(counts[row.product_id])
    return c === null ? null : c - row.final
}
const debt = (row) => {
    const d = difference(row)
    return d === null ? 0 : -d * Number(row.price_cup)
}

const visibleRows = computed(() => {
    const term = normalize(search.value).trim()
    return rows.value.filter((r) => {
        if (onlyDifferences.value && !difference(r)) return false
        return !term || r.code === term || normalize(r.name).includes(term)
    })
})

const dirty = computed(() => rows.value.some((r) => toCount(counts[r.product_id]) !== r.counted))
const savedDifferences = computed(() => rows.value.filter((r) => r.difference).length)

const stats = computed(() => {
    const debtTotal = rows.value.reduce((s, r) => s + debt(r), 0)
    return [
        { label: 'Inicial', value: int(totals.value.initial) },
        { label: 'Entradas/salidas', value: int(totals.value.in_out) },
        { label: 'Vendido', value: int(totals.value.sold) },
        { label: 'Final teórico', value: int(totals.value.final) },
        { label: 'Venta bruta CUP', value: money(totals.value.gross) },
        { label: 'Deuda por conteo', value: money(debtTotal), class: debtTotal > 0 ? 'text-negative' : '' },
    ]
})

const loadSheet = async () => {
    if (!fairStore.dayId) {
        rows.value = []
        totals.value = {}
        return
    }
    sheetLoading.value = true
    try {
        const { data } = await api.get(`Inventory/Day/${fairStore.dayId}`, { params: { only_activity: onlyActivity.value ? 1 : 0 } })
        applySheet(data)
    } catch (error) {
        notifyApiError(error)
    } finally {
        sheetLoading.value = false
    }
}

const applySheet = (data) => {
    rows.value = data.data || []
    totals.value = data.totals || {}
    Object.keys(counts).forEach((k) => delete counts[k])
    rows.value.forEach((r) => {
        counts[r.product_id] = r.counted
    })
}

const fillCountsWithFinal = () => {
    rows.value.forEach((r) => {
        if (toCount(counts[r.product_id]) === null) counts[r.product_id] = Math.max(0, r.final)
    })
}

const saveCounts = async () => {
    savingCounts.value = true
    try {
        const payload = rows.value
            .filter((r) => toCount(counts[r.product_id]) !== r.counted)
            .map((r) => ({ product_id: r.product_id, counted: toCount(counts[r.product_id]) }))
        const { data } = await api.post(`Inventory/Day/${fairStore.dayId}/Counts`, { counts: payload },
            { params: { only_activity: onlyActivity.value ? 1 : 0 } })
        applySheet(data)
        Success('Conteo guardado')
    } catch (error) {
        notifyApiError(error)
    } finally {
        savingCounts.value = false
    }
}

const applyCounts = () => {
    $q.dialog({
        title: 'Ajustar stock al conteo',
        message: `Se crearán movimientos de ajuste para ${savedDifferences.value} productos con diferencia guardada. ¿Continuar?`,
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Ajustar', unelevated: true, color: 'orange-8' },
    }).onOk(async () => {
        try {
            const { data } = await api.post(`Inventory/Day/${fairStore.dayId}/ApplyCounts`)
            Success(data.message)
            await Promise.all([loadSheet(), loadMovements()])
        } catch (error) {
            notifyApiError(error)
        }
    })
}

/* ---------- Movements ---------- */
const movements = ref([])
const movementsLoading = ref(false)
const movementType = ref(null)
const movementsOnlyDay = ref(false)
const movementTypeOptions = ['initial', 'entry', 'exit', 'adjustment'].map((v) => ({ label: MOVEMENT_TYPES[v], value: v }))
const typeToggle = [
    { label: 'Entrada', value: 'entry' },
    { label: 'Salida', value: 'exit' },
    { label: 'Inventario inicial', value: 'initial' },
]
const typeColor = (t) => ({ initial: 'blue-grey', entry: 'positive', exit: 'negative', adjustment: 'orange-8' }[t] || 'grey')

const movementColumns = [
    { name: 'date', label: 'Día', field: (r) => (r.fair_day ? formatDate(r.fair_day.date) : 'Antes de la feria'), align: 'left' },
    { name: 'type', label: 'Tipo', field: 'type', align: 'left' },
    { name: 'product', label: 'Producto', field: (r) => `#${r.product?.code} ${r.product?.name}`, align: 'left' },
    { name: 'quantity', label: 'Cantidad', field: 'quantity', align: 'right' },
    { name: 'notes', label: 'Nota', field: 'notes', align: 'left' },
    { name: 'user', label: 'Usuario', field: (r) => r.user?.name || '', align: 'left' },
    { name: 'action', label: '', field: 'action', align: 'center' },
]

const loadMovements = async () => {
    if (!fairStore.fairId) {
        movements.value = []
        return
    }
    movementsLoading.value = true
    try {
        const params = { fair_id: fairStore.fairId }
        if (movementType.value) params.type = movementType.value
        if (movementsOnlyDay.value && fairStore.dayId) params.fair_day_id = fairStore.dayId
        const { data } = await api.get('Inventory/Movements', { params })
        movements.value = data.data || []
    } catch (error) {
        notifyApiError(error)
    } finally {
        movementsLoading.value = false
    }
}

const removeMovement = (row) => {
    $q.dialog({
        title: 'Eliminar movimiento',
        message: `¿Eliminar ${MOVEMENT_TYPES[row.type]} de ${row.product?.name} (${row.quantity})?`,
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Eliminar', unelevated: true, color: 'negative' },
    }).onOk(async () => {
        try {
            await api.delete(`Inventory/Movement/${row.id}`)
            Success('Movimiento eliminado')
            await Promise.all([loadMovements(), loadSheet()])
        } catch (error) {
            notifyApiError(error)
        }
    })
}

/* ---------- New movement ---------- */
const movementDialog = ref(false)
const savingMovement = ref(false)
const products = ref([])
const productFilterOptions = ref([])
const movement = reactive({ type: 'entry', fair_day_id: null, notes: '', items: [] })

const dayOptions = computed(() => fairStore.days.map((d) => ({
    label: `${weekday(d.date)} ${formatDate(d.date)}${d.status === 'closed' ? ' (cerrado)' : ''}`,
    value: d.id,
    disable: d.status === 'closed',
})))

const productOptions = computed(() => products.value.map((p) => ({ label: `#${p.code} ${p.name} (stock ${p.stock})`, value: p.id, search: normalize(`${p.code} ${p.name}`) })))

const filterProducts = (val, update) => {
    update(() => {
        const term = normalize(val).trim()
        productFilterOptions.value = term ? productOptions.value.filter((o) => o.search.includes(term)) : productOptions.value
    })
}

const openMovementDialog = async () => {
    Object.assign(movement, { type: 'entry', fair_day_id: fairStore.isDayClosed ? null : fairStore.dayId, notes: '', items: [{ product_id: null, quantity: 1 }] })
    movementDialog.value = true
    try {
        const { data } = await api.get('Product/Catalog', { params: { fair_day_id: fairStore.dayId || fairStore.days[0]?.id } })
        products.value = data.data || []
        productFilterOptions.value = productOptions.value
    } catch (error) {
        notifyApiError(error)
    }
}

const saveMovement = async () => {
    const items = movement.items.filter((i) => i.product_id && Number(i.quantity) > 0)
    if (!items.length) return notifyApiError({ message: 'Agregue al menos un producto con cantidad.' })
    savingMovement.value = true
    try {
        await api.post('Inventory/Movement', {
            fair_id: fairStore.fairId,
            fair_day_id: movement.fair_day_id || null,
            type: movement.type,
            notes: movement.notes || null,
            items: items.map((i) => ({ product_id: i.product_id, quantity: Number(i.quantity) })),
        })
        Success('Movimiento registrado')
        movementDialog.value = false
        await Promise.all([loadMovements(), loadSheet()])
    } catch (error) {
        notifyApiError(error)
    } finally {
        savingMovement.value = false
    }
}

const reload = () => Promise.all([loadSheet(), loadMovements()])

onMounted(() => fairStore.loadFairs())
</script>
