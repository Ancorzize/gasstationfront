import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ReceiptText, ArrowLeftRight, Package, Tag, Layers,
  Wrench, Users, Wallet, Truck, Fuel, BarChart3, Ruler, UserRoundPlus,
  Settings, Shield, UserCircle, LogOut, ChevronLeft, Menu, X 
} from 'lucide-react';
import logoEmpresa from '../images/logoGranjas.png';
import { authService } from '../features/auth/services/authService';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

const menuGroups = [
  {
    title: "Principal",
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', permission: null },
      { icon: ReceiptText, label: 'Facturación', permission: 'ver_facturas' },
      { icon: ArrowLeftRight, label: 'Movimientos', permission: 'ver_movimientos' },
    ]
  },
  {
    title: "Gestión",
    items: [
      { icon: Package, label: 'Productos', permission: 'ver_productos' },
      { icon: Tag, label: 'Marcas', permission: 'ver_marcas' },
      { icon: Wrench, label: 'Servicios', permission: 'ver_servicios' },
      { icon: Users, label: 'Clientes', permission: 'ver_clientes' },
      { icon: Truck, label: 'Proveedores', permission: 'ver_proveedores' },
      { icon: Layers, label: 'Categorías', permission: 'ver_categorias_producto' },
      { icon: Ruler, label: 'Unidades de Medida', permission: 'ver_unidades_medida' }
    ]
  },
  {
    title: "Finanzas",
    items: [
      { icon: Wallet, label: 'Cartera', permission: 'ver_cartera' },
      { icon: Fuel, label: 'Estación', permission: 'ver_estacion' },
      { icon: BarChart3, label: 'Reportes', permission: 'ver_reportes' },
    ]
  },
  {
    title: "Configuración",
    items: [
      { icon: UserRoundPlus, label: 'Administración', permission: 'ver_usuarios' },
      { icon: Shield, label: 'Roles y Permisos', permission: 'ver_roles' },
      { icon: UserCircle, label: 'Perfil', permission: null },
      { icon: Settings, label: 'Configuración', permission: 'ver_configuracion_empresa' }
    ]
  }
];

export const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(window.innerWidth > 768);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [user, setUser] = useState({ name: 'Usuario', email: '' });
  const { hasPermission, loading } = usePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth > 768;
      if (isDesktop) {
        setIsMobileOpen(false); 
      } else {
        setIsExpanded(true); 
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    loadUser();
  }, []);

  const handleItemClick = (label) => {
    setActiveItem(label);
    if (window.innerWidth <= 768) setIsMobileOpen(false); 
    
    let path = "";
    switch (label) {
      case 'Dashboard': path = '/dashboard'; break;
      case 'Administración': path = '/usuarios'; break;
      case 'Roles y Permisos': path = '/roles'; break;
      case 'Perfil': path = '/perfil'; break;
      case 'Clientes': path = '/clientes'; break;
      case 'Marcas': path = '/marcas'; break;
      case 'Unidades de Medida': path = '/unidades-medida'; break;
      case 'Productos': path = '/productos'; break;
      case 'Servicios': path = '/servicios'; break;
      default:
        path = `/${label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}`;
        break;
    }
    navigate(path);
  };

  if (loading) return null;

  return (
    <>
      {/* BOTÓN HAMBURGUESA */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 bg-zinc-900 text-white rounded-xl md:hidden border border-zinc-800 shadow-lg"
      >
        <Menu size={24} />
      </button>

      {/* OVERLAY */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[45] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR PRINCIPAL */}
      <motion.div 
        initial={false}
        animate={{ 
          // En móvil el ancho es fijo (280), en PC depende de isExpanded
          width: window.innerWidth <= 768 ? 280 : (isExpanded ? 280 : 80),
          // En móvil se desliza, en PC siempre está en 0
          x: window.innerWidth <= 768 ? (isMobileOpen ? 0 : -280) : 0 
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed md:relative h-screen bg-[#09090b] text-zinc-400 flex flex-col border-r border-zinc-800 shadow-2xl z-50"
      >
        {/* BOTÓN COLAPSAR (Solo PC) */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="hidden md:flex absolute -right-3 top-12 bg-zinc-900 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-yellow-500 transition-colors shadow-md z-[60]"
        >
          <motion.div animate={{ rotate: isExpanded ? 0 : 180 }}>
            <ChevronLeft size={16} />
          </motion.div>
        </button>

        {/* LOGO Y CIERRE MÓVIL */}
        <div className="p-6 h-24 flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <img src={logoEmpresa} alt="Logo" className="w-10 h-10 object-contain" />
            {/* CORRECCIÓN: Eliminado group.title que causaba error */}
            {(isExpanded || isMobileOpen) && (
              <span className="font-bold text-white tracking-tight text-lg">Las Granjas</span>
            )}
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-zinc-500 p-1">
            <X size={24} />
          </button>
        </div>

        {/* CUERPO DEL MENÚ */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          {menuGroups.map((group, idx) => {
            const visibleItems = group.items.filter(item => hasPermission(item.permission));
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="mb-6">
                {(isExpanded || isMobileOpen) && (
                  <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-bold mb-3 px-2">
                    {group.title}
                  </p>
                )}
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = activeItem === item.label;
                    return (
                      <button
                        key={item.label}
                        onClick={() => handleItemClick(item.label)} 
                        className={`w-full flex items-center relative group px-3 py-2.5 rounded-xl transition-all duration-200
                          ${isActive ? 'bg-zinc-800/50 text-white' : 'hover:bg-zinc-800/30 hover:text-zinc-200'}`}
                      >
                        <item.icon size={20} className={`${isActive ? 'text-yellow-500' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                        {(isExpanded || isMobileOpen) && (
                          <span className="ml-3 text-sm font-medium whitespace-nowrap text-zinc-300">
                            {item.label}
                          </span>
                        )}
                        {isActive && <div className="absolute left-0 w-1 h-5 bg-yellow-500 rounded-r-full" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER - PERFIL */}
        <div className="p-4 border-t border-zinc-800 bg-[#09090b]">
           <div className="flex items-center gap-3 p-2 rounded-2xl bg-zinc-900/50 border border-white/5">
             <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-xs uppercase flex-shrink-0">
               {user.name ? user.name.substring(0, 2) : 'U'} 
             </div>
             {(isExpanded || isMobileOpen) && (
               <div className="flex-1 overflow-hidden text-left">
                 <p className="text-xs font-bold text-white truncate">{user.name}</p>
                 <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
               </div>
             )}
             <button onClick={() => { authService.logout(); navigate('/login'); }} className="p-1">
               <LogOut size={16} className="text-zinc-600 hover:text-red-400" />
             </button>
           </div>
        </div>
      </motion.div>
    </>
  );
};