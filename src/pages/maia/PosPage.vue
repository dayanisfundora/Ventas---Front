<template>
    <q-page class="maia-page maia-page--pos">
        <PageHeader :title="posHeaderTitle" section="Ventas" compact>
            <FairDaySelector @change="reload" />
            <template v-if="posMode === 'sell'">
                <q-btn class="pos-sales-btn" outline color="primary" icon="document_scanner"
                    label="Escanear hoja" no-caps :disable="!fairStore.dayId || fairStore.isDayClosed" @click="openScan" />
                <q-btn class="pos-sales-btn" outline color="primary" icon="receipt_long"
                    label="Ventas del día" no-caps :disable="!fairStore.dayId" @click="openSales" />
            </template>
            <q-btn v-else class="pos-sales-btn" flat color="primary" icon="arrow_back"
                :label="posMode === 'edit' ? 'Volver a ventas' : 'Volver al POS'" no-caps
                @click="posMode === 'edit' ? closeEdit() : leaveSubview()" />
        </PageHeader>

        <q-banner v-if="!fairStore.dayId" class="maia-card maia-banner--warning q-mb-md" rounded>
            Seleccione una feria y un día para vender.
        </q-banner>
        <q-banner v-else-if="fairStore.isDayClosed" class="maia-card maia-banner--muted q-mb-md" rounded>
            <template #avatar><q-icon name="lock" /></template>
            El día seleccionado está cerrado. Solo se pueden consultar sus ventas.
        </q-banner>

        <div v-show="posMode === 'sell'" class="row q-col-gutter-md items-stretch pos-row">
            <!-- Catalog -->
            <div class="col-12 col-md-7 pos-col">
                <q-card flat class="maia-card pos-panel">
                    <q-card-section class="q-py-sm pos-panel-top">
                        <div class="row items-center no-wrap pos-toolbar">
                            <q-input ref="searchInput" dense outlined v-model="search" class="col pos-search maia-field" clearable
                                placeholder="Código o nombre" @keyup.enter="addFirstMatch">
                                <template #prepend><q-icon name="search" /></template>
                                <q-tooltip anchor="bottom left" self="top left" :delay="600">Enter agrega el primer resultado</q-tooltip>
                            </q-input>
                            <q-btn class="col-auto pos-toolbar-btn" :outline="!showFilters" :unelevated="showFilters" color="primary"
                                icon="tune" no-caps padding="0 12px" @click="showFilters = !showFilters">
                                Filtros
                                <q-badge v-if="filtersActive" floating color="accent" text-color="dark" rounded />
                                <q-tooltip>{{ showFilters ? 'Ocultar filtros' : 'Mostrar filtros' }}</q-tooltip>
                            </q-btn>
                            <q-btn-toggle v-model="viewMode" class="col-auto pos-view-toggle" no-caps unelevated
                                toggle-color="primary" color="transparent" text-color="primary" padding="0 10px"
                                :options="[
                                    { value: 'grid', slot: 'grid' },
                                    { value: 'list', slot: 'list' },
                                ]">
                                <template #grid>
                                    <q-icon name="grid_view" size="20px" />
                                    <q-tooltip>Mosaico</q-tooltip>
                                </template>
                                <template #list>
                                    <q-icon name="view_list" size="20px" />
                                    <q-tooltip>Listado</q-tooltip>
                                </template>
                            </q-btn-toggle>
                        </div>
                        <div v-if="!showFilters && activeFilterSummary" class="text-caption text-grey-7 q-mt-xs">
                            {{ activeFilterSummary }}
                        </div>
                        <q-slide-transition>
                            <div v-show="showFilters" class="q-mt-sm">
                                <div class="row q-gutter-xs items-center">
                                    <q-chip class="pos-chip" clickable dense :outline="categoryId !== null" color="primary"
                                        :text-color="categoryId === null ? 'white' : 'primary'" @click="categoryId = null">Todos</q-chip>
                                    <q-chip v-for="c in categories" :key="c.id" class="pos-chip" clickable dense :outline="categoryId !== c.id" color="primary"
                                        :text-color="categoryId === c.id ? 'white' : 'primary'" @click="categoryId = c.id">
                                        {{ c.name }}
                                    </q-chip>
                                </div>
                                <div class="row q-gutter-md items-center q-mt-sm">
                                    <q-toggle dense v-model="onlyFair" label="Solo de esta feria" @update:model-value="loadCatalog" />
                                    <q-toggle dense v-model="onlyStock" label="Solo con existencia" />
                                </div>
                                <div class="text-caption text-grey-7 q-mt-xs">
                                    El stock es independiente por feria; el mismo producto puede existir en varias.
                                </div>
                            </div>
                        </q-slide-transition>
                    </q-card-section>
                    <q-separator />
                    <q-card-section class="pos-grid-wrap">
                        <q-inner-loading :showing="catalogLoading" color="primary" />
                        <div v-if="!catalogLoading && !filteredProducts.length" class="text-center text-grey q-pa-lg">
                            No hay productos que coincidan.
                        </div>
                        <q-list v-if="viewMode === 'list'" class="pos-list" separator>
                            <q-item v-for="p in filteredProducts" :key="p.id" clickable v-ripple dense class="pos-list-item"
                                :class="{ 'pos-product--empty': available(p) <= 0 }" @click="addToCart(p)">
                                <q-item-section side class="pos-list-item__code">
                                    <span class="text-caption text-grey-7 text-mono">#{{ p.code }}</span>
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label class="pos-list-item__name">{{ p.name }}</q-item-label>
                                    <q-item-label v-if="p.category" caption lines="1">{{ p.category }}</q-item-label>
                                </q-item-section>
                                <q-item-section side class="pos-list-item__price">
                                    <div class="text-weight-bold text-primary">{{ money(p.price_cup) }} <span class="text-caption">CUP</span></div>
                                    <div class="text-caption text-grey-7">{{ money(p.price_usd) }} USD</div>
                                </q-item-section>
                                <q-item-section side>
                                    <q-badge :color="available(p) > 0 ? (available(p) <= 2 ? 'orange-8' : 'positive') : 'grey-6'"
                                        :label="available(p)" />
                                </q-item-section>
                            </q-item>
                        </q-list>
                        <div v-else class="pos-grid">
                            <q-card v-for="p in filteredProducts" :key="p.id" flat bordered class="pos-product cursor-pointer"
                                :class="{ 'pos-product--empty': available(p) <= 0 }" v-ripple @click="addToCart(p)">
                                <q-card-section class="q-pa-sm">
                                    <div class="row items-center no-wrap">
                                        <span class="text-caption text-grey-7 text-mono">#{{ p.code }}</span>
                                        <q-space />
                                        <q-badge :color="available(p) > 0 ? (available(p) <= 2 ? 'orange-8' : 'positive') : 'grey-6'"
                                            :label="available(p)" />
                                    </div>
                                    <div class="pos-product__name">{{ p.name }}</div>
                                    <div class="text-weight-bold text-primary">{{ money(p.price_cup) }} <span class="text-caption">CUP</span></div>
                                    <div class="text-caption text-grey-7">{{ money(p.price_usd) }} USD</div>
                                </q-card-section>
                            </q-card>
                        </div>
                    </q-card-section>
                </q-card>
            </div>

            <!-- Cart and payment -->
            <div class="col-12 col-md-5 pos-col">
                <q-card flat class="maia-card pos-panel pos-panel--checkout">
                    <div class="pos-checkout-scroll">
                        <q-card-section class="q-py-sm">
                            <q-select dense outlined emit-value map-options clearable class="pos-field"
                                placeholder="Vendedor" :options="workerOptions" v-model="workerId"
                                @update:model-value="syncTipFromSeller" hide-bottom-space>
                                <template #prepend><q-icon name="badge" /></template>
                            </q-select>
                        </q-card-section>

                        <q-list separator dense class="pos-cart">
                            <q-item v-if="!cart.length" class="text-grey q-py-md justify-center">
                                El carrito está vacío
                            </q-item>
                            <q-item v-for="line in cart" :key="line.product.id" dense>
                                <q-item-section>
                                    <q-item-label class="text-weight-medium">{{ line.product.name }}</q-item-label>
                                    <q-item-label caption>#{{ line.product.code }} · {{ money(line.product.price_cup) }} CUP</q-item-label>
                                </q-item-section>
                                <q-item-section side>
                                    <div class="row items-center no-wrap q-gutter-xs">
                                        <q-btn flat round dense size="sm" icon="remove" @click="changeQty(line, -1)" />
                                        <q-input dense borderless type="number" input-class="text-center text-weight-bold" style="width: 44px"
                                            :model-value="line.quantity" @update:model-value="(v) => setQty(line, v)" />
                                        <q-btn flat round dense size="sm" icon="add" :disable="available(line.product) <= 0"
                                            @click="changeQty(line, 1)" />
                                    </div>
                                </q-item-section>
                                <q-item-section side style="min-width: 80px" class="text-right">
                                    <q-item-label class="text-weight-bold text-dark">{{ money(line.quantity * line.product.price_cup) }}</q-item-label>
                                </q-item-section>
                                <q-item-section side>
                                    <q-btn flat round dense size="sm" color="negative" icon="close" @click="removeLine(line)" />
                                </q-item-section>
                            </q-item>
                        </q-list>

                        <q-separator />
                        <q-card-section class="q-py-xs">
                            <div class="row items-center">
                                <div class="text-subtitle2">Total</div>
                                <q-space />
                                <div class="pos-total">{{ money(total) }} <span class="pos-total__cur">CUP</span></div>
                            </div>
                            <div class="row q-gutter-sm text-caption text-grey-8 justify-end">
                                <span v-for="c in ['USD', 'EUR', 'MXN', 'MLC']" :key="c">{{ money(total / rate(c)) }} {{ c }}</span>
                            </div>
                        </q-card-section>

                        <q-separator />
                        <q-card-section class="q-py-sm">
                            <div class="row items-center q-mb-xs">
                                <div class="text-subtitle2">Pagos</div>
                                <q-space />
                                <q-btn flat dense no-caps size="sm" color="primary" icon="add" label="Agregar pago" @click="addPayment()" />
                            </div>
                            <div v-for="(p, i) in payments" :key="i" class="pos-pay-row q-mb-sm">
                                <q-select class="pos-field pos-pay-method" dense outlined emit-value map-options options-dense
                                    :options="methodOptions" v-model="p.payment_method_id" hide-bottom-space />
                                <q-input class="pos-field pos-amount-input pos-pay-amount" dense outlined type="number" step="0.01" min="0"
                                    v-model.number="p.amount" :suffix="methodCurrency(p.payment_method_id)"
                                    input-class="text-right" hide-bottom-space />
                                <div class="pos-pay-actions row no-wrap items-center">
                                    <q-btn flat round dense size="sm" icon="bolt" color="primary" @click="fillRemaining(p)">
                                        <q-tooltip>Completar lo que falta</q-tooltip>
                                    </q-btn>
                                    <q-btn flat round dense size="sm" icon="close" color="negative" :disable="payments.length === 1"
                                        @click="payments.splice(i, 1)" />
                                </div>
                            </div>
                            <div v-if="showChange" class="pos-change q-mb-sm">
                                <q-toggle dense :model-value="change.enabled" label="Vuelto"
                                    @update:model-value="(v) => setChangeEnabled(change, v, payments, total)">
                                    <q-tooltip>Se devolvió dinero al cliente (por ejemplo, pagó en USD y se le dio el vuelto en CUP)</q-tooltip>
                                </q-toggle>
                                <div v-if="change.enabled" class="pos-pay-row q-mt-xs">
                                    <q-select class="pos-field pos-pay-method" dense outlined emit-value map-options options-dense
                                        :options="cashMethodOptions" v-model="change.payment_method_id" hide-bottom-space />
                                    <q-input class="pos-field pos-amount-input pos-pay-amount" dense outlined type="number" step="0.01" min="0"
                                        v-model.number="change.amount" :suffix="methodCurrency(change.payment_method_id)"
                                        input-class="text-right" hide-bottom-space />
                                    <div class="pos-pay-actions row no-wrap items-center">
                                        <q-btn flat round dense size="sm" icon="bolt" color="primary" @click="fillChange(change, payments, total)">
                                            <q-tooltip>Todo lo que sobra, como vuelto</q-tooltip>
                                        </q-btn>
                                    </div>
                                </div>
                            </div>
                            <div class="pos-pay-check text-body2" :class="payCheckClass">
                                <div>
                                    Total {{ money(total) }} CUP · Pagado {{ paidDisplay }}
                                    <template v-if="showPaidCupEquiv"> = <b>{{ money(receivedCup) }} CUP</b></template>
                                    <template v-if="changeRows(change).length">
                                        · Vuelto <b>{{ money(change.amount) }} {{ methodCurrency(change.payment_method_id) }}</b>
                                    </template>
                                </div>
                                <div v-if="remainingCup > 0.009" class="text-right">
                                    Falta <b>{{ balanceDisplay(remainingCup) }}</b>
                                </div>
                                <div v-else-if="tipFromExcess" class="text-right">
                                    <template v-if="excessIsSale">Cobrado de más <b>{{ money(paidCup - total) }} CUP</b></template>
                                    <template v-else>A propina <b>{{ money(tipFromExcess.amount) }} {{ tipFromExcess.currency }}</b></template>
                                </div>
                                <div v-else-if="total > 0" class="text-right"><b>Exacto</b></div>
                            </div>
                            <div v-if="mixedPayRates.length" class="text-caption text-grey-7 q-mt-xs">
                                Tasa:
                                <span v-for="(r, i) in mixedPayRates" :key="r.currency">
                                    <template v-if="i"> · </template>1 {{ r.currency }} = {{ money(r.rate) }} CUP
                                </span>
                            </div>
                        </q-card-section>

                        <q-separator />
                        <q-card-section class="q-py-sm">
                            <div class="row items-center no-wrap q-gutter-sm">
                                <q-toggle dense :model-value="withTip" label="Propina" @update:model-value="setWithTip" />
                                <q-space />
                                <q-input v-if="withTip" class="col pos-field pos-amount-input" style="max-width: 168px" dense outlined
                                    type="number" step="0.01" min="0" v-model.number="tip.amount"
                                    :suffix="methodCurrency(tip.payment_method_id) || 'CUP'" input-class="text-right" hide-bottom-space />
                            </div>
                            <div v-if="tipFromExcess && excessIsSale" class="text-caption text-grey-7 q-mt-xs">
                                Sin propina: la venta se registra por {{ money(paidCup) }} CUP (se vendió por más del precio).
                            </div>
                            <div v-if="withTip" class="pos-tip-row q-mt-sm">
                                <q-select class="pos-field" dense outlined emit-value map-options options-dense
                                    :options="workerOptions" v-model="tip.worker_id" hide-bottom-space
                                    placeholder="Trabajador" />
                                <q-select class="pos-field pos-pay-method" dense outlined emit-value map-options options-dense
                                    :options="methodOptions" v-model="tip.payment_method_id" hide-bottom-space />
                            </div>
                            <q-input class="pos-field q-mt-sm" dense outlined v-model="notes" placeholder="Nota (opcional)"
                                maxlength="255" hide-bottom-space />
                        </q-card-section>
                    </div>

                    <q-card-actions class="q-pa-sm pos-actions">
                        <q-btn flat :color="$q.dark.isActive ? 'grey-5' : 'grey-8'" icon="delete_sweep" label="Limpiar" no-caps dense @click="resetSale" :disable="!cart.length" />
                        <q-space />
                        <q-btn unelevated color="primary" icon="point_of_sale" label="Cobrar" no-caps
                            class="pos-charge" :loading="saving" :disable="!canCharge" @click="charge" />
                    </q-card-actions>
                </q-card>
            </div>
        </div>

        <!-- Ventas del día (vista in-page) -->
        <div v-if="posMode === 'sales'" class="pos-subview">
            <q-card flat class="maia-card pos-panel pos-sales-panel">
                <q-card-section class="pos-subview__bar row items-center q-py-sm">
                    <div>
                        <div class="text-subtitle1 text-weight-bold">Ventas del día</div>
                        <div class="text-caption text-grey-7">{{ formatDate(fairStore.day?.date) }}</div>
                    </div>
                    <q-space />
                    <div class="pos-sales-total text-right q-mr-lg">
                        <div class="text-caption text-grey-7">Cantidad vendida</div>
                        <div class="text-h6 text-weight-bold">{{ salesUnits }}</div>
                        <div class="text-caption text-grey-7">{{ salesCount }} {{ salesCount === 1 ? 'venta' : 'ventas' }}</div>
                    </div>
                    <div class="pos-sales-total text-right">
                        <div class="text-caption text-grey-7">Total del día</div>
                        <div class="pos-sales-total__amounts text-h6 text-weight-bold text-primary">
                            <span v-for="(c, i) in salesCurrencyTotals" :key="c.currency">
                                <span v-if="i" class="pos-sales-total__plus">+</span>
                                {{ money(c.amount) }} <span class="text-caption">{{ c.currency }}</span>
                            </span>
                        </div>
                        <div v-if="salesCurrencyTotals.some((c) => c.currency !== 'CUP')" class="text-caption text-grey-7">
                            = {{ money(salesTotal) }} CUP
                        </div>
                    </div>
                    <q-btn flat round dense icon="refresh" color="primary" class="q-ml-sm" :loading="salesLoading" @click="loadSales">
                        <q-tooltip>Actualizar</q-tooltip>
                    </q-btn>
                </q-card-section>
                <q-card-section v-if="salesPayBreakdown.length" class="pos-sales-pays q-pt-none q-pb-sm">
                    <div class="pos-sales-pays__grid">
                        <button
                            v-for="row in salesPayBreakdown"
                            :key="row.key"
                            type="button"
                            class="pos-sales-pay"
                            :class="{ 'pos-sales-pay--active': salesPayFilter === row.key }"
                            @click="salesPayFilter = salesPayFilter === row.key ? null : row.key"
                        >
                            <div class="text-caption text-grey-7">{{ row.label }}</div>
                            <div class="text-weight-bold">{{ money(row.amount) }} <span class="text-caption">{{ row.currency }}</span></div>
                            <div v-if="row.currency !== 'CUP'" class="text-caption text-grey-7">= {{ money(row.amount_cup) }} CUP</div>
                        </button>
                    </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="row items-center q-py-sm q-col-gutter-sm">
                    <div class="col-12 col-sm">
                        <q-input v-model="salesSearch" dense outlined clearable debounce="150" placeholder="Buscar por producto o código">
                            <template #prepend><q-icon name="search" /></template>
                        </q-input>
                    </div>
                    <div class="col-12 col-sm-5 col-md-4">
                        <q-select
                            v-model="salesPayFilter"
                            dense outlined clearable emit-value map-options options-dense
                            :options="salesPayFilterOptions"
                            label="Forma de pago"
                            placeholder="Todas"
                        />
                    </div>
                    <div v-if="salesSearchTerm || salesPayFilter" class="col-12 text-caption text-grey-7">
                        <template v-if="salesSearchTerm">
                            <b class="text-body2 text-weight-bold">{{ salesSearchUnits }}</b> {{ salesSearchUnits === 1 ? 'unidad' : 'unidades' }}
                            del producto · {{ money(salesSearchAmount) }} CUP
                            <span v-if="salesPayFilter"> · </span>
                        </template>
                        <template v-if="salesPayFilter || salesSearchTerm">
                            {{ salesFilterCount }} {{ salesFilterCount === 1 ? 'venta' : 'ventas' }}
                        </template>
                    </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="pos-subview__body q-pa-none">
                    <q-inner-loading :showing="salesLoading" color="primary" />
                    <div v-if="!salesLoading && !sales.length" class="text-center text-grey q-pa-xl">
                        Sin ventas en este día.
                    </div>
                    <div v-else-if="!salesLoading && !filteredSales.length" class="text-center text-grey q-pa-xl">
                        <template v-if="salesSearchTerm && salesPayFilter">
                            Ninguna venta coincide con «{{ salesSearch }}» y {{ salesPayFilterLabel }}.
                        </template>
                        <template v-else-if="salesPayFilter">
                            Ninguna venta se cobró con {{ salesPayFilterLabel }}.
                        </template>
                        <template v-else>
                            Ninguna venta tiene un producto que coincida con «{{ salesSearch }}».
                        </template>
                    </div>
                    <div v-else class="pos-sales-list">
                        <div v-for="sale in filteredSales" :key="sale.id" class="pos-sale-row"
                            :class="{ 'pos-sale-row--void': sale.status !== 'completed' }">
                            <div class="pos-sale-row__main">
                                <div class="pos-sale-row__id">
                                    <span class="text-weight-bold">#{{ sale.number }}</span>
                                    <span class="text-caption text-grey-7 q-ml-sm">{{ saleTime(sale) }}</span>
                                    <q-badge class="q-ml-sm" dense :color="sale.status === 'completed' ? 'positive' : 'negative'"
                                        :label="sale.status === 'completed' ? 'OK' : 'Anulada'" />
                                </div>
                                <div class="text-caption text-grey-8">{{ sale.worker?.name || 'Sin vendedor' }}</div>
                                <div class="pos-sale-row__items text-caption">
                                    <span v-for="(it, idx) in sale.items" :key="it.id">
                                        <span v-if="idx"> · </span>
                                        <span :class="{ 'text-primary text-weight-bold': salesSearchTerm && itemMatches(it) }">
                                            <b>{{ it.product?.code || '—' }}</b> {{ it.quantity }}× {{ it.product?.name }}
                                        </span>
                                    </span>
                                </div>
                                <div class="pos-sale-row__pays text-caption text-grey-7">
                                    <span v-for="(py, idx) in sale.payments.filter((p) => Number(p.amount) > 0)" :key="py.id">
                                        <span v-if="idx"> · </span>{{ py.payment_method?.name }}
                                        <span class="pos-sale-row__pay-amount">{{ money(py.amount) }} {{ py.payment_method?.currency }}</span>
                                    </span>
                                    <span v-for="py in sale.payments.filter((p) => Number(p.amount) < 0)" :key="`c${py.id}`">
                                        · Vuelto <span class="pos-sale-row__pay-amount">{{ money(-py.amount) }} {{ py.payment_method?.currency }}</span>
                                    </span>
                                    <span v-for="t in sale.tips" :key="`t${t.id}`" class="text-teal">
                                        · Propina <b>{{ money(t.amount_cup) }} CUP</b>
                                    </span>
                                </div>
                            </div>
                            <div class="pos-sale-row__side">
                                <div class="pos-sale-row__amount text-weight-bold" :class="sale.status === 'completed' ? 'pos-sale-row__amount--done' : 'text-grey'">
                                    <template v-if="saleIsForeign(sale)">
                                        <div v-for="c in saleCurrencyTotals(sale)" :key="c.currency">
                                            {{ money(c.amount) }} <span class="text-caption">{{ c.currency }}</span>
                                        </div>
                                    </template>
                                    <template v-else>{{ money(sale.total_cup) }} <span class="text-caption">CUP</span></template>
                                </div>
                                <div v-if="saleIsForeign(sale)" class="text-caption text-grey-7">
                                    = {{ money(sale.total_cup) }} CUP
                                </div>
                                <div v-if="sale.status === 'completed' && !fairStore.isDayClosed" class="row no-wrap q-gutter-xs justify-end">
                                    <q-btn v-if="can('pos.vender')" flat round dense color="primary" icon="edit" @click="openEditSale(sale)">
                                        <q-tooltip>Editar venta</q-tooltip>
                                    </q-btn>
                                    <q-btn v-if="can('ventas.anular')" flat round dense color="negative" icon="block" @click="voidSale(sale)">
                                        <q-tooltip>Anular venta</q-tooltip>
                                    </q-btn>
                                </div>
                            </div>
                        </div>
                    </div>
                </q-card-section>
            </q-card>
        </div>

        <!-- Editar venta (vista in-page) -->
        <div v-else-if="posMode === 'edit'" class="pos-subview">
            <q-card flat class="maia-card pos-panel pos-edit-panel">
                <q-card-section class="pos-subview__bar row items-center q-py-sm">
                    <div>
                        <div class="text-subtitle1 text-weight-bold">Editar venta #{{ editSale?.number }}</div>
                        <div class="text-caption text-grey-7">{{ formatDate(fairStore.day?.date) }}</div>
                    </div>
                    <q-space />
                    <div class="text-h6 text-weight-bold text-primary">{{ money(editTotal) }} <span class="text-caption">CUP</span></div>
                </q-card-section>
                <q-separator />
                <div class="pos-subview__body edit-sale-body">
                    <q-select class="maia-field full-width" dense outlined emit-value map-options clearable options-dense
                        label="Vendedor" :options="workerOptions" v-model="editWorkerId" hide-bottom-space />

                    <div class="edit-sale-block">
                        <div class="edit-sale-block__head">
                            <span class="text-subtitle2">Productos</span>
                            <q-select class="maia-field edit-sale-add" dense outlined emit-value map-options options-dense
                                label="Agregar" :options="editProductOptions" v-model="editAddProductId"
                                @update:model-value="addEditProduct" hide-bottom-space />
                        </div>

                        <div class="edit-sale-lines">
                            <div v-for="line in editCart" :key="line.product_id" class="edit-sale-line">
                                <div class="edit-sale-line__info">
                                    <div class="edit-sale-line__code">{{ line.code || '—' }}</div>
                                    <div class="edit-sale-line__name ellipsis">{{ line.name }}</div>
                                </div>
                                <div class="edit-sale-line__qty">
                                    <q-btn flat round dense size="sm" icon="remove" @click="changeEditQty(line, -1)" />
                                    <q-input class="edit-sale-qty" dense outlined type="number" min="1" :max="editMaxQty(line)"
                                        v-model.number="line.quantity" input-class="text-center" hide-bottom-space
                                        @change="normalizeEditQty(line)" />
                                    <q-btn flat round dense size="sm" icon="add" :disable="line.quantity >= editMaxQty(line)"
                                        @click="changeEditQty(line, 1)" />
                                </div>
                                <q-input class="maia-field edit-sale-price" dense outlined type="number" step="0.01" min="0"
                                    v-model.number="line.unit_price" suffix="CUP" input-class="text-right" hide-bottom-space
                                    @update:model-value="syncEditLineTotal(line)" />
                                <q-btn flat round dense size="sm" color="negative" icon="close" @click="removeEditLine(line)" />
                            </div>
                            <div v-if="!editCart.length" class="text-caption text-grey q-pa-sm">Agregue al menos un producto</div>
                        </div>
                    </div>

                    <div class="edit-sale-block">
                        <div class="edit-sale-block__head">
                            <span class="text-subtitle2">Pagos</span>
                            <q-btn flat dense no-caps size="sm" color="primary" icon="add" label="Agregar"
                                @click="editPayments.push({ payment_method_id: methods[0]?.id || null, amount: null })" />
                        </div>
                        <div v-for="(p, i) in editPayments" :key="i" class="edit-sale-pay">
                            <q-select class="maia-field edit-sale-pay__method" dense outlined emit-value map-options options-dense
                                :options="methodOptions" v-model="p.payment_method_id" hide-bottom-space />
                            <q-input class="maia-field edit-sale-pay__amount" dense outlined type="number" step="0.01" min="0"
                                v-model.number="p.amount" :suffix="methodCurrency(p.payment_method_id)"
                                input-class="text-right" hide-bottom-space />
                            <q-btn flat round dense icon="close" color="negative" :disable="editPayments.length === 1"
                                @click="editPayments.splice(i, 1)" />
                        </div>
                        <div v-if="editShowChange">
                            <q-toggle dense :model-value="editChange.enabled" label="Vuelto"
                                @update:model-value="(v) => setChangeEnabled(editChange, v, editPayments, editTotal)" />
                            <div v-if="editChange.enabled" class="edit-sale-pay q-mt-xs">
                                <q-select class="maia-field edit-sale-pay__method" dense outlined emit-value map-options options-dense
                                    :options="cashMethodOptions" v-model="editChange.payment_method_id" hide-bottom-space />
                                <q-input class="maia-field edit-sale-pay__amount" dense outlined type="number" step="0.01" min="0"
                                    v-model.number="editChange.amount" :suffix="methodCurrency(editChange.payment_method_id)"
                                    input-class="text-right" hide-bottom-space />
                                <q-btn flat round dense icon="bolt" color="primary" @click="fillChange(editChange, editPayments, editTotal)">
                                    <q-tooltip>Todo lo que sobra, como vuelto</q-tooltip>
                                </q-btn>
                            </div>
                        </div>
                        <div class="pos-pay-check text-body2" :class="editPayCheckClass">
                            <div>
                                Total {{ money(editTotal) }} CUP · Pagado {{ editPaidDisplay }}
                                <template v-if="editShowPaidCupEquiv"> = <b>{{ money(editReceivedCup) }} CUP</b></template>
                                <template v-if="changeRows(editChange).length">
                                    · Vuelto <b>{{ money(editChange.amount) }} {{ methodCurrency(editChange.payment_method_id) }}</b>
                                </template>
                            </div>
                            <div v-if="editRemaining > 0.009" class="text-right">
                                Falta <b>{{ money(editRemaining) }} CUP</b>
                            </div>
                            <div v-else-if="editTipFromExcess" class="text-right">
                                <template v-if="editExcessIsSale">Cobrado de más <b>{{ money(editPaidCup - editTotal) }} CUP</b></template>
                                <template v-else>A propina <b>{{ money(editTipFromExcess.amount) }} {{ editTipFromExcess.currency }}</b></template>
                            </div>
                            <div v-else-if="editTotal > 0" class="text-right"><b>Exacto</b></div>
                        </div>
                    </div>

                    <div v-if="editTipFromExcess && editExcessIsSale" class="text-caption text-grey-7">
                        Sin propina: la venta se registra por {{ money(editPaidCup) }} CUP (se vendió por más del precio).
                    </div>
                    <div class="edit-sale-tip">
                        <q-toggle dense :model-value="editWithTip" label="Propina" @update:model-value="setEditWithTip" />
                        <template v-if="editWithTip">
                            <q-input class="maia-field edit-sale-pay__amount" dense outlined type="number" step="0.01" min="0"
                                v-model.number="editTip.amount" :suffix="methodCurrency(editTip.payment_method_id) || 'CUP'"
                                input-class="text-right" hide-bottom-space />
                            <q-select class="maia-field edit-sale-pay__method" dense outlined emit-value map-options options-dense
                                label="Trabajador" :options="workerOptions" v-model="editTip.worker_id" hide-bottom-space />
                            <q-select class="maia-field edit-sale-pay__method" dense outlined emit-value map-options options-dense
                                label="Forma de pago" :options="methodOptions" v-model="editTip.payment_method_id" hide-bottom-space />
                        </template>
                    </div>

                    <q-input class="maia-field full-width" dense outlined v-model="editNotes" label="Nota (opcional)"
                        maxlength="255" hide-bottom-space />
                </div>
                <q-card-actions class="q-pa-md pos-actions">
                    <q-btn flat no-caps label="Cancelar" @click="closeEdit" />
                    <q-space />
                    <q-btn unelevated no-caps color="primary" label="Guardar cambios" :loading="editSaving"
                        :disable="!canSaveEdit" @click="saveEditSale" />
                </q-card-actions>
            </q-card>
        </div>

        <!-- Escanear hoja (OCR local → verificar → confirmar) -->
        <div v-else-if="posMode === 'scan'" class="pos-subview">
            <q-card flat class="maia-card pos-panel pos-scan-panel">
                <q-card-section class="pos-subview__bar row items-center q-py-sm q-col-gutter-sm">
                    <div class="col-12 col-sm">
                        <div class="text-subtitle1 text-weight-bold">Escanear hoja de ventas</div>
                        <div class="text-caption text-grey-7">
                            OCR local (Tesseract). Revise cada línea antes de confirmar.
                        </div>
                    </div>
                    <div class="col-auto row q-gutter-sm items-center">
                        <q-btn outline no-caps color="primary" icon="photo_camera" label="Foto / archivo"
                            :disable="scanLoading || !fairStore.dayId" @click="pickScanImage" />
                        <input ref="scanFileInput" type="file" accept="image/*" capture="environment"
                            style="display: none" @change="onScanFileChosen" />
                    </div>
                </q-card-section>
                <q-banner v-if="scanUnavailable" dense class="maia-banner--warning q-mx-md" rounded>
                    Tesseract OCR no está instalado en este servidor. Consulte <code>Back/docs/POS_SCAN_HOJA.md</code>.
                </q-banner>
                <q-banner v-for="(w, i) in scanWarnings" :key="i" dense class="maia-banner--muted q-mx-md q-mt-sm" rounded>
                    {{ w }}
                </q-banner>
                <q-separator />
                <div class="pos-subview__body pos-scan-body">
                    <q-inner-loading :showing="scanLoading" color="primary" label="Leyendo hoja…" />
                    <div v-if="scanPreviewUrl" class="pos-scan-preview q-mb-md">
                        <img :src="scanPreviewUrl" alt="Hoja escaneada" />
                    </div>
                    <div v-if="!scanLines.length && !scanLoading" class="text-center text-grey q-pa-xl">
                        Capture o elija una foto de la hoja para proponer las ventas.
                    </div>
                    <div v-else class="pos-scan-lines">
                        <div v-for="(line, idx) in scanLines" :key="line.id" class="pos-scan-line"
                            :class="`pos-scan-line--${scanCheck(line).status}`">
                            <div v-if="line.preview" class="pos-scan-line__preview">
                                <img :src="line.preview" alt="Fila escrita en la hoja" />
                            </div>
                            <q-checkbox dense v-model="line.selected" :disable="!line.product_id || !(line.amount > 0)" />
                            <q-select class="maia-field pos-scan-line__worker" dense outlined emit-value map-options options-dense
                                clearable label="Vendedor" :options="workerOptions" v-model="line.worker_id" hide-bottom-space
                                @update:model-value="() => { if (scanCheck(line).status === 'ok') line.selected = true }" />
                            <q-select class="maia-field pos-scan-line__product" dense outlined emit-value map-options options-dense
                                use-input fill-input hide-selected input-debounce="200" label="Producto"
                                :options="scanProductOptions(line)" @filter="filterScanProducts"
                                v-model="line.product_id" hide-bottom-space
                                @update:model-value="(v) => onScanProductPicked(line, v)" />
                            <q-input class="maia-field pos-scan-line__qty" dense outlined type="number" min="1" label="Cant."
                                v-model.number="line.quantity" input-class="text-right" hide-bottom-space
                                @change="syncScanAmount(line)" />
                            <q-input class="maia-field pos-scan-line__amount" dense outlined type="number" min="0" step="0.01"
                                label="Importe" v-model.number="line.amount" input-class="text-right" hide-bottom-space
                                @change="syncScanUnitPrice(line)" />
                            <q-select class="maia-field pos-scan-line__pay" dense outlined emit-value map-options options-dense
                                label="Pago" :options="methodOptions" v-model="line.payment_method_id" hide-bottom-space
                                @update:model-value="syncScanUnitPrice(line)" />
                            <div class="pos-scan-line__meta">
                                <q-badge :color="SCAN_STATUS[scanCheck(line).status].color" :label="SCAN_STATUS[scanCheck(line).status].label">
                                    <q-tooltip>{{ scanCheck(line).message }}</q-tooltip>
                                </q-badge>
                                <q-btn flat round dense size="sm" color="primary" icon="add_card" @click="addScanPayment(line)">
                                    <q-tooltip>Agregar otro pago</q-tooltip>
                                </q-btn>
                                <q-btn flat round dense size="sm" color="negative" icon="delete" @click="scanLines.splice(idx, 1)" />
                            </div>
                            <div v-for="(pay, pi) in line.extra_payments || []" :key="pi" class="pos-scan-line__extra">
                                <span class="pos-scan-line__extra-label text-caption text-grey-7">Pago adicional</span>
                                <q-input class="maia-field pos-scan-line__extra-amount" dense outlined type="number" min="0" step="0.01"
                                    label="Importe" v-model.number="pay.amount" input-class="text-right" hide-bottom-space
                                    @change="syncScanUnitPrice(line)" />
                                <q-select class="maia-field pos-scan-line__extra-pay" dense outlined emit-value map-options options-dense
                                    label="Pago" :options="methodOptions" v-model="pay.payment_method_id" hide-bottom-space
                                    @update:model-value="syncScanUnitPrice(line)" />
                                <div class="pos-scan-line__extra-remove">
                                    <q-btn flat round dense size="sm" color="negative" icon="close"
                                        @click="() => { line.extra_payments.splice(pi, 1); syncScanUnitPrice(line) }">
                                        <q-tooltip>Quitar este pago</q-tooltip>
                                    </q-btn>
                                </div>
                            </div>
                            <div v-if="scanSuggestions(line).length" class="pos-scan-line__suggest">
                                <span class="text-caption text-grey-7">¿Es otro código?</span>
                                <q-chip v-for="s in scanSuggestions(line)" :key="s.product_id" dense clickable outline color="grey-7"
                                    @click="pickScanSuggestion(line, s.product_id)">
                                    {{ s.code }} · {{ s.name }}
                                </q-chip>
                            </div>
                            <div class="pos-scan-line__check text-caption" :class="`text-${SCAN_STATUS[scanCheck(line).status].text}`">
                                {{ scanCheck(line).message }}
                                <q-btn v-if="line.amount_from_catalog" flat dense no-caps size="sm" color="positive" icon="check"
                                    label="Es correcto" class="q-ml-sm" @click="syncScanUnitPrice(line)" />
                            </div>
                            <div v-if="scanSummary(line)" class="pos-scan-line__raw text-caption text-grey-7">{{ scanSummary(line) }}</div>
                        </div>
                    </div>
                </div>
                <q-card-actions class="q-pa-md pos-actions">
                    <q-btn flat no-caps label="Cancelar" @click="leaveSubview" />
                    <q-space />
                    <div class="text-caption text-grey-7 q-mr-md">
                        {{ scanSelectedCount }} seleccionada(s)
                    </div>
                    <q-btn unelevated no-caps color="primary" icon="check" label="Confirmar seleccionadas"
                        :loading="scanConfirming" :disable="!scanSelectedCount || scanUnavailable" @click="confirmScanLines" />
                </q-card-actions>
            </q-card>
        </div>
    </q-page>
