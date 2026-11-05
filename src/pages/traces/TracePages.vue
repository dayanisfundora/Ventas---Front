<template>
    <div class="q-pa-xl">
        <q-breadcrumbs class="qb cursor-pointer q-pb-md">
            <q-breadcrumbs-el label="Inicio" icon="home" @click="router.push('/Inicio')" />
            <q-breadcrumbs-el label="Trazas" />
        </q-breadcrumbs>
        <q-table class="q-pa-md" :filter="filter" title="Útiles" :rows="items" :columns="columns" row-key="id"
            v-model:pagination="pagination" @request="onRequest" :rows-per-page-options="[5, 20, 50, 100]"
            no-data-label="No hay elementos disponibles" no-results-label="No hay elementos disponibles"
            loading-label="Cargando..." rows-per-page-label="Filas por página">
            <template v-slot:top>
                <div class="col-4 q-table__title">
                    <span>Trazas</span>
                    <q-input outline color="primary" flat v-model="filter" debounce="500" label="Buscar" />
                </div>
                <q-space />

                <q-btn outline class="bg-white q-ml-sm" style="width: 20px" color="primary" icon="file_upload"
                    @click="PrintToPdf()" :disable="!printEnabled">
                    <q-tooltip class="bg-primary" :offset="[10, 10]" transition-show="flip-right"
                        transition-hide="flip-left">
                        Exportar
                    </q-tooltip>
                </q-btn>
            </template>
            <template v-slot:body-cell-supervisora="props">
                <q-td :props="props">
                    <q-icon name="done" v-if="props.value == 0" style="color: #bdbdbd" size="25px" />
                    <q-icon name="done" v-else style="color: #3a7779" size="25px" />
                </q-td>
            </template>
            <template v-slot:body-cell-state="props">
                <q-td :props="props">
                    <q-icon flat :name="(props.value == 0) ? 'highlight_off' : 'check_circle'"
                        :class="(props.value == 0) ? 'text-grey' : 'text-primary'" size="20px" />
                </q-td>
            </template>
            <template v-slot:body-cell-action="props">
                <q-td :props="props">
                    <div class="q-gutter-sm">
                        <q-btn flat dense size="sm" @click="openDetailDialog(props.row.id)" text-color="primary"
                            icon="visibility">
                            <q-tooltip class="bg-primary" :offset="[10, 10]" transition-show="flip-right"
                                transition-hide="flip-left">Ver detalles</q-tooltip>
                        </q-btn>
                    </div>
                </q-td>
            </template>
        </q-table>
    </div>

    <!-- DIALOGS -->
    <DialogLoad :dialogLoad="dialogLoad" />

    <!-- Add & Delete -->
    <q-dialog v-model="dialog" persistent>
        <q-card class="app-card">
            <header class="q-pa-sm bg-primary">
                <q-toolbar>
                    <q-toolbar-title class="text-subtitle6 text-white">
                        {{
                            object?.id ? "Ver Trazas" : "No"
                        }}</q-toolbar-title>
                </q-toolbar>
            </header>
            <q-form @submit.prevent="save()" @reset="close" ref="myForm">
                <div class="h row q-ma-md">
                    <q-input outlined class="col-xs-12 q-pt-md" label="Codigo *" v-model="object.code" color="primary"
                        counter maxlength="5" :rules="[onlyLetter_Number, string, (val) =>
                            (items.length > 0
                                ? !isValueRepeated(val, 'code', object, items)
                                : true) || 'Ya existe un código  con ese valor',]" dense readonly disable />
                    <q-input outlined class="col-xs-12 q-pt-md" label="Descripción *" v-model="object.description"
                        color="primary" counter maxlength="60" :rules="[onlyLetter_Number, string, (val) =>
                            (items.length > 0
                                ? !isValueRepeated(val, 'description', object, items)
                                : true) || 'Ya existe una descripción  con ese valor',]" dense />
                    <div class="col-6 col-sm-2 q-pt-md" v-if="object.id">
                        <div>
                            <q-checkbox right-label v-model="object.state" label="Activo" dense />
                        </div>
                    </div>
                    <q-card-actions class="col-12 q-mt-md justify-end">
                        <q-btn class="text-white q-px-md q-py-sm shadow-3 text-body1" color="primary" type="submit"
                            icon="save" no-caps size="md" label="Guardar" :disable="!areAllFieldsFilled(object.id)" />
                        <q-btn outline class="q-px-xl q-py-sm shadow-3 text-body1" color="primary" type="reset"
                            icon="cancel" no-caps size="md" label="Cancelar" />
                    </q-card-actions>
                </div>
            </q-form>
        </q-card>
    </q-dialog>

    <!-- MODAL DE DETALLES DE TRAZA -->
    <q-dialog v-model="detailDialog" persistent>
        <q-card class="app-card modal-compact">
            <!-- Header simplificado -->
            <header class="bg-primary">
                <q-toolbar class="q-py-sm">
                    <q-toolbar-title class="text-subtitle1 text-white">
                        Detalles de la Traza
                    </q-toolbar-title>
                </q-toolbar>
            </header>

            <!-- Contenido compacto con scroll interno -->
            <div class="modal-content">
                <div v-if="traceDetail" class="q-pa-md">
                    <!-- Información principal compacta -->
                    <div class="info-section q-mb-md">
                        <div class="text-subtitle2 text-primary q-mb-sm">Información General</div>
                        <div class="row q-gutter-sm text-body2">
                            <div class="col-12 col-sm-6">
                                <strong>ID:</strong> {{ traceDetail.id }}
                            </div>
                            <div class="col-12 col-sm-6">
                                <strong>Usuario:</strong> {{ traceDetail.causer_id || 'Sistema' }}
                            </div>
                            <div class="col-12">
                                <strong>Descripción:</strong> {{ traceDetail.description }}
                            </div>
                            <div class="col-12 col-sm-6">
                                <strong>Fecha:</strong> {{ formatDate(traceDetail.created_at) }}
                            </div>
                            <div class="col-12 col-sm-6">
                                <strong>Hora:</strong> {{ formatTime(traceDetail.created_at) }}
                            </div>
                            <div class="col-12 col-sm-6">
                                <strong>IP:</strong> {{ traceDetail.properties?.ip || 'No disponible' }}
                            </div>
                        </div>
                    </div>

                    <!-- Tabla de atributos compacta con paginación -->
                    <div class="attributes-section">
                        <div class="text-subtitle2 text-primary q-mb-sm">
                            Atributos Modificados ({{ attributesRows.length }})
                        </div>

                        <!-- Búsqueda compacta -->
                        <div class="q-mb-sm">
                            <q-input outlined dense debounce="300" v-model="attributesFilter"
                                placeholder="Buscar atributos..." class="search-compact" clearable>
                                <template v-slot:prepend>
                                    <q-icon name="search" size="sm" />
                                </template>
                            </q-input>
                        </div>

                        <!-- Tabla compacta -->
                        <q-table :rows="paginatedAttributesRows" :columns="attributesColumns"
                            v-model:pagination="attributesPagination" @request="onAttributesRequest"
                            :rows-per-page-options="[5, 10, 15]" flat dense no-data-label="Sin atributos"
                            rows-per-page-label="Por página" class="compact-table" hide-header>
                            <template v-slot:body="props">
                                <q-tr :props="props">
                                    <q-td class="text-weight-medium text-primary" style="width: 30%">
                                        {{ props.row.attribute }}
                                    </q-td>
                                    <q-td class="old-value-simple" style="width: 35%">
                                        {{ props.row.old || '-' }}
                                    </q-td>
                                    <q-td class="new-value-simple" style="width: 35%">
                                        {{ props.row.new || '-' }}
                                    </q-td>
                                </q-tr>
                            </template>
                        </q-table>
                    </div>
                </div>
            </div>

            <!-- Botones simples -->
            <q-card-actions class="q-pa-md justify-end bg-grey-1">
                <q-btn color="primary" label="Cerrar" @click="closeDetailDialog" />
            </q-card-actions>
        </q-card>
    </q-dialog>

