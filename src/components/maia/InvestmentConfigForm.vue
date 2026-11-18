<template>
    <div class="investment-form q-gutter-y-md">
        <div>
            <div class="text-subtitle2 q-mb-xs">¿Cuánto es la inversión?</div>
            <q-option-group v-model="config.basis" :options="basisOptions" :disable="disable" dense />
            <q-input v-if="config.basis === 'sales_percent'" outlined dense class="maia-field q-mt-sm" style="max-width: 220px"
                type="number" min="0" max="100" step="0.5" suffix="%" label="% de la venta *" :disable="disable"
                v-model.number="config.sales_percent" :rules="[(v) => (v !== null && v !== '' && v >= 0 && v <= 100) || '0–100']" />
            <div class="text-caption text-grey q-mt-xs">{{ BASIS_HELP[config.basis] }}</div>
        </div>

        <div v-if="config.basis !== 'none'">
            <div class="text-subtitle2 q-mb-xs">¿De dónde sale?</div>
            <q-select outlined dense class="maia-field" emit-value map-options options-dense label="Desglose"
                :options="splitOptions" v-model="config.split" :disable="disable">
                <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                        <q-item-section>
                            <q-item-label>{{ scope.opt.label }}</q-item-label>
                            <q-item-label caption>{{ SPLIT_HELP[scope.opt.value] }}</q-item-label>
                        </q-item-section>
                    </q-item>
                </template>
            </q-select>
            <div class="text-caption text-grey q-mt-xs">{{ SPLIT_HELP[config.split] }}</div>

            <q-list v-if="config.split === 'priority'" bordered separator dense class="rounded-borders q-mt-sm">
                <q-item v-for="(source, i) in priorityList" :key="source.key">
                    <q-item-section avatar class="text-grey-6">{{ i + 1 }}</q-item-section>
                    <q-item-section>{{ source.label }}</q-item-section>
                    <q-item-section side>
                        <div class="row no-wrap">
                            <q-btn flat round dense size="sm" icon="arrow_upward" :disable="disable || i === 0" @click="move(i, -1)" />
                            <q-btn flat round dense size="sm" icon="arrow_downward" :disable="disable || i === priorityList.length - 1"
                                @click="move(i, 1)" />
                        </div>
                    </q-item-section>
                </q-item>
                <q-item v-if="!priorityList.length">
                    <q-item-section class="text-grey">No hay métodos de pago activos.</q-item-section>
                </q-item>
            </q-list>

            <q-select v-if="config.split === 'single'" outlined dense class="maia-field q-mt-sm" emit-value map-options options-dense
                label="Fuente *" :options="sourceOptions" v-model="config.source" :disable="disable"
                :rules="[(v) => !!v || 'Elija la fuente']" />
        </div>

        <div v-if="config.basis !== 'none'">
            <div class="text-subtitle2 q-mb-xs">¿Y lo cobrado en otra moneda (USD, EUR…)?</div>
            <q-option-group v-model="config.foreign" :options="foreignOptions" :disable="disable" dense />
            <q-input v-if="config.foreign === 'sales_percent'" outlined dense class="maia-field q-mt-sm" style="max-width: 220px"
                type="number" min="0" max="100" step="0.5" suffix="%" label="% de lo cobrado *" :disable="disable"
                v-model.number="config.foreign_percent"
                :rules="[(v) => (v !== null && v !== '' && v >= 0 && v <= 100) || '0–100']" />
            <div class="text-caption text-grey q-mt-xs">{{ FOREIGN_HELP[config.foreign] }}</div>
        </div>

        <div class="investment-example">
            <div class="text-caption text-weight-bold text-uppercase q-mb-xs">Ejemplo</div>
            <div class="text-caption text-grey q-mb-sm">
                Venta de {{ money(EXAMPLE.gross) }} con costo de {{ money(EXAMPLE.cost) }}, cobrada así (importes en CUP):
                {{ exampleSources.map((s) => `${s.label} ${money(s.amount)}`).join(' · ') || '—' }}
            </div>
            <div class="row justify-between text-weight-bold">
                <span>Inversión</span>
                <span>{{ money(exampleAmount) }}</span>
            </div>
            <div v-for="part in exampleParts" :key="part.key" class="row justify-between investment-example__part"
                :class="{ 'text-negative': part.amount < 0 }">
                <span>{{ part.label }}</span>
                <span>{{ money(part.amount) }}</span>
            </div>
            <div v-if="config.basis !== 'none' && config.split === 'none'" class="text-caption text-grey">Sin desglose.</div>
            <template v-if="config.basis !== 'none' && exampleForeignCup > 0">
                <q-separator class="q-my-sm" />
                <div class="text-caption text-grey q-mb-xs">
                    Cobrado en moneda extranjera: {{ money(exampleForeignCup) }} CUP
                    ({{ exampleForeignLabels.join(', ') }}).
                </div>
                <div v-if="config.foreign === 'manual'" class="text-caption">
                    La parte que se repone en {{ exampleForeignCodes.join(' / ') }} se escribe en el cierre de cada feria; el resto sale del CUP.
                </div>
                <template v-else>
                    <div class="row justify-between investment-example__part">
                        <span>Se repone en {{ exampleForeignCodes.join(' / ') }}</span>
                        <span>{{ money(exampleForeignInvestment) }}</span>
                    </div>
                    <div class="row justify-between investment-example__part">
                        <span>Se repone en CUP</span>
                        <span>{{ money(exampleAmount - exampleForeignInvestment) }}</span>
                    </div>
                </template>
            </template>
        </div>
    </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { money } from 'src/assets/js/util/maia'
