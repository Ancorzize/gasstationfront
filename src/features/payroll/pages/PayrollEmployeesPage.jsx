import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Edit2, Power, UserPlus, Loader2, Download, UserCheck, ShieldCheck } from 'lucide-react';
import { payrollService } from '../services/payrollService';
import { useToast } from '../../../context/ToastContext';
import { EmployeeModal } from '../components/EmployeeModal';
import { exportToExcel } from '../../../shared/utils/exportExcel';

export const PayrollEmployeesPage = () => {
  const { showToast } = useToast();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await payrollService.getEmployees({
        search: searchTerm,
        page: page,
        per_page: 15,
        is_active: statusFilter,
      });

      if (res?.status) {
        setEmployees(res.data.items || []);
        if (res.data.pagination) {
          setCurrentPage(res.data.pagination.current_page || 1);
          setLastPage(res.data.pagination.last_page || 1);
          setTotalItems(res.data.pagination.total || 0);
        }
      } else {
        showToast(res?.message || 'Error al obtener la lista de empleados.', 'error');
      }
    } catch {
      showToast('Error de conexión al cargar empleados.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, showToast]);

  useEffect(() => {
    fetchEmployees(1);
  }, [fetchEmployees]);

  const handleToggleStatus = async (employee) => {
    try {
      const newStatus = !employee.is_active;
      const res = await payrollService.toggleEmployeeStatus(employee.id, newStatus);

      if (res?.status) {
        showToast(
          newStatus ? 'Empleado activado correctamente.' : 'Empleado desactivado correctamente.',
          'success'
        );
        fetchEmployees(currentPage);
      } else {
        showToast(res?.message || 'No se pudo cambiar el estado del empleado.', 'error');
      }
    } catch {
      showToast('Error al procesar el cambio de estado.', 'error');
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '$ 0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(val));
  };

  const getContractTypeLabel = (typeId) => {
    const map = {
      '1': 'Término Fijo',
      '2': 'Término Indefinido',
      '3': 'Obra o Labor',
      '4': 'Aprendizaje',
      '5': 'Prácticas',
    };
    return map[String(typeId)] || 'Término Fijo';
  };

  const getWorkerTypeLabel = (typeId) => {
    const map = {
      '1': 'Dependiente',
      '2': 'Servicio Doméstico',
      '4': 'Madre Comunitaria',
      '51': 'Tiempo Parcial',
    };
    return map[String(typeId)] || 'Dependiente';
  };

  const filteredExportItems = useMemo(() => {
    return employees.map((emp) => ({
      Código: emp.worker_code,
      Documento: emp.document_number,
      Nombre: emp.full_name,
      Salario: emp.salary,
      Tipo_Trabajador: getWorkerTypeLabel(emp.worker_type_id),
      Tipo_Contrato: getContractTypeLabel(emp.contract_type_id),
      Fecha_Ingreso: emp.date_entry,
      Estado: emp.is_active ? 'Activo' : 'Inactivo',
    }));
  }, [employees]);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">
            Nómina — Empleados
          </h2>
          <p className="text-slate-500 text-xs md:text-sm font-bold tracking-widest uppercase mt-0.5">
            Gestión de empleados y cuentas de pago
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            onClick={() => exportToExcel(filteredExportItems, 'Empleados_Nomina')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>

          <div className="relative flex-1 md:flex-none min-w-[180px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-zinc-900 transition-all shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="bg-white border border-slate-200 text-slate-700 px-3 py-2.5 rounded-2xl font-bold text-xs outline-none focus:border-zinc-900 shadow-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="1">Solo Activos</option>
            <option value="0">Solo Inactivos</option>
          </select>

          <button
            onClick={() => {
              setSelectedEmployee(null);
              setIsModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-[10px] uppercase hover:bg-black transition-all shadow-md"
          >
            <UserPlus size={16} /> <span className="hidden sm:inline">Nuevo empleado</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar-light">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Cargando expediente de empleados...
              </p>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <UserCheck size={24} />
              </div>
              <p className="text-sm font-bold text-slate-600 uppercase">No se encontraron empleados</p>
              <p className="text-xs text-slate-400">Intenta cambiar los filtros o agrega un nuevo empleado.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Código</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Identificación</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Empleado</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tipo / Contrato</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Salario Base</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Estado</th>
                  <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 uppercase">{emp.worker_code}</td>
                    <td className="py-4 px-6">
                      <span className="font-semibold">{emp.document_number}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{emp.full_name || `${emp.first_name} ${emp.first_surname}`}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{emp.work_address}</div>
                    </td>
                    <td className="py-4 px-6 space-y-1">
                      <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                        {getWorkerTypeLabel(emp.worker_type_id)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {getContractTypeLabel(emp.contract_type_id)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-900">
                      {formatCurrency(emp.salary)}
                      {emp.integral_salary && (
                        <span className="block text-[9px] text-amber-600 font-bold uppercase">Integral</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          emp.is_active
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50'
                            : 'bg-rose-50 text-rose-600 border border-rose-200/50'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {emp.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-zinc-900 hover:bg-slate-100 rounded-xl transition-all"
                          title="Editar Empleado"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          className={`p-2 rounded-xl transition-all ${
                            emp.is_active
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={emp.is_active ? 'Desactivar Empleado' : 'Activar Empleado'}
                        >
                          <Power size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && employees.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span>
              Total: <strong>{totalItems}</strong> empleados | Página <strong>{currentPage}</strong> de{' '}
              <strong>{lastPage}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => fetchEmployees(currentPage - 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
              >
                Anterior
              </button>
              <button
                disabled={currentPage >= lastPage}
                onClick={() => fetchEmployees(currentPage + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEmployee(null);
        }}
        onSave={() => fetchEmployees(currentPage)}
        employeeToEdit={selectedEmployee}
      />
    </div>
  );
};