</template>

<script setup>
import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import PageHeader from 'src/components/maia/PageHeader.vue'
import FairDaySelector from 'src/components/maia/FairDaySelector.vue'
import { useAuthStore } from 'src/stores/auth-store'
import { useFairStore } from 'src/stores/fair-store'
import { Success } from 'src/assets/js/util/notify'
import { money, formatDate, notifyApiError } from 'src/assets/js/util/maia'

const $q = useQuasar()
const authStore = useAuthStore()
const fairStore = useFairStore()
const can = (p) => authStore.hasPermission(p)

/* ---------- Data ---------- */
const products = ref([])
const catalogLoading = ref(false)
const dayRates = ref({})
const methods = ref([])
const workers = ref([])
const workerId = ref(null)

const search = ref('')
const categoryId = ref(null)
const onlyFair = ref(true)
const onlyStock = ref(true)
const showFilters = ref(false)
const viewMode = ref(localStorage.getItem('maia_pos_view') === 'list' ? 'list' : 'grid')
watch(viewMode, (mode) => localStorage.setItem('maia_pos_view', mode))
const searchInput = ref(null)

const filtersActive = computed(() => categoryId.value !== null || !onlyFair.value || !onlyStock.value)
const activeFilterSummary = computed(() => {
    const parts = []
    if (categoryId.value !== null) {
        const cat = categories.value.find((c) => c.id === categoryId.value)
        if (cat) parts.push(cat.name)
    }
    if (!onlyFair.value) parts.push('todas las ferias')
    if (!onlyStock.value) parts.push('incl. sin existencia')
    return parts.length ? `Filtros: ${parts.join(' · ')}` : ''
})

