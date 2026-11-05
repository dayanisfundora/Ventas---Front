import { api } from 'src/boot/axios'
import { Error as NotifyError } from './notify'

export const OWNER_OPTIONS = [
    { label: 'Propio', value: 'own' },
    { label: 'Consignación', value: 'consignment' },
]

export const ownerLabel = (value) => OWNER_OPTIONS.find((o) => o.value === value)?.label ?? value

export const ACCOUNT_LABELS = {
    maia_cup: 'Maia CUP',
    fiscal: 'Fiscal',
    fcbc: 'FCBC',
    mlc: 'MLC',
}

export const MOVEMENT_TYPES = {
    initial: 'Inventario inicial',
    entry: 'Entrada',
    exit: 'Salida',
    sale: 'Venta',
    adjustment: 'Ajuste por conteo',
}

const numberFormat = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const intFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 })

export const money = (value) => numberFormat.format(Number(value || 0))
export const int = (value) => intFormat.format(Number(value || 0))

export const formatDate = (value) => {
    if (!value) return ''
    const [y, m, d] = String(value).substring(0, 10).split('-')
    return `${d}/${m}/${y}`
}

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const weekday = (value) => {
    if (!value) return ''
    const [y, m, d] = String(value).substring(0, 10).split('-').map(Number)
    return WEEKDAYS[new Date(y, m - 1, d).getDay()]
}

/**
 * Human readable message from a Laravel error response (validation, abort or exception).
 */
const HTTP_MESSAGES = {
    400: 'Solicitud no válida.',
    401: 'Su sesión expiró. Inicie sesión nuevamente.',
    403: 'No tiene permiso para realizar esta acción.',
    404: 'El recurso solicitado no existe.',
    405: 'Método no permitido para esta ruta.',
    413: 'El archivo o los datos enviados son demasiado grandes.',
    419: 'La página expiró. Recargue e intente de nuevo.',
    422: 'Los datos enviados no son válidos.',
    429: 'Demasiadas solicitudes. Espere un momento e intente de nuevo.',
    500: 'Error del servidor. Intente de nuevo más tarde.',
    503: 'El servicio no está disponible en este momento.',
}

export const apiErrorMessage = (error) => {
    if (!error?.response) {
        if (error?.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder. Intente de nuevo.'
        if (error?.code === 'ERR_CANCELED') return 'La solicitud fue cancelada.'
        if (error?.request) return 'No se pudo conectar con el servidor. Verifique su conexión o que el servidor esté encendido.'
        return 'Ocurrió un error inesperado.'
    }
    const data = error.response.data
    if (data?.errors) {
        return Object.values(data.errors).flat().join(' ')
    }
    return data?.error || data?.message || data?.mensajeError || HTTP_MESSAGES[error.response.status] || 'Ocurrió un error inesperado.'
}

export const notifyApiError = (error) => NotifyError(apiErrorMessage(error))

/**
 * Downloads a file (Excel/PDF) from an API endpoint using the auth token.
 */
export const downloadFile = async (endpoint, params = {}, fallbackName = 'reporte') => {
    try {
        const response = await api.get(endpoint, { params, responseType: 'blob' })
        const disposition = response.headers['content-disposition'] || ''
        const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
        const name = match ? decodeURIComponent(match[1]) : fallbackName
        const url = URL.createObjectURL(response.data)
        const link = document.createElement('a')
        link.href = url
        link.download = name
        document.body.appendChild(link)
        link.click()
        link.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
        if (error?.response?.data instanceof Blob) {
            try {
                const text = await error.response.data.text()
                error.response.data = JSON.parse(text)
            } catch (e) {
                // keep original error
            }
        }
        notifyApiError(error)
    }
}
