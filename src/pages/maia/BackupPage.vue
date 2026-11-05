<template>
    <q-page class="maia-page">
        <PageHeader title="Respaldo de base de datos" section="Seguridad" />

        <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
                <q-card flat class="maia-card backup-card">
                    <q-card-section class="row items-start no-wrap q-gutter-md">
                        <q-avatar class="backup-icon backup-icon--save" icon="cloud_download" size="52px" />
                        <div class="col">
                            <div class="text-subtitle1 text-weight-bold">Salvar base de datos</div>
                            <div class="text-body2 text-grey-7 q-mt-xs">
                                Descarga un archivo <b>.sql</b> con todos los datos actuales: productos, ferias, ventas,
                                inventario, propinas, usuarios y roles. Guárdelo en un lugar seguro (memoria, nube, otra PC).
                            </div>
                        </div>
                    </q-card-section>
                    <q-card-section class="q-pt-none">
                        <ul class="backup-list text-caption text-grey-7">
                            <li>No incluye sesiones abiertas ni archivos temporales.</li>
                            <li>Se recomienda salvar al cerrar cada día de feria.</li>
                        </ul>
                    </q-card-section>
                    <q-card-actions class="q-px-md q-pb-md">
                        <q-btn unelevated no-caps color="primary" icon="download" label="Descargar respaldo"
                            :loading="downloading" :disable="restoring" @click="downloadBackup" />
                    </q-card-actions>
                </q-card>
            </div>

            <div class="col-12 col-md-6">
                <q-card flat class="maia-card backup-card backup-card--danger">
                    <q-card-section class="row items-start no-wrap q-gutter-md">
                        <q-avatar class="backup-icon backup-icon--restore" icon="settings_backup_restore" size="52px" />
                        <div class="col">
                            <div class="text-subtitle1 text-weight-bold">Restaurar base de datos</div>
                            <div class="text-body2 text-grey-7 q-mt-xs">
                                Reemplaza <b>todos</b> los datos actuales por los de un respaldo <b>.sql</b> descargado antes.
                                Lo registrado después de ese respaldo se perderá.
                            </div>
                        </div>
                    </q-card-section>
                    <q-card-section class="q-pt-none">
                        <q-file v-model="restoreFile" outlined dense accept=".sql" label="Seleccionar archivo .sql" clearable
                            max-file-size="52428800" :disable="downloading || restoring" @rejected="onRejected">
                            <template #prepend><q-icon name="upload_file" /></template>
                        </q-file>
                    </q-card-section>
                    <q-card-actions class="q-px-md q-pb-md">
                        <q-btn unelevated no-caps color="negative" icon="restore" label="Restaurar base de datos"
                            :loading="restoring" :disable="downloading || !restoreFile" @click="confirmDialog = true" />
                    </q-card-actions>
                </q-card>
            </div>
        </div>

        <q-dialog v-model="confirmDialog" persistent>
            <q-card class="maia-dialog-card" style="width: 460px; max-width: 95vw">
                <q-card-section class="text-h6">Restaurar base de datos</q-card-section>
                <q-card-section class="q-pt-none">
                    <div class="row no-wrap items-start q-gutter-sm">
                        <q-icon name="warning_amber" color="negative" size="28px" />
                        <div class="col">
                            Se reemplazarán todos los datos actuales por los del archivo
                            <b>{{ restoreFile?.name }}</b>. Esta acción no se puede deshacer.
                            <div class="text-caption text-grey-7 q-mt-sm">
                                Sugerencia: descargue primero un respaldo de los datos actuales.
                            </div>
                        </div>
                    </div>
                    <q-input class="q-mt-md" dense outlined v-model="confirmText" label='Escriba "RESTAURAR" para confirmar'
                        :disable="restoring" />
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat no-caps label="Cancelar" :disable="restoring" @click="closeConfirm" />
                    <q-btn unelevated no-caps color="negative" icon="restore" label="Restaurar" :loading="restoring"
                        :disable="confirmText.trim().toUpperCase() !== 'RESTAURAR'" @click="restoreBackup" />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <q-inner-loading :showing="restoring" color="primary" label="Restaurando base de datos..." />
    </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { api } from 'src/boot/axios'
import PageHeader from 'src/components/maia/PageHeader.vue'
import { useAuthStore } from 'src/stores/auth-store'
import { useFairStore } from 'src/stores/fair-store'
import { Success, Error as NotifyError } from 'src/assets/js/util/notify'
import { apiErrorMessage } from 'src/assets/js/util/maia'

