import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { Success } from 'src/assets/js/util/notify'
import { notifyApiError } from 'src/assets/js/util/maia'

/**
 * Paged table + create/update/delete against the "Prefix/GetPagedList|Create|Update|Delete" API convention.
 */
export function useCrudTable(prefix, { extraParams = () => ({}), rowsPerPage = 20 } = {}) {
    const $q = useQuasar()
    const items = ref([])
    const filter = ref('')
    const loading = ref(false)
    const saving = ref(false)
    const pagination = ref({ page: 1, rowsPerPage, rowsNumber: 0, sortBy: null, descending: false })

    const load = async (page = pagination.value.page, perPage = pagination.value.rowsPerPage) => {
        loading.value = true
        try {
            const params = { page, per_page: perPage, ...extraParams() }
            if (filter.value?.trim()) params.search = filter.value.trim()
            if (pagination.value.sortBy) {
                params.sort_by = pagination.value.sortBy
                params.sort_order = pagination.value.descending ? 'desc' : 'asc'
            }
            const { data } = await api.get(`${prefix}/GetPagedList`, { params })
            items.value = data.data || []
            pagination.value.page = data.meta?.current_page || 1
            pagination.value.rowsPerPage = data.meta?.per_page || perPage
            pagination.value.rowsNumber = data.meta?.total || 0
        } catch (error) {
            items.value = []
            notifyApiError(error)
        } finally {
            loading.value = false
        }
    }

    const onRequest = async ({ pagination: p }) => {
        pagination.value.sortBy = p.sortBy
        pagination.value.descending = p.descending
        await load(p.page, p.rowsPerPage)
    }

    const save = async (object) => {
        saving.value = true
        try {
            if (object.id) {
                await api.put(`${prefix}/Update/${object.id}`, object)
                Success('El elemento ha sido modificado correctamente')
            } else {
                await api.post(`${prefix}/Create`, object)
                Success('El elemento ha sido creado correctamente')
            }
            await load()
            return true
        } catch (error) {
            notifyApiError(error)
            return false
        } finally {
            saving.value = false
        }
    }

    const remove = (row, label) => {
        $q.dialog({
            title: 'Eliminar',
            message: `¿Desea eliminar ${label || 'este elemento'}?`,
            cancel: { label: 'Cancelar', flat: true },
            ok: { label: 'Eliminar', color: 'negative', unelevated: true },
            persistent: true,
        }).onOk(async () => {
            try {
                await api.delete(`${prefix}/Delete/${row.id}`)
                Success('El elemento ha sido eliminado correctamente')
                await load()
            } catch (error) {
                notifyApiError(error)
            }
        })
    }

    watch(filter, () => load(1))

    return { items, filter, loading, saving, pagination, load, onRequest, save, remove }
}