const cart = ref([])
const payments = ref([])
const withTip = ref(false)
/** Tip turned on by a surplus (not by hand): it turns off again when the surplus goes away. */
const tipFromSurplus = ref(false)
const excessIsSale = ref(false)
const tip = reactive({ worker_id: null, payment_method_id: null, amount: null })
const notes = ref('')
const saving = ref(false)

const workerOptions = computed(() => workers.value.filter((w) => w.state).map((w) => ({ label: w.name, value: w.id })))
const methodOptions = computed(() => methods.value.map((m) => ({ label: m.name, value: m.id })))
const cashCup = computed(() => methods.value.find((m) => m.kind === 'cash' && m.currency === 'CUP'))

const categories = computed(() => {
    const map = new Map()
    products.value.forEach((p) => p.product_category_id && map.set(p.product_category_id, p.category))
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
})

const normalize = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const filteredProducts = computed(() => {
    const term = normalize(search.value).trim()
    return products.value.filter((p) => {
        if (categoryId.value && p.product_category_id !== categoryId.value) return false
        if (onlyStock.value && p.stock <= 0) return false
        if (!term) return true
        return p.code === term || normalize(p.name).includes(term) || String(p.code).startsWith(term)
    })
})

const rate = (currency) => {
    if (currency === 'CUP') return 1
    const value = Number(dayRates.value[`${String(currency).toLowerCase()}_rate`])
    return value > 0 ? value : 1
}
const methodById = (id) => methods.value.find((m) => m.id === id)
const methodCurrency = (id) => methodById(id)?.currency || ''

