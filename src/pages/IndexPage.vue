<template>
    <q-page class="maia-page">
        <PageHeader title="Inicio" :section="fairStore.fair ? fairStore.fair.name : brandStore.name">
            <FairDaySelector hide-day @change="load" />
        </PageHeader>

        <div class="row q-col-gutter-md q-mb-md items-stretch">
            <div v-for="a in shortcuts" :key="a.link" class="col-6 col-sm-4 col-md shortcut-col">
                <q-card flat class="maia-card cursor-pointer shortcut" v-ripple @click="router.push({ name: a.link })">
                    <q-card-section class="row items-center no-wrap q-gutter-md">
                        <div class="shortcut-icon">
                            <q-icon :name="a.icon" size="22px" />
                        </div>
                        <div class="shortcut-copy">
                            <div class="shortcut-title">{{ a.title }}</div>
                            <div class="shortcut-caption">{{ a.caption }}</div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </div>

        <q-banner v-if="!fairStore.fairId && !fairStore.loading" class="maia-card maia-banner--warning" rounded>
            No hay ferias registradas. Cree una en Configuración › Ferias y tasas, y cargue los productos desde Configuración › Productos › Importar.
        </q-banner>

        <template v-if="data && canSeeTotals">
            <div class="row q-col-gutter-md q-mb-md">
                <div v-for="s in stats" :key="s.label" class="col-6 col-sm-4 col-md-2">
                    <div class="maia-stat">
                        <div class="maia-stat__label">{{ s.label }}</div>
                        <div class="maia-stat__value" :class="s.class">{{ s.value }}</div>
                        <div v-if="s.caption" class="stat-caption">{{ s.caption }}</div>
                    </div>
                </div>
            </div>

            <div class="row q-col-gutter-md">
                <div class="col-12 col-lg-8">
                    <q-card flat class="maia-card chart-card">
                        <q-card-section class="text-subtitle1 text-weight-bold q-pb-none">
                            Venta, inversión y ganancia por día (CUP)
                            <InfoHint text="Barras: venta bruta del día (todo lo cobrado). Línea discontinua: inversión = costo de los productos vendidos. Línea dorada: ganancia = venta bruta − porción del vendedor − inversión." />
                        </q-card-section>
                        <v-chart class="chart chart--tall" :option="dayOption" autoresize />
                    </q-card>
                </div>
                <div class="col-12 col-lg-4">
                    <q-card flat class="maia-card chart-card">
                        <q-card-section class="text-subtitle1 text-weight-bold q-pb-none">
                            Cobros por forma de pago
                            <InfoHint text="Suma de lo cobrado en cada forma de pago (efectivo por moneda, transferencias, tarjeta) durante toda la feria, convertido a CUP con la tasa de cada día." />
                        </q-card-section>
                        <v-chart class="chart" :option="pieOption(data.by_method)" autoresize />
                    </q-card>
                </div>

                <div class="col-12 col-lg-4">
                    <q-card flat class="maia-card chart-card">
                        <q-card-section class="text-subtitle1 text-weight-bold q-pb-none">
                            Inventario de la feria
                            <InfoHint text="Inicial: piezas con que arrancó la feria. Vendido: piezas vendidas en todas las ventas. Stock: lo que queda hoy (inicial + entradas − salidas − vendido). El % del centro es vendido ÷ (vendido + stock)." />
                        </q-card-section>
                        <q-card-section class="q-pt-sm text-caption text-grey-7">
                            Inicial {{ int(data.totals.initial_units) }} · Vendido {{ int(data.totals.sold_units) }} · Stock {{ int(data.totals.stock_units) }}
                        </q-card-section>
                        <v-chart class="chart chart--short" :option="inventoryOption" autoresize />
                    </q-card>
                </div>
                <div class="col-12 col-lg-4">
                    <q-card v-if="hasConsignment" flat class="maia-card chart-card">
                        <q-card-section class="text-subtitle1 text-weight-bold q-pb-none">
                            Propio vs consignación
                            <InfoHint text="Venta bruta en CUP separada según el dueño del producto: propio del negocio o dejado en consignación por un tercero." />
                        </q-card-section>
                        <v-chart class="chart" :option="pieOption(data.by_owner.map((c) => ({ name: c.name, value: Number(c.value) })))" autoresize />
                    </q-card>
                    <q-card v-else flat class="maia-card chart-card">
                        <q-card-section class="text-subtitle1 text-weight-bold q-pb-none">
                            Unidades y promedio por venta
                            <InfoHint text="Barras: piezas vendidas cada día. Línea: venta bruta del día ÷ cantidad de ventas (lo que deja cada cliente en promedio). Los días sin ventas no llevan punto." />
                        </q-card-section>
                        <v-chart class="chart" :option="unitsOption" autoresize />
                    </q-card>
                </div>
                <div class="col-12 col-lg-4">
                    <q-card flat class="maia-card chart-card">
                        <q-card-section class="text-subtitle1 text-weight-bold q-pb-none">
                            Venta por categoría
                            <InfoHint text="Venta bruta en CUP agrupada por la categoría de cada producto vendido. Los productos sin categoría salen como “Sin categoría”." />
                        </q-card-section>
                        <v-chart class="chart" :option="pieOption(data.by_category.map((c) => ({ name: c.name, value: Number(c.value) })))" autoresize />
                    </q-card>
                </div>

                <div class="col-12 col-lg-7">
                    <q-card flat class="maia-card chart-card">
                        <q-card-section class="text-subtitle1 text-weight-bold q-pb-none">
                            Productos más vendidos (CUP)
                            <InfoHint text="Los 10 productos con mayor venta bruta en CUP en toda la feria (precio × cantidad de cada venta). Al pasar el ratón se ven también las unidades." />
                        </q-card-section>
                        <v-chart class="chart chart--tall" :option="topOption" autoresize />
                    </q-card>
                </div>
                <div class="col-12 col-lg-5">
                    <q-card flat class="maia-card chart-card">
                        <q-card-section class="text-subtitle1 text-weight-bold q-pb-none">
                            Ventas por vendedor
                            <InfoHint text="Venta bruta en CUP registrada por cada trabajador en el punto de venta (hasta 8). Al pasar el ratón se ve cuántas ventas hizo." />
                        </q-card-section>
                        <v-chart class="chart chart--tall" :option="workerOption" autoresize />
                    </q-card>
                </div>
            </div>
        </template>
    </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import VChart from 'vue-echarts'
