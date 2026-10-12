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
  },

  reintentarMasivoDS: async () => {
    const res = await fetch(`${API_URL}/documentos-electronicos/reintentar-ds-rechazados`, {
      method: 'POST',
      headers: getHeaders()
    });

    return res.json();
  },

  getDocumentoById: async (id) => {
    const res = await fetch(`${API_URL}/documentos-electronicos/${id}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  prepararNC: async (payload) => {
    const res = await fetch(`${API_URL}/documentos-electronicos/preparar-nc`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  transmitirNC: async (id) => {
    const res = await fetch(`${API_URL}/documentos-electronicos/${id}/transmitir-nc`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  reintentarNC: async (id) => {
    const res = await fetch(`${API_URL}/documentos-electronicos/${id}/reintentar-nc`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  prepararND: async (payload) => {
    const res = await fetch(`${API_URL}/documentos-electronicos/preparar-nd`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  transmitirND: async (id) => {
    const res = await fetch(`${API_URL}/documentos-electronicos/${id}/transmitir-nd`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  reintentarND: async (id) => {
    const res = await fetch(`${API_URL}/documentos-electronicos/${id}/reintentar-nd`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  }
};
