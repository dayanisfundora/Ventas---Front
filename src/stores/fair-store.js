import { defineStore } from 'pinia'
import { api } from 'boot/axios'

/**
 * Selected fair and working day, shared by POS, inventory, close, tips and reports.
 */
export const useFairStore = defineStore('fair', {
    state: () => ({
        fairs: [],
        fairId: Number(localStorage.getItem('maia_fair_id')) || null,
        dayId: Number(localStorage.getItem('maia_day_id')) || null,
        loading: false,
    }),

    getters: {
        fair: (state) => state.fairs.find((f) => f.id === state.fairId) || null,
        days: (state) => state.fairs.find((f) => f.id === state.fairId)?.days || [],
        day(state) {
            return this.days.find((d) => d.id === state.dayId) || null
        },
        isDayClosed() {
            return this.day?.status === 'closed' || this.fair?.status === 'closed'
        },
    },

    actions: {
        async loadFairs(force = false) {
            if (this.fairs.length && !force) return
            this.loading = true
            try {
                const { data } = await api.get('Fair/All')
                this.fairs = data.data || []
                if (!this.fairs.some((f) => f.id === this.fairId)) {
                    const open = this.fairs.find((f) => f.status === 'open') || this.fairs[0]
                    this.fairId = open?.id || null
                    this.dayId = null
                }
                if (this.fairId && !this.days.some((d) => d.id === this.dayId)) {
                    await this.pickCurrentDay()
                }
                this.persist()
            } finally {
                this.loading = false
            }
        },

        async selectFair(id) {
            this.fairId = id
            this.dayId = null
            await this.pickCurrentDay()
            this.persist()
        },

        selectDay(id) {
            this.dayId = id
            this.persist()
        },

        async pickCurrentDay() {
            if (!this.fairId) return
            try {
                const { data } = await api.get(`Fair/${this.fairId}/CurrentDay`)
                this.dayId = data.data?.id || null
            } catch (e) {
                this.dayId = this.days[0]?.id || null
            }
        },

        setDayStatus(id, status) {
            const day = this.days.find((d) => d.id === id)
            if (day) day.status = status
        },

        persist() {
            localStorage.setItem('maia_fair_id', this.fairId || '')
            localStorage.setItem('maia_day_id', this.dayId || '')
        },
    },
})
