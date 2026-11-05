<template>
    <span class="brand-name"><template v-if="parts.lead">{{ parts.lead }} </template><em v-if="parts.last">{{ parts.last }}</em></span>
</template>

<script setup>
import { computed } from 'vue'
import { useBrandStore } from 'src/stores/brand-store'

const props = defineProps({
    name: { type: String, default: null },
})

const brandStore = useBrandStore()

/** The last word is highlighted, as in the original "Maia <em>Arte</em>" wordmark. */
const parts = computed(() => {
    const words = String(props.name ?? brandStore.name ?? '').trim().split(/\s+/).filter(Boolean)
    if (words.length < 2) return { lead: words[0] || '', last: '' }
    return { lead: words.slice(0, -1).join(' '), last: words[words.length - 1] }
})
</script>
