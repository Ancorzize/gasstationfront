const API_URL = import.meta.env.VITE_API_URL ;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const portfolioService = {
  getSummary: async () => {
    const res = await fetch(`${API_URL}/cartera/resumen`, { headers: getHeaders() });
    return res.json();
  },


  getMovements: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/cartera/movimientos?${query}`, { 
      headers: getHeaders() 
    });
    return res.json();
  },

  registerPayment: async (data) => {
    const res = await fetch(`${API_URL}/cartera/abonos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        cliente_id: data.cliente_id,
        fecha_abono: data.fecha_abono,
        valor: data.valor,
        medio_pago: data.medio_pago,
        observacion: data.observacion,
        caja_id: data.caja_id
      })
    });
    return res.json();
  },

  createInitialDebt: async (data) => {
    const res = await fetch(`${API_URL}/cartera/saldos-iniciales`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        cliente_id: data.cliente_id,
        fecha_documento: data.fecha_documento,
        valor: data.valor,
        observacion: data.observacion
      })
    });
    return res.json();
  }
};