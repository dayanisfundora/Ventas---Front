<template>
  <div
    class="menu-card cursor-pointer"
    :class="{ 'menu-card-hover': hover }"
    :style="card_style"
    @click="router.push(props.link)"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <div class="card-top">
      <q-icon :name="props.icon" size="2.25rem" color="primary" class="card-icon" />
      <h3 class="card-title">{{ props.title }}</h3>
    </div>

    <div class="wave-wrap" aria-hidden="true">
      <svg viewBox="0 0 300 50" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d="M-2,0 L302,0 L302,26 C240,6 180,46 120,26 C60,6 30,46 0,26 L-2,26 Z" />
      </svg>
    </div>

    <div class="card-bottom-content">
      <span class="card-sub">Ver detalles</span>
      <div class="arrow-btn">
        <q-icon name="arrow_forward" size="1rem" color="white" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const hover = ref(false)
const $q = useQuasar()

const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, required: true },
  link: { type: String, required: true },
  color: { type: String, default: 'var(--q-primary)' }
})

function resolve_to_rgb(input_color) {
  try {
    if (typeof window === 'undefined' || !document?.body) {
      return input_color
    }

    const probe = document.createElement('div')
    probe.style.color = input_color
    probe.style.display = 'none'
    document.body.appendChild(probe)

    const computed_color = getComputedStyle(probe).color
    document.body.removeChild(probe)

    const match = computed_color.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (match) {
      return `rgb(${match[1]}, ${match[2]}, ${match[3]})`
    }

    return input_color
  } catch {
    return input_color
  }
}

const card_style = computed(() => {
  const bottom_rgb = resolve_to_rgb(props.color)
  const top_bg = $q.dark.isActive ? '#2a2a2d' : '#ffffff'
  const top_text = $q.dark.isActive ? '#e8e8e8' : '#1a1a1a'

  return {
    '--card-top-bg': top_bg,
    '--card-top-text': top_text,
    '--card-bottom-bg': bottom_rgb,
    background: bottom_rgb
  }
})
</script>

<style scoped>
.menu-card {
  --card-top-bg: #ffffff;
  --card-top-text: #1a1a1a;
  --card-bottom-bg: var(--q-primary);
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto auto;
  height: var(--app-card-height, 176px);
  border-radius: 24px;
  overflow: hidden;
  isolation: isolate;
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}

.menu-card-hover {
  transform: translate3d(0, -6px, 0);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
}

:global(body.body--dark) .menu-card {
  box-shadow: none;
}

:global(body.body--dark) .menu-card-hover {
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
}

.card-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 14px 10px;
  background: var(--card-top-bg);
  z-index: 1;
}

.card-icon {
  flex-shrink: 0;
  line-height: 1;
  transition: transform 0.3s ease;
}

.menu-card-hover .card-icon {
  transform: scale(1.08);
}

.card-title {
  margin: 0;
  flex-shrink: 0;
  font-size: clamp(0.78rem, 1.4vw, 0.92rem);
  font-weight: 700;
  color: var(--card-top-text);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.25;
  word-break: break-word;
  white-space: normal;
  max-height: 3.75em;
  overflow: hidden;
}

/* Ola sobre fondo rojo único de la card; path extendido evita bleed lateral */
.wave-wrap {
  line-height: 0;
  height: 40px;
  margin-top: -1px;
  color: var(--card-top-bg);
  z-index: 2;
}

.wave-wrap svg {
  width: calc(100% + 4px);
  margin-left: -2px;
  height: 100%;
  display: block;
}

.card-bottom-content {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 18px 16px;
  background: transparent;
}

.card-sub {
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 0.4px;
}

.arrow-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.25s ease;
}

.menu-card-hover .arrow-btn {
  background: rgba(255, 255, 255, 0.4);
}
</style>
