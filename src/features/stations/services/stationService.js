const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const stationService = {
  getStations: async () => {
    const res = await fetch(`${API_URL}/estaciones`, { headers: getHeaders() });
    return res.json();
  },
  saveStation: async (data, id = null) => {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/estaciones/${id}` : `${API_URL}/estaciones`;
    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getPumps: async () => {
    const res = await fetch(`${API_URL}/bombas`, { headers: getHeaders() });
    return res.json();
  },
  savePump: async (data, id = null) => {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/bombas/${id}` : `${API_URL}/bombas`;
    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getHoses: async () => {
    const res = await fetch(`${API_URL}/mangueras`, { headers: getHeaders() });
    return res.json();
  },
  saveHose: async (data, id = null) => {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/mangueras/${id}` : `${API_URL}/mangueras`;
    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }
};