const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const documentosElectronicosService = {
  getDocumentos: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.fecha_inicial) params.append('fecha_inicial', filters.fecha_inicial);
    if (filters.fecha_final) params.append('fecha_final', filters.fecha_final);
    if (filters.search) params.append('search', filters.search);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.page) params.append('page', filters.page);
    if (filters.per_page) params.append('per_page', filters.per_page);

    const res = await fetch(`${API_URL}/documentos-electronicos?${params.toString()}`, {
      headers: getHeaders()
    });

    return res.json();
  }
};