import { use, graphic } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { api } from 'src/boot/axios'
import PageHeader from 'src/components/maia/PageHeader.vue'
import FairDaySelector from 'src/components/maia/FairDaySelector.vue'
import InfoHint from 'src/components/maia/InfoHint.vue'
import { useAuthStore } from 'src/stores/auth-store'
import { useFairStore } from 'src/stores/fair-store'
import { useBrandStore } from 'src/stores/brand-store'
import { money, int, formatDate, notifyApiError } from 'src/assets/js/util/maia'
import { withAlpha, derivedColors } from 'src/assets/js/util/brand'

use([CanvasRenderer, BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent])

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const fairStore = useFairStore()
const brandStore = useBrandStore()
const data = ref(null)
const canSeeTotals = computed(() => authStore.hasAnyPermission(['reportes.ver', 'cierre.ver']))

const allShortcuts = [
    { title: 'Punto de venta', caption: 'Registrar ventas', icon: 'point_of_sale', link: 'PuntoVenta', permission: ['pos.vender'] },
    { title: 'Inventario', caption: 'Entradas y conteo', icon: 'inventory_2', link: 'Inventario', permission: ['inventario.ver', 'inventario.contar'] },
    { title: 'Propinas', caption: 'Propinas y salarios', icon: 'volunteer_activism', link: 'Propinas', permission: ['propinas.ver'] },
    { title: 'Cierre del día', caption: 'Cuadre de caja', icon: 'price_check', link: 'CierreDia', permission: ['cierre.ver', 'cierre.editar'] },
    { title: 'Reportes', caption: 'Análisis', icon: 'query_stats', link: 'Reportes', permission: ['reportes.ver'] },
]
const shortcuts = computed(() => allShortcuts.filter((s) => authStore.hasAnyPermission(s.permission)))

