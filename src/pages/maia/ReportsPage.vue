<template>
    <q-page class="maia-page">
        <PageHeader title="Reportes" section="Análisis">
            <FairDaySelector hide-day @change="load" />
            <q-input dense outlined type="date" stack-label label="Desde" v-model="from" class="maia-field" style="width: 150px"
                clearable @update:model-value="load" />
            <q-input dense outlined type="date" stack-label label="Hasta" v-model="to" class="maia-field" style="width: 150px"
                clearable @update:model-value="load" />
            <q-btn-dropdown unelevated no-caps color="primary" icon="download" label="Exportar" :disable="!fairStore.fairId">
                <q-list dense>
                    <q-item clickable v-close-popup @click="exportCurrent('Excel')">
                        <q-item-section avatar><q-icon name="table_view" /></q-item-section>
                        <q-item-section>Este reporte (Excel)</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="exportCurrent('PDF')">
                        <q-item-section avatar><q-icon name="picture_as_pdf" /></q-item-section>
                        <q-item-section>Este reporte (PDF)</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item clickable v-close-popup @click="exportType('Full', 'Excel')">
                        <q-item-section avatar><q-icon name="library_books" /></q-item-section>
                        <q-item-section>Libro completo (Excel)</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="exportType('Catalog', 'Excel')">
                        <q-item-section avatar><q-icon name="sell" /></q-item-section>
                        <q-item-section>Catálogo de precios (Excel)</q-item-section>
                    </q-item>
                    <q-item clickable v-close-popup @click="exportType('Catalog', 'PDF')">
                        <q-item-section avatar><q-icon name="sell" /></q-item-section>
                        <q-item-section>Catálogo de precios (PDF)</q-item-section>
                    </q-item>
                </q-list>
            </q-btn-dropdown>
        </PageHeader>

        <q-tabs v-model="tab" dense align="left" active-color="primary" indicator-color="primary" class="q-mb-md" no-caps
            @update:model-value="load">
            <q-tab name="SalesAnalysis" icon="query_stats" label="Análisis de venta" />
            <q-tab name="Products" icon="inventory_2" label="Resumen por producto" />
            <q-tab name="WorkerSales" icon="groups" label="Ventas por trabajador" />
        </q-tabs>

        <q-inner-loading :showing="loading" color="primary" />

        <!-- Sales analysis -->
        <template v-if="tab === 'SalesAnalysis' && analysis">
            <div class="row q-col-gutter-md q-mb-md">
                <div v-for="s in analysisStats" :key="s.label" class="col-6 col-sm-4 col-md-2">
                    <div class="maia-stat">
                        <div class="maia-stat__label">{{ s.label }}</div>
                        <div class="maia-stat__value" :class="s.class">{{ s.value }}</div>
                    </div>
                </div>
            </div>
            <q-card flat class="maia-card">
                <q-markup-table flat dense class="maia-table" separator="cell" style="overflow-x: auto">
                    <thead>
                        <tr>
                            <th class="text-left">Día</th>
                            <th class="text-right">Ventas</th>
                            <th class="text-right">Venta bruta</th>
                            <th v-for="m in analysisMethods" :key="m.id" class="text-right">{{ m.name }}</th>
                            <th class="text-right">% vendedor</th>
                            <th class="text-right">Ingreso</th>
                            <th class="text-right">Inversión</th>
                            <th class="text-right">Ganancia</th>
                            <th class="text-right">USD</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="r in analysis.rows" :key="r.fair_day_id">
                            <td>
                                {{ weekday(r.date).substring(0, 3) }} {{ formatDate(r.date) }}
                                <q-icon v-if="r.status === 'closed'" name="lock" size="12px" color="grey" />
                            </td>
                            <td class="text-right">{{ r.count || '' }}</td>
                            <td class="text-right text-weight-medium">{{ r.gross ? money(r.gross) : '' }}</td>
                            <td v-for="m in analysisMethods" :key="m.id" class="text-right">
                                {{ r.methods[m.id]?.amount ? money(r.methods[m.id].amount) : '' }}
                            </td>
                            <td class="text-right">{{ r.seller_portion ? money(r.seller_portion) : '' }}</td>
                            <td class="text-right">{{ r.income ? money(r.income) : '' }}</td>
                            <td class="text-right">{{ r.investment ? money(r.investment) : '' }}</td>
                            <td class="text-right" :class="r.profit < 0 ? 'text-negative' : ''">{{ r.profit ? money(r.profit) : '' }}</td>
                            <td class="text-right">{{ r.gross_usd ? money(r.gross_usd) : '' }}</td>
                        </tr>
                        <tr class="total-row">
                            <td>TOTAL</td>
                            <td class="text-right">{{ analysis.totals.count }}</td>
                            <td class="text-right">{{ money(analysis.totals.gross) }}</td>
                            <td v-for="m in analysisMethods" :key="m.id" class="text-right">
                                {{ money(analysis.totals.methods[m.id]?.amount) }}
                            </td>
                            <td class="text-right">{{ money(analysis.totals.seller_portion) }}</td>
                            <td class="text-right">{{ money(analysis.totals.income) }}</td>
                            <td class="text-right">{{ money(analysis.totals.investment) }}</td>
                            <td class="text-right">{{ money(analysis.totals.profit) }}</td>
                            <td class="text-right">{{ money(analysis.totals.gross_usd) }}</td>
                        </tr>
                    </tbody>
                </q-markup-table>
            </q-card>
            <div v-if="analysis.fcbc.total" class="text-body2 q-mt-sm">
                FCBC: {{ money(analysis.fcbc.total) }} CUP − {{ fairStore.fair?.fcbc_percent }}% ({{ money(analysis.fcbc.discount) }})
                = <b>{{ money(analysis.fcbc.net) }} CUP</b>
            </div>
        </template>

        <!-- Products -->
        <template v-if="tab === 'Products'">
            <q-card flat class="maia-card">
                <q-card-section class="row items-center q-gutter-sm q-py-sm">
                    <q-input dense outlined debounce="250" v-model="productSearch" placeholder="Buscar producto" class="maia-field" clearable>
                        <template #prepend><q-icon name="search" /></template>
                    </q-input>
                    <q-toggle dense v-model="onlySold" label="Solo vendidos" @update:model-value="load" />
                </q-card-section>
                <q-table flat dense class="maia-table maia-sticky" :rows="filteredProducts" :columns="productColumns" row-key="product_id"
                    :pagination="{ rowsPerPage: 0, sortBy: 'gross', descending: true }" hide-pagination style="max-height: calc(100vh - 300px)"
                    no-data-label="Sin datos">
                    <template #bottom-row>
                        <q-tr class="total-row">
                            <q-td colspan="3">TOTAL</q-td>
                            <q-td class="text-right">{{ int(productSum('initial')) }}</q-td>
                            <q-td class="text-right">{{ int(productSum('in_out')) }}</q-td>
                            <q-td class="text-right">{{ int(productSum('sold')) }}</q-td>
                            <q-td />
                            <q-td class="text-right">{{ money(productSum('gross')) }}</q-td>
                            <q-td class="text-right">{{ money(productSum('seller_portion')) }}</q-td>
                            <q-td class="text-right">{{ money(productSum('income')) }}</q-td>
                            <q-td class="text-right">{{ money(productSum('investment')) }}</q-td>
                            <q-td class="text-right">{{ money(productSum('profit')) }}</q-td>
                            <q-td class="text-right">{{ int(productSum('final')) }}</q-td>
                        </q-tr>
                    </template>
                </q-table>
            </q-card>
        </template>

        <!-- Worker sales -->
        <template v-if="tab === 'WorkerSales' && workerSales">
            <q-card flat class="maia-card">
                <q-markup-table flat dense class="maia-table" separator="cell" style="overflow-x: auto">
                    <thead>
                        <tr>
                            <th class="text-left">Trabajador</th>
                            <th v-for="d in workerSales.days" :key="d.id" class="text-right">{{ formatDate(d.date).substring(0, 5) }}</th>
                            <th class="text-right">Ventas</th>
                            <th class="text-right">Unidades</th>
                            <th class="text-right">Importe CUP</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="r in workerSales.rows" :key="r.worker_id">
                            <td class="text-weight-medium">{{ r.name }}</td>
                            <td v-for="d in workerSales.days" :key="d.id" class="text-right">{{ r.cells[d.id]?.count || '' }}</td>
                            <td class="text-right text-weight-bold">{{ r.count }}</td>
                            <td class="text-right">{{ r.units }}</td>
                            <td class="text-right">{{ money(r.gross) }}</td>
                        </tr>
                        <tr v-if="!workerSales.rows.length">
                            <td :colspan="workerSales.days.length + 4" class="text-center text-grey">Sin ventas asignadas a trabajadores</td>
                        </tr>
                    </tbody>
                </q-markup-table>
            </q-card>
        </template>
    </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { api } from 'src/boot/axios'
