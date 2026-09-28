const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const invoicingSettingsService = {
  getConfig: async () => {
    const res = await fetch(`${API_URL}/configuracion-facturacion`, { 
      headers: { ...getHeaders(), 'Content-Type': 'application/json' } 
    });
    return res.json();
  },

  updateConfig: async (payload) => {
    const res = await fetch(`${API_URL}/configuracion-facturacion`, {
      method: 'PUT', 
      headers: { ...getHeaders(), 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload)
    });
    return res.json();
  }
};
