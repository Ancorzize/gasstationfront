import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, CreditCard, Calendar, DollarSign, MapPin, Briefcase, Building, CheckCircle2, Hash, RefreshCw, Loader2, Plus, Clock, Power, AlertCircle } from 'lucide-react';
import { payrollService } from '../services/payrollService';
import { companyService } from '../../settings/services/companyService';
import { useToast } from '../../../context/ToastContext';

export const EmployeeModal = ({ isOpen, onClose, onSave, employeeToEdit = null }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'payment' | 'cycles'
  const [loading, setLoading] = useState(false);

  // Cycle Assignment State
  const [cycleAssignments, setCycleAssignments] = useState([]);
  const [availableCycles, setAvailableCycles] = useState([]);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    payroll_cycle_id: '',
    start_date: '',
    end_date: '',
  });

  // General Employee Form State
  const [formData, setFormData] = useState({
    worker_code: '',
    identity_document_id: '1',
    document_number: '',
    first_name: '',
    other_names: '',
    first_surname: '',
    second_surname: '',
    working_country_id: '45',
    department_id: '',
    work_city_id: '',
    work_address: '',
    date_entry: '',
    departure_date: '',
    worker_type_id: '1',
    worker_subtype_id: '1',
    contract_type_id: '1',
    salary: '',
    integral_salary: false,
    high_risk_pension: false,
    is_active: true,
  });

  // Payment Account Form State
  const [accountData, setAccountData] = useState({
    id: null,
    payment_method_id: '1',
    means_payment_id: '47',
    bank: '',
    account_type: 'Ahorros',
    account_number: '',
    is_active: true,
  });

  // Location dropdown data
  const [countries, setCountries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('general');
      loadCountries();

      if (employeeToEdit) {
        const initialForm = {
          worker_code: employeeToEdit.worker_code || '',
          identity_document_id: employeeToEdit.identity_document_id ? String(employeeToEdit.identity_document_id) : '1',
          document_number: employeeToEdit.document_number || '',
          first_name: employeeToEdit.first_name || '',
          other_names: employeeToEdit.other_names || '',
          first_surname: employeeToEdit.first_surname || '',
          second_surname: employeeToEdit.second_surname || '',
          working_country_id: employeeToEdit.working_country_id ? String(employeeToEdit.working_country_id) : '45',
          department_id: '',
          work_city_id: employeeToEdit.work_city_id ? String(employeeToEdit.work_city_id) : '',
          work_address: employeeToEdit.work_address || '',
          date_entry: employeeToEdit.date_entry || '',
          departure_date: employeeToEdit.departure_date || '',
          worker_type_id: employeeToEdit.worker_type_id ? String(employeeToEdit.worker_type_id) : '1',
          worker_subtype_id: employeeToEdit.worker_subtype_id ? String(employeeToEdit.worker_subtype_id) : '1',
          contract_type_id: employeeToEdit.contract_type_id ? String(employeeToEdit.contract_type_id) : '1',
          salary: employeeToEdit.salary !== undefined && employeeToEdit.salary !== null ? String(employeeToEdit.salary) : '',
          integral_salary: Boolean(employeeToEdit.integral_salary),
          high_risk_pension: Boolean(employeeToEdit.high_risk_pension),
          is_active: employeeToEdit.is_active !== undefined ? Boolean(employeeToEdit.is_active) : true,
        };
        setFormData(initialForm);
        loadLocationsForEdit(initialForm.working_country_id, initialForm.work_city_id);
        fetchEmployeePaymentAccount(employeeToEdit.id);
      } else {
        setFormData({
          worker_code: '',
          identity_document_id: '1',
          document_number: '',
          first_name: '',
          other_names: '',
          first_surname: '',
          second_surname: '',
          working_country_id: '45',
          department_id: '',
          work_city_id: '',
          work_address: '',
          date_entry: new Date().toISOString().split('T')[0],
          departure_date: '',
          worker_type_id: '1',
          worker_subtype_id: '1',
          contract_type_id: '1',
          salary: '',
          integral_salary: false,
          high_risk_pension: false,
          is_active: true,
        });
        setAccountData({
          id: null,
          payment_method_id: '1',
          means_payment_id: '47',
          bank: '',
          account_type: 'Ahorros',
          account_number: '',
          is_active: true,
        });
        setDepartments([]);
        setCities([]);
      }
    }
  }, [isOpen, employeeToEdit]);

  const loadCountries = async () => {
    try {
      const res = await companyService.getCountries();
      if (res?.data) setCountries(res.data);
    } catch {
      // Ignore location fetch error
    }
  };

  const loadLocationsForEdit = async (countryId, cityId) => {
    try {
      const resPaises = await companyService.getCountries();
      const paisesList = resPaises?.data || [];
      setCountries(paisesList);

      if (countryId) {
        const resDepts = await companyService.getDepartments(countryId);
        const deptsList = resDepts?.data || [];
        setDepartments(deptsList);

        if (cityId) {
          for (const dept of deptsList) {
            const resCities = await companyService.getCities(dept.id);
            const citiesList = resCities?.data || [];
            if (citiesList.some((c) => String(c.id) === String(cityId))) {
              setCities(citiesList);
              setFormData((prev) => ({ ...prev, department_id: String(dept.id) }));
              break;
            }
          }
        }
      }
    } catch {
      // Ignore location search error
    }
  };

  const handleCountryChange = async (e) => {
    const countryId = e.target.value;
    setFormData((prev) => ({ ...prev, working_country_id: countryId, department_id: '', work_city_id: '' }));
    setDepartments([]);
    setCities([]);
    if (countryId) {
      try {
        const res = await companyService.getDepartments(countryId);
        if (res?.data) setDepartments(res.data);
      } catch {
        setDepartments([]);
      }
    }
  };

  const handleDepartmentChange = async (e) => {
    const deptId = e.target.value;
    setFormData((prev) => ({ ...prev, department_id: deptId, work_city_id: '' }));
    setCities([]);
    if (deptId) {
      try {
        const res = await companyService.getCities(deptId);
        if (res?.data) setCities(res.data);
      } catch {
        setCities([]);
      }
    }
  };

  const fetchEmployeePaymentAccount = async (employeeId) => {
    try {
      const res = await payrollService.getPaymentAccounts(employeeId);
      if (res?.status && Array.isArray(res.data) && res.data.length > 0) {
        const acc = res.data[0];
        setAccountData({
          id: acc.id,
          payment_method_id: acc.payment_method_id ? String(acc.payment_method_id) : '1',
          means_payment_id: acc.means_payment_id ? String(acc.means_payment_id) : '47',
          bank: acc.bank || '',
          account_type: acc.account_type || 'Ahorros',
          account_number: acc.account_number || '',
          is_active: acc.is_active !== undefined ? Boolean(acc.is_active) : true,
        });
      } else {
        setAccountData({
          id: null,
          payment_method_id: '1',
          means_payment_id: '47',
          bank: '',
          account_type: 'Ahorros',
          account_number: '',
          is_active: true,
        });
      }
    } catch {
      // Ignore payment account fetch error
    }
  };

  const loadAvailableCycles = async () => {
    try {
      const res = await payrollService.getCycles({ is_active: '1' });
      if (res?.status) {
        const items = res.data?.items || res.data || [];
        setAvailableCycles(items);
      }
    } catch {
      // Ignore cycle fetch error
    }
  };

  const loadEmployeeCycles = async (empId) => {
    if (!empId) return;
    setLoadingCycles(true);
    try {
      const res = await payrollService.getEmployeeCycles(empId);
      if (res?.status) {
        setCycleAssignments(res.data || []);
      }
    } catch {
      // Ignore assignment fetch error
    } finally {
      setLoadingCycles(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'cycles') {
      loadAvailableCycles();
      if (employeeToEdit?.id) {
        loadEmployeeCycles(employeeToEdit.id);
      }
    }
  }, [isOpen, activeTab, employeeToEdit]);

  const handleCreateAssignment = async () => {
    if (!employeeToEdit?.id) {
      showToast('Debe guardar el empleado antes de asignarle un ciclo de nómina.', 'warning');
      return;
    }
    if (!assignmentForm.payroll_cycle_id) {
      showToast('Seleccione un ciclo de nómina.', 'error');
      return;
    }
    if (!assignmentForm.start_date) {
      showToast('La fecha de inicio de asignación es obligatoria.', 'error');
      return;
    }

    setSubmittingAssignment(true);
    try {
      const payload = {
        payroll_cycle_id: Number(assignmentForm.payroll_cycle_id),
        start_date: assignmentForm.start_date,
        end_date: assignmentForm.end_date || null,
        is_active: true,
      };
      const res = await payrollService.createEmployeeCycle(employeeToEdit.id, payload);
      if (res?.status) {
        showToast('Ciclo de nómina asignado correctamente.', 'success');
        setAssignmentForm({
          payroll_cycle_id: '',
          start_date: formData.date_entry || new Date().toISOString().split('T')[0],
          end_date: '',
        });
        loadEmployeeCycles(employeeToEdit.id);
      } else {
        showToast(res?.message || 'Error al asociar ciclo de nómina.', 'error');
      }
    } catch {
      showToast('Ocurrió un error al intentar asignar el ciclo de nómina.', 'error');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleToggleAssignmentStatus = async (assignmentId, currentStatus) => {
    try {
      const res = await payrollService.toggleEmployeeCycleStatus(assignmentId, !currentStatus);
      if (res?.status) {
        showToast('Estado de la asignación actualizado.', 'success');
        if (employeeToEdit?.id) {
          loadEmployeeCycles(employeeToEdit.id);
        }
      } else {
        showToast(res?.message || 'No se pudo cambiar el estado de la asignación.', 'error');
      }
    } catch {
      showToast('Error al cambiar el estado de la asignación.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.worker_code.trim()) {
      showToast('El código del trabajador es obligatorio.', 'error');
      setActiveTab('general');
      return;
    }
    if (!formData.document_number.trim()) {
      showToast('El número de documento es obligatorio.', 'error');
      setActiveTab('general');
      return;
    }
    if (!formData.first_name.trim()) {
      showToast('El primer nombre es obligatorio.', 'error');
      setActiveTab('general');
      return;
    }
    if (!formData.first_surname.trim()) {
      showToast('El primer apellido es obligatorio.', 'error');
      setActiveTab('general');
      return;
    }
    if (!formData.work_address.trim()) {
      showToast('La dirección de trabajo es obligatoria.', 'error');
      setActiveTab('general');
      return;
    }
    if (!formData.date_entry) {
      showToast('La fecha de ingreso es obligatoria.', 'error');
      setActiveTab('general');
      return;
    }
    if (!formData.salary || Number(formData.salary) < 0) {
      showToast('El salario base debe ser un valor numérico mayor o igual a 0.', 'error');
      setActiveTab('general');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        worker_code: formData.worker_code.trim(),
        identity_document_id: formData.identity_document_id,
        document_number: formData.document_number.trim(),
        first_name: formData.first_name.trim(),
        other_names: formData.other_names ? formData.other_names.trim() : null,
        first_surname: formData.first_surname.trim(),
        second_surname: formData.second_surname ? formData.second_surname.trim() : null,
        working_country_id: formData.working_country_id || null,
        work_city_id: formData.work_city_id || null,
        work_address: formData.work_address.trim(),
        date_entry: formData.date_entry,
        departure_date: formData.departure_date ? formData.departure_date : null,
        worker_type_id: formData.worker_type_id || '1',
        worker_subtype_id: formData.worker_subtype_id || '1',
        contract_type_id: formData.contract_type_id || '1',
        salary: Number(formData.salary),
        integral_salary: Boolean(formData.integral_salary),
        high_risk_pension: Boolean(formData.high_risk_pension),
        is_active: Boolean(formData.is_active),
      };

      let savedEmpId = employeeToEdit?.id;
      let empRes;

      if (employeeToEdit) {
        empRes = await payrollService.updateEmployee(employeeToEdit.id, payload);
      } else {
        empRes = await payrollService.createEmployee(payload);
      }

      if (!empRes?.status) {
        showToast(empRes?.message || 'Error al guardar el empleado.', 'error');
        setLoading(false);
        return;
      }

      savedEmpId = savedEmpId || empRes?.data?.id;

      // Save Payment Account if entered or provided
      if (savedEmpId && (accountData.bank || accountData.account_number || accountData.payment_method_id)) {
        const accPayload = {
          payment_method_id: accountData.payment_method_id || '1',
          means_payment_id: accountData.means_payment_id || '47',
          bank: accountData.bank ? accountData.bank.trim() : null,
          account_type: accountData.account_type || 'Ahorros',
          account_number: accountData.account_number ? accountData.account_number.trim() : null,
          is_active: Boolean(accountData.is_active),
        };

        if (accountData.id) {
          await payrollService.updatePaymentAccount(accountData.id, accPayload);
        } else {
          await payrollService.createPaymentAccount(savedEmpId, accPayload);
        }
      }

      showToast(
        employeeToEdit ? 'Empleado actualizado correctamente.' : 'Empleado registrado correctamente.',
        'success'
      );
      onSave();
      onClose();
    } catch {
      showToast('Ocurrió un error inesperado al procesar la solicitud.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-8 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-500/20 text-yellow-400 rounded-2xl border border-yellow-500/30">
                  <User size={22} />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold tracking-wide uppercase">
                    {employeeToEdit ? 'Editar Empleado' : 'Nuevo Empleado'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {employeeToEdit
                      ? `Actualizar expediente de ${employeeToEdit.full_name || employeeToEdit.first_name}`
                      : 'Registrar un nuevo trabajador en el módulo de nómina'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50 px-6 pt-3 gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider rounded-t-2xl border-t border-x transition-all ${
                  activeTab === 'general'
                    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <User size={16} />
                <span>Datos Principales</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payment')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider rounded-t-2xl border-t border-x transition-all ${
                  activeTab === 'payment'
                    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <CreditCard size={16} />
                <span>Cuenta de Pago</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cycles')}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider rounded-t-2xl border-t border-x transition-all ${
                  activeTab === 'cycles'
                    ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <RefreshCw size={16} />
                <span>Ciclos de Nómina</span>
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar-light flex-1">
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    {/* Section 1: Identificación y Nombres */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                        <Hash size={14} className="text-yellow-500" /> Identificación y Nombres
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                            Código Trabajador *
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-yellow-500 focus:bg-white transition-all uppercase"
                            value={formData.worker_code}
                            onChange={(e) => setFormData({ ...formData, worker_code: e.target.value })}
                            placeholder="Ej: EMP001"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                            Tipo de Documento
                          </label>
                          <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 focus:bg-white transition-all font-medium"
                            value={formData.identity_document_id}
                            onChange={(e) => setFormData({ ...formData, identity_document_id: e.target.value })}
                          >
                            <option value="1">Cédula de Ciudadanía</option>
                            <option value="2">Cédula de Extranjería</option>
                            <option value="3">Pasaporte</option>
                            <option value="4">Tarjeta de Identidad</option>
                            <option value="5">NIT</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                            Número Documento *
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                            value={formData.document_number}
                            onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                            placeholder="Ej: 1098765432"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                            Primer Nombre *
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            placeholder="Ej: Juan"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                            Otros Nombres
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                            value={formData.other_names}
                            onChange={(e) => setFormData({ ...formData, other_names: e.target.value })}
                            placeholder="Ej: Carlos"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                            Primer Apellido *
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                            value={formData.first_surname}
                            onChange={(e) => setFormData({ ...formData, first_surname: e.target.value })}
                            placeholder="Ej: Pérez"
                            required
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                            Segundo Apellido
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                            value={formData.second_surname}
                            onChange={(e) => setFormData({ ...formData, second_surname: e.target.value })}
                            placeholder="Ej: Gómez"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                            Dirección de Trabajo *
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3.5 top-3 text-slate-400" size={16} />
                            <input
                              type="text"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                              value={formData.work_address}
                              onChange={(e) => setFormData({ ...formData, work_address: e.target.value })}
                              placeholder="Ej: Calle 45 # 12-34"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Ubicación de Trabajo */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                        <MapPin size={14} className="text-yellow-500" /> Ubicación Laboral
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">País</label>
                          <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 focus:bg-white transition-all font-medium"
                            value={formData.working_country_id}
                            onChange={handleCountryChange}
                          >
                            <option value="">Seleccione país</option>
                            {countries.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name || c.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Departamento</label>
                          <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 focus:bg-white transition-all font-medium"
                            value={formData.department_id}
                            onChange={handleDepartmentChange}
                            disabled={!formData.working_country_id}
                          >
                            <option value="">Seleccione departamento</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name || d.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Ciudad</label>
                          <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 focus:bg-white transition-all font-medium"
                            value={formData.work_city_id}
                            onChange={(e) => setFormData({ ...formData, work_city_id: e.target.value })}
                            disabled={!formData.department_id}
                          >
                            <option value="">Seleccione ciudad</option>
                            {cities.map((ci) => (
                              <option key={ci.id} value={ci.id}>
                                {ci.name || ci.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Datos Laborales y Contratación */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                        <Briefcase size={14} className="text-yellow-500" /> Contrato y Salario
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                            Salario Básico Mensual *
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3.5 top-3 text-slate-400" size={16} />
                            <input
                              type="number"
                              step="0.01"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-yellow-500 focus:bg-white transition-all"
                              value={formData.salary}
                              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                              placeholder="Ej: 1300000"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                            Fecha de Ingreso *
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3.5 top-3 text-slate-400" size={16} />
                            <input
                              type="date"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                              value={formData.date_entry}
                              onChange={(e) => setFormData({ ...formData, date_entry: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                            Fecha de Retiro (Opcional)
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3.5 top-3 text-slate-400" size={16} />
                            <input
                              type="date"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                              value={formData.departure_date}
                              onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                            Tipo de Trabajador
                          </label>
                          <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 focus:bg-white transition-all font-medium"
                            value={formData.worker_type_id}
                            onChange={(e) => setFormData({ ...formData, worker_type_id: e.target.value })}
                          >
                            <option value="1">Dependiente</option>
                            <option value="2">Servicio Doméstico</option>
                            <option value="4">Madre Comunitaria</option>
                            <option value="51">Trabajador de tiempo parcial</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                            Subtipo de Trabajador
                          </label>
                          <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 focus:bg-white transition-all font-medium"
                            value={formData.worker_subtype_id}
                            onChange={(e) => setFormData({ ...formData, worker_subtype_id: e.target.value })}
                          >
                            <option value="1">No aplica</option>
                            <option value="2">Pensionado</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                            Tipo de Contrato
                          </label>
                          <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 focus:bg-white transition-all font-medium"
                            value={formData.contract_type_id}
                            onChange={(e) => setFormData({ ...formData, contract_type_id: e.target.value })}
                          >
                            <option value="1">Término Fijo</option>
                            <option value="2">Término Indefinido</option>
                            <option value="3">Obra o Labor</option>
                            <option value="4">Aprendizaje</option>
                            <option value="5">Prácticas o Pasantías</option>
                          </select>
                        </div>
                      </div>

                      {/* Flags & State */}
                      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={formData.integral_salary}
                            onChange={(e) => setFormData({ ...formData, integral_salary: e.target.checked })}
                            className="w-4 h-4 text-yellow-500 border-slate-300 rounded focus:ring-yellow-500"
                          />
                          <span>Salario Integral</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={formData.high_risk_pension}
                            onChange={(e) => setFormData({ ...formData, high_risk_pension: e.target.checked })}
                            className="w-4 h-4 text-yellow-500 border-slate-300 rounded focus:ring-yellow-500"
                          />
                          <span>Pensión de Alto Riesgo</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 ml-auto">
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                          />
                          <span className={formData.is_active ? 'text-emerald-700 font-black' : 'text-slate-400'}>
                            Empleado Activo
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'payment' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                        <Building size={14} className="text-yellow-500" /> Configuración de Pago Bancario
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">
                        Información requerida para la dispersión de nómina y la transmisión del documento electrónico
                        MATIAS.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Método de Pago</label>
                          <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 focus:bg-white transition-all font-medium"
                            value={accountData.payment_method_id}
                            onChange={(e) => setAccountData({ ...accountData, payment_method_id: e.target.value })}
                          >
                            <option value="1">Contado</option>
                            <option value="2">Crédito</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Medio de Pago</label>
                          <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 focus:bg-white transition-all font-medium"
                            value={accountData.means_payment_id}
                            onChange={(e) => setAccountData({ ...accountData, means_payment_id: e.target.value })}
                          >
                            <option value="10">Efectivo / Instrumento no definido</option>
                            <option value="47">Transferencia Débito Bancario</option>
                            <option value="42">Consignación Bancaria</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Banco / Entidad</label>
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                            value={accountData.bank}
                            onChange={(e) => setAccountData({ ...accountData, bank: e.target.value })}
                            placeholder="Ej: Bancolombia, Davivienda, Nequi"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Tipo de Cuenta</label>
                          <select
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 focus:bg-white transition-all font-medium"
                            value={accountData.account_type}
                            onChange={(e) => setAccountData({ ...accountData, account_type: e.target.value })}
                          >
                            <option value="Ahorros">Cuenta de Ahorros</option>
                            <option value="Corriente">Cuenta Corriente</option>
                            <option value="Daviplata">Daviplata</option>
                            <option value="Nequi">Nequi</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                            Número de Cuenta / Teléfono celular
                          </label>
                          <div className="relative">
                            <CreditCard className="absolute left-3.5 top-3 text-slate-400" size={16} />
                            <input
                              type="text"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 focus:bg-white transition-all"
                              value={accountData.account_number}
                              onChange={(e) => setAccountData({ ...accountData, account_number: e.target.value })}
                              placeholder="Ej: 12345678901"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={accountData.is_active}
                            onChange={(e) => setAccountData({ ...accountData, is_active: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                          />
                          <span className={accountData.is_active ? 'text-emerald-700 font-black' : 'text-slate-400'}>
                            Cuenta de Pago Activa
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'cycles' && (
                  <div className="space-y-6">
                    {!employeeToEdit ? (
                      <div className="p-8 bg-amber-50 border border-amber-200 rounded-3xl text-center space-y-3">
                        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                          <AlertCircle size={24} />
                        </div>
                        <h4 className="text-sm font-bold text-amber-900 uppercase">
                          Asignación de Ciclo de Nómina
                        </h4>
                        <p className="text-xs text-amber-700 max-w-md mx-auto">
                          Para asociar un ciclo de nómina a un empleado, primero debe guardar los datos principales del trabajador.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Section 1: Formulario para Asignar Nuevo Ciclo */}
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                            <RefreshCw size={14} className="text-yellow-500" /> Nueva Asignación de Ciclo
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                                Ciclo de Nómina *
                              </label>
                              <select
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 transition-all font-medium"
                                value={assignmentForm.payroll_cycle_id}
                                onChange={(e) =>
                                  setAssignmentForm({ ...assignmentForm, payroll_cycle_id: e.target.value })
                                }
                              >
                                <option value="">Seleccione ciclo...</option>
                                {availableCycles.map((cycle) => (
                                  <option key={cycle.id} value={cycle.id}>
                                    {cycle.name} ({cycle.code}) — {cycle.period_type === 'monthly' ? 'Mensual' : cycle.period_type === 'biweekly' ? 'Quincenal' : cycle.period_type}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                                Fecha de Inicio *
                              </label>
                              <div className="relative">
                                <Calendar className="absolute left-3.5 top-3 text-slate-400" size={16} />
                                <input
                                  type="date"
                                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 transition-all"
                                  value={assignmentForm.start_date}
                                  onChange={(e) =>
                                    setAssignmentForm({ ...assignmentForm, start_date: e.target.value })
                                  }
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                                Fecha de Fin (Opcional)
                              </label>
                              <div className="relative">
                                <Calendar className="absolute left-3.5 top-3 text-slate-400" size={16} />
                                <input
                                  type="date"
                                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-yellow-500 transition-all"
                                  value={assignmentForm.end_date}
                                  onChange={(e) =>
                                    setAssignmentForm({ ...assignmentForm, end_date: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={handleCreateAssignment}
                              disabled={submittingAssignment}
                              className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold text-xs rounded-2xl transition-all flex items-center gap-2 shadow-sm uppercase disabled:opacity-50"
                            >
                              {submittingAssignment ? (
                                <>
                                  <Loader2 className="animate-spin" size={14} />
                                  <span>Asignando...</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={14} />
                                  <span>Asignar Ciclo</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Section 2: Historial de Ciclos Asignados */}
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                            <Clock size={14} className="text-yellow-500" /> Historial de Ciclos Asignados
                          </h4>

                          {loadingCycles ? (
                            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                              <Loader2 className="animate-spin" size={24} />
                              <span className="text-xs font-bold uppercase">Cargando ciclos asignados...</span>
                            </div>
                          ) : cycleAssignments.length === 0 ? (
                            <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center text-slate-400 text-xs font-medium">
                              El empleado no tiene ciclos de nómina asignados actualmente.
                            </div>
                          ) : (
                            <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100/70 border-b border-slate-200/80">
                                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                      Ciclo
                                    </th>
                                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                      Tipo Período
                                    </th>
                                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                      Fecha Inicio
                                    </th>
                                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                      Fecha Fin
                                    </th>
                                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">
                                      Estado
                                    </th>
                                    <th className="py-3 px-4 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">
                                      Acciones
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700 bg-white">
                                  {cycleAssignments.map((asg) => (
                                    <tr key={asg.id} className="hover:bg-slate-50/80 transition-colors">
                                      <td className="py-3.5 px-4 font-bold text-slate-900">
                                        {asg.payroll_cycle?.name || 'Ciclo #' + asg.payroll_cycle_id}
                                        {asg.payroll_cycle?.code && (
                                          <span className="ml-1 text-[10px] text-slate-400 font-normal">
                                            ({asg.payroll_cycle.code})
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-slate-600">
                                        {asg.payroll_cycle?.period_type === 'monthly'
                                          ? 'Mensual'
                                          : asg.payroll_cycle?.period_type === 'biweekly'
                                          ? 'Quincenal'
                                          : asg.payroll_cycle?.period_type || '-'}
                                      </td>
                                      <td className="py-3.5 px-4 font-semibold">{asg.start_date || '-'}</td>
                                      <td className="py-3.5 px-4">
                                        {asg.end_date ? (
                                          <span>{asg.end_date}</span>
                                        ) : (
                                          <span className="text-emerald-600 font-bold text-[10px] uppercase">
                                            Vigente
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3.5 px-4 text-center">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                            asg.is_active
                                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50'
                                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                                          }`}
                                        >
                                          <span
                                            className={`w-1.5 h-1.5 rounded-full ${
                                              asg.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                                            }`}
                                          ></span>
                                          {asg.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-4 text-right">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleAssignmentStatus(asg.id, asg.is_active)}
                                          className={`p-1.5 rounded-lg transition-all ${
                                            asg.is_active
                                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                          }`}
                                          title={asg.is_active ? 'Desactivar Asignación' : 'Activar Asignación'}
                                        >
                                          <Power size={14} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs uppercase hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-2xl bg-zinc-900 text-white font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-200 uppercase"
                >
                  {loading ? (
                    'Procesando...'
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>{employeeToEdit ? 'Guardar Cambios' : 'Registrar Empleado'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
