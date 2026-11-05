import React, { useEffect, useState, useRef, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ReceiptText, ArrowLeftRight, Package, Tag, Layers, Warehouse, Box, ShoppingBag, ArrowDownCircle, CheckCircle2,
  Wrench, Users, Wallet, Truck, TrendingUp, Fuel, BarChart3, Ruler, UserRoundPlus, Receipt, Target, Settings, Shield, UserCircle, LogOut, ChevronLeft, Menu, X, Landmark, ClipboardList, Crosshair as Pump, Droplets, Play,
  Calendar, Calculator, Send, CreditCard, History, FileCheck, Building2, Sliders, Clock, Search, ChevronDown
} from 'lucide-react';
import logoEmpresa from '../images/logoGranjas.png';
import { authService } from '../features/auth/services/authService';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { modalStack } from '../utils/modalStack';

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

/**
 * Validador inteligente de ruta activa con soporte para subrutas
 * y prevención de falsos positivos en rutas similares.
 */
const isRouteActive = (itemPath, currentPath) => {
  if (!currentPath || !itemPath) return false;
  if (currentPath === itemPath) return true;
  if (itemPath === '/dashboard') return currentPath === '/dashboard';

  // Rutas con submódulos hermanos que requieren discriminación estricta
  if (itemPath === '/ventas') {
    return currentPath === '/ventas' || (
      currentPath.startsWith('/ventas/') && 
      !currentPath.startsWith('/ventas/nueva') && 
      !currentPath.startsWith('/ventas/lubricantes')
    );
  }
  if (itemPath === '/facturacion') {
    return currentPath === '/facturacion' || (
      currentPath.startsWith('/facturacion/') && 
      !currentPath.startsWith('/facturacion/mapeos') && 
      !currentPath.startsWith('/facturacion/resoluciones')
    );
  }
  if (itemPath === '/caja') {
    return currentPath === '/caja' || (
      currentPath.startsWith('/caja/') && 
      !currentPath.startsWith('/caja/historico')
    );
  }
  if (itemPath === '/cartera') {
    return currentPath === '/cartera' || (
      currentPath.startsWith('/cartera/') && 
      !currentPath.startsWith('/cartera/movimientos')
    );
  }
  if (itemPath === '/gastos') {
    return currentPath === '/gastos' || (
      currentPath.startsWith('/gastos/') && 
      !currentPath.startsWith('/gastos/categorias')
    );
  }

  // Coincidencia estándar para subrutas (ej: /compras/nueva activa /compras, /nomina/empleados/1 activa /nomina/empleados)
  return currentPath.startsWith(itemPath + '/');
};

