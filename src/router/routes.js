const routes = [
    // Public routes
    {
        path: '/login',
        name: 'Login',
        component: () => import('src/pages/LoginPage.vue'),
        meta: { requiresGuest: true, permission: ['inicio.ver', 'entidades.editar', 'entidades.crear'] }
    },

    // Protected routes
    {
        path: '/',
        component: () => import('src/layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [

            // #region INICIO
            /*********************************************************************
            *                                INICIO                              *
            *********************************************************************/
            {
                path: "",
                redirect: "/Inicio"
            },
            {
                path: "Inicio",
                name: "Inicio",
                component: () => import("src/pages/IndexPage.vue"),
                meta: {
                    permission: ['inicio.ver', 'inicio.crear', 'inicio.editar', 'inicio.eliminar']
                }
            },
            {
                path: "profile",
                name: "UserProfile",
                component: () => import("src/pages/UserProfile.vue"),
            },

            // #region ENTITY
            /*********************************************************************
            *                          INDEX ENTITY                          *
            *********************************************************************/
            {
                path: 'DatosEntidad',
                name: 'DatosEntidad',
                component: () => import('src/pages/nomencladores/EntityPages.vue'),
                meta: { permission: ['entidades.ver', 'entidades.editar', 'entidades.crear'] }
            },

            /*********************************************************************
            *                      MAIA ARTE - FERIAS                            *
            *********************************************************************/
            {
                path: '/PuntoVenta',
                name: 'PuntoVenta',
                component: () => import('src/pages/maia/PosPage.vue'),
                meta: { permission: ['pos.vender'] }
            },
            {
                path: '/Inventario',
                name: 'Inventario',
                component: () => import('src/pages/maia/InventoryPage.vue'),
                meta: { permission: ['inventario.ver', 'inventario.contar', 'inventario.editar'] }
            },
            {
                path: '/CierreDia',
                name: 'CierreDia',
                component: () => import('src/pages/maia/DayClosePage.vue'),
                meta: { permission: ['cierre.ver', 'cierre.editar'] }
            },
            {
                path: '/Propinas',
                name: 'Propinas',
                component: () => import('src/pages/maia/TipsPage.vue'),
                meta: { permission: ['propinas.ver', 'propinas.editar'] }
            },
            {
                path: '/CierreFeria',
                name: 'CierreFeria',
                component: () => import('src/pages/maia/FairClosePage.vue'),
                meta: { permission: ['cierre_feria.ver', 'cierre_feria.editar'] }
            },
            {
                path: '/FlujoCaja',
                name: 'FlujoCaja',
                component: () => import('src/pages/maia/CashFlowPage.vue'),
                meta: { permission: ['finanzas.ver', 'finanzas.editar'] }
            },
            {
                path: '/PagosProgramados',
                name: 'PagosProgramados',
                component: () => import('src/pages/maia/ScheduledPaymentsPage.vue'),
                meta: { permission: ['finanzas.ver', 'finanzas.editar'] }
            },
            {
                path: '/Bolsillos',
                name: 'Bolsillos',
                component: () => import('src/pages/maia/CashFundsPage.vue'),
                meta: { permission: ['finanzas.ver', 'finanzas.editar'] }
            },
            {
                path: '/ActivosFijos',
                name: 'ActivosFijos',
                component: () => import('src/pages/maia/FixedAssetsPage.vue'),
                meta: { permission: ['activos.ver', 'activos.editar'] }
            },
            {
                path: '/ConceptosGasto',
                name: 'ConceptosGasto',
                component: () => import('src/pages/maia/ExpenseCategoriesPage.vue'),
                meta: { permission: ['cierre_feria.ver', 'cierre_feria.editar'] }
            },
            {
                path: '/Presupuestos',
                name: 'Presupuestos',
                component: () => import('src/pages/maia/BudgetConceptsPage.vue'),
                meta: { permission: ['cierre_feria.ver', 'cierre_feria.editar'] }
            },
            {
                path: '/Reportes',
                name: 'Reportes',
                component: () => import('src/pages/maia/ReportsPage.vue'),
                meta: { permission: ['reportes.ver'] }
            },
            {
                path: '/Ferias',
                name: 'Ferias',
                component: () => import('src/pages/maia/FairsPage.vue'),
                meta: { permission: ['ferias.ver', 'ferias.crear', 'ferias.editar'] }
            },
            {
                path: '/Productos',
                name: 'Productos',
                component: () => import('src/pages/maia/ProductsPage.vue'),
                meta: { permission: ['productos.ver', 'productos.crear', 'productos.editar'] }
            },
            {
                path: '/Categorias',
                name: 'Categorias',
                component: () => import('src/pages/maia/CategoriesPage.vue'),
                meta: { permission: ['categorias.ver', 'categorias.crear', 'categorias.editar'] }
            },
            {
                path: '/Trabajadores',
                name: 'Trabajadores',
                component: () => import('src/pages/maia/WorkersPage.vue'),
                meta: { permission: ['trabajadores.ver', 'trabajadores.crear', 'trabajadores.editar'] }
            },

            /*********************************************************************
                    *                      TRAZAS                                 *
            *********************************************************************/
            {
                path: '/Trazas',
                name: 'Trazas',
                component: () => import('src/pages/traces/TracePages.vue')
            },
            {
                path: '/Usuarios',
                name: 'Usuarios',
                component: () => import('src/pages/UserPages.vue'),
                meta: {
                    permission: ['usuarios.ver']
                }
            },
            {
                path: '/Roles',
                name: 'Roles',
                component: () => import('src/pages/RolePages.vue'),
                meta: {
                    permission: ['roles.ver']
                }
            },
            {
                path: '/RespaldoBD',
                name: 'RespaldoBD',
                component: () => import('src/pages/maia/BackupPage.vue'),
                meta: { permission: ['respaldo.gestionar'] }
            },
            {
                path: '/IdentidadNegocio',
                name: 'IdentidadNegocio',
                component: () => import('src/pages/maia/BrandingPage.vue'),
                meta: { permission: ['configuracion.marca'] }
            },
        ]
    },

    // Always leave this as last one,
    // but you can also remove it
    {
        path: '/:catchAll(.*)*',
        component: () => import('src/pages/ErrorNotFound.vue')
    }
]

export default routes
