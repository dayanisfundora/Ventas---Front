<template>
    <q-icon name="info" size="16px" class="info-hint q-ml-xs">
        <q-tooltip max-width="280px" class="text-body2">
            <slot>{{ text }}</slot>
        </q-tooltip>
    </q-icon>
</template>

<script setup>
defineProps({
    text: { type: String, default: '' },
})
</script>

<style scoped>
.info-hint {
    color: var(--app-text-muted, #9e9e9e);
    cursor: help;
    vertical-align: middle;
}

.info-hint:hover {
    color: var(--maia-gold);
}
</style>