const SEARCH_SYNONYMS = {
  '/dashboard': ['panel', 'resumen', 'estadisticas', 'metricas', 'inicio', 'kpis', 'kpi', 'graficas', 'general'],
  '/operacion/turnos': ['islero', 'apertura', 'cierre', 'turno', 'cuadrante', 'entrega', 'cuadre', 'planilla turnos'],
  '/turnos/aprobaciones': ['aprobar', 'autorizar', 'cuadre', 'auditoria', 'revision de turnos', 'cierre islero', 'vales'],
  '/ventas/nueva': ['acpm', 'gasolina', 'corriente', 'extra', 'diesel', 'tanqueo', 'combustible', 'surtidor', 'manguera', 'isla', 'despacho', 'galones', 'venta pos'],
  '/ventas/lubricantes': ['aceite', 'filtro', 'aditivo', 'lubricante', 'grasa', 'valvulina', 'refrigerante', 'tienda', 'mostrador', 'venta insumos', 'caneca', 'cuarto', 'frasco'],
  '/ventas': ['historico de ventas', 'facturas', 'recibos', 'comprobantes', 'reimpresion', 'tickets', 'consultas ventas', 'ventas pasadas'],
  '/inventario/existencias': ['stock', 'cantidades', 'saldos', 'disponible', 'bodega', 'saldo fisico', 'inventario combustible', 'lubricantes'],
  '/inventario/movimientos': ['kardex', 'entradas', 'salidas', 'traslados', 'ajustes inventario', 'variaciones', 'descargas', 'traspasos'],
  '/productos': ['catalogo', 'articulos', 'items', 'combustibles', 'aceites', 'referencias', 'precios lista', 'sku', 'codigo'],
  '/marcas': ['fabricantes', 'marcas de productos', 'casas comerciales', 'sellos'],
  '/categorias': ['familias', 'lineas', 'clasificacion productos', 'grupos', 'departamentos'],
  '/unidades-medida': ['galones', 'litros', 'cuartos', 'canecas', 'unidades', 'medidas', 'conversion', 'volumen', 'capacidad'],
  '/servicios': ['mano de obra', 'lavado', 'engrase', 'calibracion', 'mantenimiento', 'montallantas', 'servicios isla'],
  '/bodegas': ['almacenes', 'tanques', 'tanques subterraneos', 'depositos', 'ubicaciones', 'silos', 'almacenamiento'],
  '/compras': ['facturas compra', 'ordenes de compra', 'adquisiciones', 'insumos', 'pedidos', 'cisternas', 'recepcion combustible', 'fletes'],
  '/proveedores': ['terceros', 'mayoristas', 'distribuidores', 'suministros', 'nit', 'razon social', 'contactos', 'mayorista', 'distribuidora'],
  '/pagos-compra': ['cuentas por pagar', 'abono compras', 'pago facturas', 'egresos compra', 'cancelaciones proveedores', 'pasivos'],
  '/caja': ['arqueo', 'efectivo', 'caja chica', 'apertura caja', 'cierre caja', 'base', 'dinero', 'cuadre caja', 'saldo efectivo'],
  '/caja/historico': ['cierres anteriores', 'historial de caja', 'arqueos pasados', 'registros de caja', 'cierres turnos caja general'],
  '/cartera': ['cuentas por cobrar', 'creditos', 'deudas', 'abonos', 'saldos clientes', 'pendientes', 'fiado', 'vales empresas', 'cobranza'],
  '/cartera/movimientos': ['recibos de caja', 'comprobantes abono', 'historial pagos cliente', 'recaudos', 'amortizacion', 'abonos cartera'],
  '/clientes': ['compradores', 'fidelizacion', 'credito clientes', 'empresas', 'conductores', 'placas vehiculos', 'nit', 'cedula', 'flotillas'],
  '/gastos': ['egresos', 'compras menores', 'desembolsos', 'salidas dinero', 'operativos', 'comprobante egreso', 'servicios aseo', 'caja menor'],
  '/gastos/categorias': ['tipos de gasto', 'clasificacion gastos', 'rubros', 'conceptos', 'centros de costo', 'operacionales', 'administrativos'],
  '/destinos-recaudo': ['cuentas bancarias', 'bancos', 'consignaciones', 'cajas destino', 'cajas fuertes', 'datafonos', 'transferencias'],
  '/nomina/empleados': ['personal', 'trabajadores', 'colaboradores', 'isleros', 'operarios', 'administradores personal', 'cargos', 'salarios', 'contratos'],
  '/nomina/periodos': ['quincenas', 'meses nomina', 'cortes de pago', 'calendario nomina', 'fechas periodo', 'liquidacion'],
  '/nomina/liquidaciones': ['pago sueldos', 'salarios', 'horas extras', 'prestaciones', 'recargos nocturnos', 'deducciones', 'desprendibles', 'devengados'],
  '/nomina/electronica': ['dian nomina', 'transmision nomina', 'xml nomina', 'soporte nomina', 'cune', 'documento soporte pago nomina dian'],
  '/estaciones': ['eds', 'estacion de servicio', 'sucursales', 'sedes', 'puntos de venta', 'ubicacion gasolinera'],
  '/bombas': ['dispensadores', 'bombas surtidores', 'islas', 'caras dispensador', 'equipos despacho', 'computadores de isla'],
  '/mangueras': ['posiciones', 'picos', 'mangueras', 'combustibles por manguera', 'lados', 'tanques asociados', 'lecturas totalizadores'],
  '/precios-combustible': ['tarifa', 'precio galon', 'gasolina corriente extra diesel acpm', 'precios venta', 'margen', 'cambio precio'],
  '/facturacion': ['dian', 'resolucion', 'prefijo', 'factura electronica', 'cufe', 'xml', 'emision', 'certificado digital', 'software dian'],
  '/facturacion/mapeos': ['catalogos dian', 'equivalencias dian', 'codigos impuestos', 'unidades dian', 'formas pago dian', 'tributos', 'tarifas homologacion'],
  '/facturacion/resoluciones': ['numeracion dian', 'rangos autorizados', 'consecutivos', 'vigencias', 'prefijos', 'fecha vencimiento resolucion dian'],
  '/reportes/capital-trabajo': ['finanzas', 'balance', 'indicadores liquidez', 'rentabilidad', 'flujo', 'rotacion cartera', 'caja disponible', 'financiero informe'],
  '/turnos/historico': ['reportes turnos', 'auditoria turnos pasados', 'consolidados isleros', 'lecturas totalizadores', 'arqueos turnos'],
  '/dashboardconfiguracion': ['ajustes dashboard', 'personalizar paneles', 'widgets', 'vista principal', 'configuracion dashboard'],
  '/usuarios': ['operadores', 'administradores', 'accesos', 'cuentas usuarios', 'contraseñas', 'emails', 'login credenciales'],
  '/roles': ['permisos', 'seguridad', 'perfiles', 'privilegios', 'autorizaciones', 'matriz roles', 'asignacion permisos'],
  '/perfil': ['mi cuenta', 'perfil usuario', 'cambiar clave', 'mis datos', 'contraseña', 'ajustes usuario sesion'],
  '/configuracion': ['empresa', 'datos legales', 'nit', 'razon social', 'direccion', 'telefono', 'logotipo', 'pie de factura', 'resolucion general']
};