/* ---------- Cart ---------- */
const inCart = (productId) => cart.value.find((l) => l.product.id === productId)?.quantity || 0
const available = (p) => p.stock - inCart(p.id)

const addToCart = (p) => {
    if (fairStore.isDayClosed) return
    if (available(p) <= 0) {
        $q.notify({ type: 'warning', message: `Sin existencia de ${p.name}`, timeout: 1500 })
        return
    }
    const line = cart.value.find((l) => l.product.id === p.id)
    if (line) line.quantity++
    else cart.value.push({ product: p, quantity: 1 })
}

const addFirstMatch = () => {
    const term = normalize(search.value).trim()
    if (!term) return
    const exact = products.value.find((p) => p.code === term)
    const target = exact || filteredProducts.value[0]
    if (target) {
        addToCart(target)
        search.value = ''
    }
}

const changeQty = (line, delta) => setQty(line, line.quantity + delta)
const setQty = (line, value) => {
    const qty = Math.floor(Number(value) || 0)
    if (qty <= 0) return removeLine(line)
    line.quantity = Math.min(qty, line.product.stock)
}
const removeLine = (line) => {
    cart.value = cart.value.filter((l) => l !== line)
}

const total = computed(() => cart.value.reduce((s, l) => s + l.quantity * Number(l.product.price_cup), 0))

/* ---------- Payments ---------- */
const round2 = (v) => Math.round(v * 100) / 100
const paymentCup = (p) => Number(p.amount || 0) * rate(methodCurrency(p.payment_method_id))

/* Change handed back in cash, e.g. paid 20 USD and got CUP back. Sent as its own field; stored as a negative payment. */
const cashMethodOptions = computed(() => methods.value.filter((m) => m.kind === 'cash').map((m) => ({ label: m.name, value: m.id })))
const emptyChange = () => ({ enabled: false, payment_method_id: null, amount: null })
const changeRows = (c) => (c.enabled && c.payment_method_id && Number(c.amount) > 0
    ? [{ payment_method_id: c.payment_method_id, amount: -Number(c.amount) }]
    : [])
const changePayload = (c) => {
    const [row] = changeRows(c)
    return row ? { payment_method_id: row.payment_method_id, amount: -row.amount } : null
}
const receivedCupOf = (list) => list.reduce((s, p) => s + paymentCup(p), 0)
/** Whole surplus as change, in the change currency (foreign rounded down so it never gives too much). */
const fillChange = (c, list, totalCup) => {
    c.payment_method_id ||= cashCup.value?.id || cashMethodOptions.value[0]?.value || null
    const surplus = Math.max(0, receivedCupOf(list) - totalCup)
    const r = rate(methodCurrency(c.payment_method_id))
    c.amount = surplus > 0 ? (r === 1 ? round2(surplus) : Math.floor((surplus / r) * 100) / 100) : null
}
const setChangeEnabled = (c, value, list, totalCup) => {
    c.enabled = value
    if (value && !(Number(c.amount) > 0)) fillChange(c, list, totalCup)
}

const change = reactive(emptyChange())
const payList = computed(() => [...payments.value, ...changeRows(change)])
const receivedCup = computed(() => receivedCupOf(payments.value))
const showChange = computed(() => change.enabled || receivedCup.value - total.value > 0.009)
const paidCup = computed(() => payList.value.reduce((s, p) => s + paymentCup(p), 0))
const remainingCup = computed(() => Math.max(0, total.value - paidCup.value))

/** Amounts grouped by the currency actually entered (not converted to CUP). */
const paidByCurrencyOf = (list) => {
    const map = new Map()
    for (const p of list) {
        const amount = Number(p.amount || 0)
        if (amount <= 0) continue
        const currency = methodCurrency(p.payment_method_id) || 'CUP'
        map.set(currency, round2((map.get(currency) || 0) + amount))
    }
    return [...map.entries()].map(([currency, amount]) => ({ currency, amount }))
}
const formatPaid = (rows) => (rows.length
    ? rows.map(({ currency, amount }) => `${money(amount)} ${currency}`).join(' + ')
    : `${money(0)} CUP`)

/** What a sale left in each currency (payments are net of the tip; change counts as money out). */
const saleCurrencyTotals = (sale) => {
    const map = new Map()
    for (const p of sale.payments || []) {
        const amount = Number(p.amount || 0)
        if (!amount) continue
        const currency = p.payment_method?.currency || methodCurrency(p.payment_method_id) || 'CUP'
        map.set(currency, round2((map.get(currency) || 0) + amount))
    }
    return [...map.entries()]
        .filter(([, amount]) => Math.abs(amount) > 0.004)
        .map(([currency, amount]) => ({ currency, amount }))
}
const saleIsForeign = (sale) => saleCurrencyTotals(sale).some((c) => c.currency !== 'CUP')

const paidByCurrency = computed(() => paidByCurrencyOf(payments.value))
const paidDisplay = computed(() => formatPaid(paidByCurrency.value))

/** Show "= X CUP" when any payment is not CUP (so 500 CUP + 5 USD is clear). */
const showPaidCupEquiv = computed(() => paidByCurrency.value.some((r) => r.currency !== 'CUP'))

const mixedPayRates = computed(() => {
    const seen = new Set()
    return paidByCurrency.value
        .filter((r) => r.currency !== 'CUP' && !seen.has(r.currency) && (seen.add(r.currency), true))
        .map((r) => ({ currency: r.currency, rate: rate(r.currency) }))
})

/**
 * Surplus over the total, kept in the currency that overshot
 * (e.g. 500 CUP + 2 USD on a 1500 CUP item → tip in USD, not converted to CUP).
 * @returns {{ payment_method_id: number|null, currency: string, amount: number }|null}
 */
const excessTip = (list, totalCup) => {
    const paid = list.filter((p) => p.payment_method_id && Number(p.amount) !== 0)
    const isCup = (p) => (methodCurrency(p.payment_method_id) || 'CUP') === 'CUP'
    const allCup = paid.reduce((s, p) => s + paymentCup(p), 0)
    const excess = round2(allCup - totalCup)
    if (excess < 0.01) return null
    const cupOnly = paid.filter(isCup).reduce((s, p) => s + Number(p.amount), 0)
    const foreignOvershoot = round2(Math.max(0, allCup - cupOnly) - Math.max(0, totalCup - cupOnly))
    const pay = [...paid].reverse().find((p) => !isCup(p) && Number(p.amount) > 0)
    if (foreignOvershoot > 0.009 && pay) {
        const currency = methodCurrency(pay.payment_method_id)
        return {
            payment_method_id: pay.payment_method_id,
            currency,
            amount: round2(foreignOvershoot / (rate(currency) || 1)),
        }
    }
    return {
        payment_method_id: cashCup.value?.id || paid.find((p) => isCup(p) && Number(p.amount) > 0)?.payment_method_id || null,
        currency: 'CUP',
        amount: excess,
    }
}

const tipFromExcess = computed(() => excessTip(payList.value, total.value))

const payCheckClass = computed(() => {
    if (!(total.value > 0) || !(paidCup.value > 0)) return 'text-grey-8'
    if (remainingCup.value > 0.009) return 'text-negative'
    if (tipFromExcess.value) return 'text-positive'
    return 'text-positive'
})

