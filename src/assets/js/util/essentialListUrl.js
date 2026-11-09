export const essentialListUrl = [
    {
        title: 'INICIO',
        link: 'Inicio',
        icon: 'home',
        permission: 'inicio.ver'
    },
    {
        title: 'PUNTO DE VENTA',
        link: 'PuntoVenta',
        icon: 'point_of_sale',
        permission: 'pos.vender'
    },
    {
        title: 'CATÁLOGO',
        permission: ['ferias.ver', 'productos.ver', 'categorias.ver', 'trabajadores.ver', 'cierre_feria.ver'],
        icon: 'storefront',
        children: [
            {
                title: 'Categorías',
                icon: 'category',
                link: 'Categorias',
                permission: ['categorias.ver', 'categorias.crear', 'categorias.editar']
            },
            {
                title: 'Productos',
                icon: 'sell',
                link: 'Productos',
                permission: ['productos.ver', 'productos.crear', 'productos.editar']
            },
            {
                title: 'Trabajadores',
                icon: 'badge',
                link: 'Trabajadores',
                permission: ['trabajadores.ver', 'trabajadores.crear', 'trabajadores.editar']
            },
            {
                title: 'Ferias y tasas',
                icon: 'event',
                link: 'Ferias',
                permission: ['ferias.ver', 'ferias.crear', 'ferias.editar']
            },
            {
                title: 'Conceptos de gasto',
                icon: 'receipt_long',
                link: 'ConceptosGasto',
                permission: ['cierre_feria.ver', 'cierre_feria.editar']
            },
            {
                title: 'Presupuestos',
                icon: 'pie_chart',
                link: 'Presupuestos',
                permission: ['cierre_feria.ver', 'cierre_feria.editar']
            },
        ]
    },
    {
        title: 'FERIA DEL DÍA',
        permission: ['inventario.ver', 'inventario.contar', 'cierre.ver', 'propinas.ver', 'cierre_feria.ver'],
        icon: 'today',
        children: [
            {
                title: 'Inventario',
                icon: 'inventory_2',
                link: 'Inventario',
                permission: ['inventario.ver', 'inventario.contar', 'inventario.editar']
            },
            {
                title: 'Propinas y salarios',
                icon: 'volunteer_activism',
                link: 'Propinas',
                permission: ['propinas.ver', 'propinas.editar']
            },
            {
                title: 'Cierre del día',
                icon: 'price_check',
                link: 'CierreDia',
                permission: ['cierre.ver', 'cierre.editar']
            },
            {
                title: 'Cierre de feria',
                icon: 'account_balance',
                link: 'CierreFeria',
                permission: ['cierre_feria.ver', 'cierre_feria.editar']
            },
        ]
    },
    {
        title: 'FINANZAS',
        feature: 'finance',
        permission: ['finanzas.ver', 'activos.ver'],
        icon: 'account_balance_wallet',
        children: [
            {
                title: 'Flujo de caja',
                icon: 'payments',
                link: 'FlujoCaja',
                permission: ['finanzas.ver', 'finanzas.editar']
            },
            {
                title: 'Pagos programados',
                icon: 'event_note',
                link: 'PagosProgramados',
                permission: ['finanzas.ver', 'finanzas.editar']
            },
            {
                title: 'Bolsillos',
                icon: 'savings',
                link: 'Bolsillos',
                permission: ['finanzas.ver', 'finanzas.editar']
            },
            {
                title: 'Activos fijos',
                icon: 'chair',
                link: 'ActivosFijos',
                permission: ['activos.ver', 'activos.editar']
            },
        ]
    },
    {
        title: 'SEGURIDAD',
        permission: ['usuarios.ver', 'roles.ver', 'respaldo.gestionar'],
        icon: 'group',
        children: [
            {
                title: 'Roles',
                icon: 'admin_panel_settings',
                link: 'Roles',
                permission: 'roles.ver'
            },
            {
                title: 'Usuarios',
                icon: 'person',
                link: 'Usuarios',
                permission: 'usuarios.ver'
            },
            {
                title: 'Salvar y restaurar BD',
                icon: 'backup',
                link: 'RespaldoBD',
                permission: 'respaldo.gestionar'
            },
        ]
    },
    {
        title: 'CONFIGURACIÓN',
        permission: ['configuracion.marca'],
        icon: 'tune',
        children: [
            {
                title: 'Identidad del negocio',
                icon: 'palette',
                link: 'IdentidadNegocio',
                permission: 'configuracion.marca'
            },
        ]
    },
    {
        title: 'REPORTES',
        link: 'Reportes',
        icon: 'query_stats',
        permission: 'reportes.ver'
    },
    {
        title: 'TRAZAS',
        icon: 'track_changes',
        link: 'Trazas',
        permission: 'trazas.ver'
    },
]
