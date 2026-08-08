const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const cashService = {
  getCurrentCash: async () => {
    const res = await fetch(`${API_URL}/caja/actual`, { headers: getHeaders() });
    return res.json();
  },

  openCash: async (data) => {
    const res = await fetch(`${API_URL}/caja/abrir`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        nombre: data.nombre,
        tipo_caja: data.tipo_caja,
        destino_recaudo_id: data.destino_recaudo_id,
        monto_apertura: data.monto_apertura,
        observacion_apertura: data.observacion_apertura
      })
    });
    return res.json();
  },

  closeCash: async (data) => {
    const res = await fetch(`${API_URL}/caja/cerrar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        cierres: data.cierres,
        observacion_cierre: data.observacion_cierre
      })
    });
    return res.json();
  },

  registerIncome: async (data) => {
    const res = await fetch(`${API_URL}/caja/ingresos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  registerWithdrawal: async (data) => {
    const res = await fetch(`${API_URL}/caja/retiros`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  registerTransfer: async (data) => {
    const res = await fetch(`${API_URL}/caja/transferencias`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getSummary: async () => {
    const res = await fetch(`${API_URL}/caja/resumen`, { headers: getHeaders() });
    return res.json();
  },

  getMovements: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/caja/movimientos?${query}`, { headers: getHeaders() });
    return res.json();
  },

  getHistory: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    );
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`${API_URL}/caja/historico?${query}`, { headers: getHeaders() });
    return res.json();
  },

  getDestinosRecaudo: async (isActive = true) => {
    const res = await fetch(`${API_URL}/destinos-recaudo?is_active=${isActive}`, { 
      headers: getHeaders() 
    });
    return res.json();
  },

  getSuggestedOpenings: async () => {
    const res = await fetch(`${API_URL}/caja/sugerencias-apertura`, { headers: getHeaders() });
    return res.json();
  },
};