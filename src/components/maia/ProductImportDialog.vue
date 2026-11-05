<template>
    <q-dialog :model-value="modelValue" persistent @update:model-value="(v) => emit('update:modelValue', v)" @show="reset">
        <q-card class="import-card">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">Importar productos desde Excel</div>
                <q-space />
                <q-btn flat round dense icon="close" :disable="loading" @click="close" />
            </q-card-section>

            <q-stepper v-model="step" flat animated color="primary" active-color="primary" done-color="positive"
                class="import-stepper">
                <!-- 1. File -->
                <q-step :name="1" title="Archivo" icon="upload_file" :done="step > 1">
                    <div class="column q-gutter-md">
                        <q-banner rounded class="import-hint">
                            <template #avatar><q-icon name="description" color="accent" /></template>
                            Use la plantilla del sistema: <b>Código, Nombre, Categoría, Precio CUP, Costo USD, Costo fijo CUP, Cantidad</b>.
                            Si el código ya existe se actualiza; las celdas vacías conservan el valor actual.
                            <template #action>
                                <q-btn flat no-caps color="primary" icon="download" label="Descargar plantilla"
                                    @click="downloadFile('Product/Import/Template', {}, 'plantilla-productos.xlsx')" />
                            </template>
                        </q-banner>

                        <q-file v-model="file" outlined dense accept=".xlsx,.xls" label="Archivo Excel *" clearable
                            max-file-size="5242880" @rejected="onRejected">
                            <template #prepend><q-icon name="attach_file" /></template>
                        </q-file>

                        <div>
                            <q-toggle v-model="withQty" :disable="!canInventory" label="Cargar cantidades en una feria" />
                            <div v-if="!canInventory" class="text-caption text-grey-7 q-ml-sm">
                                No tiene permiso para modificar el inventario; solo se importará el catálogo.
                            </div>
                        </div>

                        <q-slide-transition>
                            <div v-show="withQty" class="row q-col-gutter-sm">
                                <q-select class="col-12 col-sm-6" outlined dense emit-value map-options options-dense
                                    label="Feria *" :options="fairOptions" v-model="fairId" />
                                <div class="col-12 col-sm-6">
                                    <q-btn-toggle v-model="qtyType" spread unelevated no-caps toggle-color="primary" class="import-type"
                                        :options="[{ label: 'Entrada', value: 'entry' }, { label: 'Inventario inicial', value: 'initial' }]" />
                                </div>
                                <q-select v-if="qtyType === 'entry'" class="col-12 col-sm-6" outlined dense emit-value map-options
                                    options-dense label="Día de la entrada *" :options="dayOptions" v-model="dayId" />
                                <div class="col-12 text-caption text-grey-7">
                                    {{ qtyType === 'entry'
                                        ? 'Las cantidades se registran como entrada del día elegido.'
                                        : 'Las cantidades se registran como inventario inicial de la feria.' }}
                                </div>
                            </div>
                        </q-slide-transition>
                    </div>
                </q-step>

                <!-- 2. Preview -->
                <q-step :name="2" title="Vista previa" icon="fact_check" :done="step > 2">
                    <template v-if="preview">
                        <div class="row items-center q-gutter-sm q-mb-sm">
                            <div class="text-caption text-grey-7">
                                <q-icon name="description" /> {{ preview.file }}
                                <template v-if="preview.with_qty && preview.fair">
                                    · {{ preview.qty_type === 'entry' ? 'Entrada' : 'Inventario inicial' }} en
                                    <b>{{ preview.fair.name }}</b>
                                    <span v-if="preview.day"> ({{ formatDate(preview.day.date) }})</span>
                                </template>
                            </div>
                        </div>

                        <div class="row q-gutter-sm q-mb-sm">
                            <q-chip v-for="s in summaryChips" :key="s.key" dense :color="s.color" text-color="white" :icon="s.icon">
                                {{ s.label }}: <b class="q-ml-xs">{{ s.value }}</b>
                            </q-chip>
                            <q-chip v-if="preview.summary.quantity" dense outline color="primary" icon="inventory_2">
                                Unidades a cargar: <b class="q-ml-xs">{{ preview.summary.quantity }}</b>
                            </q-chip>
                        </div>

                        <q-banner v-if="preview.summary.quantity_ignored" dense rounded class="bg-orange-1 text-orange-9 q-mb-sm">
                            El archivo trae cantidades, pero no marcó "Cargar cantidades en una feria"; se ignorarán.
                        </q-banner>
                        <q-banner v-if="preview.summary.error" dense rounded class="bg-red-1 text-negative q-mb-sm">
                            Las filas con error no se guardarán. Puede corregir el Excel y volver a subirlo.
                        </q-banner>

                        <q-tabs v-model="tab" dense no-caps align="left" active-color="primary" indicator-color="primary" class="q-mb-xs">
                            <q-tab v-for="t in tabs" :key="t.value" :name="t.value" :label="`${t.label} (${t.count})`" />
                        </q-tabs>

                        <q-table flat dense class="maia-table import-table" :rows="visibleRows" :columns="columns" row-key="row"
                            :pagination="{ rowsPerPage: 0 }" hide-pagination virtual-scroll no-data-label="No hay filas en esta vista">
                            <template #body-cell-status="props">
                                <q-td :props="props">
                                    <q-badge :color="STATUS[props.value].color" :label="STATUS[props.value].label" />
                                </q-td>
                            </template>
                            <template #body-cell-name="props">
                                <q-td :props="props">
                                    <div class="ellipsis import-name">{{ props.value || '—' }}</div>
                                    <div v-if="props.row.category" class="text-caption text-grey-7">
                                        {{ props.row.category }}<span v-if="props.row.category_new"> (nueva)</span>
                                    </div>
                                </q-td>
                            </template>
                            <template #body-cell-detail="props">
                                <q-td :props="props" class="import-detail">
                                    <div v-for="(e, i) in props.row.errors" :key="`e${i}`" class="text-negative">
                                        <q-icon name="error_outline" size="14px" /> {{ e }}
                                    </div>
                                    <div v-for="(c, i) in props.row.changes" :key="`c${i}`">
                                        <b>{{ c.field }}:</b> <span class="text-grey-7">{{ c.from }}</span> → {{ c.to }}
                                    </div>
                                    <div v-for="(w, i) in props.row.warnings" :key="`w${i}`" class="text-orange-9">
                                        <q-icon name="warning_amber" size="14px" /> {{ w }}
                                    </div>
                                </q-td>
                            </template>
                        </q-table>
                    </template>
                </q-step>

                <!-- 3. Result -->
                <q-step :name="3" title="Resultado" icon="task_alt">
                    <div v-if="result" class="column items-center q-py-md text-center">
                        <q-icon name="task_alt" color="positive" size="56px" />
                        <div class="text-h6 q-mt-sm">Importación completada</div>
                        <div class="row q-gutter-sm justify-center q-mt-md">
                            <q-chip color="positive" text-color="white" icon="add_circle">Creados: <b class="q-ml-xs">{{ result.created }}</b></q-chip>
                            <q-chip color="info" text-color="white" icon="edit">Actualizados: <b class="q-ml-xs">{{ result.updated }}</b></q-chip>
                            <q-chip v-if="result.units" color="primary" text-color="white" icon="inventory_2">
                                Unidades cargadas: <b class="q-ml-xs">{{ result.units }}</b>
                            </q-chip>
                            <q-chip v-if="result.skipped" color="negative" text-color="white" icon="block">
                                Filas omitidas: <b class="q-ml-xs">{{ result.skipped }}</b>
                            </q-chip>
                        </div>
                        <div v-if="result.units && result.fair" class="text-caption text-grey-7 q-mt-sm">
                            {{ result.qty_type === 'entry' ? 'Entrada' : 'Inventario inicial' }} registrado en {{ result.fair }}.
                        </div>
                    </div>
                </q-step>
            </q-stepper>

            <q-separator />
            <q-card-actions align="right" class="q-pa-md">
                <template v-if="step === 1">
                    <q-btn flat no-caps label="Cancelar" @click="close" />
                    <q-btn unelevated no-caps color="primary" icon="fact_check" label="Analizar archivo" :loading="loading"
                        :disable="!canAnalyze" @click="analyze" />
                </template>
                <template v-else-if="step === 2">
                    <q-btn flat no-caps icon="arrow_back" label="Volver" :disable="loading" @click="step = 1" />
                    <q-space />
                    <q-btn unelevated no-caps color="primary" icon="save" :loading="loading"
                        :disable="!preview?.summary.applicable" @click="confirm"
                        :label="`Confirmar importación (${preview?.summary.applicable || 0} filas)`" />
                </template>
                <template v-else>
                    <q-btn unelevated no-caps color="primary" label="Cerrar" @click="close" />
                </template>
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth-store'
import { useFairStore } from 'src/stores/fair-store'
import { Error as NotifyError } from 'src/assets/js/util/notify'
import { downloadFile, formatDate, weekday, notifyApiError } from 'src/assets/js/util/maia'

