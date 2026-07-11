const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const purchaseService = {
  // Compras
  getPurchases: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/compras?${query}`, { headers: getHeaders() });
    return res.json();
  },

  getPurchaseById: async (id) => {
    const res = await fetch(`${API_URL}/compras/${id}`, { headers: getHeaders() });
    return res.json();
  },

  createPurchase: async (data) => {
    const res = await fetch(`${API_URL}/compras`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updatePurchase: async (id, data) => {
    const res = await fetch(`${API_URL}/compras/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  confirmPurchase: async (id, cajaId) => {
    const res = await fetch(`${API_URL}/compras/${id}/confirmar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ caja_id: cajaId })
    });
    return res.json();
  },

  // Pagos
  getPayments: async (purchaseId) => {
    const res = await fetch(`${API_URL}/compras/${purchaseId}/pagos`, { headers: getHeaders() });
    return res.json();
  },

  registerPayment: async (purchaseId, data) => {
    const res = await fetch(`${API_URL}/compras/${purchaseId}/pagos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async downloadPurchasePDF(id, download = false) {
    const token = localStorage.getItem('token'); // O donde guardes tu token
    const url = `${import.meta.env.VITE_API_URL}/compras/${id}/pdf${download ? '?download=1' : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf'
      }
    });

    if (!response.ok) throw new Error('Error al generar el PDF');
    
    return await response.blob();
  },
};