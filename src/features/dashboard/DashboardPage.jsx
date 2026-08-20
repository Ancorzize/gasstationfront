import React, { useState, useEffect } from 'react';
import { dashboardService } from '../dashboard/services/dashboardService';
import { Loader2, ArrowLeft, ArrowRight, Maximize2, Minimize2, Grid } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { DashboardCharts } from './components/DashboardCharts';

export const DashboardPage = () => {
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [periodo, setPeriodo] = useState('hoy');
  const [fechas, setFechas] = useState({ desde: '', hasta: '' });

  const STORAGE_KEY = 'dashboard_widgets_config_v2';

  const calcularFechasPorPeriodo = (tipoPeriodo) => {
    const hoy = new Date();
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (tipoPeriodo === 'hoy') {
      const fechaActual = formatLocalDate(hoy);
      return { desde: fechaActual, hasta: fechaActual };
    } 
    if (tipoPeriodo === 'este_mes') {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      return { desde: formatLocalDate(primerDia), hasta: formatLocalDate(ultimoDia) };
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
        const rawWidgets = res.data.widgets;
        
        const savedConfig = localStorage.getItem(STORAGE_KEY);
        if (savedConfig) {
          try {
            const parsedConfig = JSON.parse(savedConfig);
            const configuredWidgets = parsedConfig.map(saved => {
              const found = rawWidgets.find(w => w.codigo === saved.codigo);
              return found ? { ...found, ancho: saved.ancho ?? found.ancho } : null;
            }).filter(Boolean);

            rawWidgets.forEach(w => {
              if (!configuredWidgets.some(cw => cw.codigo === w.codigo)) {
                configuredWidgets.push(w);
              }
            });

            setData(configuredWidgets);
          } catch (e) {
            setData(rawWidgets);
          }
        } else {
          setData(rawWidgets);
        }
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

  const saveLayoutToStorage = (updatedWidgets) => {
    const configToSave = updatedWidgets.map(w => ({
      codigo: w.codigo,
      ancho: w.ancho
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
  };

  const handleMove = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= data.length) return;
    const newData = [...data];
    const temp = newData[index];
    newData[index] = newData[newIndex];
    newData[newIndex] = temp;
    setData(newData);
    saveLayoutToStorage(newData);
  };

  // Rotar tamaño: 6 (mediano / 2 por fila) -> 4 (pequeño / 3 por fila) -> 12 (completo / 1 por fila) -> 6
  const handleCycleWidth = (index) => {
    const newData = [...data];
    const current = newData[index].ancho;
    
    if (current === 6) {
      newData[index].ancho = 4; // 3 por fila
    } else if (current === 4) {
      newData[index].ancho = 12; // Ancho completo
    } else {
      newData[index].ancho = 6; // 2 por fila por defecto
    }

    setData(newData);
    saveLayoutToStorage(newData);
  };

  const KpiWidget = ({ data, titulo }) => (
    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col justify-between">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{titulo}</p>
      <h4 className="text-2xl font-black text-zinc-900 mt-2">
        {typeof data?.valor === 'number' ? ` ${data.valor.toLocaleString('es-CO')}` : data?.valor}
      </h4>
    </div>
  );

  const TableWidget = ({ data, titulo }) => {
    const items = data.items || [];
    const hasItems = items.length > 0;
    const columns = hasItems ? Object.keys(items[0]) : [];

    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-slate-50 font-black text-xs text-slate-600 uppercase">
          {titulo}
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs whitespace-nowrap">
            {hasItems && (
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  {columns.map((col, index) => (
                    <th key={index} className="px-4 py-2.5">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-50">
              {hasItems ? (
                items.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    {Object.values(item).map((val, j) => (
                      <td key={j} className="px-4 py-3 text-slate-600">
                        {typeof val === 'object' && val !== null ? JSON.stringify(val) : val}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="100%" className="px-4 py-8 text-center text-slate-400 text-xs">
                    Sin datos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderWidget = (widget) => {
    const { tipo, data, nombre } = widget;

    switch (tipo) {
      case 'card':
        return <KpiWidget data={data} titulo={nombre} />;
      case 'table':
        return <TableWidget data={data} titulo={nombre} />;
      case 'chart':
        return (
          <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-4">{nombre}</p>
            <div className="flex-1">
              <DashboardCharts tipo={widget.codigo.includes('flujo') ? 'line' : 'bar'} data={data} />
            </div>
          </div>
        );
      default:
        return <div className="p-4 bg-red-50 text-red-500 rounded-xl text-xs">Tipo desconocido: {tipo}</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <select 
          value={periodo} 
          onChange={(e) => setPeriodo(e.target.value)} 
          className="p-2 border rounded-lg text-xs font-bold text-slate-700 outline-none bg-slate-50"
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
                  className="p-2 border rounded-lg text-xs bg-slate-50" 
                  onChange={e => setFechas({...fechas, desde: e.target.value})} 
                />
                <input 
                  type="date" 
                  value={fechas.hasta}
                  className="p-2 border rounded-lg text-xs bg-slate-50" 
                  onChange={e => setFechas({...fechas, hasta: e.target.value})} 
                />
            </div>
        )}
        <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
          💡 Pasa el mouse sobre cualquier tarjeta para moverla o cambiar su tamaño (2 por fila, 3 por fila o completa).
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : data.length === 0 ? (
        <div className="p-10 text-center text-slate-400">Sin información para el período seleccionado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {data.map((widget, idx) => {
              // Asignación de clases de Tailwind según el ancho configurado (4 = 1/3 de pantalla, 6 = mitad, 12 = completo)
              let spanClass = "md:col-span-6";
              if (widget.ancho === 4) spanClass = "lg:col-span-4 md:col-span-6";
              if (widget.ancho === 12) spanClass = "md:col-span-12";

              return (
                <div key={widget.codigo || idx} className={`${spanClass} relative group transition-all duration-200`}>
                  
                  {/* Botonera flotante */}
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-sm border border-slate-200 shadow-sm rounded-lg p-1 flex items-center gap-1">
                    <button 
                      onClick={() => handleMove(idx, -1)} 
                      disabled={idx === 0}
                      title="Mover a la izquierda"
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button 
                      onClick={() => handleMove(idx, 1)} 
                      disabled={idx === data.length - 1}
                      title="Mover a la derecha"
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                    >
                      <ArrowRight size={14} />
                    </button>
                    <span className="w-[1px] h-3 bg-slate-200 mx-0.5" />
                    <button 
                      onClick={() => handleCycleWidth(idx)}
                      title="Cambiar tamaño (2 por fila / 3 por fila / Ancho completo)"
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 flex items-center gap-0.5 text-[10px] font-bold px-1.5"
                    >
                      <Grid size={13} />
                      <span>{widget.ancho === 4 ? '3x' : widget.ancho === 6 ? '2x' : '1x'}</span>
                    </button>
                  </div>

                  {renderWidget(widget)}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};