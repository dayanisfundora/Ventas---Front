<template>
    <q-page class="maia-page">
        <PageHeader title="Propinas y salarios" section="Feria del día">
            <FairDaySelector @change="reload" />
        </PageHeader>

        <q-tabs v-model="tab" dense align="left" active-color="primary" indicator-color="primary" class="q-mb-md" no-caps>
            <q-tab name="day" icon="today" label="Día seleccionado" />
            <q-tab name="fair" icon="summarize" label="Resumen de la feria" />
        </q-tabs>

        <q-tab-panels v-model="tab" animated class="bg-transparent">
            <q-tab-panel name="day" class="q-pa-none">
                <div class="row q-col-gutter-md">
                    <!-- Tips of the day -->
                    <div class="col-12 col-md-7">
                        <q-card flat class="maia-card">
                            <q-card-section class="row items-center q-pb-none">
                                <div class="text-subtitle1 text-weight-bold">Propinas del día</div>
                                <q-space />
                                <b>{{ money(tipsTotal) }} CUP</b>
                            </q-card-section>
                            <q-card-section v-if="canEdit" class="row q-col-gutter-sm items-center">
                                <q-select class="col-12 col-sm-4" dense outlined emit-value map-options options-dense label="Trabajador"
                                    :options="workerOptions" v-model="tipForm.worker_id" />
                                <q-select class="col-6 col-sm-3" dense outlined emit-value map-options options-dense label="Forma"
                                    :options="methodOptions" v-model="tipForm.payment_method_id" />
                                <q-input class="col-6 col-sm-3" dense outlined type="number" min="0" step="0.01" label="Importe"
                                    :suffix="methodCurrency(tipForm.payment_method_id)" v-model.number="tipForm.amount" @keyup.enter="addTip" />
                                <div class="col-12 col-sm-2">
                                    <q-btn unelevated no-caps color="primary" icon="add" label="Añadir" class="full-width" :loading="savingTip"
                                        :disable="!tipForm.worker_id || !(tipForm.amount > 0)" @click="addTip" />
                                </div>
                            </q-card-section>
                            <q-table flat dense class="maia-table" :rows="tips" :columns="tipColumns" row-key="id" :loading="tipsLoading"
                                :pagination="{ rowsPerPage: 20 }" no-data-label="Sin propinas" rows-per-page-label="Filas por página">
                                <template #body-cell-action="props">
                                    <q-td :props="props">
                                        <q-btn v-if="canEdit" flat round dense color="negative" icon="delete" @click="removeTip(props.row)" />
                                    </q-td>
                                </template>
                            </q-table>
                        </q-card>
                    </div>

                    <!-- Attendance -->
                    <div class="col-12 col-md-5">
                        <q-card flat class="maia-card">
                            <q-card-section class="row items-center q-pb-none">
                                <div class="text-subtitle1 text-weight-bold">Asistencia y salario</div>
                                <q-space />
                                <q-btn v-if="canEdit" unelevated dense no-caps color="primary" icon="save" label="Guardar"
                                    :loading="savingAttendance" @click="saveAttendance" />
                            </q-card-section>
                            <q-list separator>
                                <q-item v-for="a in attendance" :key="a.worker_id">
                                    <q-item-section side>
                                        <q-checkbox v-model="a.present" :disable="!canEdit" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>{{ a.name }}</q-item-label>
                                        <q-item-label caption>Salario base {{ money(a.daily_salary) }}</q-item-label>
                                    </q-item-section>
                                    <q-item-section side style="width: 130px">
                                        <q-input dense outlined type="number" min="0" step="0.01" input-class="text-right" suffix="CUP"
                                            :disable="!canEdit || !a.present" v-model.number="a.salary" />
                                    </q-item-section>
                                </q-item>
                                <q-item v-if="!attendance.length" class="text-grey">No hay trabajadores</q-item>
                            </q-list>
                        </q-card>
                    </div>
                </div>
            </q-tab-panel>

            <q-tab-panel name="fair" class="q-pa-none">
                <div class="row items-center q-mb-sm q-gutter-sm">
                    <div class="text-subtitle1 text-weight-bold">{{ fairStore.fair?.name }}</div>
                    <q-space />
                    <q-btn v-if="can('reportes.ver')" flat dense no-caps color="primary" icon="table_view" label="Excel"
                        @click="downloadFile(`Report/Tips/${fairStore.fairId}/Excel`, {}, 'propinas.xlsx')" />
                    <q-btn v-if="can('reportes.ver')" flat dense no-caps color="primary" icon="picture_as_pdf" label="PDF"
                        @click="downloadFile(`Report/Tips/${fairStore.fairId}/PDF`, {}, 'propinas.pdf')" />
                </div>
                <q-inner-loading :showing="reportLoading" color="primary" />

                <template v-if="report">
                    <q-card flat class="maia-card q-mb-md">
                        <q-card-section class="text-subtitle2 q-pb-none">Resumen por trabajador</q-card-section>
                        <q-table flat dense class="maia-table" :rows="summaryRows" :columns="summaryColumns" row-key="worker_id"
                            hide-pagination :pagination="{ rowsPerPage: 0 }" no-data-label="Sin datos">
                            <template #bottom-row>
                                <q-tr class="total-row">
                                    <q-td>TOTAL</q-td>
                                    <q-td class="text-right">{{ money(sumOf('tips')) }}</q-td>
                                    <q-td class="text-right">{{ money(sumOf('commission')) }}</q-td>
                                    <q-td class="text-right">{{ money(sumOf('subtotal')) }}</q-td>
                                    <q-td class="text-right">{{ sumOf('days_worked') }}</q-td>
                                    <q-td class="text-right">{{ money(sumOf('salary')) }}</q-td>
                                    <q-td class="text-right">{{ money(report.grand_total) }}</q-td>
                                </q-tr>
                            </template>
                        </q-table>
                    </q-card>

                    <div class="row q-col-gutter-md">
                        <div v-for="m in matrices" :key="m.key" class="col-12 col-lg-6">
                            <q-card flat class="maia-card">
                                <q-card-section class="text-subtitle2 q-pb-none">{{ m.title }}</q-card-section>
                                <q-markup-table flat dense class="maia-table" separator="cell">
                                    <thead>
                                        <tr>
                                            <th class="text-left">Día</th>
                                            <th v-for="w in report.workers" :key="w.id" class="text-right">{{ w.name }}</th>
                                            <th class="text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="r in report[m.key].rows" :key="r.fair_day_id">
                                            <td>{{ formatDate(r.date) }}</td>
                                            <td v-for="w in report.workers" :key="w.id" class="text-right">
                                                <template v-if="r.cells[w.id]?.count">
                                                    {{ money(r.cells[w.id].amount) }}
                                                    <span class="text-caption text-grey">({{ r.cells[w.id].count }})</span>
                                                </template>
                                            </td>
                                            <td class="text-right text-weight-bold">{{ r.amount ? money(r.amount) : '' }}</td>
                                        </tr>
                                        <tr class="total-row">
                                            <td>Total</td>
                                            <td v-for="w in report.workers" :key="w.id" class="text-right">
                                                {{ money(report[m.key].totals[w.id]?.amount) }}
                                            </td>
                                            <td class="text-right">{{ money(report[m.key].rows.reduce((s, r) => s + r.amount, 0)) }}</td>
                                        </tr>
                                    </tbody>
                                </q-markup-table>
                            </q-card>
                        </div>
                    </div>
                </template>
            </q-tab-panel>
        </q-tab-panels>
    </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import PageHeader from 'src/components/maia/PageHeader.vue'
