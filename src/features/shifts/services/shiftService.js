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

  requestCloseShift: async (id, data) => {
    const res = await fetch(`${API_URL}/turnos-islero/${id}/solicitar-cierre`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  approveShift: async (id) => {
    const res = await fetch(`${API_URL}/turnos-islero/${id}/aprobar-cierre`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  returnShift: async (id, data) => {
    const res = await fetch(`${API_URL}/turnos-islero/${id}/devolver-cierre`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getReturnedShifts: async () => {
    const res = await fetch(`${API_URL}/turnos-islero/mis-devueltos`, { headers: getHeaders() });
    return res.json();
  },

  getShiftDetail: async (id) => {
    const res = await fetch(`${API_URL}/turnos-islero/${id}`, { headers: getHeaders() });
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

  getShiftReadings: async (turnoId) => {
    const res = await fetch(`${API_URL}/mangueras/lecturas?turno_id=${turnoId}`, { 
      headers: getHeaders() 
    });
    return res.json();
  },

  getPendingsClose: async () => {
    const res = await fetch(`${API_URL}/turnos-islero/pendientes-cierre`, { 
      headers: getHeaders() 
    });
    return res.json();
  },

  getPendingsCloseRevision: async (id) => {
    const res = await fetch(`${API_URL}/turnos-islero/${id}/revision-cierre`, { 
      headers: getHeaders() 
    });
    return res.json();
  },

  getIsleroTurns: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/turnos-islero?${queryString}`, { headers: getHeaders() });
    return res.json();
  },

  getIsleroReturnedTurns: async () => {
    const res = await fetch(`${API_URL}/turnos-islero/devueltos`, { headers: getHeaders() });
    return res.json();
  },

  getIsleroPendingCloseTurns: async () => {
    const res = await fetch(`${API_URL}/turnos-islero/pendientes-cierre`, { headers: getHeaders() });
    return res.json();
  },

  editShiftClosing: async (id) => {
    const res = await fetch(`${API_URL}/turnos-islero/${id}/editar-cierre`, { 
      headers: getHeaders() 
    });
    return res.json();
  },
};