defineProps({
    modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'imported'])

const authStore = useAuthStore()
const fairStore = useFairStore()
const canInventory = computed(() => authStore.hasPermission('inventario.editar'))

const STATUS = {
    new: { label: 'Nuevo', color: 'positive' },
    update: { label: 'Actualizar', color: 'info' },
    unchanged: { label: 'Sin cambios', color: 'grey-6' },
    error: { label: 'Error', color: 'negative' },
}

const step = ref(1)
const file = ref(null)
const withQty = ref(false)
const qtyType = ref('entry')
const fairId = ref(null)
const dayId = ref(null)
const loading = ref(false)
const preview = ref(null)
const result = ref(null)
const tab = ref('all')

const openFairs = computed(() => fairStore.fairs.filter((f) => f.status !== 'closed'))
const fairOptions = computed(() => openFairs.value.map((f) => ({ label: f.name, value: f.id })))
const selectedFair = computed(() => fairStore.fairs.find((f) => f.id === fairId.value) || null)
const dayOptions = computed(() => (selectedFair.value?.days || [])
    .filter((d) => d.status !== 'closed')
    .map((d) => ({ label: `${weekday(d.date)} ${formatDate(d.date)}`, value: d.id })))

watch(fairId, () => {
    if (!dayOptions.value.some((d) => d.value === dayId.value)) {
        const current = fairId.value === fairStore.fairId ? fairStore.dayId : null
        dayId.value = dayOptions.value.some((d) => d.value === current) ? current : dayOptions.value[0]?.value || null
    }
})