/** Prefer showing a CUP balance in the single payment currency when there is only one. */
const balanceDisplay = (cupAmount) => {
    const rows = paidByCurrency.value
    if (rows.length === 1 && rows[0].currency !== 'CUP') {
        const r = rate(rows[0].currency)
        return `${money(r === 1 ? cupAmount : Math.ceil((cupAmount / r) * 100) / 100)} ${rows[0].currency}`
    }
    if (!rows.length) {
        const first = payments.value[0]
        const currency = methodCurrency(first?.payment_method_id) || 'CUP'
        if (currency !== 'CUP') {
            const r = rate(currency)
            return `${money(r === 1 ? cupAmount : Math.ceil((cupAmount / r) * 100) / 100)} ${currency}`
        }
    }
    return `${money(cupAmount)} CUP`
}

const syncTipFromSeller = () => {
    tip.worker_id = workerId.value || null
}

const applyExcessAsTip = () => {
    syncTipFromSeller()
    const plan = tipFromExcess.value
    if (!plan) {
        excessIsSale.value = false
        if (tipFromSurplus.value) {
            withTip.value = false
            tipFromSurplus.value = false
            tip.amount = null
            tip.payment_method_id = cashCup.value?.id || tip.payment_method_id
        }
        return
    }
    if (excessIsSale.value) return
    // Surplus stays in the overshoot currency; it goes to tip unless the cashier turns tip off.
    if (!withTip.value) tipFromSurplus.value = true
    withTip.value = true
    tip.payment_method_id = plan.payment_method_id || cashCup.value?.id || tip.payment_method_id
    tip.amount = plan.amount
}

/** Turning tip off while there is a surplus means the item was sold for more than its price. */
const setWithTip = (value) => {
    withTip.value = value
    tipFromSurplus.value = false
    excessIsSale.value = !value && !!tipFromExcess.value
    if (value) applyExcessAsTip()
    else tip.amount = null
}

watch(workerId, () => syncTipFromSeller())
watch([tipFromExcess, paidCup], () => applyExcessAsTip())

const addPayment = (methodId = null) => {
    payments.value.push({ payment_method_id: methodId || cashCup.value?.id || methods.value[0]?.id, amount: null })
}

const fillRemaining = (p) => {
    const others = payList.value.filter((x) => x !== p).reduce((s, x) => s + paymentCup(x), 0)
    const missing = Math.max(0, total.value - others)
    const r = rate(methodCurrency(p.payment_method_id))
    p.amount = r === 1 ? round2(missing) : Math.ceil((missing / r) * 100) / 100
}

const canCharge = computed(() => {
    // Paying less than the total is allowed after confirmation (sold for less)
    if (fairStore.isDayClosed || !fairStore.dayId || !cart.value.length || !(paidCup.value > 0) || !can('pos.vender')) {
        return false
    }
    if (tipFromExcess.value && !excessIsSale.value) {
        if (!workerId.value && !tip.worker_id) return false
    }
    return true
})

const resetSale = () => {
    cart.value = []
    payments.value = []
    addPayment()
    Object.assign(change, emptyChange())
    withTip.value = false
    tipFromSurplus.value = false
    excessIsSale.value = false
    Object.assign(tip, {
        worker_id: workerId.value || null,
        payment_method_id: cashCup.value?.id || methods.value[0]?.id || null,
        amount: null,
    })
    notes.value = ''
}

const confirmUnderpayment = (totalCup, paid) => new Promise((resolve) => {
    $q.dialog({
        title: 'Se cobró por menos',
        message: `El total es <b>${money(totalCup)} CUP</b> y se cobró <b>${money(paid)} CUP</b>`
            + ` (faltan <b>${money(totalCup - paid)} CUP</b>).<br><br>`
            + 'La venta se registrará por lo cobrado: el precio de los productos se rebaja en proporción'
            + ' y queda anotado en la venta. ¿Desea continuar?',
        html: true,
        cancel: { label: 'Revisar el pago', flat: true, noCaps: true },
        ok: { label: `Registrar por ${money(paid)} CUP`, color: 'warning', textColor: 'dark', unelevated: true, noCaps: true },
        persistent: true,
    }).onOk(() => resolve(true)).onCancel(() => resolve(false))
})

const charge = async () => {
    if (!canCharge.value || saving.value) return
    const underpaid = remainingCup.value >= 0.01
    if (underpaid && !(await confirmUnderpayment(total.value, paidCup.value))) return
    applyExcessAsTip()
    const validPayments = payments.value.filter((p) => p.payment_method_id && Number(p.amount) > 0)
    const payload = {
        fair_day_id: fairStore.dayId,
        worker_id: workerId.value || null,
        notes: notes.value || null,
        items: cart.value.map((l) => ({ product_id: l.product.id, quantity: l.quantity })),
        payments: validPayments.map((p) => ({ payment_method_id: p.payment_method_id, amount: Number(p.amount) })),
        change: changePayload(change),
    }
    if (underpaid) payload.accept_underpayment = true
    const soldForMore = excessIsSale.value && !!tipFromExcess.value
    if (soldForMore) {
        payload.accept_overpayment = true
    } else if (withTip.value && Number(tip.amount) > 0) {
        payload.tip = {
            worker_id: tip.worker_id || workerId.value || null,
            payment_method_id: tip.payment_method_id || cashCup.value?.id,
            amount: Number(tip.amount),
        }
    }
    const tipMsg = soldForMore
        ? ` Vendida por ${money(paidCup.value)} CUP.`
        : (payload.tip ? ` Propina: ${money(payload.tip.amount)} ${methodCurrency(payload.tip.payment_method_id) || 'CUP'}` : '')
    saving.value = true
    try {
        const { data } = await api.post('Sale/Create', payload)
        Success(`${data.message}${tipMsg}`)
        resetSale()
        await loadCatalog()
        searchInput.value?.focus()
    } catch (error) {
        notifyApiError(error)
        await loadCatalog()
    } finally {
        saving.value = false
    }
}

const clearSellerAndTip = () => {
    workerId.value = null
    withTip.value = false
    tipFromSurplus.value = false
    excessIsSale.value = false
    Object.assign(tip, {
        worker_id: null,
        payment_method_id: cashCup.value?.id || methods.value[0]?.id || null,
        amount: null,
    })
    try { localStorage.removeItem('maia_pos_worker') } catch (_) { /* ignore */ }
}

/* ---------- Loading ---------- */
const loadCatalog = async () => {
    if (!fairStore.dayId) {
        products.value = []
        return
    }
    catalogLoading.value = true
    try {
        const [catalog, day] = await Promise.all([
            api.get('Product/Catalog', { params: { fair_day_id: fairStore.dayId, only_fair: onlyFair.value ? 1 : 0 } }),
            api.get(`FairDay/GetById/${fairStore.dayId}`),
        ])
        products.value = catalog.data.data || []
        dayRates.value = day.data.data || {}
        const byId = new Map(products.value.map((p) => [p.id, p]))
        cart.value = cart.value.filter((l) => byId.has(l.product.id)).map((l) => ({ product: byId.get(l.product.id), quantity: l.quantity }))
    } catch (error) {
        notifyApiError(error)
    } finally {
        catalogLoading.value = false
    }
}

const reload = async () => {
    resetSale()
    await loadCatalog()
    if (posMode.value === 'edit') closeEdit()
    if (posMode.value === 'sales' && fairStore.dayId) await loadSales()
    if (posMode.value === 'scan') resetScan(false)
    if (!fairStore.dayId && posMode.value !== 'sell') leaveSubview()
}

/* ---------- Sales of the day (in-page) ---------- */
const posMode = ref('sell') // sell | sales | edit | scan
const sales = ref([])
const salesLoading = ref(false)
const completedSales = computed(() => sales.value.filter((s) => s.status === 'completed'))
const salesTotal = computed(() => completedSales.value.reduce((t, s) => t + Number(s.total_cup), 0))
const salesCount = computed(() => completedSales.value.length)
const salesUnits = computed(() => completedSales.value
    .reduce((t, s) => t + (s.items || []).reduce((u, it) => u + Number(it.quantity || 0), 0), 0))
