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
        monto_apertura_efectivo: data.efectivo,
        monto_apertura_digital: data.digital,
        observacion_apertura: data.observacion
      })
    });
    return res.json();
  },

  closeCash: async (data) => {
    const res = await fetch(`${API_URL}/caja/cerrar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        monto_cierre_real_efectivo: data.efectivo,
        monto_cierre_real_digital: data.digital,
        observacion_cierre: data.observacion
      })
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
  }
};