const stats = computed(() => {
    const t = data.value.totals
    return [
        { label: 'Venta bruta CUP', value: money(t.gross), caption: `${money(t.gross_usd)} USD` },
        { label: 'Ventas', value: int(t.count), caption: `${t.days} días` },
        { label: 'Ingreso', value: money(t.income), caption: `Porción vendedor ${money(t.seller_portion)}` },
        { label: 'Ganancia', value: money(t.profit), class: t.profit < 0 ? 'text-negative' : 'text-positive', caption: `Inversión ${money(t.investment)}` },
        { label: 'Propinas', value: money(t.tips) },
        { label: 'Unidades en stock', value: int(t.stock_units), caption: `Vendidas ${int(t.sold_units || 0)}` },
    ]
})

const brandPalette = computed(() => brandStore.palette)
const isDark = computed(() => $q.dark.isActive)
const chartInk = computed(() => (isDark.value ? '#d4c4b8' : '#7b6a62'))
const chartSurface = computed(() => (isDark.value ? brandPalette.value.dark : brandPalette.value.ivory))
const textStyle = computed(() => ({ fontFamily: 'Inter, Segoe UI, sans-serif', color: chartInk.value }))
const palette = computed(() => [
    brandPalette.value.wine,
    brandPalette.value.gold,
    '#6B2D8B',
    '#2F6FBF',
    '#1AA6A0',
    '#2E9B4A',
    '#E67A22',
    '#C4392A',
])

const dayOption = computed(() => {
    const p = brandPalette.value
    const days = data.value.by_day || []
    return {
        color: palette.value,
        textStyle: textStyle.value,
        tooltip: {
            trigger: 'axis',
            valueFormatter: (v) => money(v),
        },
        legend: { bottom: 0, textStyle: textStyle.value },
        grid: { left: 56, right: 24, top: 24, bottom: 56 },
        xAxis: {
            type: 'category',
            data: days.map((d) => formatDate(d.date).substring(0, 5)),
            axisLine: { lineStyle: { color: withAlpha(p.gold, 0.5) } },
            axisLabel: { color: chartInk.value },
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: withAlpha(p.gold, isDark.value ? 0.12 : 0.15) } },
            axisLabel: { color: chartInk.value },
        },
        series: [
            {
                name: 'Venta bruta',
                type: 'bar',
                data: days.map((d) => d.gross),
                barMaxWidth: 36,
                itemStyle: {
                    borderRadius: [6, 6, 0, 0],
                    color: new graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: p['wine-light'] },
                        { offset: 1, color: p['wine-deep'] },
                    ]),
                },
            },
            {
                name: 'Inversión',
                type: 'line',
                smooth: true,
                symbolSize: 6,
                data: days.map((d) => d.investment ?? 0),
                lineStyle: { width: 2, type: 'dashed', color: '#1AA6A0' },
                itemStyle: { color: '#1AA6A0' },
            },
            {
                name: 'Ganancia',
                type: 'line',
                smooth: true,
                symbolSize: 8,
                data: days.map((d) => d.profit),
                lineStyle: { width: 3, color: p.gold },
                itemStyle: { color: p['gold-light'], borderColor: p.gold, borderWidth: 2 },
                areaStyle: {
                    color: new graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: withAlpha(p['gold-light'], 0.35) },
                        { offset: 1, color: withAlpha(p['gold-light'], 0) },
                    ]),
                },
            },
        ],
    }
})