import {
    INVESTMENT_BASES,
    INVESTMENT_FOREIGN,
    INVESTMENT_SPLITS,
    foreignInvestmentCup,
    splitInvestment,
} from 'src/assets/js/util/investment'

const config = defineModel({ type: Object, required: true })
const props = defineProps({
    sources: { type: Array, default: () => [] },
    disable: { type: Boolean, default: false },
})

const BASIS_HELP = {
    product_cost: 'Lo que costaron los productos vendidos (costo × cantidad).',
    sales_percent: 'Una parte fija de la venta total, para negocios que no llevan el costo de cada producto.',
    none: 'No se descuenta inversión: toda la entrada es ganancia.',
}
const SPLIT_HELP = {
    transfers_first: 'Cada transferencia cubre inversión con todo lo que entró; el efectivo pone el resto.',
    proportional: 'Cada forma de cobro pone la parte de la inversión que le toca según lo que se cobró por ella.',
    priority: 'Se toma de las fuentes en el orden que elija, cada una hasta lo que cobró.',
    single: 'Toda la inversión sale de una sola fuente.',
    none: 'Se muestra solo el total de la inversión, sin repartir.',
}
const FOREIGN_HELP = {
    manual: 'En el cierre de cada feria se escribe cuánto de la inversión se repone en USD, EUR…; el resto sale del CUP.',
    proportional: 'Cada moneda repone la parte de la inversión que le toca según lo que se cobró en ella. Ej.: si el 20% de la venta fue en USD, el 20% de la inversión se repone en USD.',
    foreign_first: 'Lo que entra en moneda extranjera se usa primero para reponer la inversión (para volver a comprar mercancía); el CUP pone el resto.',
    sales_percent: 'Una parte fija de lo cobrado en cada moneda extranjera es inversión; el resto de la inversión sale del CUP.',
    none: 'La inversión se repone toda en CUP; lo cobrado en moneda extranjera queda completo como disponible en esa moneda.',
}
const EXAMPLE = { gross: 10000, cost: 4000 }

const basisOptions = Object.entries(INVESTMENT_BASES).map(([value, label]) => ({ value, label }))
const foreignOptions = Object.entries(INVESTMENT_FOREIGN).map(([value, label]) => ({ value, label }))
const splitOptions = Object.entries(INVESTMENT_SPLITS).map(([value, label]) => ({ value, label }))
const sourceOptions = computed(() => props.sources.map((s) => ({ label: s.label, value: s.key })))

const priorityList = computed(() => {
    const byKey = Object.fromEntries(props.sources.map((s) => [s.key, s]))
    const listed = (config.value.priority || []).filter((k) => byKey[k]).map((k) => byKey[k])
    return [...listed, ...props.sources.filter((s) => !listed.includes(s))]
})

const move = (i, step) => {
    const keys = priorityList.value.map((s) => s.key)
    ;[keys[i], keys[i + step]] = [keys[i + step], keys[i]]
    config.value.priority = keys
}

watch(() => [config.value.split, props.sources.length], () => {
    if (config.value.split === 'priority' && !(config.value.priority || []).length) {
        config.value.priority = priorityList.value.map((s) => s.key)
    }
}, { immediate: true })

// Fake collection: main cash weighs 5, other cash 1, each transfer 3; scaled to the example sale.
const exampleSources = computed(() => {
    const weight = (s, i) => (s.kind === 'cash' ? (i === 0 ? 5 : 1) : 3)
    const total = props.sources.reduce((sum, s, i) => sum + weight(s, i), 0)
    if (!total) return []
    let assigned = 0
    return props.sources.map((s, i) => {
        const amount = i === props.sources.length - 1
            ? EXAMPLE.gross - assigned
            : Math.round((EXAMPLE.gross * weight(s, i)) / total)
        assigned += amount
        return { ...s, amount }
    })
})

const exampleAmount = computed(() => {
    if (config.value.basis === 'none') return 0
    if (config.value.basis === 'sales_percent') return (EXAMPLE.gross * Number(config.value.sales_percent || 0)) / 100
    return EXAMPLE.cost
})

const exampleParts = computed(() => splitInvestment(config.value, exampleAmount.value, exampleSources.value))

const exampleForeign = computed(() => exampleSources.value.filter((s) => s.kind === 'cash' && s.key.startsWith('cash:') && s.key !== 'cash:CUP'))
const exampleForeignCup = computed(() => exampleForeign.value.reduce((sum, s) => sum + s.amount, 0))
const exampleForeignLabels = computed(() => exampleForeign.value.map((s) => `${s.label} ${money(s.amount)}`))
const exampleForeignCodes = computed(() => exampleForeign.value.map((s) => s.key.slice(5)))
const exampleForeignInvestment = computed(() => foreignInvestmentCup(config.value, exampleAmount.value, EXAMPLE.gross, exampleForeignCup.value))
</script>

<style lang="scss" scoped>
.investment-example {
    border: 1px dashed brand-a(gold, 0.5);
    border-radius: 8px;
    padding: 10px 14px;
    background: brand-a(gold-pale, 0.18);
}

.investment-example__part {
    padding-left: 14px;
    font-size: 0.9em;
    opacity: 0.85;
}
</style>
