const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const payrollService = {
  // ==================== 1. EMPLEADOS ====================
  getEmployees: async ({ search = '', page = 1, per_page = 15, is_active = '' } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page);
    if (per_page) params.append('per_page', per_page);
    if (is_active !== '') params.append('is_active', is_active);

    const res = await fetch(`${API_URL}/empleados?${params.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  createEmployee: async (data) => {
    const res = await fetch(`${API_URL}/empleados`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getEmployee: async (id) => {
    const res = await fetch(`${API_URL}/empleados/${id}`, { headers: getHeaders() });
    return res.json();
  },

  updateEmployee: async (id, data) => {
    const res = await fetch(`${API_URL}/empleados/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  toggleEmployeeStatus: async (id, is_active) => {
    const res = await fetch(`${API_URL}/empleados/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active })
    });
    return res.json();
  },

  // ==================== 2. CUENTAS DE PAGO ====================
  getPaymentAccounts: async (employeeId) => {
    const res = await fetch(`${API_URL}/empleados/${employeeId}/cuentas-pago`, { headers: getHeaders() });
    return res.json();
  },

  createPaymentAccount: async (employeeId, data) => {
    const res = await fetch(`${API_URL}/empleados/${employeeId}/cuentas-pago`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updatePaymentAccount: async (id, data) => {
    const res = await fetch(`${API_URL}/empleados/cuentas-pago/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  togglePaymentAccountStatus: async (id, is_active) => {
    const res = await fetch(`${API_URL}/empleados/cuentas-pago/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active })
    });
    return res.json();
  },

  // ==================== 3. CICLOS DE NÓMINA ====================
  getCycles: async ({ search = '', is_active = '' } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (is_active !== '') params.append('is_active', is_active);

    const res = await fetch(`${API_URL}/ciclos-nomina?${params.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  createCycle: async (data) => {
    const res = await fetch(`${API_URL}/ciclos-nomina`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getCycle: async (id) => {
    const res = await fetch(`${API_URL}/ciclos-nomina/${id}`, { headers: getHeaders() });
    return res.json();
  },

  updateCycle: async (id, data) => {
    const res = await fetch(`${API_URL}/ciclos-nomina/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  toggleCycleStatus: async (id, is_active) => {
    const res = await fetch(`${API_URL}/ciclos-nomina/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active })
    });
    return res.json();
  },

  // ==================== 4. ASIGNACIÓN EMPLEADO ↔ CICLO ====================
  getEmployeeCycles: async (employeeId) => {
    const res = await fetch(`${API_URL}/empleados/${employeeId}/ciclos-nomina`, { headers: getHeaders() });
    return res.json();
  },

  createEmployeeCycle: async (employeeId, data) => {
    const res = await fetch(`${API_URL}/empleados/${employeeId}/ciclos-nomina`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getEmployeeCycleAssignment: async (id) => {
    const res = await fetch(`${API_URL}/empleados/ciclos-nomina-asignaciones/${id}`, { headers: getHeaders() });
    return res.json();
  },

  updateEmployeeCycleAssignment: async (id, data) => {
    const res = await fetch(`${API_URL}/empleados/ciclos-nomina-asignaciones/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  toggleEmployeeCycleStatus: async (id, is_active) => {
    const res = await fetch(`${API_URL}/empleados/ciclos-nomina-asignaciones/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ is_active })
    });
    return res.json();
  },

  // ==================== 5. PERÍODOS DE NÓMINA ====================
  getPeriods: async ({ search = '', status = '', page = 1, per_page = 15 } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (page) params.append('page', page);
    if (per_page) params.append('per_page', per_page);

    const res = await fetch(`${API_URL}/periodos-nomina?${params.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  getPeriodsByCycle: async (cycleId) => {
    const res = await fetch(`${API_URL}/ciclos-nomina/${cycleId}/periodos`, { headers: getHeaders() });
    return res.json();
  },

  createPeriod: async (cycleId, data) => {
    const res = await fetch(`${API_URL}/ciclos-nomina/${cycleId}/periodos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getPeriod: async (id) => {
    const res = await fetch(`${API_URL}/periodos-nomina/${id}`, { headers: getHeaders() });
    return res.json();
  },

  updatePeriod: async (id, data) => {
    const res = await fetch(`${API_URL}/periodos-nomina/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  changePeriodStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/periodos-nomina/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // ==================== 6. LIQUIDACIONES DE NÓMINA ====================
  getSettlements: async ({ payroll_period_id = '', employee_id = '', status = '', search = '', page = 1, per_page = 15 } = {}) => {
    const params = new URLSearchParams();
    if (payroll_period_id) params.append('payroll_period_id', payroll_period_id);
    if (employee_id) params.append('employee_id', employee_id);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (page) params.append('page', page);
    if (per_page) params.append('per_page', per_page);

    const res = await fetch(`${API_URL}/liquidaciones-nomina?${params.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  getSettlementsByPeriod: async (periodId) => {
    const res = await fetch(`${API_URL}/periodos-nomina/${periodId}/liquidaciones`, { headers: getHeaders() });
    return res.json();
  },

  createSettlement: async (periodId, data) => {
    const res = await fetch(`${API_URL}/periodos-nomina/${periodId}/liquidaciones`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getSettlement: async (id) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${id}`, { headers: getHeaders() });
    return res.json();
  },

  updateSettlement: async (id, data) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  changeSettlementStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // ==================== 7. DEVENGADOS ====================
  getEarnings: async (settlementId) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${settlementId}/devengados`, { headers: getHeaders() });
    return res.json();
  },

  createEarning: async (settlementId, data) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${settlementId}/devengados`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getEarning: async (settlementId, id) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${settlementId}/devengados/${id}`, { headers: getHeaders() });
    return res.json();
  },

  updateEarning: async (settlementId, id, data) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${settlementId}/devengados/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteEarning: async (settlementId, id) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${settlementId}/devengados/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // ==================== 8. DEDUCCIONES ====================
  getDeductions: async (settlementId) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${settlementId}/deducciones`, { headers: getHeaders() });
    return res.json();
  },

  createDeduction: async (settlementId, data) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${settlementId}/deducciones`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getDeduction: async (settlementId, id) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${settlementId}/deducciones/${id}`, { headers: getHeaders() });
    return res.json();
  },

  updateDeduction: async (settlementId, id, data) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${settlementId}/deducciones/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteDeduction: async (settlementId, id) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${settlementId}/deducciones/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // ==================== 9. PARÁMETROS DE NÓMINA ====================
  getParameters: async ({ search = '', is_active = '' } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (is_active !== '') params.append('is_active', is_active);

    const res = await fetch(`${API_URL}/parametros-nomina?${params.toString()}`, { headers: getHeaders() });
    return res.json();
  },

  createParameter: async (data) => {
    const res = await fetch(`${API_URL}/parametros-nomina`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getParameter: async (id) => {
    const res = await fetch(`${API_URL}/parametros-nomina/${id}`, { headers: getHeaders() });
    return res.json();
  },

  updateParameter: async (id, data) => {
    const res = await fetch(`${API_URL}/parametros-nomina/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // ==================== 10. TRANSMISIÓN NÓMINA ELECTRÓNICA ====================
  transmitPayroll: async (settlementId, options = {}) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${settlementId}/transmitir`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(options)
    });
    return res.json();
  },

  replacePayroll: async (settlementId, options = {}) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${settlementId}/reemplazar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(options)
    });
    return res.json();
  },

  deletePayroll: async (settlementId, options = {}) => {
    const res = await fetch(`${API_URL}/liquidaciones-nomina/${settlementId}/eliminar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(options)
    });
    return res.json();
  }
};
