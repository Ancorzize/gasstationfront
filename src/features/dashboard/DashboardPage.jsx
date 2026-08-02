import React, { useState, useEffect } from 'react';
import { dashboardService } from '../dashboard/services/dashboardService';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { DashboardCharts } from './components/DashboardCharts';

export const DashboardPage = () => {
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [periodo, setPeriodo] = useState('hoy');
  const [fechas, setFechas] = useState({ desde: '', hasta: '' });


  const calcularFechasPorPeriodo = (tipoPeriodo) => {
    const hoy = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];

    if (tipoPeriodo === 'hoy') {
      const fechaActual = formatDate(hoy);
      return { desde: fechaActual, hasta: fechaActual };
    } 
    
    if (tipoPeriodo === 'este_mes') {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      return { desde: formatDate(primerDia), hasta: formatDate(ultimoDia) };
    }

    return fechas;
  };

  useEffect(() => {
    if (periodo !== 'personalizado') {
      const nuevasFechas = calcularFechasPorPeriodo(periodo);
      setFechas(nuevasFechas);
    }
  }, [periodo]);

  const fetchData = async () => {

    if (!fechas.desde || !fechas.hasta) return;

    setLoading(true);
    try {
      const res = await dashboardService.getDashboardData(fechas.desde, fechas.hasta);
      if (res.status && res.data?.widgets) {
        setData(res.data.widgets);
      } else {
        setData([]);
      }
    } catch (e) {
      console.error(e);
      showToast("Error al cargar dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [fechas]);

  const KpiWidget = ({ data, titulo }) => (
    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{titulo}</p>
      <h4 className="text-2xl font-black text-zinc-900 mt-2">
        {typeof data?.valor === 'number' ? `$ ${data.valor.toLocaleString('es-CO')}` : data?.valor}
      </h4>
    </div>
  );

  const TableWidget = ({ data, titulo }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-50 font-black text-xs text-slate-600 uppercase">{titulo}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <tbody className="divide-y divide-slate-50">
            {data.items?.map((item, i) => (
              <tr key={i}>
                {Object.values(item).map((val, j) => (
                  <td key={j} className="px-4 py-3 text-slate-600">
                    {typeof val === 'object' ? JSON.stringify(val) : val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWidget = (widget) => {
    const { tipo, data, nombre } = widget;

    switch (tipo) {
      case 'card':
        return <KpiWidget data={data} titulo={nombre} />;
      
      case 'table':
        return <TableWidget data={data} titulo={nombre} />;
        
      case 'chart':
        return (
          <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-4">{nombre}</p>
            <DashboardCharts tipo={widget.codigo.includes('flujo') ? 'line' : 'bar'} data={data} />
          </div>
        );
        
      default:
        return <div className="p-4 bg-red-50 text-red-500 rounded-xl text-xs">Tipo desconocido: {tipo}</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border">
        <select 
          value={periodo} 
          onChange={(e) => setPeriodo(e.target.value)} 
          className="p-2 border rounded-lg text-xs font-bold text-slate-700 outline-none"
        >
            <option value="hoy">Hoy</option>
            <option value="este_mes">Este Mes</option>
            <option value="personalizado">Personalizado</option>
        </select>
        
        {periodo === 'personalizado' && (
            <div className="flex gap-2">
                <input 
                  type="date" 
                  value={fechas.desde}
                  className="p-2 border rounded-lg text-xs" 
                  onChange={e => setFechas({...fechas, desde: e.target.value})} 
                />
                <input 
                  type="date" 
                  value={fechas.hasta}
                  className="p-2 border rounded-lg text-xs" 
                  onChange={e => setFechas({...fechas, hasta: e.target.value})} 
                />
            </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : data.length === 0 ? (
        <div className="p-10 text-center text-slate-400">Sin información para el período seleccionado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.map((widget, idx) => (
                <div key={idx} className={widget.ancho > 6 ? "md:col-span-2" : ""}>
                    {renderWidget(widget)}
                </div>
            ))}
        </div>
      )}
    </div>
  );
};