const salesCurrencyTotals = computed(() => {
    const map = new Map()
    for (const sale of sales.value) {
        if (sale.status !== 'completed') continue
        for (const c of saleCurrencyTotals(sale)) map.set(c.currency, round2((map.get(c.currency) || 0) + c.amount))
    }
    const rows = [...map.entries()].map(([currency, amount]) => ({ currency, amount }))
    rows.sort((a, b) => (a.currency === 'CUP' ? -1 : b.currency === 'CUP' ? 1 : a.currency.localeCompare(b.currency)))
    return rows.length ? rows : [{ currency: 'CUP', amount: 0 }]
})
const saleTime = (sale) => new Date(sale.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

const salesSearch = ref('')
const salesPayFilter = ref(null)
const salesSearchTerm = computed(() => normalize(salesSearch.value).trim())

const salePayMeta = (payment) => {
    const fromSale = payment.payment_method || {}
    const fromCatalog = methodById(payment.payment_method_id) || {}
    const id = payment.payment_method_id || fromSale.id || fromCatalog.id
    const kind = fromCatalog.kind || fromSale.kind || 'cash'
    const currency = fromSale.currency || fromCatalog.currency || 'CUP'
    const name = fromSale.name || fromCatalog.name || (kind === 'transfer' ? 'Transferencia' : `Efectivo ${currency}`)
    return {
        key: String(id || `${kind}:${currency}`),
        id,
        kind,
        currency,
        label: name,
        sort: kind === 'cash' ? 0 : 1,
    }
}
const saleHasPay = (sale, key) => (sale.payments || []).some((p) => Number(p.amount) > 0 && salePayMeta(p).key === key)

const salesPayBreakdown = computed(() => {
    const map = new Map()
    for (const sale of completedSales.value) {
        for (const p of sale.payments || []) {
            const amount = Number(p.amount || 0)
            if (amount <= 0) continue
            const meta = salePayMeta(p)
            const row = map.get(meta.key) || {
                key: meta.key,
                label: meta.label,
                kind: meta.kind,
                currency: meta.currency,
                sort: meta.sort,
                amount: 0,
                amount_cup: 0,
            }
            row.amount = round2(row.amount + amount)
            row.amount_cup = round2(row.amount_cup + amount * rate(meta.currency))
            map.set(meta.key, row)
        }
    }
    return [...map.values()].sort((a, b) => {
        if (a.sort !== b.sort) return a.sort - b.sort
        if (a.currency === 'CUP' && b.currency !== 'CUP') return -1
        if (b.currency === 'CUP' && a.currency !== 'CUP') return 1
        return a.label.localeCompare(b.label, 'es')
    })
})
const salesPayFilterOptions = computed(() => salesPayBreakdown.value.map((r) => ({
    label: `${r.label} · ${money(r.amount)} ${r.currency}`,
    value: r.key,
})))
const salesPayFilterLabel = computed(() => salesPayBreakdown.value.find((r) => r.key === salesPayFilter.value)?.label || '')

const itemMatches = (it) => {
    const term = salesSearchTerm.value
    return normalize(it.product?.code).includes(term) || normalize(it.product?.name).includes(term)
}
const filteredSales = computed(() => sales.value.filter((s) => {
    if (salesPayFilter.value && !saleHasPay(s, salesPayFilter.value)) return false
    if (salesSearchTerm.value && !(s.items || []).some(itemMatches)) return false
    return true
}))
const matchedItems = computed(() => filteredSales.value
    .filter((s) => s.status === 'completed')
    .flatMap((s) => (s.items || []).filter((it) => !salesSearchTerm.value || itemMatches(it))))
const salesFilterCount = computed(() => filteredSales.value.filter((s) => s.status === 'completed').length)
const salesSearchUnits = computed(() => matchedItems.value.reduce((t, it) => t + Number(it.quantity || 0), 0))
const salesSearchAmount = computed(() => matchedItems.value.reduce((t, it) => t + Number(it.subtotal_cup || 0), 0))

const loadSales = async () => {
    if (!fairStore.dayId) {
        sales.value = []
        return
    }
    salesLoading.value = true
    try {
        const { data } = await api.get('Sale/', { params: { fair_day_id: fairStore.dayId } })
        sales.value = data.data || []
    } catch (error) {
        notifyApiError(error)
    } finally {
        salesLoading.value = false
    }
}

const openSales = () => {
    posMode.value = 'sales'
    salesSearch.value = ''
    salesPayFilter.value = null
    loadSales()
}

const voidSale = (sale) => {
    $q.dialog({
        title: `Anular venta #${sale.number}`,
        message: 'Se devolverán los productos al inventario y se eliminará su propina. ¿Continuar?',
        cancel: { label: 'Cancelar', flat: true },
        ok: { label: 'Anular', unelevated: true, color: 'negative' },
    }).onOk(async () => {
        try {
            const { data } = await api.post(`Sale/${sale.id}/Void`)
            Success(data.message)
            await Promise.all([loadSales(), loadCatalog()])
        } catch (error) {
            notifyApiError(error)
        }
    })
}

/* ---------- Edit sale (in-page) ---------- */
const editSale = ref(null)
const posHeaderTitle = computed(() => {
    if (posMode.value === 'sales') return 'Ventas del día'
    if (posMode.value === 'edit') return `Editar venta #${editSale.value?.number || ''}`
    if (posMode.value === 'scan') return 'Escanear hoja'
    return 'Punto de venta'
})
const leaveSubview = () => {
    posMode.value = 'sell'
    editSale.value = null
    resetScan(true)
}
const closeSales = leaveSubview
const closeEdit = () => {
    posMode.value = 'sales'
    editSale.value = null
}

/* ---------- Scan sheet (local Tesseract OCR) ---------- */
const scanUnavailable = ref(false)
const scanLoading = ref(false)
const scanConfirming = ref(false)
const scanLines = ref([])
const scanToken = ref(null)
const scanWarnings = ref([])
const scanPreviewUrl = ref(null)
const scanFileInput = ref(null)
const scanProductFilter = ref('')
const scanSelectedCount = computed(() => scanLines.value.filter((l) => l.selected && l.product_id && Number(l.amount) > 0 && l.payment_method_id).length)

const resetScan = (revokePreview = true) => {
    scanLines.value = []
    scanToken.value = null
    scanWarnings.value = []
    scanLoading.value = false
    scanConfirming.value = false
    if (revokePreview && scanPreviewUrl.value) {
        URL.revokeObjectURL(scanPreviewUrl.value)
        scanPreviewUrl.value = null
    }
}

const openScan = async () => {
    if (!fairStore.dayId || fairStore.isDayClosed) return
    posMode.value = 'scan'
    resetScan(true)
    try {
        const { data } = await api.get('Sale/ScanSheet/Status')
        scanUnavailable.value = !data.data?.available
        if (scanUnavailable.value) {
            scanWarnings.value = ['Instale Tesseract OCR en este PC para leer la hoja (docs/POS_SCAN_HOJA.md).']
        }
    } catch (error) {
        scanUnavailable.value = true
        notifyApiError(error)
    }
}

const pickScanImage = () => scanFileInput.value?.click()

const onScanFileChosen = async (ev) => {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (!file || !fairStore.dayId) return
    if (scanPreviewUrl.value) URL.revokeObjectURL(scanPreviewUrl.value)
    scanPreviewUrl.value = URL.createObjectURL(file)
    scanLoading.value = true
    scanWarnings.value = []
    scanLines.value = []
    try {
        const form = new FormData()
        form.append('fair_day_id', fairStore.dayId)
        form.append('image', file)
        const { data } = await api.post('Sale/ScanSheet', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 180000,
        })
        scanToken.value = data.data?.scan_token || null
        scanLines.value = (data.data?.lines || []).map((l) => {
            const line = { ...l, extra_payments: (l.extra_payments || []).map((p) => ({ ...p })) }
            const read = l.product_id ? [{ product_id: l.product_id, code: l.product_code, name: l.product_name }] : []
            line.suggestions = [...read, ...(l.suggestions || [])]
            line.selected = scanCheck(line).status === 'ok'
            return line
        })
        scanWarnings.value = data.data?.warnings || []
        if (data.message) Success(data.message)
    } catch (error) {
        if (error?.response?.status === 503) {
            scanUnavailable.value = true
            scanWarnings.value = [error.response.data?.message || 'Tesseract no disponible.']
        } else {
            notifyApiError(error)
        }
    } finally {
        scanLoading.value = false
    }
}

const scanProductOptions = (line) => {
    const q = String(scanProductFilter.value || '').toLowerCase()
    const list = products.value
        .filter((p) => !q || String(p.code).includes(q) || p.name.toLowerCase().includes(q))
        .slice(0, 80)
        .map((p) => ({ label: `${p.code} · ${p.name}`, value: p.id }))
    if (line.product_id && !list.some((o) => o.value === line.product_id)) {
        const p = products.value.find((x) => x.id === line.product_id)
        if (p) list.unshift({ label: `${p.code} · ${p.name}`, value: p.id })
    }
    return list
}

const filterScanProducts = (val, update) => {
    update(() => { scanProductFilter.value = val || '' })
}

const onScanProductPicked = (line, productId) => {
    const p = products.value.find((x) => x.id === productId)
    if (!p) return
    line.product_code = p.code
    line.product_name = p.name
    line.catalog_price_cup = Number(p.price_cup)
    if (!(line.amount > 0) || (line.amount_from_catalog && !line.extra_payments?.length)) {
        line.unit_price = Number(p.price_cup)
        line.amount = round2(line.unit_price * (Number(line.quantity) || 1))
    }
    line.selected = scanCheck(line).status === 'ok'
}

/** Other codes the reader considered, and products whose price matches what was charged. None once the line checks out. */
const scanSuggestions = (line) => {
    if (scanCheck(line).status === 'ok') return []
    return (line.suggestions || []).filter((s) => s.product_id !== line.product_id)
}

const pickScanSuggestion = (line, productId) => {
    line.product_id = productId
    onScanProductPicked(line, productId)
}

const scanLinePayments = (line) => [
    { payment_method_id: line.payment_method_id, amount: Number(line.amount) },
    ...(line.extra_payments || []).map((p) => ({ payment_method_id: p.payment_method_id, amount: Number(p.amount) })),
].filter((p) => p.payment_method_id && p.amount > 0)

/** Row summary with the values as currently edited (not the raw OCR reading). */
const scanSummary = (line) => {
    if (!line.scan_row) return line.raw || ''
    const qty = Math.max(1, Math.floor(Number(line.quantity) || 1))
    const paid = scanLinePayments(line).map((p) => `${methodCurrency(p.payment_method_id) || 'CUP'} ${money(p.amount)}`)
    return [`Fila ${line.scan_row}`, `Cód ${line.product_code || '?'}`, `Cant ${qty}`, ...paid].join(' · ')
}

const scanLineTotalCup = (line) => round2(scanLinePayments(line).reduce((sum, p) => {
    const currency = methodCurrency(p.payment_method_id) || 'CUP'
    return sum + (currency === 'CUP' ? p.amount : p.amount * rate(currency))
}, 0))

const SCAN_STATUS = {
    ok: { label: 'OK', color: 'positive', text: 'positive' },
    mismatch: { label: 'Revisar', color: 'warning', text: 'orange-9' },
    error: { label: 'Error', color: 'negative', text: 'negative' },
}
/** Converting foreign currency can leave a few cents of difference against the catalog price. */
const SCAN_TOLERANCE_CUP = 1

/** Charged amount (all payments in CUP) against catalog price × quantity, like a regular sale. */
const scanCheck = (line) => {
    const product = products.value.find((p) => p.id === line.product_id)
    if (!product) return { status: 'error', message: 'Elija el producto para comparar lo cobrado con su precio.' }
    const paid = scanLinePayments(line)
    const charged = scanLineTotalCup(line)
    if (!paid.length || !(charged > 0)) return { status: 'error', message: 'Falta el importe cobrado y su forma de pago.' }

    const qty = Math.max(1, Math.floor(Number(line.quantity) || 1))
    const expected = round2(qty * Number(product.price_cup))
    const paidText = paid.map((p) => `${money(p.amount)} ${methodCurrency(p.payment_method_id) || 'CUP'}`).join(' + ')
    const converted = paid.length > 1 || paid.some((p) => (methodCurrency(p.payment_method_id) || 'CUP') !== 'CUP')
    const detail = `Precio: ${qty} × ${money(product.price_cup)} = ${money(expected)} CUP · Cobrado: ${paidText}`
        + (converted ? ` = ${money(charged)} CUP` : '')
    const diff = round2(charged - expected)
    if (line.amount_from_catalog) {
        return { status: 'mismatch', message: `${detail} · No se leyó lo cobrado en la hoja: se puso el precio del catálogo` }
    }
    if (Math.abs(diff) <= SCAN_TOLERANCE_CUP) return { status: 'ok', message: `${detail} · Exacto` }
    if (diff < 0) return { status: 'mismatch', message: `${detail} · Falta ${money(-diff)} CUP` }
    const tipPlan = excessTip(paid, expected)
    const tipText = `A propina ${money(tipPlan.amount)} ${tipPlan.currency}`
    if (!line.worker_id) return { status: 'mismatch', message: `${detail} · ${tipText}: elija el vendedor` }
    return { status: 'ok', message: `${detail} · ${tipText}`, tip: tipPlan }
}

const syncScanUnitPrice = (line) => {
    line.amount_from_catalog = false
    const qty = Math.max(1, Math.floor(Number(line.quantity) || 1))
    line.unit_price = round2(scanLineTotalCup(line) / qty)
    if (scanCheck(line).status === 'ok') line.selected = true
}

const syncScanAmount = (line) => {
    line.quantity = Math.max(1, Math.floor(Number(line.quantity) || 1))
    if (line.extra_payments?.length) {
        syncScanUnitPrice(line)
    } else if (line.unit_price > 0) {
        line.amount = round2(line.unit_price * line.quantity)
    } else if (line.amount > 0) {
        line.unit_price = round2(line.amount / line.quantity)
    }
}

const addScanPayment = (line) => {
    if (!line.extra_payments) line.extra_payments = []
    const used = new Set([line.payment_method_id, ...line.extra_payments.map((p) => p.payment_method_id)])
    const next = methodOptions.value.find((o) => !used.has(o.value))
    line.extra_payments.push({ payment_method_id: next?.value ?? null, amount: null })
}

const confirmScanLines = async () => {
    const rows = scanLines.value.filter((l) => l.selected && l.product_id && Number(l.amount) > 0 && l.payment_method_id)
    if (!rows.length) return
    scanConfirming.value = true
    let ok = 0
    const errors = []
    const learnRows = []
    for (const line of rows) {
        const qty = Math.max(1, Math.floor(Number(line.quantity) || 1))
        const payments = scanLinePayments(line)
        const check = scanCheck(line)
        const unitPrice = check.tip
            ? Number(products.value.find((p) => p.id === line.product_id)?.price_cup)
            : round2(scanLineTotalCup(line) / qty)
        try {
            await api.post('Sale/Create', {
                fair_day_id: fairStore.dayId,
                worker_id: line.worker_id || null,
                notes: scanSummary(line) ? `Hoja: ${scanSummary(line).slice(0, 200)}` : 'Importado desde hoja',
                items: [{ product_id: line.product_id, quantity: qty, unit_price: unitPrice }],
                payments,
                ...(check.tip ? {
                    tip: {
                        worker_id: line.worker_id,
                        payment_method_id: check.tip.payment_method_id,
                        amount: check.tip.amount,
                    },
                } : {}),
            })
            ok += 1
            line.selected = false
            line._done = true
            if (line.scan_row && /^\d+$/.test(String(line.product_code || ''))) {
                learnRows.push({ row: line.scan_row, code: String(line.product_code), quantity: qty })
            }
        } catch (error) {
            const msg = error?.response?.data?.message
                || error?.response?.data?.errors?.items?.[0]
                || error?.response?.data?.errors?.payments?.[0]
                || `Error en código ${line.product_code || line.product_id}`
            errors.push(typeof msg === 'string' ? msg : JSON.stringify(msg))
        }
    }
    scanLines.value = scanLines.value.filter((l) => !l._done)
    if (scanToken.value && learnRows.length) {
        api.post('Sale/ScanSheet/Learn', { scan_token: scanToken.value, rows: learnRows }).catch(() => {})
    }
    await loadCatalog()
    scanConfirming.value = false
    if (ok) Success(`${ok} venta(s) registrada(s).`)
    if (errors.length) {
        $q.notify({ type: 'warning', message: errors.slice(0, 3).join(' · '), timeout: 5000, multiLine: true })
    }
    if (!scanLines.value.length && ok) leaveSubview()
}

