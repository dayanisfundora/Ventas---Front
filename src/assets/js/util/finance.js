import { Dialog } from 'quasar'

export const CURRENCIES = ['CUP', 'USD', 'EUR', 'MXN']

export const SOURCES = {
    manual: { label: 'Manual', icon: 'edit_note' },
    transfer: { label: 'Traspaso', icon: 'swap_horiz' },
    fair: { label: 'Feria', icon: 'storefront' },
    payment: { label: 'Pago', icon: 'event_available' },
}

export const FUND_ROLES = {
    investment: { label: 'Inversión', icon: 'inventory_2', hint: 'Recibe la inversión recuperada al repartir una feria.' },
    depreciation: { label: 'Depreciación', icon: 'two_wheeler', hint: 'Recibe el presupuesto de depreciación de cada feria.' },
    marketing: { label: 'Marketing', icon: 'campaign', hint: 'Recibe el presupuesto de marketing de cada feria.' },
    profit: { label: 'Utilidad', icon: 'savings', hint: 'Recibe un porcentaje de la utilidad de cada feria.' },
    none: { label: 'Sin reparto', icon: 'account_balance_wallet', hint: 'Solo movimientos manuales y traspasos.' },
}

export const today = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Runs a request; when the API answers that the fund lacks money (`insufficient`), asks to confirm
 * and retries with `allow_negative`. `send(allowNegative)` must return the axios promise.
 */
export const withFundsCheck = async (send) => {
    try {
        return await send(false)
    } catch (error) {
        if (error?.response?.status !== 422 || !error.response.data?.insufficient) throw error
        const confirmed = await new Promise((resolve) => {
            Dialog.create({
                title: 'Saldo insuficiente',
                message: `${error.response.data.message} ¿Registrarlo de todas formas? El bolsillo quedará en negativo.`,
                cancel: { label: 'Cancelar', flat: true },
                ok: { label: 'Registrar igual', unelevated: true, color: 'negative' },
            }).onOk(() => resolve(true)).onCancel(() => resolve(false)).onDismiss(() => resolve(false))
        })
        if (!confirmed) return null
        return send(true)
    }
}
