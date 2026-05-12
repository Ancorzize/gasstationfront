import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, ShoppingCart, Trash2, Loader2, Save, ArrowLeft } from 'lucide-react';
import { shiftService } from '../../shifts/services/shiftService';
import { fuelSalesService } from '../services/fuelSalesService';
import { useToast } from '../../../context/ToastContext';

export const LubricantSalesPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const init = async () => {
      const shiftRes = await shiftService.getCurrentShift();
      if (shiftRes.status && shiftRes.data) {
        setCurrentShift(shiftRes.data);
        const prodRes = await fuelSalesService.getLubricants();
        if (prodRes.status) setProducts(prodRes.data.items);
      } else {
        showToast("Turno activo requerido", "error");
        navigate('/operacion/turnos');
      }
    };
    init();
  }, []);

  const addToCart = (product) => {
    const exists = cart.find(item => item.id === product.id);
    if (exists) {
      setCart(cart.map(item => item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCart([...cart, { ...product, cantidad: 1 }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const total = cart.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await fuelSalesService.createSale({
        turno_islero_id: currentShift.id,
        tipo_venta: 'lubricantes',
        productos: cart.map(item => ({ producto_id: item.id, cantidad: item.cantidad })),
        total: total,
        tipo_pago: 'contado'
      });
      if (res.status) {
        showToast("Venta de lubricantes registrada", "success");
        navigate('/operacion/turnos');
      }
    } catch (e) {
      showToast("Error al procesar venta", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!currentShift) return null;

  return (
    <div className="p-4 md:p-8 space-y-6 text-left">
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">Lubricantes y Aditivos</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Turno: {currentShift.estacion?.nombre}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-3.5 text-slate-300 group-focus-within:text-zinc-900" size={18} />
            <input 
              type="text" placeholder="Buscar lubricante..."
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-zinc-900 shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
              <button 
                key={p.id} onClick={() => addToCart(p)}
                className="bg-white p-4 rounded-[2rem] border border-slate-100 hover:border-zinc-900 transition-all text-left space-y-3 shadow-sm"
              >
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><Package size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-800 uppercase line-clamp-1">{p.nombre}</p>
                  <p className="text-[11px] font-black text-emerald-600">$ {Number(p.precio_venta).toLocaleString()}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white h-fit sticky top-8 space-y-6 shadow-2xl">
          <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <ShoppingCart size={16} /> Carrito de Venta
          </h3>
          
          <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between group">
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase line-clamp-1">{item.nombre}</p>
                  <p className="text-[9px] text-zinc-500">{item.cantidad} x ${Number(item.precio_venta).toLocaleString()}</p>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="p-2 text-zinc-600 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            ))}
            {cart.length === 0 && <p className="text-[10px] text-zinc-600 italic uppercase py-10 text-center">Sin productos seleccionados</p>}
          </div>

          <div className="pt-6 border-t border-zinc-800">
            <div className="flex justify-between items-end mb-6">
              <span className="text-[10px] font-black uppercase text-zinc-500">Total Venta</span>
              <span className="text-2xl font-black italic">$ {total.toLocaleString()}</span>
            </div>
            <button 
              onClick={handleSubmit} disabled={loading || cart.length === 0}
              className="w-full bg-white text-zinc-900 py-4 rounded-2xl font-black uppercase text-xs hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Finalizar Venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};