</template>

<script setup>
// IMPORT LIBRERIES
import { dataColumnTrace } from "src/assets/js/column_data/columnData";
import {
    loadGet,
    isValueRepeated,
    closeDialog,
    printPdf,
} from 'src/assets/js/util/funciones'
import { onlyLetter_Number, string } from 'src/assets/js/util/validator_form'
import { Error } from "src/assets/js/util/notify";
import { api } from 'src/boot/axios'

// IMPORT COMPONENTS
import DialogLoad from 'src/components/dialog_boxes/DialogLoad.vue'

// IMPORT HOOKS
import { ref, onMounted, reactive, computed, watch } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const columns = dataColumnTrace;
const filter = ref("");
const items = ref([]);

const dialog = ref(false)
const dialogLoad = ref(false)
const detailDialog = ref(false)

const myForm = ref(null)
const object = reactive({ id: null, code: '', description: '', state: false });
const initialObject = { id: null, code: '', description: '', state: false };

const pagination = ref({
    page: 1,
    rowsPerPage: 5,
    rowsNumber: 0
});

const printEnabled = computed(() => items.value.length > 0);

const traceDetail = ref(null)
const attributesRows = ref([])

const attributesFilter = ref('')
const attributesPagination = ref({
    page: 1,
    rowsPerPage: 5,
    rowsNumber: 0
});

