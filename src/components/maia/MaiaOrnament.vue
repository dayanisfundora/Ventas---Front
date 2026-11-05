<template>
    <svg class="maia-ornament" :style="{ width: `${width}px`, color }" viewBox="0 0 240 20" aria-hidden="true">
        <line x1="6" y1="10" x2="96" y2="10" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.55" />
        <line x1="144" y1="10" x2="234" y2="10" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.55" />
        <path d="M96 10 C 102 3, 108 3, 112 10" fill="none" stroke="currentColor" stroke-width="1.2" />
        <path d="M144 10 C 138 3, 132 3, 128 10" fill="none" stroke="currentColor" stroke-width="1.2" />
        <path d="M96 10 C 102 17, 108 17, 112 10" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.6" />
        <path d="M144 10 C 138 17, 132 17, 128 10" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.6" />
        <rect x="115" y="5" width="10" height="10" fill="currentColor" transform="rotate(45 120 10)" />
        <circle cx="6" cy="10" r="1.6" fill="currentColor" opacity="0.7" />
        <circle cx="234" cy="10" r="1.6" fill="currentColor" opacity="0.7" />
    </svg>
</template>

<script setup>
defineProps({
    width: { type: Number, default: 200 },
    color: { type: String, default: 'var(--maia-gold-light)' },
})
</script>

<style scoped>
.maia-ornament {
    display: block;
    height: auto;
}
</style>