const menuGroups = [
  {
    title: "Operación Estación",
    icon: Fuel,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', permission: null, path: '/dashboard' },
      { icon: Play, label: 'Turnos', permission: 'ver_turnos_islero', path: '/operacion/turnos' },
      { icon: CheckCircle2, label: 'Aprobación de Turnos', permission: 'aprobar_cierres_turnos_islero', path: '/turnos/aprobaciones' },
      { icon: Fuel, label: 'Ventas Combustible', permission: 'vender_combustible', path: '/ventas/nueva' },
      { icon: Droplets, label: 'Ventas Lubricantes', permission: 'vender_lubricantes', path: '/ventas/lubricantes' },
      { icon: Receipt, label: 'Ventas Realizadas', permission: 'ver_ventas', path: '/ventas' },
    ]
  },
  {
    title: "Inventario y Catálogo",
    icon: Box,
    items: [
      { icon: Box, label: 'Existencias', permission: 'ver_movimientos_inventario', path: '/inventario/existencias' },
      { icon: ArrowLeftRight, label: 'Movimientos', permission: 'ver_movimientos_inventario', path: '/inventario/movimientos' },
      { icon: Package, label: 'Productos', permission: 'ver_productos', path: '/productos' },
      { icon: Tag, label: 'Marcas', permission: 'ver_marcas', path: '/marcas' },
      { icon: Layers, label: 'Categorías', permission: 'ver_categorias_producto', path: '/categorias' },
      { icon: Ruler, label: 'Unidades de Medida', permission: 'ver_unidades_medida', path: '/unidades-medida' },
      { icon: Wrench, label: 'Servicios', permission: 'ver_servicios', path: '/servicios' },
      { icon: Warehouse, label: 'Bodegas', permission: 'ver_bodegas', path: '/bodegas' },
    ]
  },
  {
    title: "Compras y Proveedores",
    icon: ShoppingBag,
    items: [
      { icon: ShoppingBag, label: 'Compras', permission: 'ver_compras', path: '/compras' },
      { icon: Truck, label: 'Proveedores', permission: 'ver_proveedores', path: '/proveedores' },
      { icon: CreditCard, label: 'Pagos de Compra', permission: 'ver_pagos_compra', path: '/pagos-compra' },
    ]
  },
  {
    title: "Tesorería y Cartera",
    icon: Wallet,
    items: [
      { icon: Wallet, label: 'Caja', permission: 'ver_caja_menu', path: '/caja' },
      { icon: History, label: 'Histórico de Cajas', permission: 'ver_caja_menu', path: '/caja/historico' },
      { icon: Landmark, label: 'Cartera', permission: ['ver_cartera', 'registrar_abonos_cartera'], path: '/cartera' },
      { icon: ClipboardList, label: 'Mov. Cartera', permission: 'ver_movimientos_cartera', path: '/cartera/movimientos' },
      { icon: Users, label: 'Clientes', permission: 'ver_clientes', path: '/clientes' },
      { icon: ArrowDownCircle, label: 'Gastos', permission: 'ver_gastos', path: '/gastos' },
      { icon: Layers, label: 'Categorías Gasto', permission: 'ver_categorias_gasto', path: '/gastos/categorias' },
      { icon: Target, label: 'Destinos Recaudo', permission: 'ver_destinos_recaudo', path: '/destinos-recaudo' },
    ]
  },
  {
    title: "Nómina y Personal",
    icon: Users,
    items: [
      { icon: Users, label: 'Empleados', permission: 'ver_empleados', path: '/nomina/empleados' },
      { icon: Calendar, label: 'Períodos', permission: 'ver_periodos_nomina', path: '/nomina/periodos' },
      { icon: Calculator, label: 'Liquidaciones', permission: 'ver_liquidaciones_nomina', path: '/nomina/liquidaciones' },
      { icon: Send, label: 'Nómina Electrónica', permission: 'ver_nomina_electronica', path: '/nomina/electronica' },
    ]
  },
  {
    title: "Configuración y Sistema",
    icon: Settings,
    items: [
      { icon: Building2, label: 'Estaciones', permission: 'ver_estaciones', path: '/estaciones' },
      { icon: Pump, label: 'Dispensadores', permission: 'ver_bombas', path: '/bombas' },
      { icon: Droplets, label: 'Mangueras', permission: 'ver_mangueras', path: '/mangueras' },
      { icon: Receipt, label: 'Precios Combustible Isla', permission: 'ver_precios_combustible', path: '/precios-combustible' },
      { icon: ReceiptText, label: 'Facturación Electrónica', permission: 'ver_configuracion_empresa', path: '/facturacion' },
      { icon: Layers, label: 'Mapeos Catálogos DIAN', permission: 'ver_mapeos_catalogos', path: '/facturacion/mapeos' },
      { icon: FileCheck, label: 'Resoluciones Facturación', permission: 'ver_resoluciones_facturacion', path: '/facturacion/resoluciones' },
      { icon: TrendingUp, label: 'Capital de Trabajo', permission: 'ver_indicadores_financieros', path: '/reportes/capital-trabajo' },
      { icon: BarChart3, label: 'Histórico Turnos', permission: 'ver_reportes_turnos_islero', path: '/turnos/historico' },
      { icon: Sliders, label: 'Dashboard Configuración', permission: 'configurar_dashboard', path: '/dashboardconfiguracion' },
      { icon: UserRoundPlus, label: 'Administración', permission: 'ver_usuarios', path: '/usuarios' },
      { icon: Shield, label: 'Roles y Permisos', permission: 'ver_roles', path: '/roles' },
      { icon: UserCircle, label: 'Perfil', permission: null, path: '/perfil' },
      { icon: Settings, label: 'Configuración Empresa', permission: 'ver_configuracion_empresa', path: '/configuracion' },
    ]
  }
];

