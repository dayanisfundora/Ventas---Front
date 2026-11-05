<template>
  <div class="q-pa-xl">
    <q-breadcrumbs class="qb cursor-pointer q-pb-md">
      <q-breadcrumbs-el label="Inicio" icon="home" @click="router.push('/Inicio')" />
      <q-breadcrumbs-el label="Gestión Usuarios" icon="group" />
      <q-breadcrumbs-el label="Usuarios" icon="person" />
    </q-breadcrumbs>
    <q-table class="q-pa-md" :filter="filter" title="Útiles" :rows="items" :columns="columns" row-key="id"
      v-model:pagination="pagination" @request="onRequest" :rows-per-page-options="[5, 20, 50, 100]"
      no-data-label="No hay elementos disponibles" no-results-label="No hay elementos disponibles"
      loading-label="Cargando..." rows-per-page-label="Filas por página">
      <template v-slot:top>
        <div class="col-4 q-table__title">
          <span>Usuarios</span>
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
              {{ object?.id ? "Editar Usuario" : "Adicionar Usuario" }}
            </q-toolbar-title>
          </q-toolbar>
        </header>
        <q-form @submit.prevent="save()" @reset="close" ref="myForm">
          <div class="h row q-ma-md">
            <q-input outlined class="col-xs-12 q-pt-md" label="Nombre *" v-model="object.name" color="primary"
              maxlength="60" dense />
            <q-input outlined class="col-xs-12 q-pt-md" label="Usuario *" v-model="object.username" color="primary"
              maxlength="60" dense />
            <q-input outlined class="col-xs-12 q-pt-md" label="Email" v-model="object.email" color="primary"
              maxlength="60" dense type="email" />
            <q-input outlined class="col-xs-12 col-sm-6 q-pt-md q-pr-sm-xs" v-model="object.password" color="primary" dense
              :type="showPassword ? 'text' : 'password'" autocomplete="new-password"
              :label="object.id ? 'Nueva contraseña' : 'Contraseña *'"
              :hint="object.id ? 'Déjela vacía para no cambiarla' : 'Mínimo 6 caracteres'"
              :rules="[(v) => (object.id && !v) || (v && v.length >= 6) || 'Mínimo 6 caracteres']">
              <template #append>
                <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                  @click="showPassword = !showPassword" />
              </template>
            </q-input>
            <q-input outlined class="col-xs-12 col-sm-6 q-pt-md q-pl-sm-xs" v-model="object.password_confirmation" color="primary"
              dense :type="showPassword ? 'text' : 'password'" autocomplete="new-password"
              :label="object.id ? 'Repetir nueva contraseña' : 'Repetir contraseña *'"
              :rules="[(v) => (v || '') === (object.password || '') || 'Las contraseñas no coinciden']" />
            <!-- <q-select outlined class="col-xs-12 q-pt-md" v-model="object.roles" :options="rolesOptions" label="Roles"
              color="primary" multiple use-chips emit-value map-options option-value="id" option-label="name" dense /> -->
            <q-select outlined class="col-xs-12 q-pt-md" v-model="object.roles" :options="rolesOptions"
              label="Roles *" multiple use-chips emit-value map-options option-value="id" option-label="name" dense>
              <template v-slot:selected-item="scope">
                <template v-if="scope.index < 3">
                  <q-chip removable @remove="removeRoleChip(scope.index)" color="primary" text-color="white"
                    class="q-mr-xs" size="sm">
                    {{typeof scope.opt === 'object' ? scope.opt.name : rolesOptions.find(r => r.id ===
                      scope.opt)?.name || scope.opt}}
                  </q-chip>
                </template>
                <template v-else-if="scope.index === 3">
                  <q-chip color="primary" text-color="white" class="q-mr-xs" size="sm">
                    +{{ object.roles.length - 3 }} más
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

            <q-checkbox v-if="object.id" class="col-xs-12 q-pt-md" v-model="object.is_active" label="Activo"
              :true-value="true" :false-value="false" />
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
import { dataColumnUsers } from "src/assets/js/column_data/columnData";
import { get_users, get_user_by_id, create_user, update_user, delete_user } from "src/assets/js/apis/userApi";
import { get_roles, get_permissions } from "src/assets/js/apis/rolePermissionApi";
import DialogLoad from 'src/components/dialog_boxes/DialogLoad.vue';
import DialogDelete from 'src/components/dialog_boxes/DialogDelete.vue';
import { ref, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { Error, Success } from "src/assets/js/util/notify";
import { closeDialog } from 'src/assets/js/util/funciones';
import { api } from 'src/boot/axios'
import { apiErrorMessage } from 'src/assets/js/util/maia'

const router = useRouter();
const columns = dataColumnUsers;
const filter = ref("");
const items = ref([]);
const dialog = ref(false);
const dialogLoad = ref(false);
const isDeleteDialogOpen = ref(false);
const myForm = ref(null);
const selectedElementId = ref("");
const pagination = ref({ page: 1, rowsPerPage: 5, rowsNumber: 0 });
const rolesOptions = ref([]);
const permissionsOptions = ref([]);
const emptyUser = () => ({ name: '', username: '', email: '', password: '', password_confirmation: '', roles: [], permissions: [], is_active: true });
const object = reactive(emptyUser());
const showPassword = ref(false);
let editAuxObject = {};

onMounted(async () => {
  await load();
  await loadRolesAndPermissions();
});

const loadRolesAndPermissions = async () => {
  try {
    const rolesRes = await get_roles();
    rolesOptions.value = rolesRes.data;
    const permRes = await get_permissions();
    permissionsOptions.value = permRes.data;
  } catch (error) {
    Error('No se pudieron cargar roles o permisos');
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
    const response = await api.get('users/GetPagedList', { params });

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
};

const openAddDialog = () => {
  Object.assign(object, { id: undefined, ...emptyUser() });
  showPassword.value = false;
  dialog.value = true;
};

const getElementById = async (id) => {
  dialogLoad.value = true;
  try {
    const res = await get_user_by_id(id);
    Object.assign(object, res.data.user, {
      roles: res.data.user.roles.map(r => r.id),
      permissions: res.data.user.permissions.map(p => p.id),
      is_active: Boolean(res.data.user.is_active)
    });
    object.password = '';
    object.password_confirmation = '';
    showPassword.value = false;
    dialog.value = true;
    editAuxObject = { ...object };
  } catch (error) {
    Error('No se pudo cargar el usuario');
  } finally {
    dialogLoad.value = false;
  }
};

const save = async () => {
  dialogLoad.value = true;
  try {
    const payload = { ...object };
    if (object.id && !payload.password) {
      delete payload.password;
      delete payload.password_confirmation;
    }
    if (object.id) {
      await update_user(object.id, payload);
      Success('Usuario actualizado satisfactoriamente', { position: 'top-right' });
    } else {
      payload.is_active = true;
      await create_user(payload);
      Success(`Usuario "${object.username}" creado. Ya puede entrar con la contraseña indicada.`, { position: 'top-right' });
    }
    await load();
    dialog.value = false;
  } catch (error) {
    Error(apiErrorMessage(error));
  } finally {
    dialogLoad.value = false;
  }
};

const deleteElement = async () => {
  dialogLoad.value = true;
  try {
    await delete_user(selectedElementId.value);
    await load();
    isDeleteDialogOpen.value = false;
    Success('Elemento eliminado satisfactoriamente', { position: 'top-right' });
  } catch (error) {
    Error(apiErrorMessage(error));
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
  closeDialog(object, emptyUser(), myForm, dialog);
};

/*
 * Remove a permission chip by index from object.permissions
 * Ensures robust removal and avoids undefined errors
 * @param {number} index
 */
function removeRoleChip(index) {
  if (Array.isArray(object.roles) && index >= 0 && index < object.roles.length) {
    object.roles.splice(index, 1);
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