const editSaving = ref(false)
const editCart = ref([])
const editOriginalQty = ref({})
const editPayments = ref([])
const editWorkerId = ref(null)
const editNotes = ref('')
const editWithTip = ref(false)
const editExcessIsSale = ref(false)
const editTip = reactive({ worker_id: null, payment_method_id: null, amount: null })
const editAddProductId = ref(null)

const editProductOptions = computed(() => products.value.map((p) => ({
    label: `${p.code} · ${p.name} (stock ${p.stock + (editOriginalQty.value[p.id] || 0)})`,
    value: p.id,
})))

const editMaxQty = (line) => {
    const p = products.value.find((x) => x.id === line.product_id)
    const stock = Number(p?.stock || 0)
    return Math.max(1, stock + Number(editOriginalQty.value[line.product_id] || 0))
}

/** Line total is stored apart from unit×qty so cents that don't divide evenly (9500/3) don't invent +0.01. */
const editLineTotal = (line) => (line.line_total != null
    ? Number(line.line_total)
    : round2(Number(line.quantity || 0) * Number(line.unit_price || 0)))
const syncEditLineTotal = (line) => {
    line.line_total = round2(Number(line.quantity || 0) * Number(line.unit_price || 0))
}
const editTotal = computed(() => round2(editCart.value.reduce((s, l) => s + editLineTotal(l), 0)))
const editChange = reactive(emptyChange())
const editPayList = computed(() => [...editPayments.value, ...changeRows(editChange)])
const editReceivedCup = computed(() => receivedCupOf(editPayments.value))
const editShowChange = computed(() => editChange.enabled || editReceivedCup.value - editTotal.value > 0.009)
const editPaidCup = computed(() => round2(editPayList.value.reduce((s, p) => s + paymentCup(p), 0)))
const editRemaining = computed(() => Math.max(0, round2(editTotal.value - editPaidCup.value)))
const editTipFromExcess = computed(() => excessTip(editPayList.value, editTotal.value))
const editPaidByCurrency = computed(() => paidByCurrencyOf(editPayments.value))
const editPaidDisplay = computed(() => formatPaid(editPaidByCurrency.value))
const editShowPaidCupEquiv = computed(() => editPaidByCurrency.value.some((r) => r.currency !== 'CUP'))
const editPayCheckClass = computed(() => {
    if (!(editTotal.value > 0) || !(editPaidCup.value > 0)) return 'text-grey-8'
    return editRemaining.value > 0.009 ? 'text-negative' : 'text-positive'
})

const applyEditExcessAsTip = () => {
    const plan = editTipFromExcess.value
    if (!plan) {
        editExcessIsSale.value = false
        editWithTip.value = false
        editTip.amount = null
        return
    }
    if (editExcessIsSale.value) return
    editWithTip.value = true
    const keepMethod = editTip.payment_method_id && (methodCurrency(editTip.payment_method_id) || 'CUP') === plan.currency
    if (!keepMethod) editTip.payment_method_id = plan.payment_method_id || cashCup.value?.id || editTip.payment_method_id
    editTip.amount = plan.amount
}

const setEditWithTip = (value) => {
    editWithTip.value = value
    editExcessIsSale.value = !value && !!editTipFromExcess.value
    if (value) applyEditExcessAsTip()
}

watch([editTipFromExcess, editPaidCup], () => {
    if (posMode.value === 'edit') applyEditExcessAsTip()
})

const canSaveEdit = computed(() => {
    if (!editCart.value.length || !(editPaidCup.value > 0) || editSaving.value) return false
    if (editTipFromExcess.value && !editExcessIsSale.value) {
        if (!editWorkerId.value && !editTip.worker_id) return false
    }
    return editPayments.value.some((p) => p.payment_method_id && Number(p.amount) > 0)
})

const changeEditQty = (line, delta) => {
    line.quantity = Math.min(editMaxQty(line), Math.max(1, Number(line.quantity || 0) + delta))
    syncEditLineTotal(line)
}
const normalizeEditQty = (line) => {
    line.quantity = Math.min(editMaxQty(line), Math.max(1, Math.floor(Number(line.quantity) || 1)))
    syncEditLineTotal(line)
}
const removeEditLine = (line) => {
    editCart.value = editCart.value.filter((l) => l !== line)
}
const addEditProduct = (productId) => {
    if (!productId) return
    const existing = editCart.value.find((l) => l.product_id === productId)
    if (existing) {
        if (existing.quantity < editMaxQty(existing)) {
            existing.quantity++
            syncEditLineTotal(existing)
        }
    } else {
        const p = products.value.find((x) => x.id === productId)
        if (!p) return
        const max = Number(p.stock || 0) + Number(editOriginalQty.value[p.id] || 0)
        if (max < 1) {
            $q.notify({ type: 'warning', message: `Sin existencia de ${p.name}`, timeout: 1500 })
        } else {
            const unit = Number(p.price_cup)
            editCart.value.push({
                product_id: p.id,
                code: p.code,
                name: p.name,
                quantity: 1,
                unit_price: unit,
                line_total: round2(unit),
            })
        }
    }
    editAddProductId.value = null
}

const openEditSale = async (sale) => {
    await loadCatalog()
    editSale.value = sale
    const originals = {}
    editCart.value = (sale.items || []).map((it) => {
        originals[it.product_id] = (originals[it.product_id] || 0) + Number(it.quantity)
        const quantity = Number(it.quantity)
        const unit = Number(it.unit_price_cup)
        // Prefer the stored line total: unit × qty can invent an extra cent when cents don't divide evenly.
        const lineTotal = it.subtotal_cup != null ? round2(Number(it.subtotal_cup)) : round2(quantity * unit)
        return {
            product_id: it.product_id,
            code: it.product?.code || '',
            name: it.product?.name || 'Producto',
            quantity,
            unit_price: unit,
            line_total: lineTotal,
        }
    })
    editOriginalQty.value = originals
    editWorkerId.value = sale.worker_id || null
    editNotes.value = sale.notes || ''
    const received = (sale.payments || [])
        .filter((p) => Number(p.amount) > 0)
        .map((p) => ({ payment_method_id: p.payment_method_id, amount: Number(p.amount) }))
    // If a past rounding left the sale 1 cent above what was paid, snap the last line to the payments.
    const paidNow = round2(received.reduce((s, p) => s + paymentCup(p), 0))
    const linesNow = round2(editCart.value.reduce((s, l) => s + editLineTotal(l), 0))
    if (editCart.value.length && Math.abs(round2(linesNow - paidNow)) === 0.01) {
        const last = editCart.value[editCart.value.length - 1]
        last.line_total = round2(editLineTotal(last) - (linesNow - paidNow))
        last.unit_price = last.quantity ? round2(last.line_total / last.quantity) : last.unit_price
    }
    const changeRow = (sale.payments || []).find((p) => Number(p.amount) < 0)
    Object.assign(editChange, changeRow
        ? { enabled: true, payment_method_id: changeRow.payment_method_id, amount: -Number(changeRow.amount) }
        : emptyChange())
    // Payments are stored net of the tip; show what was actually received so the tip is the excess again.
    const tipRow = (sale.tips || [])[0]
    if (tipRow && Number(tipRow.amount) > 0) {
        const same = received.find((p) => p.payment_method_id === tipRow.payment_method_id)
        if (same) same.amount = round2(same.amount + Number(tipRow.amount))
        else received.push({ payment_method_id: tipRow.payment_method_id, amount: Number(tipRow.amount) })
    }
    editPayments.value = received.length ? received : [{ payment_method_id: methods.value[0]?.id || null, amount: null }]
    editWithTip.value = !!tipRow
    editExcessIsSale.value = false
    Object.assign(editTip, {
        worker_id: tipRow?.worker_id || sale.worker_id || null,
        payment_method_id: tipRow?.payment_method_id || cashCup.value?.id || methods.value[0]?.id || null,
        amount: tipRow ? Number(tipRow.amount) : null,
    })
    posMode.value = 'edit'
}

const saveEditSale = async () => {
    if (!canSaveEdit.value || !editSale.value) return
    const editUnderpaid = editRemaining.value >= 0.01
    if (editUnderpaid && !(await confirmUnderpayment(editTotal.value, editPaidCup.value))) return
    const editSoldForMore = editExcessIsSale.value && !!editTipFromExcess.value
    if (editTipFromExcess.value && !editSoldForMore) {
        editWithTip.value = true
        editTip.payment_method_id = editTipFromExcess.value.payment_method_id || cashCup.value?.id || editTip.payment_method_id
        if (!(Number(editTip.amount) > 0)) editTip.amount = editTipFromExcess.value.amount
    }
    const payload = {
        worker_id: editWorkerId.value || null,
        notes: editNotes.value || null,
        items: editCart.value.map((l) => {
            const quantity = Number(l.quantity)
            const subtotal = editLineTotal(l)
            return {
                product_id: l.product_id,
                quantity,
                unit_price: quantity ? subtotal / quantity : Number(l.unit_price),
                subtotal_cup: subtotal,
            }
        }),
        payments: editPayments.value
            .filter((p) => p.payment_method_id && Number(p.amount) > 0)
            .map((p) => ({ payment_method_id: p.payment_method_id, amount: Number(p.amount) })),
        change: changePayload(editChange),
    }
    if (editUnderpaid) payload.accept_underpayment = true
    if (editSoldForMore) {
        payload.accept_overpayment = true
    } else if (editWithTip.value && Number(editTip.amount) > 0) {
        payload.tip = {
            worker_id: editTip.worker_id || editWorkerId.value || null,
            payment_method_id: editTip.payment_method_id || cashCup.value?.id,
            amount: Number(editTip.amount),
        }
    }
    editSaving.value = true
    try {
        const { data } = await api.put(`Sale/Update/${editSale.value.id}`, payload)
        Success(data.message)
        await Promise.all([loadSales(), loadCatalog()])
        closeEdit()
    } catch (error) {
        notifyApiError(error)
        await loadCatalog()
    } finally {
        editSaving.value = false
    }
}

onMounted(async () => {
    try {
        const [m, w] = await Promise.all([api.get('PaymentMethod', { params: { active: 1 } }), api.get('Worker/')])
        methods.value = m.data.data || []
        workers.value = Array.isArray(w.data) ? w.data : w.data.data || []
    } catch (error) {
        notifyApiError(error)
    }
    resetSale()
    clearSellerAndTip()
})

onActivated(() => {
    clearSellerAndTip()
})
</script>

<style scoped lang="scss">
.maia-page--pos {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 64px);
    max-height: calc(100dvh - 64px);
    overflow: hidden;
    padding-bottom: 10px;
    box-sizing: border-box;
}

.pos-sales-btn {
    height: 40px;
    min-height: 40px;
    padding: 0 14px;
}

.pos-row {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
}

.pos-col {
    display: flex;
    min-height: 0;
    height: 100%;
}