import FairDaySelector from 'src/components/maia/FairDaySelector.vue'
import { useAuthStore } from 'src/stores/auth-store'
import { useFairStore } from 'src/stores/fair-store'
import { Success } from 'src/assets/js/util/notify'
import { money, formatDate, notifyApiError, downloadFile } from 'src/assets/js/util/maia'

const $q = useQuasar()
const authStore = useAuthStore()
const fairStore = useFairStore()
const can = (p) => authStore.hasPermission(p)
const canEdit = computed(() => can('propinas.editar') && !fairStore.isDayClosed)

const tab = ref('day')
const workers = ref([])
const methods = ref([])
const workerOptions = computed(() => workers.value.filter((w) => w.state).map((w) => ({ label: w.name, value: w.id })))
const methodOptions = computed(() => methods.value.map((m) => ({ label: m.name, value: m.id })))
const methodCurrency = (id) => methods.value.find((m) => m.id === id)?.currency || ''

/* ---------- Tips of the day ---------- */
const tips = ref([])
const tipsLoading = ref(false)
const savingTip = ref(false)
const tipForm = reactive({ worker_id: null, payment_method_id: null, amount: null })
const tipsTotal = computed(() => tips.value.reduce((s, t) => s + Number(t.amount_cup), 0))

const tipColumns = [
    { name: 'worker', label: 'Trabajador', field: (r) => r.worker?.name, align: 'left' },
    { name: 'method', label: 'Forma', field: (r) => r.payment_method?.name, align: 'left' },
    { name: 'amount', label: 'Importe', field: (r) => `${money(r.amount)} ${r.payment_method?.currency || ''}`, align: 'right' },
    { name: 'amount_cup', label: 'CUP', field: 'amount_cup', align: 'right', format: money },
    { name: 'sale', label: 'Venta', field: (r) => (r.sale ? `#${r.sale.number}` : 'Manual'), align: 'center' },
    { name: 'action', label: '', field: 'action', align: 'center' },
]

