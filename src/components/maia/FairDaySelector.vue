<template>
    <div class="fair-day-selector row items-center no-wrap">
        <q-select dense outlined emit-value map-options options-dense class="selector-field"
            :style="{ minWidth: '220px' }" label="Feria" :options="fairOptions" :model-value="fairStore.fairId"
            :loading="fairStore.loading" @update:model-value="onFair">
            <template #option="scope">
                <q-item v-bind="scope.itemProps">
                    <q-item-section>
                        <q-item-label>{{ scope.opt.name }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-badge :color="scope.opt.status === 'closed' ? 'grey-6' : 'positive'"
                            :label="scope.opt.status === 'closed' ? 'Cerrada' : 'Abierta'" />
                    </q-item-section>
                </q-item>
            </template>
            <template #append>
                <q-badge v-if="fairStore.fair" :color="fairStore.fair.status === 'closed' ? 'grey-6' : 'positive'"
                    :label="fairStore.fair.status === 'closed' ? 'Cerrada' : 'Abierta'" />
            </template>
        </q-select>
        <q-select v-if="!hideDay" dense outlined emit-value map-options options-dense class="selector-field"
            :style="{ minWidth: '190px' }" label="Día" :options="dayOptions" :model-value="fairStore.dayId"
            :disable="!fairStore.fairId" @update:model-value="onDay">
            <template #option="scope">
                <q-item v-bind="scope.itemProps">
                    <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-badge :color="scope.opt.status === 'closed' ? 'grey-6' : 'positive'"
                            :label="scope.opt.status === 'closed' ? 'Cerrado' : 'Abierto'" />
                    </q-item-section>
                </q-item>
            </template>
            <template #append>
                <q-badge v-if="fairStore.day" :color="fairStore.isDayClosed ? 'grey-6' : 'positive'"
                    :label="fairStore.isDayClosed ? 'Cerrado' : 'Abierto'" />
            </template>
        </q-select>
    </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useFairStore } from 'src/stores/fair-store'
import { formatDate, weekday } from 'src/assets/js/util/maia'

defineProps({
    hideDay: { type: Boolean, default: false },
})
const emit = defineEmits(['change'])

const fairStore = useFairStore()

// Reload parent pages when fair/day changes (including header quick-switch)
watch(
    () => [fairStore.fairId, fairStore.dayId],
    () => emit('change'),
)

const fairOptions = computed(() => {
    const sorted = [...fairStore.fairs].sort((a, b) => {
        if (a.status === b.status) return String(a.name).localeCompare(String(b.name), 'es')
        return a.status === 'open' ? -1 : 1
    })
    return sorted.map((f) => ({
        label: f.status === 'closed' ? `${f.name} (cerrada)` : f.name,
        name: f.name,
        value: f.id,
        status: f.status,
    }))
})

const dayOptions = computed(() => fairStore.days.map((d) => ({
    label: `${weekday(d.date)} ${formatDate(d.date)}`,
    value: d.id,
    status: d.status,
})))

const onFair = async (id) => {
    await fairStore.selectFair(id)
}

const onDay = (id) => {
    fairStore.selectDay(id)
}

onMounted(async () => {
    await fairStore.loadFairs()
    emit('change')
})
</script>

<style scoped>
.fair-day-selector {
    gap: 8px;
}

.selector-field :deep(.q-field__control) {
    border-radius: 10px;
}
</style>
