import React, { useState, useEffect } from 'react';
import { 
  X, ArrowLeftRight, Search, Loader2, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { useToast } from '../../../context/ToastContext';

export const TransferBulkModal = ({ isOpen, onClose, onSave }) => {
  const { showToast } = useToast();
  
  // Estados de bodegas y paso/estado general
  const [warehouses, setWarehouses] = useState([]);
  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  
  // Productos y búsqueda
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Selección de productos (mapa de producto_id -> cantidad o estado)
  const [seleccionados, setSeleccionados] = useState({});

  // Observación y estados de envío
  const [observacion, setObservacion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [stepResumen, setStepResumen] = useState(false);

  // Cargar bodegas al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setOrigenId('');
      setDestinoId('');
      setProductosDisponibles([]);
      setSeleccionados({});
      setObservacion('');
      setStepResumen(false);
      setBusqueda('');
      
      fetchWarehouses();
    }
  }, [isOpen]);

  const fetchWarehouses = async () => {
    try {
      const res = await inventoryService.getStock();
      if (res.status && res.data) {
        const mapW = {};
        res.data.items?.forEach(item => {
          if (item.bodega) {
            mapW[item.bodega.id] = item.bodega;
          }
        });
        setWarehouses(Object.values(mapW));
      }
    } catch (e) {
      showToast("Error al cargar bodegas", "error");
    }
  };

  // Cargar productos cuando cambia la bodega origen
  useEffect(() => {
    if (origenId) {
      fetchStockPorBodega(origenId);
    } else {
      setProductosDisponibles([]);
      setSeleccionados({});
    }
  }, [origenId]);

  const fetchStockPorBodega = async (bodegaId) => {
    setLoadingProductos(true);
    try {
      const res = await inventoryService.getStock({ bodega_id: bodegaId });
      if (res.status) {
        setProductosDisponibles(res.data.items || []);
        setSeleccionados({});
      }
    } catch (e) {
      showToast("Error al cargar productos de la bodega", "error");
    } finally {
      setLoadingProductos(false);
    }
  };

  // Manejar selección de checkbox de producto
  const handleToggleProducto = (prodItem) => {
    const prodId = prodItem.producto_id;
    const stockMax = Number(prodItem.cantidad || 0);
    const unidadMedida = prodItem.producto?.unidad_medida?.abreviatura || 'UN';
    const nombreProd = prodItem.producto?.nombre || 'Producto sin nombre';
    const codigoProd = prodItem.producto?.codigo || '';

    setSeleccionados(prev => {
      const copia = { ...prev };
      if (copia[prodId]) {
        delete copia[prodId];
      } else {
        copia[prodId] = {
          producto_id: prodId,
          nombre: nombreProd,
          codigo: codigoProd,
          stock: stockMax,
          unidad: unidadMedida,
          cantidad: ''
        };
      }
      return copia;
    });
  };

  // Manejar cambio de cantidad para un producto seleccionado
  const handleCantidadChange = (prodId, val) => {
    setSeleccionados(prev => {
      if (!prev[prodId]) return prev;
      return {
        ...prev,
        [prodId]: {
          ...prev[prodId],
          cantidad: val
        }
      };
    });
  };

  const productosFiltrados = productosDisponibles.filter(p => {
    const nombre = (p.producto?.nombre || '').toLowerCase();
    const codigo = (p.producto?.codigo || '').toLowerCase();
    const query = busqueda.toLowerCase();
    return nombre.includes(query) || codigo.includes(query);
  });

  // Validaciones
  const itemsArray = Object.values(seleccionados);
  const totalProductosSeleccionados = itemsArray.length;
  
  const hayErroresCantidad = itemsArray.some(item => {
    const cant = Number(item.cantidad);
    return isNaN(cant) || cant <= 0 || cant > item.stock;
  });

  const bodegasIguales = origenId && destinoId && Number(origenId) === Number(destinoId);
  const esValidoFormulario = origenId && destinoId && !bodegasIguales && totalProductosSeleccionados > 0 && !hayErroresCantidad;

  const handleSubmitTraslado = async () => {
    if (!esValidoFormulario) return;

    setEnviando(true);
    try {
      const payload = {
        bodega_origen_id: Number(origenId),
        bodega_destino_id: Number(destinoId),
        observacion: observacion.trim() || 'Traslado masivo de productos',
        items: itemsArray.map(item => ({
          producto_id: Number(item.producto_id),
          cantidad: Number(item.cantidad)
        }))
      };

      const res = await inventoryService.createTransferBulk(payload);

      if (res.status) {
        showToast("Traslado masivo realizado con éxito", "success");
        onSave(); 
        onClose();
      } else {
        showToast(res.message || "Error al realizar el traslado", "error");
      }
    } catch (e) {
      showToast("Error de conexión al procesar el traslado", "error");
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen) return null;

  const bodegaOrigenObj = warehouses.find(w => String(w.id) === String(origenId));
  const bodegaDestinoObj = warehouses.find(w => String(w.id) === String(destinoId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Movimiento masivo de inventario</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Traslade múltiples productos entre bodegas</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body content */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1">
          
          {!stepResumen ? (
            <>
              {/* Selección de Bodegas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Bodega Origen</label>
                  <select 
                    value={origenId}
                    onChange={(e) => setOrigenId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-zinc-900 transition-all"
                  >
                    <option value="">Seleccionar bodega origen...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Bodega Destino</label>
                  <select 
                    value={destinoId}
                    onChange={(e) => setDestinoId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-zinc-900 transition-all"
                  >
                    <option value="">Seleccionar bodega destino...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {bodegasIguales && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-bold flex items-center gap-2">
                  <AlertCircle size={14} /> La bodega origen y destino no pueden ser iguales.
                </div>
              )}

              {/* Productos Disponibles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Productos Disponibles</h4>
                  <span className="text-[10px] font-bold text-slate-400">
                    {totalProductosSeleccionados} seleccionados
                  </span>
                </div>

                {origenId ? (
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3.5 text-slate-400" size={14} />
                    <input 
                      type="text"
                      placeholder="Buscar producto..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 outline-none focus:border-zinc-900"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl text-center text-slate-400 text-xs italic font-medium">
                    Seleccione primero una bodega origen para ver los productos disponibles.
                  </div>
                )}

                {loadingProductos ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-slate-400" size={30} />
                  </div>
                ) : origenId && productosFiltrados.length > 0 ? (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-50 max-h-60 overflow-y-auto">
                    {productosFiltrados.map((item) => {
                      const prodId = item.producto_id;
                      const nombreProd = item.producto?.nombre;
                      const stockDispo = Number(item.cantidad || 0);
                      const unidadMedida = item.producto?.unidad_medida?.abreviatura || 'UN';
                      const isSelected = !!seleccionados[prodId];
                      const currentVal = isSelected ? seleccionados[prodId].cantidad : '';
                      const hasError = isSelected && (Number(currentVal) <= 0 || Number(currentVal) > stockDispo);

                      return (
                        <div key={prodId} className={`p-3 flex items-center justify-between gap-4 transition-colors ${isSelected ? 'bg-zinc-50/80' : 'hover:bg-slate-50/50'}`}>
                          <div className="flex items-center gap-3 flex-1">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleProducto(item)}
                              className="w-4 h-4 rounded border-slate-300 text-zinc-900 focus:ring-0 cursor-pointer"
                            />
                            <div>
                              <p className="text-xs font-black text-slate-800 uppercase">{nombreProd}</p>
                              <p className="text-[10px] font-bold text-slate-400">Stock: {stockDispo} {unidadMedida}</p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1.5">
                                <input 
                                  type="number"
                                  min="1"
                                  max={stockDispo}
                                  placeholder="Cant"
                                  value={currentVal}
                                  onChange={(e) => handleCantidadChange(prodId, e.target.value)}
                                  className={`w-20 p-1.5 text-right border rounded-xl text-xs font-black outline-none ${hasError ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-200 bg-white'}`}
                                />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{unidadMedida}</span>
                              </div>
                              {hasError && (
                                <span className="text-[8px] font-bold text-rose-500 mt-0.5">Inválida / Supera stock</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : origenId ? (
                  <div className="p-6 text-center text-slate-400 text-xs italic">No hay productos disponibles en esta bodega.</div>
                ) : null}
              </div>

              {/* Observación general */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Observación</label>
                <textarea 
                  rows="2"
                  placeholder="Traslado para abastecimiento..."
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 outline-none focus:border-zinc-900 resize-none"
                />
              </div>
            </>
          ) : (
            /* Vista de Resumen */
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Origen:</span>
                  <span className="font-black text-slate-800 uppercase">{bodegaOrigenObj?.nombre}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Destino:</span>
                  <span className="font-black text-slate-800 uppercase">{bodegaDestinoObj?.nombre}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Total Productos:</span>
                  <span className="font-black text-zinc-900">{totalProductosSeleccionados}</span>
                </div>
                {observacion && (
                  <div className="flex justify-between text-xs pt-2 border-t border-slate-200/60">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Observación:</span>
                    <span className="font-medium text-slate-600 italic">{observacion}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Detalle del Traslado</h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-50 max-h-48 overflow-y-auto">
                  {itemsArray.map((item, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center text-xs">
                      <span className="font-black text-slate-700 uppercase">{item.nombre}</span>
                      <span className="font-bold text-zinc-900">{item.cantidad} {item.unidad}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl text-amber-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" /> ¿Desea realizar este traslado?
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          {stepResumen ? (
            <button 
              onClick={() => setStepResumen(false)}
              className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all"
            >
              Volver
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
          )}

          {!stepResumen ? (
            <button 
              disabled={!esValidoFormulario}
              onClick={() => setStepResumen(true)}
              className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase bg-zinc-900 text-white hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-zinc-200"
            >
              Ver Resumen
            </button>
          ) : (
            <button 
              disabled={enviando}
              onClick={handleSubmitTraslado}
              className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-xl shadow-emerald-100 flex items-center gap-2"
            >
              {enviando && <Loader2 className="animate-spin" size={14} />}
              {enviando ? 'Procesando...' : 'Realizar Traslado'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};