.pos-panel {
    width: 100%;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.pos-panel--checkout {
    .pos-checkout-scroll {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
    }

    .pos-actions {
        flex-shrink: 0;
        border-top: 1px solid var(--app-gold-line);
    }
}

.pos-toolbar {
    gap: 8px;
}

.pos-search {
    min-width: 0;
}

.pos-search :deep(.q-field__control),
.pos-search :deep(.q-field__marginal) {
    height: 38px;
    min-height: 38px;
}

.pos-toolbar-btn {
    height: 38px;
    min-height: 38px;
}

.pos-view-toggle {
    height: 38px;
    border: 1px solid rgba(var(--maia-wine-rgb), 0.45);
    border-radius: 10px;
    overflow: hidden;

    :deep(.q-btn) {
        height: 36px;
        min-height: 36px;
        border-radius: 0;
    }
}

body.body--dark .pos-view-toggle {
    border-color: rgba(232, 165, 174, 0.45);
}

.pos-list-item {
    border-radius: 8px;
    min-height: 44px;
    padding: 4px 8px;

    &:hover {
        background: rgba(var(--maia-gold-light-rgb), 0.1);
    }

    &__code {
        min-width: 44px;
        padding-right: 8px;
    }

    &__name {
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__price {
        align-items: flex-end;
        text-align: right;

        .text-primary.text-weight-bold {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 0.98rem;
        }
    }
}

body.body--dark .pos-list-item__price .text-primary.text-weight-bold {
    color: var(--maia-gold-bright) !important;
}

.pos-chip {
    height: 28px;
    max-width: 180px;
}

.pos-chip :deep(.q-chip__content) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pos-field {
    width: 100%;
}

.pos-field :deep(.q-field__control),
.pos-field :deep(.q-field__marginal) {
    height: 36px;
    min-height: 36px;
}

.pos-field :deep(.q-field__native),
.pos-field :deep(.q-field__prefix),
.pos-field :deep(.q-field__suffix),
.pos-field :deep(.q-field__input) {
    min-height: 36px;
    padding-top: 0;
    padding-bottom: 0;
}

.pos-field :deep(.q-field__native),
.pos-field :deep(input::placeholder) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pos-pay-row {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(108px, 0.85fr) auto;
    gap: 8px;
    align-items: center;
}

.pos-pay-check {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 4px 12px;
    margin-top: 4px;
}

.pos-pay-method,
.pos-pay-amount {
    min-width: 0;
}

.pos-pay-method :deep(.q-field__native) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pos-pay-actions {
    flex-shrink: 0;
}

.pos-tip-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 8px;
}

.pos-amount-input :deep(input[type='number']) {
    padding-right: 0 !important;
}

/* Space between the typed number and the spin arrows (not before the currency) */
.pos-amount-input :deep(input[type='number']::-webkit-outer-spin-button),
.pos-amount-input :deep(input[type='number']::-webkit-inner-spin-button) {
    margin: 0 0 0 12px;
    opacity: 1;
}

.pos-amount-input :deep(.q-field__suffix) {
    padding-left: 4px;
}

.pos-grid-wrap {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
}

.pos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
    gap: 6px;
}

.pos-product {
    border-radius: 12px;
    border-color: rgba(var(--maia-gold-rgb), 0.22);
    background: var(--app-card-bg);
    transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;

    &:hover {
        border-color: var(--maia-gold-light);
        box-shadow: 0 0 0 1px var(--maia-gold-light), 0 10px 22px rgba(var(--maia-wine-deep-rgb), 0.14);
        transform: translateY(-2px);
    }

    .text-primary.text-weight-bold {
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 1.02rem;
    }

    &--empty {
        opacity: 0.45;
    }

    &__name {
        font-weight: 500;
        line-height: 1.15;
        min-height: 2.2em;
        margin: 2px 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-size: 0.9rem;
    }
}

.pos-cart {
    max-height: min(140px, 18vh);
    overflow-y: auto;
    flex-shrink: 0;
}

.pos-total {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.45rem;
    font-weight: 700;
    line-height: 1.1;
    color: var(--q-primary);

    &__cur {
        font-family: 'Inter', sans-serif;
        font-size: 0.85rem;
        font-weight: 600;
        letter-spacing: 0.12em;
        color: var(--maia-gold);
    }
}

body.body--dark .pos-total {
    color: var(--maia-gold-bright);
}

body.body--dark .pos-product {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(var(--maia-gold-light-rgb), 0.18);

    &:hover {
        background: rgba(var(--maia-gold-light-rgb), 0.06);
        box-shadow: 0 0 0 1px var(--maia-gold-light), 0 10px 22px rgba(0, 0, 0, 0.4);
    }

    .text-primary.text-weight-bold {
        color: var(--maia-gold-bright) !important;
    }
}

body.body--dark .pos-panel--checkout .pos-actions {
    border-top-color: rgba(var(--maia-gold-light-rgb), 0.18);
}

.pos-charge {
    min-width: 150px;
    border-radius: 12px;
    letter-spacing: 0.04em;
    box-shadow: 0 8px 18px rgba(var(--maia-wine-rgb), 0.28), 0 0 0 1px rgba(var(--maia-gold-light-rgb), 0.55) !important;
}

@media (max-width: 1023px) {
    .maia-page--pos {
        height: auto;
        max-height: none;
        overflow: visible;
    }

    .pos-row,
    .pos-col,
    .pos-panel,
    .pos-subview {
        height: auto;
        min-height: 0;
        overflow: visible;
    }

    .pos-subview__body {
        overflow: visible;
    }

    .pos-grid-wrap {
        max-height: 50vh;
        min-height: 220px;
    }

    .pos-panel--checkout .pos-checkout-scroll {
        overflow: visible;
    }

    .pos-cart {
        max-height: 180px;
    }

    .pos-sale-row {
        flex-direction: column;
        align-items: stretch;

        &__side {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            width: 100%;
        }
    }
}

@media (min-width: 1024px) and (max-height: 820px) {
    .pos-cart {
        max-height: min(100px, 14vh);
    }

    .pos-field :deep(.q-field__control),
    .pos-field :deep(.q-field__marginal) {
        height: 34px;
        min-height: 34px;
    }
}

.pos-subview {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.pos-sales-panel,
.pos-edit-panel,
.pos-scan-panel {
    flex: 1 1 auto;
}

.pos-scan-body {
    padding: 12px 16px 16px;
}

.pos-scan-preview {
    max-height: 180px;
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid rgba(var(--maia-gold-rgb), 0.25);

    img {
        display: block;
        width: 100%;
        max-height: 180px;
        object-fit: contain;
        background: brand-a(gold-pale, 0.35);
    }
}

.pos-scan-line {
    display: grid;
    grid-template-columns: auto minmax(110px, 0.9fr) minmax(160px, 1.4fr) 72px 110px minmax(120px, 1fr) auto;
    gap: 8px;
    align-items: start;
    padding: 10px 8px;
    border-bottom: 1px solid rgba(var(--maia-gold-rgb), 0.14);

    &__raw {
        grid-column: 1 / -1;
        padding-left: 36px;
    }

    &__preview {
        grid-column: 1 / -1;
        overflow-x: auto;
        border-radius: 8px;
        border: 1px solid rgba(var(--maia-gold-rgb), 0.25);
        background: #fff;

        img {
            display: block;
            height: 56px;
            max-width: none;
        }
    }

    &__extra {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: subgrid;
        align-items: center;
    }

    &__extra-label {
        grid-column: 2 / 5;
        justify-self: end;
    }

    &__extra-amount {
        grid-column: 5;
    }

    &__extra-pay {
        grid-column: 6;
    }

    &__extra-remove {
        grid-column: 7;
    }

    &__check {
        grid-column: 1 / -1;
        padding-left: 36px;
    }

    &__suggest {
        grid-column: 1 / -1;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 2px 4px;
        padding-left: 36px;
    }

    &__meta {
        display: flex;
        align-items: center;
        gap: 4px;
        padding-top: 4px;
    }

    &--error {
        background: rgba(179, 38, 30, 0.06);
    }

    &--mismatch {
        background: rgba(224, 165, 38, 0.08);
    }
}

@media (max-width: 1023px) {
    .pos-scan-line {
        grid-template-columns: auto 1fr 1fr;
        grid-template-areas:
            'preview preview preview'
            'check worker meta'
            'product product product'
            'qty amount pay';

        &__preview { grid-area: preview; }
        > .q-checkbox { grid-area: check; }
        &__worker { grid-area: worker; }
        &__meta { grid-area: meta; justify-self: end; }
        &__product { grid-area: product; }
        &__qty { grid-area: qty; }
        &__amount { grid-area: amount; }
        &__pay { grid-area: pay; }
        &__extra-label { display: none; }
        &__extra-remove { grid-column: 1; }
        &__extra-amount { grid-column: 2; }
        &__extra-pay { grid-column: 3; }
        &__check,
        &__suggest,
        &__raw { padding-left: 0; }
    }
}

.pos-subview__bar {
    flex-shrink: 0;
    gap: 12px;
}

.pos-subview__body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    position: relative;
}

.pos-sales-list {
    padding: 4px 0;
}

.pos-sale-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(var(--maia-gold-rgb), 0.14);
    transition: background 0.15s;

    &:hover {
        background: brand-a(gold-pale, 0.35);
    }

    &--void {
        opacity: 0.62;
    }

    &__main {
        min-width: 0;
        flex: 1 1 auto;
    }

    &__items {
        margin-top: 4px;
        color: var(--app-text-muted, #666);
        line-height: 1.35;
    }

    &__pays {
        margin-top: 2px;
    }

    &__side {
        flex: 0 0 auto;
        text-align: right;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
    }

    &__amount {
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }
}

body.body--dark .pos-sale-row:hover {
    background: brand-a(gold, 0.08);
}

.pos-sale-row__pay-amount {
    font-size: 1.08em;
    font-weight: 700;
    color: var(--maia-wine);
    font-variant-numeric: tabular-nums;
}

body.body--dark .pos-sale-row__pay-amount {
    color: var(--maia-gold-bright);
}

.pos-sale-row__amount--done {
    color: var(--maia-ink);
}

.pos-sales-total__amounts {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    column-gap: 6px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.pos-sales-total__plus {
    margin-right: 6px;
    opacity: 0.6;
}

.pos-sales-pays {
    padding-top: 0;
}

.pos-sales-pays__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.pos-sales-pay {
    appearance: none;
    border: 1px solid brand-a(wine, 0.18);
    background: brand-a(ivory, 0.04);
    color: inherit;
    border-radius: 10px;
    padding: 8px 12px;
    text-align: left;
    cursor: pointer;
    min-width: 132px;
    transition: border-color 0.15s ease, background 0.15s ease;
}

.pos-sales-pay:hover {
    border-color: brand-a(gold, 0.55);
}

.pos-sales-pay--active {
    border-color: var(--maia-gold);
    background: brand-a(gold, 0.12);
}

body.body--dark .pos-sales-pay {
    border-color: brand-a(gold-pale, 0.16);
    background: brand-a(dark, 0.35);
}

body.body--dark .pos-sale-row__amount--done {
    color: var(--maia-ivory);
}

.edit-sale-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
}

.edit-sale-block {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.edit-sale-block__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.edit-sale-add {
    width: 210px;
    max-width: 55%;
}

.edit-sale-lines {
    border: 1px solid rgba(var(--maia-gold-rgb), 0.22);
    border-radius: 10px;
    overflow: hidden;
}

.edit-sale-line {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto 118px auto;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-bottom: 1px solid rgba(var(--maia-gold-rgb), 0.12);

    &:last-child {
        border-bottom: 0;
    }
}

.edit-sale-line__info {
    min-width: 0;
}

.edit-sale-line__code {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--q-primary);
}

.edit-sale-line__name {
    font-size: 0.86rem;
    line-height: 1.2;
}

.edit-sale-line__qty {
    display: flex;
    align-items: center;
    gap: 2px;
}

.edit-sale-qty {
    width: 52px;
}

.edit-sale-price {
    width: 118px;
}

.edit-sale-total {
    text-align: right;
    font-weight: 600;
    font-size: 1rem;
}

.edit-sale-pay {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 130px auto;
    align-items: center;
    gap: 8px;
}

.edit-sale-pay__method {
    min-width: 0;
}

.edit-sale-pay__amount {
    width: 130px;
}

.edit-sale-tip {
    display: grid;
    grid-template-columns: auto 130px minmax(0, 1fr) minmax(0, 1fr);
    align-items: center;
    gap: 8px;
}

@media (max-width: 560px) {
    .edit-sale-line {
        grid-template-columns: minmax(0, 1fr) auto;
        grid-template-areas:
            'info del'
            'qty price';
    }

    .edit-sale-line__info { grid-area: info; }
    .edit-sale-line__qty { grid-area: qty; }
    .edit-sale-price { grid-area: price; width: 100%; }
    .edit-sale-line > .q-btn { grid-area: del; justify-self: end; }

    .edit-sale-pay,
    .edit-sale-tip {
        grid-template-columns: 1fr;
    }

    .edit-sale-pay__amount,
    .edit-sale-add {
        width: 100%;
        max-width: none;
    }
}
</style>
