<template>
  <div class="q-pa-xl">
    <q-breadcrumbs class="qb cursor-pointer q-pb-md">
      <q-breadcrumbs-el label="Inicio" icon="home" @click="router.push('/Inicio')" />
      <q-breadcrumbs-el label="Gestión Usuarios" icon="group" />
      <q-breadcrumbs-el label="Roles" icon="admin_panel_settings" />
    </q-breadcrumbs>
    <!-- <q-table class="q-pa-md" :filter="filter" title="Roles" :rows="items" :columns="columns" row-key="id"
      v-model:pagination="pagination" @request="onRequest" :rows-per-page-options="[5, 20, 50, 100]"
      no-data-label="No hay roles disponibles" no-results-label="No hay roles disponibles" loading-label="Cargando..."
      rows-per-page-label="Filas por página"> -->

    <q-table class="q-pa-md" :filter="filter" title="Útiles" :rows="items" :columns="columns" row-key="id"
      v-model:pagination="pagination" @request="onRequest" :rows-per-page-options="[5, 20, 50, 100]"
      no-data-label="No hay elementos disponibles" no-results-label="No hay elementos disponibles"
      loading-label="Cargando..." rows-per-page-label="Filas por página">
      <template v-slot:top>
        <div class="col-4 q-table__title">
          <span>Roles</span>
          <q-input outline color="primary" flat v-model="filter" debounce="500" label="Buscar"
            :disable="pagination.rowsNumber === 0 && filter === ''" />
        </div>
        <q-space />
        <q-btn class="bg-primary" style="width: 20px" color="primary" icon="add" @click="openAddDialog">
          <q-tooltip class="bg-primary" transition-show="flip-right" transition-hide="flip-left"
            :offset="[10, 10]">Adicionar</q-tooltip>
        </q-btn>
      </template>
      <template v-slot:body-cell-action="props">
        <q-td :props="props">
          <div class="q-gutter-sm">
            <q-btn flat dense size="sm" @click="getElementById(props.row.id)" class="action-btn text-primary"
              icon="edit">
              <q-tooltip class="bg-primary" :offset="[10, 10]" transition-show="flip-right"
                transition-hide="flip-left">Editar</q-tooltip>
            </q-btn>
            <q-btn flat dense size="sm" @click="openDeleteDialog(props.row.id)" class="action-btn text-negative"
              icon="delete">
              <q-tooltip class="bg-red" :offset="[10, 10]" transition-show="flip-right"
                transition-hide="flip-left">Eliminar</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>
    <!-- DIALOGS -->
    <DialogLoad :dialogLoad="dialogLoad" />
    <DialogDelete v-if="isDeleteDialogOpen" :isOpen="isDeleteDialogOpen" :idElemento="selectedElementId"
      @eliminar="deleteElement" @closeDialog="handleCloseDialog" />
    <q-dialog v-model="dialog" persistent>
      <q-card class="app-card">
        <header class="q-pa-sm bg-primary">
          <q-toolbar>
            <q-toolbar-title class="text-subtitle6 text-white">
              {{ object?.id ? "Editar Rol" : "Adicionar Rol" }}
            </q-toolbar-title>
          </q-toolbar>
        </header>
        <q-form @submit.prevent="save()" @reset="close" ref="myForm">
          <div class="h row q-ma-md">
            <q-input outlined class="col-xs-12 q-pt-md" label="Nombre del Rol *" v-model="object.name" color="primary"
              maxlength="60" dense />
            <!-- <q-select outlined class="col-xs-12 q-pt-md" v-model="object.permissions" :options="permissionsOptions"
              label="Permisos" color="primary" multiple use-chips emit-value map-options option-value="id"
              option-label="name" dense /> -->
            <q-select outlined class="col-xs-12 q-pt-md" v-model="object.permissions" :options="permissionsOptions"
              label="Permisos" multiple use-chips emit-value map-options option-value="id" option-label="name" dense>
              <template v-slot:selected-item="scope">
                <template v-if="scope.index < 3">
                  <q-chip removable @remove="removePermissionChip(scope.index)" color="primary" text-color="white"
                    class="q-mr-xs" size="sm">
                    {{typeof scope.opt === 'object' ? scope.opt.name : permissionsOptions.find(p => p.id ===
                      scope.opt)?.name || scope.opt}}
                  </q-chip>
                </template>
                <template v-else-if="scope.index === 3">
                  <q-chip color="primary" text-color="white" class="q-mr-xs" size="sm">
                    +{{ object.permissions.length - 3 }} más
                  </q-chip>
                </template>
              </template>
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    Sin resultados
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <div class="col-xs-12 q-pt-md">
              <q-toggle v-model="selectAllPermissions" @update:model-value="toggleAllPermissions"
                label="Seleccionar todos los permisos" color="primary" />
            </div>

            <q-card-actions class="col-12 q-mt-md justify-end">
              <q-btn class="text-white q-px-md q-py-sm shadow-3 text-body1" color="primary" aling="right" type="submit"
                icon="save" no-caps size="md" label="Guardar" />
              <q-btn outline class="q-px-xl q-py-sm shadow-3 text-body1" color="primary" type="reset" icon="cancel"
                no-caps size="md" label="Cancelar" />
            </q-card-actions>
          </div>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { dataColumnRoles } from "src/assets/js/column_data/columnData";
