<template>
  <q-dialog v-model="dialog" persistent>
    <q-card class="loading-card" flat>
      <q-card-section class="text-center q-pa-xl">
        <div class="loading-spinner-container q-mb-lg">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
        </div>

        <div class="loading-text q-mb-md">
          <h6 class="loading-title q-ma-none">
            Cargando...
          </h6>
          <p class="loading-caption q-ma-none q-mt-xs">
            Por favor espere un momento
          </p>
        </div>

        <div class="progress-container">
          <q-linear-progress
            color="primary"
            indeterminate
            rounded
            size="4px"
            class="modern-progress"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'

defineOptions({
  name: 'DialogLoad'
})

const props = defineProps({
  dialogLoad: Boolean
})

const dialog = computed(() => props.dialogLoad)
</script>

<style scoped>
.loading-card {
  min-width: 320px;
  max-width: 400px;
  border-radius: 16px;
  border-top: 3px solid var(--maia-gold);
  box-shadow: 0 10px 30px rgba(var(--maia-ink-rgb), 0.18);
  backdrop-filter: blur(10px);
  background: var(--app-card-bg);
  color: var(--app-text);
  animation: scaleIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.loading-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--table-head-text, var(--maia-wine));
}

.loading-caption {
  font-size: 0.875rem;
  color: var(--app-text-muted);
}

.loading-spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80px;
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: var(--maia-wine);
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  border-right-color: var(--maia-gold);
  animation-delay: -0.5s;
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
}

.spinner-ring:nth-child(3) {
  border-bottom-color: var(--maia-gold-light);
  animation-delay: -1s;
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  animation: fadeInUp 0.6s ease-out;
}

.progress-container {
  width: 100%;
  animation: fadeInUp 0.8s ease-out;
}

.modern-progress {
  border-radius: 2px;
  overflow: hidden;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