import PageHeader from 'src/components/maia/PageHeader.vue'
import FairDaySelector from 'src/components/maia/FairDaySelector.vue'
import { useFairStore } from 'src/stores/fair-store'
import { money, int, formatDate, weekday, notifyApiError, downloadFile } from 'src/assets/js/util/maia'

const fairStore = useFairStore()

const tab = ref('SalesAnalysis')
const from = ref(null)
const to = ref(null)
const loading = ref(false)

const analysis = ref(null)
const products = ref([])
const workerSales = ref(null)
const onlySold = ref(true)
const productSearch = ref('')

const rangeParams = () => ({ ...(from.value ? { from: from.value } : {}), ...(to.value ? { to: to.value } : {}) })

const load = async () => {
    if (!fairStore.fairId) return
    loading.value = true
    try {
        if (tab.value === 'SalesAnalysis') {
            const { data } = await api.get(`Report/SalesAnalysis/${fairStore.fairId}`, { params: rangeParams() })
            analysis.value = data.data
        } else if (tab.value === 'Products') {
            const { data } = await api.get(`Report/Products/${fairStore.fairId}`, { params: { ...rangeParams(), only_sold: onlySold.value ? 1 : 0 } })
            products.value = data.data || []
        } else {
            const { data } = await api.get(`Report/WorkerSales/${fairStore.fairId}`)
            workerSales.value = data.data
        }
    } catch (error) {
        notifyApiError(error)
    } finally {
        loading.value = false
    }
}