const topOption = computed(() => {
    const items = [...(data.value.top_products || [])].reverse()
    const p = brandPalette.value
    return {
        textStyle: textStyle.value,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                const i = params?.[0]?.dataIndex
                const row = items[i]
                if (!row) return ''
                return `${row.name}<br/>${money(row.gross)} CUP · ${int(row.units)} u.`
            },
        },
        grid: { left: 10, right: 30, top: 10, bottom: 10, containLabel: true },
        xAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: withAlpha(p.gold, isDark.value ? 0.12 : 0.15) } },
            axisLabel: { color: chartInk.value },
        },
        yAxis: {
            type: 'category',
            data: items.map((i) => (i.name.length > 28 ? `${i.name.substring(0, 28)}…` : i.name)),
            axisLine: { lineStyle: { color: withAlpha(p.gold, 0.5) } },
            axisLabel: { color: chartInk.value },
        },
        series: [{
            type: 'bar',
            data: items.map((i) => Number(i.gross)),
            barMaxWidth: 22,
            itemStyle: {
                borderRadius: [0, 6, 6, 0],
                color: new graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: p.gold },
                    { offset: 1, color: derivedColors(p)['gold-bright'] },
                ]),
            },
        }],
    }
})

const workerOption = computed(() => {
    const items = [...(data.value.by_worker || [])].reverse()
    const p = brandPalette.value
    return {
        textStyle: textStyle.value,
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
                const i = params?.[0]?.dataIndex
                const row = items[i]
                if (!row) return ''
                return `${row.name}<br/>${money(row.gross)} CUP · ${int(row.sales)} ventas`
            },
        },
        grid: { left: 10, right: 24, top: 10, bottom: 10, containLabel: true },
        xAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: withAlpha(p.gold, isDark.value ? 0.12 : 0.15) } },
            axisLabel: { color: chartInk.value },
        },
        yAxis: {
            type: 'category',
            data: items.map((i) => {
                const short = String(i.name || '').split(' ')[0]
                return short.length > 14 ? `${short.substring(0, 14)}…` : short
            }),
            axisLine: { lineStyle: { color: withAlpha(p.gold, 0.5) } },
            axisLabel: { color: chartInk.value },
        },
        series: [{
            type: 'bar',
            data: items.map((i) => Number(i.gross)),
            barMaxWidth: 22,
            itemStyle: {
                borderRadius: [0, 6, 6, 0],
                color: new graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: p['wine-deep'] },
                    { offset: 1, color: p['wine-light'] },
                ]),
            },
        }],
    }
})

const hasConsignment = computed(() => (data.value?.by_owner || []).filter((o) => Number(o.value) > 0).length > 1)

const unitsOption = computed(() => {
    const p = brandPalette.value
    const days = data.value.by_day || []
    return {
        textStyle: textStyle.value,
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, textStyle: textStyle.value },
        grid: { left: 44, right: 52, top: 20, bottom: 50 },
        xAxis: {
            type: 'category',
            data: days.map((d) => formatDate(d.date).substring(0, 5)),
            axisLine: { lineStyle: { color: withAlpha(p.gold, 0.5) } },
            axisLabel: { color: chartInk.value },
        },
        yAxis: [
            {
                type: 'value',
                name: 'u.',
                splitLine: { lineStyle: { color: withAlpha(p.gold, isDark.value ? 0.12 : 0.15) } },
                axisLabel: { color: chartInk.value },
            },
            {
                type: 'value',
                name: 'CUP',
                splitLine: { show: false },
                axisLabel: { color: chartInk.value },
            },
        ],
        series: [
            {
                name: 'Unidades',
                type: 'bar',
                barMaxWidth: 26,
                data: days.map((d) => d.units || 0),
                itemStyle: { borderRadius: [5, 5, 0, 0], color: '#2F6FBF' },
                tooltip: { valueFormatter: (v) => `${int(v)} u.` },
            },
            {
                name: 'Promedio por venta',
                type: 'line',
                yAxisIndex: 1,
                smooth: true,
                symbolSize: 7,
                data: days.map((d) => (d.count ? Math.round(d.gross / d.count) : null)),
                lineStyle: { width: 3, color: p.gold },
                itemStyle: { color: p['gold-light'], borderColor: p.gold, borderWidth: 2 },
                tooltip: { valueFormatter: (v) => (v == null ? 'Sin ventas' : `${money(v)} CUP`) },
            },
        ],
    }
})