const loadTips = async () => {
    if (!fairStore.dayId) {
        tips.value = []
        return
    }
    tipsLoading.value = true
    try {
        const { data } = await api.get('Tip/', { params: { fair_day_id: fairStore.dayId } })
        tips.value = data.data || []
    } catch (error) {
        notifyApiError(error)
    } finally {
        tipsLoading.value = false
    }
}

const addTip = async () => {
    if (!tipForm.worker_id || !(tipForm.amount > 0)) return
    savingTip.value = true
    try {
        await api.post('Tip/Create', { fair_day_id: fairStore.dayId, ...tipForm })
        Success('Propina registrada')
        tipForm.amount = null
        await loadTips()
    } catch (error) {
        notifyApiError(error)
    } finally {
        savingTip.value = false
    }
}

const removeTip = (row) => {
    $q.dialog({
        title: 'Eliminar propina',
        message: `¿Eliminar la propina de ${row.worker?.name} (${money(row.amount_cup)} CUP)?`,
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Eliminar', unelevated: true, color: 'negative' },
    }).onOk(async () => {
        try {
            await api.delete(`Tip/Delete/${row.id}`)
            Success('Propina eliminada')
            await loadTips()
        } catch (error) {
            notifyApiError(error)
        }
    })
}

/* ---------- Attendance ---------- */
const attendance = ref([])
const savingAttendance = ref(false)

const loadAttendance = async () => {
    if (!fairStore.dayId) {
        attendance.value = []
        return
    }
    try {
        const { data } = await api.get(`FairDay/${fairStore.dayId}/Attendance`)
        attendance.value = data.data || []
    } catch (error) {
        notifyApiError(error)
    }
}

const saveAttendance = async () => {
    savingAttendance.value = true
    try {
        const { data } = await api.post(`FairDay/${fairStore.dayId}/Attendance`, {
            rows: attendance.value.map((a) => ({ worker_id: a.worker_id, present: !!a.present, salary: Number(a.salary) || 0 })),
        })
        attendance.value = data.data || []
        Success('Asistencia guardada')
    } catch (error) {
        notifyApiError(error)
    } finally {
        savingAttendance.value = false
    }
}

/* ---------- Fair report ---------- */
const report = ref(null)
const reportLoading = ref(false)
const matrices = [
    { key: 'tips', title: 'Propinas por día' },
    { key: 'commission', title: '% de venta por día' },
]
const summaryRows = computed(() => report.value?.summary || [])
const sumOf = (key) => summaryRows.value.reduce((s, r) => s + Number(r[key] || 0), 0)
const summaryColumns = [
    { name: 'name', label: 'Trabajador', field: 'name', align: 'left' },
    { name: 'tips', label: 'Propinas', field: 'tips', align: 'right', format: money },
    { name: 'commission', label: '% de venta', field: 'commission', align: 'right', format: money },
    { name: 'subtotal', label: 'Subtotal', field: 'subtotal', align: 'right', format: money },
    { name: 'days_worked', label: 'Días', field: 'days_worked', align: 'right' },
    { name: 'salary', label: 'Salario', field: 'salary', align: 'right', format: money },
    { name: 'total', label: 'Total a pagar', field: 'total', align: 'right', format: money, classes: 'text-weight-bold' },
]

const loadReport = async () => {
    if (!fairStore.fairId) {
        report.value = null
        return
    }
    reportLoading.value = true
    try {
        const { data } = await api.get(`Report/Tips/${fairStore.fairId}`)
        report.value = data.data
    } catch (error) {
        notifyApiError(error)
    } finally {
        reportLoading.value = false
    }
}

const reload = () => Promise.all([loadTips(), loadAttendance(), tab.value === 'fair' ? loadReport() : null])
watch(tab, (v) => v === 'fair' && loadReport())

onMounted(async () => {
    try {
        const [m, w] = await Promise.all([api.get('PaymentMethod', { params: { active: 1 } }), api.get('Worker/')])
        methods.value = m.data.data || []
        workers.value = Array.isArray(w.data) ? w.data : w.data.data || []
        tipForm.payment_method_id = methods.value.find((x) => x.kind === 'cash' && x.currency === 'CUP')?.id || methods.value[0]?.id
    } catch (error) {
        notifyApiError(error)
    }
})
</script>
