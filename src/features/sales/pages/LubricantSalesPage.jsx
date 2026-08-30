import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, 
  User, Save, Loader2, Package, X, Check, AlertTriangle 
} from 'lucide-react';
import { fuelSalesService } from '../services/fuelSalesService';
import { productService } from '../../products/services/productService';
import { clientService } from '../../clients/services/clientService';
import { useToast } from '../../../context/ToastContext';

export const LubricantSalesPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileStockError, setMobileStockError] = useState('');
  
  const [cart, setCart] = useState([]);
  const [saleData, setSaleData] = useState({
    tipo_venta: 'contado',
    metodo_pago: 'efectivo',
    cliente_id: null,
    observacion: 'Venta lubricantes'
  });

  const [searchingClients, setSearchingClients] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const clientListRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const loadProducts = async (searchQuery = '') => {
    setProductsLoading(true);
    try {
      const params = { per_page: 50 };
      if (searchQuery) params.search = searchQuery;

      const res = await productService.getProducts(params);
      if (res.status && res.data?.items) {
        const filtered = res.data.items.filter(p => 
          p.categoria_producto?.nombre !== 'Combustible' && 
          p.is_active === true
        );
        setProducts(filtered);
      }
    } catch (e) {
      console.error("Error cargando productos", e);
      showToast("Error al buscar productos", "error");
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProducts(searchTerm);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    const searchClients = async () => {
      if (clientSearchTerm.length < 3) {
        setClients([]);
        return;
      }
      setSearchingClients(true);
      try {
        const res = await clientService.getClients({ search: clientSearchTerm });
        if (res.status) setClients(res.data.items || []);
      } catch (e) {
        console.error("Error buscando clientes", e);
      } finally {
        setSearchingClients(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (showClientList) searchClients();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [clientSearchTerm, showClientList]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clientListRef.current && !clientListRef.current.contains(e.target)) {
        setShowClientList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectClient = (client) => {
    setSaleData({ ...saleData, cliente_id: client.id });
    setClientSearchTerm(client.nombre || client.razon_social);
    setShowClientList(false);
  };

  const triggerStockError = (msg) => {
    setMobileStockError(msg);
    showToast(msg, "error");
    setTimeout(() => {
      setMobileStockError('');
    }, 3500);
  };

  const addToCart = (product) => {
    const stockAvailable = Number(product.stock_actual ?? product.stock ?? 0);
    const exists = cart.find(item => item.id === product.id);
    const currentQty = exists ? exists.cantidad : 0;

    if (currentQty + 1 > stockAvailable) {
      triggerStockError("No hay suficiente stock disponible");
      return;
    }

    if (exists) {
      setCart(cart.map(item => item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCart([...cart, { ...product, cantidad: 1, stock_actual: stockAvailable }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.cantidad + delta;
        const stockAvailable = Number(item.stock_actual ?? item.stock ?? 0);

        if (delta > 0 && newQty > stockAvailable) {
          triggerStockError("Stock máximo alcanzado");
          return item;
        }

        return { ...item, cantidad: newQty > 0 ? newQty : 1 };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const calculateTotals = () => {
    return cart.reduce((acc, item) => {
      const subtotalItem = item.precio_venta * item.cantidad;
      const ivaFactor = (item.iva || 0) / 100;
      const ivaValorItem = subtotalItem * ivaFactor;
      
      return {
        subtotal: acc.subtotal + subtotalItem,
        iva: acc.iva + ivaValorItem,
        total: acc.total + (subtotalItem + ivaValorItem)
      };
    }, { subtotal: 0, iva: 0, total: 0 });
  };

  const totals = calculateTotals();

  const handleSubmit = async () => {
    if (cart.length === 0) return showToast("El carrito está vacío", "error");
    if (saleData.tipo_venta === 'credito' && !saleData.cliente_id) return showToast("Seleccione un cliente", "error");

    setLoading(true);
    
    const payload = {
      cliente_id: saleData.cliente_id,
      tipo_venta: saleData.tipo_venta,
      observacion: saleData.observacion,
      detalles: cart.map(item => {
        const subtotal = item.precio_venta * item.cantidad;
        const ivaValor = subtotal * ((item.iva || 0) / 100);
        return {
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_venta,
          descuento: 0,
          iva: item.iva || 0,
          iva_valor: ivaValor,
          soldicom: 0,
          sobre_tasa: 0,
          total: subtotal + ivaValor
        };
      }),
      pagos: saleData.tipo_venta === 'contado' ? [
        {
          metodo_pago: saleData.metodo_pago,
          monto: totals.total,
          observacion: "Pago de productos/lubricantes"
        }
      ] : []
    };

    try {
      const res = await fuelSalesService.createGeneralSale(payload);
      if (res.status) {
        showToast("Venta registrada con éxito", "success");
        navigate('/operacion/factura-venta', { state: { saleData: res.data } });
      } else {
        showToast(res.message, "error");
      }
    } catch (e) {
      showToast("Error al procesar la venta", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const termTrimmed = searchTerm.trim().toLowerCase();
      if (!termTrimmed) return;

      // Se agrega validación con codigo_barras además de codigo, sku y nombre
      const exactMatch = products.find(p => 
        (p.codigo && p.codigo.toLowerCase() === termTrimmed) ||
        (p.codigo_barras && p.codigo_barras.toLowerCase() === termTrimmed) ||
        (p.sku && p.sku.toLowerCase() === termTrimmed) ||
        (p.nombre && p.nombre.toLowerCase() === termTrimmed)
      );

      if (exactMatch) {
        addToCart(exactMatch);
        setSearchTerm(''); 
        loadProducts(''); 
      } else {
        showToast("No se encontró un producto exacto para agregar", "error");
      }

      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  return (
    <div className="p-2 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-8 text-left relative">
      
      {/* Alerta flotante superior exclusiva para dispositivos móviles */}
      {mobileStockError && (
        <div className="block md:hidden col-span-full bg-red-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-black uppercase animate-bounce z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>{mobileStockError}</span>
          </div>
          <button onClick={() => setMobileStockError('')} className="p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Columna Izquierda: Buscador y Listado de Productos más grandes */}
      <div className="lg:col-span-7 space-y-3 md:space-y-6">
        <header className="hidden md:block">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">Lubricantes y Tienda</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Venta de productos generales</p>
        </header>

        <div className="relative group">
          <Search className="absolute left-4 top-4 text-slate-400 group-focus-within:text-zinc-900 transition-colors" size={20} />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Escanear código, código de barras o buscar producto..."
            className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] text-xs font-bold outline-none focus:border-zinc-900 shadow-sm uppercase"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {productsLoading && (
            <Loader2 className="absolute right-4 top-4 animate-spin text-slate-400" size={18} />
          )}
        </div>

        <div className={`overflow-y-auto custom-scrollbar max-h-[380px] md:max-h-[480px] pr-1 ${searchTerm.trim() ? 'block' : 'hidden md:block'}`}>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {products.map(p => {
              const stockDisponible = Number(p.stock_actual ?? p.stock ?? 0);
              return (
                <button 
                  key={p.id} 
                  onClick={() => {
                    addToCart(p);
                    setSearchTerm('');
                    if (searchInputRef.current) searchInputRef.current.focus();
                  }}
                  className="bg-white p-3.5 md:p-4 rounded-[1.5rem] border border-slate-200 hover:border-zinc-900 transition-all text-left flex flex-col justify-between shadow-sm group min-h-[135px]"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                      <Package size={18} />
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${stockDisponible > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      Stock: {stockDisponible}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-800 uppercase line-clamp-2 leading-snug" title={p.nombre}>
                      {p.nombre}
                    </p>
                    <p className="text-xs font-black text-emerald-600 mt-1.5">$ {Number(p.precio_venta).toLocaleString()}</p>
                  </div>
                </button>
              );
            })}
            {!productsLoading && products.length === 0 && searchTerm.trim() && (
              <div className="col-span-full py-8 text-center text-slate-400 text-[10px] uppercase font-bold italic">
                No se encontraron productos para "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Carrito en Estilo Blanco, Amplio y Sin Espacios Innecesarios */}
      <div className="lg:col-span-5">
        <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-3.5 md:p-6 text-slate-900 border border-slate-200 shadow-xl flex flex-col h-auto lg:sticky lg:top-8">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-slate-800">
              <ShoppingCart size={18} className="text-amber-600" /> Carrito de Venta
            </h3>
            <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">{cart.length} items</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 max-h-[240px] md:max-h-[320px]">
            {cart.map(item => {
              const stockDisponible = Number(item.stock_actual ?? item.stock ?? 0);
              return (
                <div key={item.id} className="flex items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black uppercase truncate text-slate-800" title={item.nombre}>{item.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-slate-500 font-bold">$ {Number(item.precio_venta).toLocaleString()} + IVA</p>
                      <span className="text-[9px] text-slate-400 font-semibold">(Stock: {stockDisponible})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-600 hover:text-amber-600"><Minus size={15}/></button>
                    <span className="text-xs font-black w-4 text-center text-slate-800">{item.cantidad}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-600 hover:text-amber-600"><Plus size={15}/></button>
                    <button onClick={() => removeFromCart(item.id)} className="ml-1 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              );
            })}
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                <Package size={36} className="mb-2 opacity-40" />
                <p className="text-[11px] font-bold uppercase italic">Escanee un producto</p>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Tipo de Venta</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black uppercase text-slate-800 outline-none focus:border-zinc-900 shadow-sm"
                  value={saleData.tipo_venta}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSaleData({...saleData, tipo_venta: val, cliente_id: val === 'contado' ? null : saleData.cliente_id});
                    if (val === 'contado') setClientSearchTerm('');
                  }}
                >
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Método de Pago</label>
                <select 
                  disabled={saleData.tipo_venta === 'credito'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black uppercase text-slate-800 outline-none focus:border-zinc-900 shadow-sm disabled:opacity-30"
                  value={saleData.metodo_pago}
                  onChange={(e) => setSaleData({...saleData, metodo_pago: e.target.value})}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="datafono">Datáfono</option>
                  <option value="qr">QR</option>
                </select>
              </div>
            </div>

            {saleData.tipo_venta === 'credito' && (
              <div className="space-y-1 relative" ref={clientListRef}>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Buscar Cliente (Nit/Nombre)</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Escribe para buscar..."
                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-zinc-900 transition-all uppercase text-slate-800 placeholder-slate-400 shadow-sm"
                    value={clientSearchTerm}
                    onFocus={() => setShowClientList(true)}
                    onChange={(e) => {
                      setClientSearchTerm(e.target.value);
                      setShowClientList(true);
                      if (saleData.cliente_id) setSaleData({ ...saleData, cliente_id: null });
                    }}
                  />
                  {searchingClients && <Loader2 className="absolute right-4 top-3.5 animate-spin text-slate-400" size={16} />}
                  {!searchingClients && saleData.cliente_id && <Check className="absolute right-4 top-3.5 text-emerald-600" size={16} />}
                </div>

                {/* Listado de clientes resaltado y pegado abajo */}
                {showClientList && clientSearchTerm.length >= 3 && (
                  <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-300 rounded-2xl shadow-2xl p-2 max-h-56 overflow-y-auto left-0 top-full">
                    {clients.length > 0 ? (
                      clients.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-4 py-3 text-[11px] font-black uppercase hover:bg-slate-100 flex items-center justify-between border-b border-slate-100 last:border-0 text-slate-800 rounded-xl my-0.5"
                          onClick={() => selectClient(c)}
                        >
                          <div>
                            <p className="text-slate-900 font-black">{c.nombre || c.razon_social}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">{c.documento} {c.cupo_disponible ? `| Cupo: $${Number(c.cupo_disponible).toLocaleString()}` : ''}</p>
                          </div>
                          {saleData.cliente_id === c.id && <Check size={16} className="text-emerald-600" />}
                        </button>
                      ))
                    ) : !searchingClients ? (
                      <p className="p-4 text-[10px] text-slate-400 uppercase italic text-center font-bold">No se encontraron clientes</p>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5 pt-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>Subtotal</span>
                <span>$ {totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>Total IVA</span>
                <span>$ {totals.iva.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end pt-1 border-t border-slate-200/60 mt-1">
                <span className="text-[10px] font-black uppercase text-slate-800">Total a Pagar</span>
                <span className="text-2xl font-black italic text-slate-900">$ {totals.total.toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading || cart.length === 0}
              className="w-full bg-zinc-900 text-white py-4 rounded-[1.2rem] md:rounded-[1.5rem] font-black uppercase text-xs hover:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg mt-1"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
              Finalizar Venta de Productos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};