const authStore = useAuthStore()
const fairStore = useFairStore()

const downloading = ref(false)
const restoring = ref(false)
const restoreFile = ref(null)
const confirmDialog = ref(false)
const confirmText = ref('')

const sqlFilename = (disposition) => {
    const fallback = `backup_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.sql`
    if (!disposition) return fallback
    const utf8Match = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
    const plainMatch = disposition.match(/filename\s*=\s*("?)([^";]+)\1/i)
    let name = utf8Match?.[1] || plainMatch?.[2] || ''
    try {
        name = decodeURIComponent(name.trim())
    } catch {
        name = name.trim()
    }
    name = name.replace(/^["']|["']$/g, '')
    if (!name.toLowerCase().endsWith('.sql')) name = `${name || 'backup'}.sql`
    return name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_') || fallback
}

const blobErrorMessage = async (error) => {
    if (error?.response?.data instanceof Blob) {
        try {
            const payload = JSON.parse(await error.response.data.text())
            return [payload.message, payload.error].filter(Boolean).join(' ')
        } catch {
            // fall through to the generic message
        }
    }
    return apiErrorMessage(error)
}

const downloadBackup = async () => {
    downloading.value = true
    try {
        const response = await api.get('backup/database', { responseType: 'blob', timeout: 300000 })
        if ((response.headers['content-type'] || '').includes('application/json')) {
            const payload = JSON.parse(await response.data.text())
            throw new Error(payload.message || 'No se pudo generar el respaldo.')
        }
        const url = URL.createObjectURL(new Blob([response.data], { type: 'application/sql' }))
        const link = document.createElement('a')
        link.href = url
        link.download = sqlFilename(response.headers['content-disposition'])
        document.body.appendChild(link)
        link.click()
        setTimeout(() => {
            link.remove()
            URL.revokeObjectURL(url)
        }, 100)
        Success('Respaldo descargado correctamente.')
    } catch (error) {
        NotifyError(error?.response ? await blobErrorMessage(error) : error.message || 'Error al descargar el respaldo.')
    } finally {
        downloading.value = false
    }
}

const onRejected = () => NotifyError('El archivo debe ser .sql y no superar 50 MB.')

const closeConfirm = () => {
    confirmDialog.value = false
    confirmText.value = ''
}

const restoreBackup = async () => {
    const file = Array.isArray(restoreFile.value) ? restoreFile.value[0] : restoreFile.value
    if (!file) return

    restoring.value = true
    try {
        const form = new FormData()
        form.append('file', file)
        const { data } = await api.post('backup/restore', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 300000,
        })

        if (data?.token) {
            authStore.token = data.token
            localStorage.setItem('token', data.token)
            api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
        }

        restoreFile.value = null
        closeConfirm()
        Success(data?.message || 'Base de datos restaurada correctamente.')
        await fairStore.loadFairs(true)
    } catch (error) {
        let message = [error?.response?.data?.message, error?.response?.data?.error].filter(Boolean).join(' ') || apiErrorMessage(error)
        if (error?.response?.status === 401) message = 'La sesión se invalidó durante la restauración. Inicie sesión de nuevo.'
        if (error?.code === 'ECONNABORTED') message = 'La restauración tardó demasiado. Verifique el archivo e intente de nuevo.'
        NotifyError(message)
    } finally {
        restoring.value = false
    }
}
</script>

<style scoped lang="scss">
.backup-card {
    height: 100%;
    display: flex;
    flex-direction: column;

    .q-card__actions {
        margin-top: auto;
    }
}

.backup-card--danger {
    border-top: 3px solid rgba(179, 38, 30, 0.55);
}

.backup-icon {
    color: #fff;
    flex-shrink: 0;

    &--save {
        background: linear-gradient(135deg, var(--maia-wine-light) 0%, var(--maia-wine) 55%, var(--maia-wine-deep) 100%);
        box-shadow: 0 6px 16px rgba(var(--maia-wine-rgb), 0.25), 0 0 0 2px rgba(var(--maia-gold-light-rgb), 0.55);
    }

    &--restore {
        background: linear-gradient(135deg, var(--maia-gold-light) 0%, var(--maia-gold) 100%);
        box-shadow: 0 6px 16px rgba(var(--maia-gold-rgb), 0.25);
    }
}

.backup-list {
    margin: 0;
    padding-left: 18px;
    line-height: 1.6;
}
</style>
