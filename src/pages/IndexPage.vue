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

        <q-banner v-if="!fairStore.fairId && !fairStore.loading" class="maia-card bg-orange-1 text-orange-9" rounded>
            No hay ferias registradas. Cree una en Catálogo › Ferias y tasas, y cargue los productos desde Catálogo › Productos › Importar.
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
                    <q-card flat class="maia-card">
                        <q-card-section class="text-subtitle1 text-weight-bold q-pb-none">Venta y ganancia por día (CUP)</q-card-section>
                        <v-chart class="chart" :option="dayOption" autoresize />
                    </q-card>
                </div>
                <div class="col-12 col-lg-4">
                    <q-card flat class="maia-card">
                        <q-card-section class="text-subtitle1 text-weight-bold q-pb-none">Cobros por forma de pago</q-card-section>
                        <v-chart class="chart" :option="pieOption(data.by_method)" autoresize />
                    </q-card>
                </div>
                <div class="col-12 col-lg-8">
                    <q-card flat class="maia-card">
                        <q-card-section class="text-subtitle1 text-weight-bold q-pb-none">Productos más vendidos (CUP)</q-card-section>
                        <v-chart class="chart" :option="topOption" autoresize />
                    </q-card>
                </div>
                <div class="col-12 col-lg-4">
                    <q-card flat class="maia-card">
                        <q-card-section class="text-subtitle1 text-weight-bold q-pb-none">Venta por categoría</q-card-section>
                        <v-chart class="chart" :option="pieOption(data.by_category.map((c) => ({ name: c.name, value: Number(c.value) })))" autoresize />
                    </q-card>
                </div>
            </div>
        </template>
    </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import VChart from 'vue-echarts'
import { use, graphic } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { api } from 'src/boot/axios'
import PageHeader from 'src/components/maia/PageHeader.vue'
import FairDaySelector from 'src/components/maia/FairDaySelector.vue'
import { useAuthStore } from 'src/stores/auth-store'
import { useFairStore } from 'src/stores/fair-store'
import { useBrandStore } from 'src/stores/brand-store'
import { money, int, formatDate, notifyApiError } from 'src/assets/js/util/maia'
import { withAlpha, derivedColors } from 'src/assets/js/util/brand'

use([CanvasRenderer, BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent])

const router = useRouter()
const authStore = useAuthStore()
const fairStore = useFairStore()
const brandStore = useBrandStore()
const data = ref(null)
const canSeeTotals = computed(() => authStore.hasAnyPermission(['reportes.ver', 'cierre.ver']))

const allShortcuts = [
    { title: 'Punto de venta', caption: 'Registrar ventas', icon: 'point_of_sale', link: 'PuntoVenta', color: 'primary', permission: ['pos.vender'] },
    { title: 'Inventario', caption: 'Entradas y conteo', icon: 'inventory_2', link: 'Inventario', color: 'teal', permission: ['inventario.ver', 'inventario.contar'] },
    { title: 'Propinas', caption: 'Propinas y salarios', icon: 'volunteer_activism', link: 'Propinas', color: 'pink-6', permission: ['propinas.ver'] },
    { title: 'Cierre del día', caption: 'Cuadre de caja', icon: 'price_check', link: 'CierreDia', color: 'orange-8', permission: ['cierre.ver', 'cierre.editar'] },
    { title: 'Reportes', caption: 'Análisis', icon: 'query_stats', link: 'Reportes', color: 'indigo', permission: ['reportes.ver'] },
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
        { label: 'Unidades en stock', value: int(t.stock_units) },
    ]
})

const brandPalette = computed(() => brandStore.palette)
const palette = computed(() => [brandPalette.value.wine, brandPalette.value.gold, '#6B2D8B', '#2F6FBF', '#1AA6A0', '#2E9B4A', '#E67A22', '#C4392A'])
const textStyle = { fontFamily: 'Inter, Segoe UI, sans-serif', color: '#7b6a62' }

const dayOption = computed(() => {
    const p = brandPalette.value
    return {
        color: palette.value,
        textStyle,
        tooltip: { trigger: 'axis', valueFormatter: (v) => money(v) },
        legend: { bottom: 0, textStyle },
        grid: { left: 60, right: 20, top: 20, bottom: 50 },
        xAxis: {
            type: 'category',
            data: data.value.by_day.map((d) => formatDate(d.date).substring(0, 5)),
            axisLine: { lineStyle: { color: withAlpha(p.gold, 0.5) } },
        },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: withAlpha(p.gold, 0.15) } } },
        series: [
            {
                name: 'Venta bruta',
                type: 'bar',
                data: data.value.by_day.map((d) => d.gross),
                barMaxWidth: 40,
                itemStyle: {
                    borderRadius: [6, 6, 0, 0],
                    color: new graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: p['wine-light'] },
                        { offset: 1, color: p['wine-deep'] },
                    ]),
                },
            },
            {
                name: 'Ganancia',
                type: 'line',
                smooth: true,
                symbolSize: 8,
                data: data.value.by_day.map((d) => d.profit),
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
    const items = [...data.value.top_products].reverse()
    const p = brandPalette.value
    return {
        textStyle,
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v) => money(v) },
        grid: { left: 10, right: 30, top: 10, bottom: 10, containLabel: true },
        xAxis: { type: 'value', splitLine: { lineStyle: { color: withAlpha(p.gold, 0.15) } } },
        yAxis: {
            type: 'category',
            data: items.map((i) => (i.name.length > 28 ? `${i.name.substring(0, 28)}…` : i.name)),
            axisLine: { lineStyle: { color: withAlpha(p.gold, 0.5) } },
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

const pieOption = (items) => ({
    color: palette.value,
    textStyle,
    tooltip: { trigger: 'item', valueFormatter: (v) => `${money(v)} CUP` },
    legend: { type: 'scroll', bottom: 0, textStyle },
    series: [{
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '45%'],
        label: { show: false },
        itemStyle: { borderColor: brandPalette.value.ivory, borderWidth: 2, borderRadius: 6 },
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
    height: 320px;
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
