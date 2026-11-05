<template>
  <div class="rollup-wrapper">
    <div class="rollup-card">

      <!-- ─── TOP TEAL DIAGONAL SHAPE ─── -->
      <div class="shape-teal"></div>
      <div class="shape-teal-accent"></div>

      <!-- ─── ORANGE DIAGONAL SHAPE (left stripe) ─── -->
      <div class="shape-orange"></div>

      <!-- ─── VISUAL / ICON FRAME ─── -->
      <div class="banner-visual-zone">
        <div class="icon-diamond">
          <q-icon name="inventory_2" size="52px" color="white" />
        </div>
        <div class="visual-dots">
          <span v-for="n in 9" :key="n" class="dot" :class="`dot-${n}`"></span>
        </div>
      </div>

      <!-- ─── HEADLINE ─── -->
      <div class="banner-headline">
        <p class="headline-hello">BIENVENIDO</p>
        <h1 class="headline-main">
          SISTEMA<br />
          <span class="headline-accent">DE GESTIÓN</span>
        </h1>
        <p class="headline-tagline">Administración integral de almacén y ventas</p>
      </div>

      <!-- ─── DIVIDER ─── -->
      <div class="banner-divider">
        <span class="divider-dot"></span>
        <span class="divider-line"></span>
        <span class="divider-dot"></span>
      </div>

      <!-- ─── FEATURES LIST ─── -->
      <div class="banner-features">
        <div class="feature-item" v-for="(feat, i) in features" :key="i">
          <div class="feature-bullet" :style="{ background: feat.color }">
            <q-icon :name="feat.icon" size="16px" color="white" />
          </div>
          <div class="feature-text">
            <p class="feat-title">{{ feat.title }}</p>
            <p class="feat-desc">{{ feat.desc }}</p>
          </div>
        </div>
      </div>

      <!-- ─── BOTTOM CTA BAR ─── -->
      <div class="banner-cta">
        <div class="cta-left">
          <q-icon name="support_agent" size="18px" color="white" class="q-mr-xs" />
          <span>Sistema activo</span>
        </div>
        <div class="cta-right" v-if="userName">
          <q-icon name="person" size="14px" color="white" class="q-mr-xs" />
          <span>{{ userName }}</span>
        </div>
      </div>

      <!-- bottom stand base decoration -->
      <div class="rollup-base"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from 'src/stores/auth-store'

const authStore = useAuthStore()

/** Logged-in user display name */
const userName = computed(() => authStore.user?.name || '')

/** Feature bullets derived from system modules */
const features = [
  {
    icon: 'point_of_sale',
    title: 'Punto de venta',
    desc: 'Ventas, inventario y cierre del día',
    color: 'linear-gradient(135deg, #7a1f2b, #8e2a36)'
  },
  {
    icon: 'account_balance_wallet',
    title: 'Finanzas',
    desc: 'Flujo de caja, bolsillos y pagos',
    color: 'linear-gradient(135deg, #b8893b, #d4af6a)'
  },
  {
    icon: 'group',
    title: 'Gestión de Usuarios',
    desc: 'Usuarios, roles y permisos',
    color: 'linear-gradient(135deg, #3b1a20, #4a111b)'
  },
  {
    icon: 'track_changes',
    title: 'Trazas del Sistema',
    desc: 'Historial y auditoría de acciones',
    color: 'linear-gradient(135deg, #2a1418, #241a1c)'
  }
]
</script>

<style scoped>
/* ── OUTER WRAPPER ── */
.rollup-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 16px 56px;
  min-height: 100%;
}

/* ── CARD BODY ── */
.rollup-card {
  position: relative;
  width: 360px;
  min-height: 680px;
  background: #ffffff;
  border-radius: 18px 18px 8px 8px;
  box-shadow:
    0 32px 80px rgba(13, 148, 136, 0.18),
    0 8px 28px rgba(0, 0, 0, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.8);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

/* ── TEAL DIAGONAL SHAPE (top right) ── */
.shape-teal {
  position: absolute;
  top: -30px;
  right: -40px;
  width: 220px;
  height: 280px;
  background: linear-gradient(140deg, #0d9488 0%, #06b6d4 100%);
  border-radius: 50% 0 60% 30%;
  transform: rotate(-12deg);
  opacity: 0.96;
  z-index: 0;
}

.shape-teal-accent {
  position: absolute;
  top: 60px;
  right: -20px;
  width: 100px;
  height: 160px;
  background: linear-gradient(140deg, #0f766e 0%, #0891b2 100%);
  border-radius: 50% 20% 60% 30%;
  transform: rotate(-20deg);
  opacity: 0.45;
  z-index: 0;
}

/* ── ORANGE DIAGONAL STRIPE (left) ── */
.shape-orange {
  position: absolute;
  top: 120px;
  left: -30px;
  width: 90px;
  height: 320px;
  background: linear-gradient(160deg, #f59e0b 0%, #f97316 55%, #ef4444 100%);
  border-radius: 0 50% 50% 0;
  transform: rotate(-8deg);
  opacity: 0.90;
  z-index: 0;
}

/* ── VISUAL ZONE ── */
.banner-visual-zone {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 28px;
  padding-bottom: 6px;
  min-height: 130px;
}

.icon-diamond {
  width: 96px;
  height: 96px;
  border-radius: 28px;
  background: linear-gradient(135deg, #0d9488 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 12px 36px rgba(13, 148, 136, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transform: rotate(6deg);
  border: 3px solid rgba(255, 255, 255, 0.65);
}

/* decorative dots grid */
.visual-dots {
  position: absolute;
  top: 16px;
  left: 20px;
  display: grid;
  grid-template-columns: repeat(3, 10px);
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
}
.dot-1,
.dot-4,
.dot-7 {
  background: rgba(245, 158, 11, 0.7);
}

/* ── HEADLINE ── */
.banner-headline {
  position: relative;
  z-index: 2;
  padding: 14px 28px 0 90px;
}

.headline-hello {
  margin: 0 0 2px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
  color: #0d9488;
  text-transform: uppercase;
}

.headline-main {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 900;
  line-height: 1.05;
  color: #0f172a;
  font-style: italic;
}

.headline-accent {
  color: #f59e0b;
  background: linear-gradient(90deg, #f59e0b, #f97316);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.headline-tagline {
  margin: 0;
  font-size: 11.5px;
  color: #64748b;
  line-height: 1.5;
  max-width: 200px;
}

/* ── DIVIDER ── */
.banner-divider {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 28px 14px;
}

.divider-line {
  flex: 1;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, #0d9488, #06b6d4, #f59e0b);
}

.divider-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0d9488;
}

/* ── FEATURES ── */
.banner-features {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 24px 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e8f4f8;
  transition: all 0.22s ease;
}

.feature-item:hover {
  background: #f0fdfc;
  border-color: #99f6e4;
  transform: translateX(4px);
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.12);
}

.feature-bullet {
  width: 38px;
  height: 38px;
  min-width: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
}

.feat-title {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.feat-desc {
  margin: 0;
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
}

/* ── BOTTOM CTA ── */
.banner-cta {
  position: relative;
  z-index: 2;
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: linear-gradient(135deg, #0d9488 0%, #2563eb 60%, #4338ca 100%);
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
}

.cta-left,
.cta-right {
  display: flex;
  align-items: center;
}

/* ── ROLLUP BASE STAND ── */
.rollup-base {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 22px;
  background: linear-gradient(180deg, #64748b 0%, #94a3b8 100%);
  border-radius: 0 0 12px 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
  z-index: 3;
}
</style>
