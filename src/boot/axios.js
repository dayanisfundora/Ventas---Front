import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { Notify } from 'quasar'

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside of the
// "export default () => {}" function below (which runs individually
// for each client)

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
})

export default boot(({ app, router }) => {
    // Set token from localStorage if exists
    const token = localStorage.getItem('token')
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    // Request interceptor
    api.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token')
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
            return config
        },
        (error) => {
            return Promise.reject(error)
        }
    )

    // Response interceptor
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response) {
                // Handle 401 Unauthorized
                if (error.response.status === 401) {
                    localStorage.removeItem('token')
                    delete api.defaults.headers.common['Authorization']

                    Notify.create({
                        type: 'negative',
                        message: 'Su sesión expiró. Inicie sesión nuevamente.',
                        position: 'top-right'
                    })

                    router.push('/login')
                }

                // Handle 403 Forbidden
                if (error.response.status === 403) {
                    Notify.create({
                        type: 'negative',
                        message: 'No tiene permiso para realizar esta acción.',
                        position: 'top-right'
                    })
                }

                // Handle 500 Server Error - only show generic error if no custom handling
                // Allow specific routes to handle their own errors (e.g., login, juegos-datos)
                if (error.response.status === 500 && error.config?.showGenericError !== false) {
                    // Only show if the response doesn't have a custom message
                    if (!error.response.data?.message && !error.response.data?.errors) {
                        Notify.create({
                            type: 'negative',
                            message: 'Error del servidor. Intente de nuevo más tarde.',
                            position: 'top-right'
                        })
                    }
                }
            }

            return Promise.reject(error)
        }
    )

    // for use inside Vue files (Options API) through this.$axios and this.$api
    app.config.globalProperties.$axios = axios
    // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
    //       so you won't necessarily have to import axios in each vue file

    app.config.globalProperties.$api = api
    // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
    //       so you can easily perform requests against your app's API
})

export { api }