const exportType = (type, format) => {
    const params = { ...rangeParams(), ...(type === 'Products' && onlySold.value ? { only_sold: 1 } : {}) }
    downloadFile(`Report/${type}/${fairStore.fairId}/${format}`, params, `${type}.${format === 'PDF' ? 'pdf' : 'xlsx'}`)
}
const exportCurrent = (format) => exportType(tab.value, format)

/* ---------- Sales analysis ---------- */
const analysisMethods = computed(() => (analysis.value?.methods || []).filter((m) => analysis.value.totals.methods[m.id]?.amount))
const analysisStats = computed(() => {
    const t = analysis.value.totals
    return [
        { label: 'Ventas', value: int(t.count) },
        { label: 'Venta bruta CUP', value: money(t.gross) },
        { label: 'Porción vendedor', value: money(t.seller_portion) },
        { label: 'Ingreso', value: money(t.income) },
        { label: 'Inversión', value: money(t.investment) },
        { label: 'Ganancia', value: money(t.profit), class: t.profit < 0 ? 'text-negative' : 'text-positive' },
    ]
})

/* ---------- Products ---------- */
const normalize = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const filteredProducts = computed(() => {
    const term = normalize(productSearch.value).trim()
    return term ? products.value.filter((p) => p.code === term || normalize(p.name).includes(term)) : products.value
})
const productSum = (key) => filteredProducts.value.reduce((s, p) => s + Number(p[key] || 0), 0)
const productColumns = [
    { name: 'code', label: 'Código', field: 'code', align: 'left', sortable: true, sort: (a, b) => Number(a) - Number(b) },
    { name: 'name', label: 'Producto', field: 'name', align: 'left', sortable: true },
    { name: 'category', label: 'Categoría', field: 'category', align: 'left', sortable: true },
    { name: 'initial', label: 'Inicial', field: 'initial', align: 'right', sortable: true },
    { name: 'in_out', label: 'Entr./Sal.', field: 'in_out', align: 'right', sortable: true },
    { name: 'sold', label: 'Vendido', field: 'sold', align: 'right', sortable: true },
    { name: 'avg_price', label: 'Precio prom.', field: 'avg_price', align: 'right', format: money },
    { name: 'gross', label: 'Venta bruta', field: 'gross', align: 'right', format: money, sortable: true },
    { name: 'seller_portion', label: '% vendedor', field: 'seller_portion', align: 'right', format: money },
    { name: 'income', label: 'Ingreso', field: 'income', align: 'right', format: money },
    { name: 'investment', label: 'Inversión', field: 'investment', align: 'right', format: money },
    { name: 'profit', label: 'Ganancia', field: 'profit', align: 'right', format: money, sortable: true },
    { name: 'final', label: 'Final', field: 'final', align: 'right', sortable: true },
]
</script>
