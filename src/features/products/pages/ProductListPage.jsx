import React, { useEffect, useState } from 'react';
import { 
  Search, Edit2, Power, Package, Loader2, 
  Download, Plus, Trash2 
} from 'lucide-react';
import { productService } from '../services/productService';
import { ProductModal } from '../components/ProductModal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { useToast } from '../../../context/ToastContext';
import { exportToExcel } from '../../../shared/utils/exportExcel';

export const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  const { showToast } = useToast();

  const fetchProducts = async (searchQuery = '') => {
    setLoading(true);
    try {
      const params = searchQuery ? { search: searchQuery } : {};
      const result = await productService.getProducts(params);
      if (result.status) {
        setProducts(result.data.items);
      }
    } catch (error) {
      showToast("Error al conectar con el servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(searchTerm);
    }, 400); 

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleToggleStatus = async (product) => {
    try {
      const result = await productService.toggleStatus(product.id, !product.is_active);
      if (result.status) {
        showToast(result.message, "success");
        fetchProducts(searchTerm);
      }
    } catch (error) {
      showToast("No se pudo cambiar el estado", "error");
    }
  };

  const handleDelete = async () => {
    try {
      const result = await productService.deleteProduct(productToDelete.id);
      if (result.status) {
        showToast(result.message, "success");
        fetchProducts(searchTerm);
        setIsConfirmOpen(false);
      }
    } catch (error) {
      showToast("Error al eliminar el producto", "error");
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">
            Inventario de Productos
          </h2>
          <p className="text-slate-500 text-xs md:text-sm">Listado detallado de existencias y precios.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button 
            onClick={() => exportToExcel(products, 'Inventario_LasGranjas')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-xs uppercase hover:bg-emerald-700 transition-all shadow-md"
          >
            <Download size={16} /> <span className="hidden sm:inline">Exportar</span>
          </button>

          <div className="relative flex-1 md:flex-none min-w-[160px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" placeholder="Buscar..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-yellow-500 shadow-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-xs uppercase hover:bg-black transition-all shadow-md"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Tabla con Scroll Vertical y Horizontal */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="max-h-[65vh] overflow-y-auto overflow-x-auto custom-scrollbar-light">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Cargando datos...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                <tr className="border-b border-slate-100">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-36">Código</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marca</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoría</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">U. Medida</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">P. Compra</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">P. Venta</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors text-slate-600 uppercase">
                    <td className="p-4">
                      <span className="text-[10px] font-black text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                        {p.codigo}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-700 whitespace-nowrap">{p.nombre}</td>
                    <td className="p-4 text-xs font-medium">{p.marca?.nombre || 'GENÉRICO'}</td>
                    <td className="p-4 text-xs font-medium">{p.categoria_producto?.nombre}</td>
                    <td className="p-4 text-center text-[10px] font-bold text-slate-500">
                      {p.unidad_medida?.abreviatura}
                    </td>
                    <td className="p-4 text-right text-xs font-medium text-emerald-600">
                      {formatCurrency(p.precio_compra)}
                    </td>
                    <td className="p-4 text-right text-xs font-black text-slate-800">
                      {formatCurrency(p.precio_venta)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setSelectedProduct(p); setIsModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleToggleStatus(p)}
                          className={`p-2 rounded-lg transition-all ${p.is_active ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-emerald-600 hover:bg-emerald-50'}`}>
                          <Power size={14} />
                        </button>
                        <button onClick={() => { setProductToDelete(p); setIsConfirmOpen(true); }}
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && !loading && (
                  <tr>
                    <td colSpan="10" className="text-center py-12 text-slate-400 text-xs uppercase font-bold italic">
                      No se encontraron productos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={() => fetchProducts(searchTerm)} productToEdit={selectedProduct} />
      
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        message={`¿Deseas eliminar "${productToDelete?.nombre}"? Esta acción es irreversible.`}
        loading={loading}
      />
    </div>
  );
};