const filteredAttributesRows = computed(() => {
    if (!attributesFilter.value) {
        return attributesRows.value;
    }
    const searchTerm = attributesFilter.value.toLowerCase();
    return attributesRows.value.filter(attr =>
        attr.attribute.toLowerCase().includes(searchTerm) ||
        (attr.old && attr.old.toString().toLowerCase().includes(searchTerm)) ||
        (attr.new && attr.new.toString().toLowerCase().includes(searchTerm))
    );
});

const paginatedAttributesRows = computed(() => {
    const filtered = filteredAttributesRows.value;
    const start = (attributesPagination.value.page - 1) * attributesPagination.value.rowsPerPage;
    const end = start + attributesPagination.value.rowsPerPage;

    return filtered.slice(start, end);
});

const load = async (page = 1, rowsPerPage = 5) => {
    dialogLoad.value = true;
    try {
        const params = {
            page,
            per_page: rowsPerPage,
        };
        if (filter.value && filter.value.trim() !== '') {
            params.search = filter.value.trim();
        }
        const response = await api.get('ActivityLog/GetPagedList', { params });
        items.value = response.data.data;

        if (response.data.meta) {
            pagination.value = {
                page: response.data.meta.current_page,
                rowsPerPage: response.data.meta.per_page,
                rowsNumber: response.data.meta.total
            };
        } else {
            pagination.value = {
                page: 1,
                rowsPerPage: rowsPerPage,
                rowsNumber: 0
            };
        }
    } catch (error) {
        items.value = [];
        pagination.value = {
            page: 1,
            rowsPerPage: rowsPerPage,
            rowsNumber: 0
        };
        Error(error.response?.data?.mensajeError || error.message);
    } finally {
        dialogLoad.value = false;
    }
}

const onRequest = async (props) => {
    const { page, rowsPerPage } = props.pagination;
    pagination.value.rowsPerPage = rowsPerPage;
    await load(page, rowsPerPage);
}

const onAttributesRequest = (props) => {
    const { page, rowsPerPage } = props.pagination;
    attributesPagination.value.page = page;
    attributesPagination.value.rowsPerPage = rowsPerPage;
    attributesPagination.value.rowsNumber = filteredAttributesRows.value.length;
}

const close = async () => {
    closeDialog(object, initialObject, myForm, dialog)
}

