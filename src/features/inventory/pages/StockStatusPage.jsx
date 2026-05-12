import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { Box, Search, Loader2, Download, Warehouse, AlertTriangle, RefreshCcw, LayoutList, Tag } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { warehouseService } from '../../warehouses/services/warehouseService';
import { useToast } from '../../../context/ToastContext';
import { useLocation, useNavigate } from 'react-router-dom';

export const StockStatusPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stock, setStock] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await warehouseService.getWarehouses();
        if (res.status) setWarehouses(res.data.items || []);
      } catch (e) {
        showToast("Error al cargar bodegas", "error");
      } finally {
        setLoadingWarehouses(false);
      }
    };
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) fetchStock();
    else setStock([]);
  }, [selectedWarehouse]);

  useEffect(() => {
    if (location.state?.bodega_id) {
      setSelectedWarehouse(location.state.bodega_id.toString());

      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await inventoryService.getStock({ bodega_id: selectedWarehouse });
      if (res.status) setStock(res.data.items || []);
    } catch (e) {
      showToast("Error al cargar existencias", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredStock = stock.filter(item => 
    item.producto?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.producto?.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToExcel = () => {
    if (filteredStock.length === 0) return showToast("No hay datos para exportar", "error");
    
    const bodegaNombre = warehouses.find(w => w.id.toString() === selectedWarehouse)?.nombre || 'Bodega';

    const dataToExport = filteredStock.map(item => ({
      'CÓDIGO': item.producto?.codigo,
      'NOMBRE': item.producto?.nombre,
      'MARCA': item.producto?.marca?.nombre || 'N/A',
      'CATEGORÍA': item.producto?.categoria?.nombre || 'N/A',
      'UNIDAD': item.producto?.unidad_medida?.nombre || 'UND',
      'CANTIDAD': parseFloat(item.cantidad)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Existencias");
    XLSX.writeFile(workbook, `Inventario_${bodegaNombre.replace(/ /g, '_')}.xlsx`);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
            Control de Inventario
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Saldos por bodega con desglose detallado</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[250px]">
            <Warehouse className="absolute left-4 top-3 text-slate-400" size={16} />
            <select 
              className="w-full pl-12 pr-10 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-zinc-900 shadow-sm appearance-none transition-all cursor-pointer"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              disabled={loadingWarehouses}
            >
              <option value="">-- SELECCIONE UNA BODEGA --</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.nombre}</option>
              ))}
            </select>
          </div>

          {selectedWarehouse && (
            <>
              <div className="relative min-w-[200px]">
                <Search className="absolute left-4 top-3 text-slate-400" size={16} />
                <input 
                  type="text" placeholder="Filtrar..." 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs outline-none focus:border-zinc-900 shadow-sm"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button onClick={exportToExcel} className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all">
                <Download size={16} /> Excel
              </button>
            </>
          )}
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {!selectedWarehouse ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-4 border border-slate-100/50">
              <Warehouse size={40} />
            </div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Consulta bajo demanda</h3>
            <p className="text-[10px] text-slate-300 font-bold uppercase mt-2">Elija una bodega para procesar el listado de existencias.</p>
          </div>
        ) : loading ? (
          <div className="p-20 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-zinc-900 mb-4" size={40} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generando reporte...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-50">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Producto</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marca</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Unidad</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStock.length > 0 ? (
                  filteredStock.map((item, idx) => {
                    const isLow = parseFloat(item.cantidad) <= 10;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black text-slate-400 group-hover:text-zinc-900 transition-colors">
                            {item.producto?.codigo}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{item.producto?.nombre}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded-md">
                            {item.producto?.marca?.nombre || 'Genérico'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Tag size={12} />
                            <span className="text-[10px] font-bold uppercase">{item.producto?.categoria?.nombre || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase">{item.producto?.unidad_medida?.nombre || 'UND'}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`inline-flex flex-col items-end px-3 py-1 rounded-xl ${isLow ? 'bg-red-50 text-red-600 border border-red-100' : ''}`}>
                            <span className="text-sm font-black tracking-tighter">
                              {parseFloat(item.cantidad).toLocaleString('es-CO')}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-20 text-center text-slate-400 text-xs font-bold uppercase italic">
                      No se encontraron productos con saldo en esta ubicación.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};