const inventoryOption = computed(() => {
    const items = data.value.inventory || []
    return {
        color: [brandPalette.value.wine, brandPalette.value.gold],
        textStyle: textStyle.value,
        tooltip: { trigger: 'item', formatter: (p) => `${p.name}: ${int(p.value)} u. (${p.percent}%)` },
        legend: { bottom: 0, textStyle: textStyle.value },
        series: [{
            type: 'pie',
            radius: ['48%', '72%'],
            center: ['50%', '44%'],
            label: {
                show: true,
                position: 'center',
                formatter: () => {
                    const total = (data.value.totals.sold_units || 0) + Math.max(0, data.value.totals.stock_units || 0)
                    const sold = data.value.totals.sold_units || 0
                    const pct = total ? Math.round((sold / total) * 100) : 0
                    return `{a|${pct}%}\n{b|vendido}`
                },
                rich: {
                    a: { fontSize: 22, fontWeight: 700, color: brandPalette.value.wine, lineHeight: 28 },
                    b: { fontSize: 11, color: chartInk.value },
                },
            },
            itemStyle: { borderColor: chartSurface.value, borderWidth: 3, borderRadius: 6 },
            data: items.map((i) => ({ name: i.name, value: Number(i.value) })),
        }],
    }
})

const pieOption = (items) => ({
    color: palette.value,
    textStyle: textStyle.value,
    tooltip: { trigger: 'item', valueFormatter: (v) => `${money(v)} CUP` },
    legend: { type: 'scroll', bottom: 0, textStyle: textStyle.value },
    series: [{
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '45%'],
        label: { show: false },
        itemStyle: { borderColor: chartSurface.value, borderWidth: 2, borderRadius: 6 },
        data: items,
    }],
})

const load = async () => {
    if (!fairStore.fairId || !canSeeTotals.value) {
        data.value = null
        return
    }
    try {
        const { data: res } = await api.get(`Report/Dashboard/${fairStore.fairId}`)
        data.value = res.data
    } catch (error) {
        notifyApiError(error)
    }
}
</script>

<style scoped>
.chart {
    height: 300px;
}

.chart--tall {
    height: 340px;
}

.chart--short {
    height: 260px;
}

/* Cards in the same row share the tallest height; the chart takes the leftover space. */
.chart-card {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.chart-card .chart {
    flex: 1 1 auto;
}

.shortcut-col {
    display: flex;
}

.shortcut {
    width: 100%;
    height: 100%;
    min-height: 88px;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.shortcut:hover {
    transform: translateY(-3px);
    border-color: rgba(var(--maia-gold-rgb), 0.6);
    box-shadow: 0 18px 36px rgba(var(--maia-wine-deep-rgb), 0.14);
}

.shortcut-copy {
    min-width: 0;
}

.shortcut-caption {
    font-size: 0.75rem;
    color: var(--app-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.shortcut-icon {
    width: 46px;
    height: 46px;
    flex-shrink: 0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f3dfb0;
    background: linear-gradient(135deg, var(--maia-wine-light) 0%, var(--maia-wine-deep) 100%);
    box-shadow: 0 0 0 2px var(--maia-ivory), 0 0 0 3.5px var(--maia-gold-light), 0 8px 18px rgba(var(--maia-wine-deep-rgb), 0.25);
    transition: transform 0.25s ease;
}

.shortcut:hover .shortcut-icon {
    transform: rotate(-8deg) scale(1.06);
}

.shortcut-title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--q-primary);
}

body.body--dark .shortcut-title {
    color: var(--maia-gold-bright);
}

body.body--dark .shortcut-icon {
    box-shadow: 0 0 0 2px var(--maia-dark), 0 0 0 3.5px var(--maia-gold-light);
}
</style>