const PrintToPdf = async () => {
    dialogLoad.value = true;
    try {
        const data = {};
        if (filter.value && filter.value.trim() !== '') {
            data.search = filter.value.trim();
        }
        const result = await printPdf('ActivityLog/PDF', data);
        const blob = new Blob([result], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `trazas_${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error(error);
    } finally {
        dialogLoad.value = false;
    }
}

watch(filter, () => {
    load(1, pagination.value.rowsPerPage);
});

watch(attributesFilter, (newFilteredRows) => {
    attributesPagination.value.rowsNumber = newFilteredRows.length;
    if (attributesPagination.value.page > 1) {
        attributesPagination.value.page = 1;
    }
}, { immediate: true });

const attributesColumns = [
    { name: 'attribute', label: 'Atributo', field: 'attribute', align: 'left' },
    { name: 'old', label: 'Editado', field: 'old', align: 'center' },
    { name: 'new', label: 'Nuevo', field: 'new', align: 'center' }
]

const traslatedAttributes = {
    code: 'Código',
    description: 'Descripción',
    state: 'Estado',
    name: 'Nombre',
    currency: 'Moneda',
    amount: 'Importe',
    status: 'Estatus',
};

function traslateAttribute(key) {
    return traslatedAttributes[key] || key;
}

function traslateValue(valor) {
    if (typeof valor === 'boolean') {
        return valor ? 'Sí' : 'No';
    }
    return valor;
}

function formatDate(fecha) {
    if (!fecha) return '';
    const parts = fecha.split('T')[0].split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return fecha;
}

function formatTime(fecha) {
    if (!fecha) return '';
    const timePart = fecha.split('T')[1];
    if (timePart) {
        return timePart.split('.')[0];
    }
    return '';
}

const closeDetailDialog = () => {
    detailDialog.value = false;
    attributesFilter.value = '';
    attributesPagination.value = {
        page: 1,
        rowsPerPage: 5,
        rowsNumber: 0
    };
}

const openDetailDialog = async (id) => {
    dialogLoad.value = true;
    try {
        const response = await api.get(`ActivityLog/GetById/${id}`);
        traceDetail.value = response.data.data;

        const attrs = [];
        const properties = traceDetail.value.properties || {};

        let oldAttrs = {};
        let newAttrs = {};

        if (properties.old) {
            oldAttrs = properties.old;
        }

        if (properties.attributes) {
            newAttrs = properties.attributes;
        }

        const allKeys = Array.from(new Set([
            ...Object.keys(oldAttrs),
            ...Object.keys(newAttrs)
        ]));

        allKeys.forEach(key => {
            attrs.push({
                attribute: traslateAttribute(key),
                old: traslateValue(oldAttrs[key] !== undefined ? oldAttrs[key] : ''),
                new: traslateValue(newAttrs[key] !== undefined ? newAttrs[key] : '')
            });
        });

        attributesRows.value = attrs;

        attributesPagination.value = {
            page: 1,
            rowsPerPage: 5,
            rowsNumber: attrs.length
        };

        detailDialog.value = true;
    } catch (error) {
        Error(error.response?.data?.mensajeError || error.message);
    } finally {
        dialogLoad.value = false;
    }
}

const areAllFieldsFilled = (id) => {
    return id !== null && object.code !== '' && object.description !== '';
}

const fetchData = async () => {
    dialogLoad.value = true;
    items.value = (await loadGet('ActivityLog/GetPagedList')) ?? [];

    dialogLoad.value = false;
};

onMounted(async () => {
    await fetchData();
    await load();
});
</script>

<style scoped>
.modal-compact {
    display: flex;
    flex-direction: column;
}

.modal-content {
    flex: 1;
    overflow-y: auto;
    max-height: calc(85vh - 120px);
}

.info-section {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 12px;
    background: #fafafa;
}

.attributes-section {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 12px;
}

.search-compact {
    max-width: 300px;
}

.compact-table {
    font-size: 13px;
}

.compact-table .q-table__bottom {
    font-size: 12px;
}

.old-value-simple {
    background: #ffebee;
    color: #d32f2f;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 3px;
}

.new-value-simple {
    background: #e8f5e8;
    color: #388e3c;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 3px;
}
</style>
