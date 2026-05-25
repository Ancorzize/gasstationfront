import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, 
  User, CreditCard, Wallet, Save, Loader2, Package, X, Check 
} from 'lucide-react';
import { fuelSalesService } from '../services/fuelSalesService';
import { productService } from '../../products/services/productService';
import { clientService } from '../../clients/services/clientService';
import { useToast } from '../../../context/ToastContext';

export const LubricantSalesPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [cart, setCart] = useState([]);
  const [saleData, setSaleData] = useState({
    tipo_venta: 'contado',
    metodo_pago: 'efectivo',
    cliente_id: null,
    observacion: 'Venta lubricantes'
  });

  // Estados para búsqueda de clientes
  const [searchingClients, setSearchingClients] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientList, setShowClientList] = useState(false);
  const clientListRef = useRef(null);

  useEffect(() => {
    const loadProducts = async () => {
      const res = await productService.getProducts({ per_page: 50 });
      if (res.status) {
        const filtered = res.data.items.filter(p => p.categoria !== 'Combustibles');
        setProducts(filtered);
      }
    };
    loadProducts();
  }, []);

  // Efecto para buscar clientes (Debounce de 400ms)
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

  // Efecto para cerrar la lista de clientes al hacer clic fuera
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

  const addToCart = (product) => {
    const exists = cart.find(item => item.id === product.id);
    if (exists) {
      setCart(cart.map(item => item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCart([...cart, { ...product, cantidad: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.cantidad + delta;
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
        navigate('/operacion/turnos');
      } else {
        showToast(res.message, "error");
      }
    } catch (e) {
      showToast("Error al procesar la venta", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      
      <div className="lg:col-span-7 space-y-6">
        <header>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">Lubricantes y Tienda</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Venta de productos generales</p>
        </header>

        <div className="relative group">
          <Search className="absolute left-4 top-4 text-slate-300 group-focus-within:text-zinc-900 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o código..."
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-xs font-bold outline-none focus:border-zinc-900 shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
            <button 
              key={p.id} onClick={() => addToCart(p)}
              className="bg-white p-5 rounded-[2rem] border border-slate-100 hover:border-zinc-900 transition-all text-left space-y-3 shadow-sm group"
            >
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <Package size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-800 uppercase line-clamp-1">{p.nombre}</p>
                <p className="text-[11px] font-black text-emerald-600">$ {Number(p.precio_venta).toLocaleString()}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Stock: {p.stock_actual || 0}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-5 space-y-6">
        <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col h-[calc(100vh-160px)] sticky top-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <ShoppingCart size={18} className="text-yellow-500" /> Carrito de Venta
            </h3>
            <span className="text-[10px] bg-zinc-800 px-3 py-1 rounded-full">{cart.length} items</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-4 bg-zinc-800/40 p-4 rounded-2xl border border-white/5">
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase truncate">{item.nombre}</p>
                  <p className="text-[9px] text-zinc-500 font-bold">$ {Number(item.precio_venta).toLocaleString()} + IVA</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-yellow-500"><Minus size={14}/></button>
                  <span className="text-xs font-black w-4 text-center">{item.cantidad}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-yellow-500"><Plus size={14}/></button>
                  <button onClick={() => removeFromCart(item.id)} className="ml-2 text-zinc-600 hover:text-red-400 transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                <Package size={40} className="mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase italic">Seleccione productos</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-zinc-500 uppercase ml-1">Tipo de Venta</label>
                <select 
                  className="w-full bg-zinc-800 border-none rounded-xl p-3 text-[10px] font-bold uppercase outline-none focus:ring-1 focus:ring-yellow-500"
                  value={saleData.tipo_venta}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSaleData({...saleData, tipo_venta: val, cliente_id: val === 'contado' ? null : saleData.cliente_id});
                    if (val === 'contado') setClientSearchTerm('');
                  }}
                >
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito (Vale)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-zinc-500 uppercase ml-1">Método de Pago</label>
                <select 
                  disabled={saleData.tipo_venta === 'credito'}
                  className="w-full bg-zinc-800 border-none rounded-xl p-3 text-[10px] font-bold uppercase outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-30"
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

            {/* Campo de búsqueda de Clientes (Condicional: Solo cuando tipo_venta es 'credito') */}
            {saleData.tipo_venta === 'credito' && (
              <div className="space-y-1 relative" ref={clientListRef}>
                <label className="text-[8px] font-black text-zinc-500 uppercase ml-1">Buscar Cliente (Nit/Nombre)</label>
                <div className="relative">
                  <User className="absolute left-4 top-3 text-zinc-500" size={14} />
                  <input
                    type="text"
                    placeholder="Escribe para buscar..."
                    className="w-full pl-10 pr-10 py-3 bg-zinc-800 border-none rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-yellow-500 transition-all uppercase text-white placeholder-zinc-600"
                    value={clientSearchTerm}
                    onFocus={() => setShowClientList(true)}
                    onChange={(e) => {
                      setClientSearchTerm(e.target.value);
                      setShowClientList(true);
                      if (saleData.cliente_id) setSaleData({ ...saleData, cliente_id: null });
                    }}
                  />
                  {searchingClients && <Loader2 className="absolute right-4 top-3 animate-spin text-zinc-500" size={14} />}
                  {!searchingClients && saleData.cliente_id && <Check className="absolute right-4 top-3 text-emerald-500" size={14} />}
                </div>

                {showClientList && clientSearchTerm.length >= 3 && (
                  <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700/50 rounded-xl shadow-xl max-h-40 overflow-y-auto left-0 bottom-full mb-2">
                    {clients.length > 0 ? (
                      clients.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-4 py-2.5 text-[9px] font-bold uppercase hover:bg-zinc-700/50 flex items-center justify-between border-b border-zinc-700/30 last:border-0 text-white"
                          onClick={() => selectClient(c)}
                        >
                          <div>
                            <p className="text-zinc-200">{c.nombre || c.razon_social}</p>
                            <p className="text-[7px] text-zinc-500">{c.documento} {c.cupo_disponible ? `| Cupo: $${Number(c.cupo_disponible).toLocaleString()}` : ''}</p>
                          </div>
                          {saleData.cliente_id === c.id && <Check size={12} className="text-emerald-500" />}
                        </button>
                      ))
                    ) : !searchingClients ? (
                      <p className="p-3 text-[9px] text-zinc-500 uppercase italic text-center">No se encontraron clientes</p>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                <span>Subtotal</span>
                <span>$ {totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase">
                <span>Total IVA</span>
                <span>$ {totals.iva.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end pt-2">
                <span className="text-[10px] font-black uppercase text-yellow-500">Total a Pagar</span>
                <span className="text-3xl font-black italic">$ {totals.total.toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading || cart.length === 0}
              className="w-full bg-white text-zinc-900 py-5 rounded-[1.5rem] font-black uppercase text-xs hover:bg-yellow-500 transition-all flex items-center justify-center gap-3 shadow-xl"
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