import { get_roles, get_role_by_id, create_role, update_role, delete_role, assign_permissions_to_role, get_permissions } from "src/assets/js/apis/rolePermissionApi";
import DialogLoad from 'src/components/dialog_boxes/DialogLoad.vue';
import DialogDelete from 'src/components/dialog_boxes/DialogDelete.vue';
import { ref, onMounted, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { Error, Success } from "src/assets/js/util/notify";
import { closeDialog } from 'src/assets/js/util/funciones';
import { api } from 'src/boot/axios'

const router = useRouter();
const columns = dataColumnRoles;
const filter = ref("");
const items = ref([]);
const dialog = ref(false);
const dialogLoad = ref(false);
const isDeleteDialogOpen = ref(false);
const myForm = ref(null);
const selectedElementId = ref("");
const pagination = ref({ page: 1, rowsPerPage: 5, rowsNumber: 0 });
const permissionsOptions = ref([]);
const object = reactive({ name: '', permissions: [] });
const selectAllPermissions = ref(false);
let editAuxObject = {};

onMounted(async () => {
  await load();
  await loadPermissions();
});

const loadPermissions = async () => {
  try {
    const permRes = await get_permissions();
    permissionsOptions.value = permRes.data;
  } catch (error) {
    Error('No se pudieron cargar los permisos');
  }
};

// Function to load data with pagination
const load = async (page = 1, rowsPerPage = 5) => {
  dialogLoad.value = true;
  try {
    // Add search filter
    const params = {
      page,
      per_page: rowsPerPage,
    };
    if (filter.value && filter.value.trim() !== '') {
      params.search = filter.value.trim();
    }
    const response = await api.get('roles/GetPagedList', { params });

    items.value = response.data.data;

    // Validate that the goal exists before accessing it
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

const openAddDialog = () => {
  Object.assign(object, { name: '', permissions: [] });
  selectAllPermissions.value = false;
  dialog.value = true;
};

const getElementById = async (id) => {
  dialogLoad.value = true;
  try {
    const res = await get_role_by_id(id);
    Object.assign(object, res.data, { permissions: res.data.permissions.map(p => p.id) });
    selectAllPermissions.value = object.permissions.length === permissionsOptions.value.length;
    dialog.value = true;
    editAuxObject = { ...object };
  } catch (error) {
    Error('No se pudo cargar el rol');
  } finally {
    dialogLoad.value = false;
  }
};

const save = async () => {
  dialogLoad.value = true;
  try {
    let roleRes;
    if (object.id) {
      roleRes = await update_role(object.id, { name: object.name });
      Success('Elemento actualizado satisfactoriamente', { position: 'top-right' });
      await assign_permissions_to_role(object.id, object.permissions);
    } else {
      roleRes = await create_role({ name: object.name });
      Success('Elemento creado satisfactoriamente', { position: 'top-right' });
      await assign_permissions_to_role(roleRes.data.id, object.permissions);
    }
    await load();
    dialog.value = false;
  } catch (error) {
    Error(error.response?.data?.mensajeError || error.message);
  } finally {
    dialogLoad.value = false;
  }
};

const deleteElement = async () => {
  dialogLoad.value = true;
  try {
    await delete_role(selectedElementId.value);
    await load();
    isDeleteDialogOpen.value = false;
    Success('Elemento eliminado satisfactoriamente', { position: 'top-right' });
  } catch (error) {
    Error('No se pudo eliminar el rol');
  } finally {
    dialogLoad.value = false;
  }
};

const openDeleteDialog = (id) => {
  selectedElementId.value = id;
  isDeleteDialogOpen.value = true;
};

const handleCloseDialog = () => {
  isDeleteDialogOpen.value = false;
};

const close = async () => {
  closeDialog(object, { name: '', permissions: [] }, myForm, dialog);
};

/**
 * Watch to reload when the filter changes
 */
watch(filter, () => {
  load(1, pagination.value.rowsPerPage);
});

/**
 * Remove a permission chip by index from object.permissions
 * Ensures robust removal and avoids undefined errors
 * @param {number} index
 */
function removePermissionChip(index) {
  if (Array.isArray(object.permissions) && index >= 0 && index < object.permissions.length) {
    object.permissions.splice(index, 1);
    selectAllPermissions.value = object.permissions.length === permissionsOptions.value.length;
  }
}

/**
 * Toggle all permissions on or off
 * @param {boolean} value - True to select all, false to deselect all
 */
function toggleAllPermissions(value) {
  if (value) {
    object.permissions = permissionsOptions.value.map(p => p.id);
  } else {
    object.permissions = [];
  }
}
</script>

<style>
.icon-fancy {
  transition: all 0.3s ease;
  cursor: pointer;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  opacity: 0.9;
}

.icon-fancy:hover {
  transform: scale(1.25);
  opacity: 1;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15));
}

.action-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  opacity: 0.9;
  border-radius: 50%;
  padding: 5px;
}

.action-btn.text-primary:hover {
  background: rgba(33, 150, 243, 0.1) !important;
}

.action-btn.text-negative:hover {
  background: rgba(244, 67, 54, 0.1) !important;
}
</style>
