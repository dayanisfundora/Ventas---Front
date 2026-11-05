// #region TRACE
/*********************************************************************
*                TRACE COLUMN DATA                     *
*********************************************************************/
export const dataColumnTrace = Object.freeze([
    {
        name: 'id',
        align: 'center',
        label: 'ID',
        field: 'id',
        sortable: true
    },
    {
        name: 'description',
        align: 'center',
        label: 'Descripción',
        field: 'description',
        sortable: true
    },
    {
        name: 'log_name',
        align: 'center',
        label: 'Tabla',
        field: 'log_name',
        sortable: true,
        format: (val) => {
            const translations = {
                'Entity': 'Entidad',
                'User': 'Usuario',
                'Fair': 'Feria',
                'Product': 'Producto',
                'ProductCategory': 'Categoría',
                'Worker': 'Trabajador',
                'Sale': 'Venta',
                'CashFund': 'Bolsillo',
                'CashMovement': 'Movimiento de caja',
                'ScheduledPayment': 'Pago programado',
                'FixedAsset': 'Activo fijo',
            };
            return translations[val] || val;
        }
    },
    {
        name: 'properties.ip',
        align: 'center',
        label: 'IP',
        field: row => row.properties.ip,
        sortable: true
    },
    {
        name: 'created_at',
        align: 'center',
        label: 'Fecha y Hora',
        field: 'created_at',
        sortable: true,
        format: (val) => {
            if (!val) return '-';
            const date = new Date(val);
            const day = date.getUTCDate();
            const month = date.getUTCMonth() + 1;
            const year = date.getUTCFullYear();
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            const seconds = String(date.getUTCSeconds()).padStart(2, '0');
            return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
        },
    },
    {
        name: 'action',
        align: 'center',
        label: 'Acciones',
        field: 'action',
        sortable: true
    }
])

// #region USERS
/*********************************************************************
*                USERS COLUMN DATA                     *
*********************************************************************/

export const dataColumnUsers = Object.freeze([
    {
        name: 'name',
        align: 'center',
        label: 'Nombre',
        field: 'name',
        sortable: true
    },
    {
        name: 'username',
        align: 'center',
        label: 'Usuario',
        field: 'username',
        sortable: true
    },
    {
        name: 'email',
        align: 'center',
        label: 'Email',
        field: 'email',
        sortable: true
    },
    {
        name: 'roles',
        align: 'center',
        label: 'Roles',
        field: 'roles',
        sortable: false,
        format: (val) => val && val.length > 0 ? val.map(r => r.name).join(', ') : 'Sin rol'
    },
    {
        name: 'action',
        align: 'center',
        label: 'Acciones',
        field: 'action',
        sortable: false
    }
]);

// #region ROLES
/*********************************************************************
*                ROLES COLUMN DATA                     *
*********************************************************************/

export const dataColumnRoles = Object.freeze([
    {
        name: 'name',
        align: 'center',
        label: 'Nombre del Rol',
        field: 'name',
        sortable: true
    },
    {
        name: 'permissions_count',
        align: 'center',
        label: 'Permisos',
        field: 'permissions',
        sortable: false,
        format: (val) => val ? val.length : 0
    },
    {
        name: 'action',
        align: 'center',
        label: 'Acciones',
        field: 'action',
        sortable: false
    }
]);