export const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(window.innerWidth > 768);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, loading } = usePermissions();
  const [user, setUser] = useState({ name: 'Usuario', email: '' });

  // Estado del acordeón: solo una categoría abierta a la vez
  const [openGroup, setOpenGroup] = useState(() => {
    const currentPath = window.location.pathname;
    const match = menuGroups.find(group => 
      group.items.some(item => isRouteActive(item.path, currentPath))
    );
    return match ? match.title : "Operación Estación";
  });

  // Apertura automática de la categoría al navegar o cambiar de ruta activa
  useEffect(() => {
    const currentPath = location.pathname;
    for (const group of menuGroups) {
      const hasActive = group.items.some(item => isRouteActive(item.path, currentPath));
      if (hasActive) {
        setOpenGroup(group.title);
        break;
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileOpen) {
      return modalStack.push(() => setIsMobileOpen(false));
    }
  }, [isMobileOpen]);

  const quickAccessItems = [
    { 
      icon: Fuel, 
      label: 'Combustible', 
      fullLabel: 'Venta Combustible', 
      permission: 'vender_combustible', 
      path: '/ventas/nueva' 
    },
    { 
      icon: Droplets, 
      label: 'Lubricantes', 
      fullLabel: 'Venta Lubricantes', 
      permission: 'vender_lubricantes', 
      path: '/ventas/lubricantes' 
    },
    { 
      icon: Clock, 
      label: 'Turnos', 
      fullLabel: 'Turnos Islero', 
      permission: 'ver_turnos_islero', 
      path: '/operacion/turnos' 
    }
  ];

  const visibleQuickAccesses = quickAccessItems.filter(item => hasPermission(item.permission));

  // Índice de búsqueda filtrado estrictamente por permisos del usuario
  const authorizedSearchItems = useMemo(() => {
    const items = [];
    menuGroups.forEach(group => {
      group.items.forEach(item => {
        const isAuthorized = !item.permission || hasPermission(item.permission);
        if (isAuthorized) {
          const synonyms = SEARCH_SYNONYMS[item.path] || [];
          const searchableString = normalizeText(
            `${item.label} ${group.title} ${synonyms.join(' ')}`
          );
          items.push({
            ...item,
            category: group.title,
            searchableString
          });
        }
      });
    });
    return items;
  }, [hasPermission]);

  // Resultados de búsqueda activos
  const searchResults = useMemo(() => {
    const cleanTerm = searchTerm.trim();
    if (!cleanTerm) return [];
    const queryTokens = normalizeText(cleanTerm).split(/\s+/).filter(Boolean);
    if (queryTokens.length === 0) return [];

    return authorizedSearchItems.filter(item => {
      return queryTokens.every(token => item.searchableString.includes(token));
    });
  }, [searchTerm, authorizedSearchItems]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  // Atajo global Ctrl+K / Cmd+K
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (window.innerWidth <= 768) {
          setIsMobileOpen(true);
        } else {
          setIsExpanded(true);
        }
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 50);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

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

  const handleItemClick = (item) => {
    if (window.innerWidth <= 768) setIsMobileOpen(false); 
    navigate(item.path);
  };

  const handleToggleGroup = (title) => {
    setOpenGroup(prev => (prev === title ? null : title));
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0 && selectedIndex >= 0 && selectedIndex < searchResults.length) {
        const selected = searchResults[selectedIndex];
        handleItemClick(selected);
        setSearchTerm('');
        searchInputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSearchTerm('');
      searchInputRef.current?.blur();
    }
  };

  if (loading) return null;

  return (
    <>
      {/* Botón flotante para abrir menú en Android/Móvil */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-40 p-2.5 bg-zinc-900 text-white rounded-xl md:hidden border border-zinc-800 shadow-xl print:hidden active:scale-95"
        aria-label="Abrir menú"
      >
        <Menu size={22} />
      </button>

      {/* Backdrop con desenfoque en móvil */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[45] md:hidden print:hidden"
          />
        )}
      </AnimatePresence>

      {/* Contenedor del Sidebar */}
      <motion.div 
        initial={false}
        animate={{ 
          width: window.innerWidth <= 768 ? 280 : (isExpanded ? 260 : 76),
          x: window.innerWidth <= 768 ? (isMobileOpen ? 0 : -280) : 0 
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="fixed md:relative h-screen bg-[#09090b] text-zinc-400 flex flex-col border-r border-zinc-800 shadow-2xl z-50 print:hidden select-none"
      >
        {/* Botón de colapso en escritorio */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? "Colapsar menú" : "Expandir menú"}
          className="hidden md:flex absolute -right-3 top-10 bg-zinc-900 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-yellow-400 transition-colors shadow-md z-[60]"
        >
          <motion.div animate={{ rotate: isExpanded ? 0 : 180 }}>
            <ChevronLeft size={15} />
          </motion.div>
        </button>

        {/* Encabezado Logo */}
        <div className="p-5 h-20 flex items-center justify-between mb-1">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logoEmpresa} alt="Logo" className="w-9 h-9 object-contain flex-shrink-0" />
            {(isExpanded || isMobileOpen) && (
              <span className="font-bold text-white tracking-tight text-base truncate">
                Las Granjas
              </span>
            )}
          </div>
          <button 
            onClick={() => setIsMobileOpen(false)} 
            className="md:hidden text-zinc-400 hover:text-white p-1"
            aria-label="Cerrar menú"
          >
            <X size={22} />
          </button>
        </div>

        {/* Buscador de Módulos */}
        <div className="px-3.5 mb-3">
          {(isExpanded || isMobileOpen) ? (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Search size={15} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar módulo u opción..."
                className="w-full pl-9 pr-14 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-yellow-500/70 focus:ring-1 focus:ring-yellow-500/30 transition-all shadow-inner"
              />
              {searchTerm ? (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-200 transition-colors"
                  title="Limpiar búsqueda"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              ) : (
                <div className="hidden md:flex absolute inset-y-0 right-0 pr-2.5 items-center pointer-events-none">
                  <kbd className="text-[9px] bg-zinc-800 text-zinc-400 font-mono px-1.5 py-0.5 rounded border border-zinc-700/60 shadow-sm">
                    Ctrl K
                  </kbd>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setIsExpanded(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                title="Buscar módulo (Ctrl+K)"
                className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-yellow-400 hover:border-zinc-700 transition-all active:scale-95"
              >
                <Search size={17} />
              </button>
            </div>
          )}
        </div>

        {/* Contenido Scrollable: Accesos Rápidos y Acordeones */}
        <div className="flex-1 overflow-y-auto px-3.5 custom-scrollbar">
          {searchTerm.trim() ? (
            /* Vista de Resultados del Buscador */
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Resultados ({searchResults.length})
                </span>
                {searchResults.length > 0 && (
                  <span className="text-[10px] text-zinc-500">
                    Usa ↑↓ y Enter
                  </span>
                )}
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-1.5">
                  {searchResults.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    const Icon = item.icon;
                    return (
                      <button
                        key={`${item.category}-${item.path}`}
                        onClick={() => {
                          handleItemClick(item);
                          setSearchTerm('');
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full text-left flex items-center justify-between p-2.5 rounded-xl border transition-all duration-150 min-h-[46px] active:scale-[0.99] ${
                          isSelected
                            ? 'bg-zinc-800 border-yellow-500/80 text-white shadow-sm ring-1 ring-yellow-500/30'
                            : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/40 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 mr-2">
                          <Icon size={18} className={isSelected ? 'text-yellow-400' : 'text-zinc-400'} />
                          <span className="text-xs font-medium truncate">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-400 border border-zinc-700/50 whitespace-nowrap flex-shrink-0">
                          {item.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center rounded-xl bg-zinc-900/50 border border-zinc-800/80 my-2">
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                    No se encontraron opciones para esta búsqueda con tus permisos actuales
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Vista Normal: Accesos Rápidos y Acordeones por Categoría */
            <>
              {/* Accesos Rápidos */}
              {visibleQuickAccesses.length > 0 && (
                <div className="mb-4">
                  {(isExpanded || isMobileOpen) ? (
                    <>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                          Accesos Rápidos
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                      </div>
                      <div className={`grid gap-1.5 ${
                        visibleQuickAccesses.length === 3 ? 'grid-cols-3' : 
                        visibleQuickAccesses.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
                      }`}>
                        {visibleQuickAccesses.map((item) => {
                          const isActive = isRouteActive(item.path, location.pathname);
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.path}
                              onClick={() => handleItemClick(item)}
                              title={item.fullLabel}
                              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 min-h-[52px] active:scale-95 ${
                                isActive
                                  ? 'bg-zinc-800 border-yellow-500/80 text-yellow-400 shadow-sm ring-1 ring-yellow-500/30'
                                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/60 hover:border-zinc-700 hover:text-white'
                              }`}
                            >
                              <Icon size={18} className={isActive ? 'text-yellow-400' : 'text-zinc-400'} />
                              <span className="text-[10px] font-bold tracking-tight truncate w-full text-center mt-1">
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 pb-2.5 mb-2 border-b border-zinc-800/80">
                      {visibleQuickAccesses.map((item) => {
                        const isActive = isRouteActive(item.path, location.pathname);
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleItemClick(item)}
                            title={item.fullLabel}
                            className={`p-2.5 rounded-xl border transition-all duration-200 active:scale-95 ${
                              isActive
                                ? 'bg-zinc-800 border-yellow-500/80 text-yellow-400 ring-1 ring-yellow-500/30'
                                : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
                            }`}
                          >
                            <Icon size={17} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Categorías en Acordeón */}
              <div className="space-y-1.5 mb-4">
                {menuGroups.map((group, idx) => {
                  const visibleItems = group.items.filter(item => !item.permission || hasPermission(item.permission));
                  if (visibleItems.length === 0) return null;

                  const isOpen = openGroup === group.title;
                  const isGroupActive = visibleItems.some(item => isRouteActive(item.path, location.pathname));
                  const GroupIcon = group.icon;

                  if (isExpanded || isMobileOpen) {
                    return (
                      <div key={idx} className="rounded-xl overflow-hidden transition-colors">
                        {/* Cabecera del Acordeón */}
                        <button
                          onClick={() => handleToggleGroup(group.title)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-left ${
                            isOpen
                              ? 'bg-zinc-800/80 text-white font-semibold shadow-sm border border-zinc-700/60'
                              : isGroupActive
                                ? 'bg-zinc-900/90 text-yellow-400 font-semibold border border-yellow-500/30 hover:bg-zinc-800/60'
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <GroupIcon 
                              size={17} 
                              className={`flex-shrink-0 transition-colors ${
                                isOpen || isGroupActive ? 'text-yellow-400' : 'text-zinc-500 group-hover:text-zinc-300'
                              }`} 
                            />
                            <span className="text-xs tracking-tight truncate">
                              {group.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                              isOpen ? 'bg-yellow-500/20 text-yellow-400' : 'bg-zinc-800 text-zinc-500'
                            }`}>
                              {visibleItems.length}
                            </span>
                            <ChevronDown 
                              size={14} 
                              className={`transition-transform duration-200 ${
                                isOpen ? 'rotate-180 text-yellow-400' : 'text-zinc-500 group-hover:text-zinc-400'
                              }`} 
                            />
                          </div>
                        </button>

                        {/* Contenido Expandible de Opciones */}
                        {isOpen && (
                          <div className="mt-1 ml-2.5 pl-2.5 border-l border-zinc-800/80 space-y-1 py-1">
                            {visibleItems.map((item) => {
                              const isActive = isRouteActive(item.path, location.pathname);
                              const ItemIcon = item.icon;
                              return (
                                <button
                                  key={item.path}
                                  onClick={() => handleItemClick(item)}
                                  title={item.label}
                                  className={`w-full flex items-center relative px-2.5 py-2 rounded-xl transition-all duration-150 min-h-[46px] group active:scale-[0.99] text-left ${
                                    isActive
                                      ? 'bg-zinc-800/90 text-white font-medium shadow-sm border border-yellow-500/30 ring-1 ring-yellow-500/20'
                                      : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                                  }`}
                                >
                                  <ItemIcon
                                    size={17}
                                    className={`flex-shrink-0 transition-colors ${
                                      isActive ? 'text-yellow-400' : 'text-zinc-500 group-hover:text-zinc-300'
                                    }`}
                                  />
                                  <span className="ml-2.5 text-xs truncate">
                                    {item.label}
                                  </span>
                                  {isActive && (
                                    <div className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-sm shadow-yellow-500/50" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Modo Colapsado en Escritorio (76-80px)
                  return (
                    <div key={idx} className="flex flex-col items-center mb-1.5">
                      <button
                        onClick={() => {
                          setOpenGroup(group.title);
                          setIsExpanded(true);
                        }}
                        title={`${group.title} (${visibleItems.length})`}
                        className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center ${
                          isGroupActive
                            ? 'bg-zinc-800 border-yellow-500/70 text-yellow-400 ring-1 ring-yellow-500/20'
                            : isOpen
                              ? 'bg-zinc-800/80 border-zinc-700 text-white'
                              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
                        }`}
                      >
                        <GroupIcon size={18} />
                      </button>

                      {isOpen && (
                        <div className="mt-1 space-y-1 flex flex-col items-center">
                          {visibleItems.map((item) => {
                            const isActive = isRouteActive(item.path, location.pathname);
                            const ItemIcon = item.icon;
                            return (
                              <button
                                key={item.path}
                                onClick={() => handleItemClick(item)}
                                title={item.label}
                                className={`p-2 rounded-xl transition-all duration-150 ${
                                  isActive
                                    ? 'bg-zinc-800 border border-yellow-500/50 text-yellow-400'
                                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40'
                                }`}
                              >
                                <ItemIcon size={16} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pie de Usuario y Cierre de Sesión */}
        <div className="p-3.5 border-t border-zinc-800 bg-[#09090b]">
           <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-zinc-900/50 border border-white/5">
             <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-xs uppercase flex-shrink-0">
               {user.name ? user.name.substring(0, 2) : 'U'} 
             </div>
             {(isExpanded || isMobileOpen) && (
               <div className="flex-1 overflow-hidden text-left">
                 <p className="text-xs font-bold text-white truncate">{user.name}</p>
                 <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
               </div>
             )}
             <button 
               onClick={() => { authService.logout(); navigate('/login'); }} 
               className="p-1" 
               title="Cerrar sesión"
               aria-label="Cerrar sesión"
             >
               <LogOut size={16} className="text-zinc-600 hover:text-red-400 transition-colors" />
             </button>
           </div>
        </div>
      </motion.div>
    </>
  );
};
