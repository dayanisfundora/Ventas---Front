// Mirrors Back/app/Services/InvestmentService.php (labels and split) for previews.

const round2 = (v) => Math.round(v * 100) / 100

export const INVESTMENT_BASES = {
    product_cost: 'Costo de lo vendido',
    sales_percent: '% de la venta',
    none: 'Sin inversión',
}

export const INVESTMENT_SPLITS = {
    transfers_first: 'Transferencias primero',
    proportional: 'Proporcional a lo cobrado',
    priority: 'Orden de prioridad',
    single: 'Una sola fuente',
    none: 'Sin desglose',
}

export const INVESTMENT_FOREIGN = {
    manual: 'Se escribe a mano en el cierre',
    proportional: 'Proporcional a lo cobrado',
    foreign_first: 'Moneda extranjera primero',
    sales_percent: '% de lo cobrado en esa moneda',
    none: 'Todo sale del CUP',
}

export const defaultInvestmentConfig = () => ({
    basis: 'product_cost',
    sales_percent: null,
    split: 'transfers_first',
    priority: [],
    source: null,
    foreign: 'manual',
    foreign_percent: null,
})

/**
 * CUP-equivalent of the investment given back in foreign currency (mirrors InvestmentService::foreignAmounts
 * for one combined foreign column). `foreignCup` is what was charged in foreign currency, in CUP.
 */
export const foreignInvestmentCup = (config, amount, gross, foreignCup) => {
    if (config.basis === 'none' || amount <= 0 || foreignCup <= 0) return 0
    if (config.foreign === 'proportional') return gross > 0 ? round2((amount * foreignCup) / gross) : 0
    if (config.foreign === 'sales_percent') return round2((foreignCup * Number(config.foreign_percent || 0)) / 100)
    if (config.foreign === 'foreign_first') return round2(Math.min(foreignCup, amount))
    return 0
}

export const normalizeInvestmentConfig = (config) => ({
    ...defaultInvestmentConfig(),
    ...(config || {}),
    priority: [...(config?.priority || [])],
})

export const investmentLabel = (config) => {
    const basis = config.basis === 'sales_percent'
        ? `${Number(config.sales_percent || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })}% de la venta`
        : INVESTMENT_BASES[config.basis]
    return config.basis === 'none' ? basis : `${basis} · ${INVESTMENT_SPLITS[config.split].toLowerCase()}`
}

/** Compact form for the close card, e.g. "proporcional a lo cobrado" or "10% de la venta". */
export const investmentShortLabel = (config) => {
    if (config.basis === 'none') return 'sin inversión'
    if (config.basis === 'sales_percent') {
        return `${Number(config.sales_percent || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })}% de la venta`
    }
    return INVESTMENT_SPLITS[config.split].toLowerCase()
}

const transfersFirst = (amount, sources) => {
    const transfers = sources.filter((s) => s.kind !== 'cash')
    const covered = transfers.reduce((sum, s) => sum + s.amount, 0)
    return [
        { key: 'cash', label: 'Efectivo', amount: round2(amount - covered) },
        ...transfers.map((s) => ({ key: s.key, label: s.label, amount: s.amount })),
    ]
}

const proportional = (amount, sources) => {
    const list = sources.filter((s) => s.amount > 0)
    const received = list.reduce((sum, s) => sum + s.amount, 0)
    if (received <= 0) return [{ key: 'cash', label: 'Efectivo', amount: round2(amount) }]
    let assigned = 0
    return list.map((s, i) => {
        const share = i === list.length - 1 ? round2(amount - assigned) : round2((amount * s.amount) / received)
        assigned += share
        return { key: s.key, label: s.label, amount: share }
    })
}

const byPriority = (amount, sources, priority) => {
    const listed = (priority || []).map((k) => sources.find((s) => s.key === k)).filter(Boolean)
    const ordered = [...listed, ...sources.filter((s) => !listed.includes(s))]
    const parts = []
    let left = round2(amount)
    for (const s of ordered) {
        if (left <= 0) break
        const take = round2(Math.min(left, Math.max(s.amount, 0)))
        if (take > 0) {
            parts.push({ key: s.key, label: s.label, amount: take })
            left = round2(left - take)
        }
    }
    if (left > 0) parts.push({ key: 'uncovered', label: 'Sin cubrir con lo cobrado', amount: left })
    return parts
}

/** @param sources [{ key, label, kind, amount }] in display order (cash first) */
export const splitInvestment = (config, amount, sources) => {
    if (config.basis === 'none' || config.split === 'none') return []
    let parts
    if (config.split === 'proportional') parts = proportional(amount, sources)
    else if (config.split === 'priority') parts = byPriority(amount, sources, config.priority)
    else if (config.split === 'single') {
        const source = sources.find((s) => s.key === config.source)
        parts = config.source ? [{ key: config.source, label: source?.label || config.source, amount: round2(amount) }] : []
    } else parts = transfersFirst(amount, sources)
    return parts.filter((p) => p.key === 'cash' || round2(p.amount) !== 0)
}
