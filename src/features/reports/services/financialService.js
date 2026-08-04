
const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const financialService = {
  getCapitalTrabajo: async (params = {}) => {

    const queryParams = new URLSearchParams({ indicador: 'capital-trabajo', ...params }).toString();
    const res = await fetch(`${API_URL}/indicadores-financieros?${queryParams}`, {
      headers: getHeaders()
    });
    return res.json();
  }
};