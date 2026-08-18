const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const inventoryService = {
  // Listar movimientos / lotes con filtros de fecha
  getMovements: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/movimientos-inventario/lotes?${query}`, {
      headers: { ...getHeaders(), 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  // Obtener el detalle de los productos de un lote específico
  getMovementDetail: async (codigoLote) => {
    const res = await fetch(`${API_URL}/movimientos-inventario/lotes/${codigoLote}`, {
      headers: { ...getHeaders(), 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  // Registrar traslado manual
  createTransfer: async (data) => {
    const res = await fetch(`${API_URL}/movimientos-inventario`, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  importInventoryJSON: async (items) => {
    const res = await fetch(`${API_URL}/inventarios/importar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ items }) 
    });
    return res.json();
  },

  getStock: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/inventarios?${query}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return res.json();
  },

  createTransferBulk: async (data) => {
    const res = await fetch(`${API_URL}/movimientos-inventario/masivo`, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
};