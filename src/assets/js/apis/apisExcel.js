import { api } from '../../../boot/axios'

/*
*************************************************
               EXCEL REPORTE
*************************************************
*/
export const downloadBlob = async (url, payload = {}) => {
    try {
        const response = await api.post(url, payload, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
