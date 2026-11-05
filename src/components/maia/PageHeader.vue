<template>
    <div class="maia-page-header" :class="{ 'maia-page-header--compact': compact }">
        <q-breadcrumbs v-if="!compact" class="q-pb-xs maia-breadcrumbs" separator-color="grey-6">
            <q-breadcrumbs-el label="Inicio" to="/Inicio" />
            <q-breadcrumbs-el v-if="section" :label="section" />
            <q-breadcrumbs-el :label="title" />
            <template #separator>
                <q-icon name="chevron_right" size="15px" />
            </template>
        </q-breadcrumbs>
        <div class="row items-center justify-between q-col-gutter-sm">
            <div class="col-12 col-md-auto">
                <div v-if="!compact" class="maia-kicker">{{ section || brandStore.name }}</div>
                <div class="maia-title" :class="{ 'maia-title--compact': compact }">{{ title }}</div>
                <MaiaOrnament v-if="!compact" :width="120" class="maia-title-ornament" />
            </div>
            <div class="col-12 col-md-auto row items-center q-gutter-sm justify-end">
                <slot />
            </div>
        </div>
    </div>
</template>

<script setup>
import MaiaOrnament from './MaiaOrnament.vue'
import { useBrandStore } from 'src/stores/brand-store'

const brandStore = useBrandStore()

defineProps({
    title: { type: String, required: true },
    section: { type: String, default: '' },
    compact: { type: Boolean, default: false },
})
</script>

<style scoped>
.maia-breadcrumbs {
    font-size: 0.78rem;
    color: var(--app-text-muted);
}

.maia-breadcrumbs :deep(a) {
    color: var(--app-text-muted);
    text-decoration: none;
}

.maia-breadcrumbs :deep(a:hover) {
    color: var(--q-primary);
}

.maia-title-ornament {
    margin-left: -4px;
}

.maia-page-header--compact {
    margin-bottom: 8px;
}

.maia-title--compact {
    font-size: 1.25rem;
    line-height: 1.15;
}
</style>
