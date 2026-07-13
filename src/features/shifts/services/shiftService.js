const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const shiftService = {
  getCurrentShift: async () => {
    const res = await fetch(`${API_URL}/turnos-islero/actual`, { headers: getHeaders() });
    return res.json();
  },

  openShift: async (data) => {
    const res = await fetch(`${API_URL}/turnos-islero/abrir`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getClosingSummary: async (id) => {
    const res = await fetch(`${API_URL}/turnos-islero/${id}/resumen-cierre`, { headers: getHeaders() });
    return res.json();
  },

  closeShift: async (id, data) => {
    const res = await fetch(`${API_URL}/turnos-islero/${id}/cerrar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getShiftHistory: async (filters) => {
    const params = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_URL}/turnos-islero?${params}`, { headers: getHeaders() });
    return res.json();
  },
  getAvailableHoses: async (estacionId) => {
    const res = await fetch(`${API_URL}/turnos-islero/mangueras-disponibles?estacion_id=${estacionId}`, {
      headers: getHeaders()
    });
    return res.json();
  },
};