const canAnalyze = computed(() => {
    if (!file.value) return false
    if (!withQty.value) return true
    if (!fairId.value) return false
    return qtyType.value === 'initial' || !!dayId.value
})

const reset = () => {
    step.value = 1
    file.value = null
    withQty.value = false
    qtyType.value = 'entry'
    preview.value = null
    result.value = null
    tab.value = 'all'
    fairStore.loadFairs()
    fairId.value = openFairs.value.some((f) => f.id === fairStore.fairId) ? fairStore.fairId : openFairs.value[0]?.id || null
    dayId.value = fairId.value === fairStore.fairId ? fairStore.dayId : null
}

const close = () => {
    if (result.value) emit('imported', result.value)
    emit('update:modelValue', false)
}

const onRejected = () => NotifyError('El archivo debe ser un Excel de hasta 5 MB.')

const analyze = async () => {
    const form = new FormData()
    form.append('file', file.value)
    form.append('with_qty', withQty.value ? '1' : '0')
    if (withQty.value) {
        form.append('qty_type', qtyType.value)
        form.append('fair_id', fairId.value)
        if (qtyType.value === 'entry' && dayId.value) form.append('fair_day_id', dayId.value)
    }
    loading.value = true
    try {
        const { data } = await api.post('Product/Import/Preview', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        preview.value = data.data
        tab.value = data.data.summary.error ? 'error' : 'all'
        step.value = 2
    } catch (error) {
        notifyApiError(error)
    } finally {
        loading.value = false
    }
}

const confirm = async () => {
    loading.value = true
    try {
        const { data } = await api.post('Product/Import/Confirm', { token: preview.value.token })
        result.value = data.data
        step.value = 3
    } catch (error) {
        notifyApiError(error)
        if (error?.response?.data?.errors?.token) step.value = 1
    } finally {
        loading.value = false
    }
}

const summaryChips = computed(() => {
    const s = preview.value?.summary || {}
    return [
        { key: 'new', label: 'Nuevos', value: s.new || 0, color: STATUS.new.color, icon: 'add_circle' },
        { key: 'update', label: 'A actualizar', value: s.update || 0, color: STATUS.update.color, icon: 'edit' },
        { key: 'unchanged', label: 'Sin cambios', value: s.unchanged || 0, color: STATUS.unchanged.color, icon: 'remove_circle_outline' },
        { key: 'error', label: 'Errores', value: s.error || 0, color: STATUS.error.color, icon: 'error_outline' },
    ]
})

const tabs = computed(() => {
    const s = preview.value?.summary || {}
    return [
        { value: 'all', label: 'Todos', count: s.total || 0 },
        { value: 'new', label: 'Nuevos', count: s.new || 0 },
        { value: 'update', label: 'Actualizar', count: s.update || 0 },
        { value: 'unchanged', label: 'Sin cambios', count: s.unchanged || 0 },
        { value: 'error', label: 'Errores', count: s.error || 0 },
    ]
})

const visibleRows = computed(() => {
    const rows = preview.value?.rows || []
    return tab.value === 'all' ? rows : rows.filter((r) => r.status === tab.value)
})

const numberFormat = new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const columns = computed(() => [
    { name: 'row', label: 'Fila', field: 'row', align: 'left' },
    { name: 'code', label: 'Código', field: 'code', align: 'left' },
    { name: 'name', label: 'Producto', field: 'name', align: 'left' },
    {
        name: 'price', label: 'Precio CUP', align: 'right',
        field: (r) => r.price_cup ?? r.current_price,
        format: (v) => (v === null || v === undefined ? '—' : numberFormat.format(v)),
    },
    ...(preview.value?.with_qty
        ? [{ name: 'qty', label: 'Cantidad', field: 'apply_quantity', align: 'right', format: (v) => (v ? v : '—') }]
        : []),
    { name: 'status', label: 'Estado', field: 'status', align: 'center' },
    { name: 'detail', label: 'Cambios / errores', field: 'detail', align: 'left' },
])
</script>

<style scoped lang="scss">
.import-card {
    width: 980px;
    max-width: 96vw;
    max-height: 92vh;
    display: flex;
    flex-direction: column;
}

.import-stepper {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    background: transparent;
}

.import-hint {
    background: var(--app-gold-soft);
    border: 1px solid var(--app-gold-line);
}

.import-type {
    border: 1px solid var(--app-gold-line);
    border-radius: 10px;
    height: 40px;
}

.import-table {
    max-height: 46vh;
}

.import-name {
    max-width: 260px;
    font-weight: 500;
}

.import-detail {
    white-space: normal;
    min-width: 260px;
    font-size: 0.8rem;
    line-height: 1.35;
}
</style>
