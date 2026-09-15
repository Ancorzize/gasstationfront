import React, { useEffect, useState, useMemo } from 'react';
import { 
  ArrowLeft, Droplets, Banknote, Users, Clock, ShieldAlert,
  Fuel, Package, CreditCard, Receipt, AlertCircle, FileText, Loader2
} from 'lucide-react';
import { shiftService } from '../services/shiftService';
import { ShiftOperationsSection } from '../components/ShiftOperationsSection';

export const IsleroTurnoDetalleView = ({ selectedTurno, onBack }) => {
  const turnoId = typeof selectedTurno === 'object' ? selectedTurno?.id : selectedTurno;
  const [summary, setSummary] = useState(null);
  const [creditosOps, setCreditosOps] = useState([]);
  const [abonosOps, setAbonosOps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (turnoId) {
      const fetchDetail = async () => {
        setLoading(true);
        try {
          const [resSummary, resCreditos, resAbonos] = await Promise.allSettled([
            shiftService.getClosingSummary(turnoId),
            shiftService.getShiftOperationsByType(turnoId, 'creditos'),
            shiftService.getShiftOperationsByType(turnoId, 'abonos')
          ]);

          if (resSummary.status === 'fulfilled' && resSummary.value?.status) {
            setSummary(resSummary.value.data);
          } else if (typeof selectedTurno === 'object') {
            setSummary(selectedTurno);
          }

          if (resCreditos.status === 'fulfilled' && resCreditos.value?.status) {
            setCreditosOps(resCreditos.value.data?.items || []);
          }

          if (resAbonos.status === 'fulfilled' && resAbonos.value?.status) {
            setAbonosOps(resAbonos.value.data?.items || []);
          }
        } catch (e) {
          if (typeof selectedTurno === 'object') {
            setSummary(selectedTurno);
          }
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [turnoId]);

  const turnoData = summary?.turno || (typeof selectedTurno === 'object' ? selectedTurno : null);
  const totales = summary?.totales_sistema || {};

  const totalCombustible = Number(
    totales.ventas_combustible ??
    summary?.turno?.total_ventas_combustible ??
    turnoData?.total_ventas_combustible ??
    0
  );
  const totalLubricantes = Number(
    totales.ventas_lubricantes ??
    summary?.turno?.total_ventas_lubricantes ??
    turnoData?.total_ventas_lubricantes ??
    0
  );
  const totalCreditos = Number(
    totales.creditos ??
    summary?.turno?.total_creditos ??
    turnoData?.total_creditos ??
    0
  );
  const totalAbonos = Number(
    totales.abonos ??
    summary?.turno?.total_abonos ??
    turnoData?.total_abonos ??
    0
  );

  const totalEsperado = (totalCombustible + totalLubricantes) - totalCreditos + totalAbonos;

  const recaudosList = summary?.destinos_recaudo || turnoData?.recaudos || [];
  let totalReportado = 0;
  if (recaudosList.length > 0) {
    totalReportado = recaudosList.reduce((acc, d) => {
      if (d.pagos) {
        return acc + Object.values(d.pagos).reduce((sum, val) => sum + Number(val || 0), 0);
      }
      return acc + Number(d.total || 0);
    }, 0) + totalAbonos + Number(
      summary?.turno?.otros_movimientos ||
      summary?.datos_cierre_pendiente?.otros_movimientos ||
      summary?.resumen?.otros_movimientos ||
      turnoData?.otros_movimientos ||
      0
    );
  } else {
    totalReportado = Number(turnoData?.total_reportado || 0);
  }

  const rawBalance = totalReportado - totalEsperado;
  const balance = Math.abs(rawBalance) < 100 ? 0 : rawBalance;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-zinc-900" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
          Cargando detalle del turno...
        </p>
      </div>
    );
  }

  if (!turnoData && !summary) {
    return (
      <div className="p-4 md:p-8 text-left max-w-6xl mx-auto space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black uppercase text-yellow-600 hover:text-yellow-700 transition-colors"
          >
            <ArrowLeft size={16} /> Volver
          </button>
        )}
        <div className="text-center py-20 text-slate-400 font-bold uppercase text-xs">
          No se encontró información para este turno
        </div>
      </div>
    );
  }

  const estadoActual = turnoData?.estado || 'cerrado';
  const esDevuelto = estadoActual === 'devuelto' || turnoData?.observacion_devolucion;

  return (
    <div className="p-4 md:p-8 text-left max-w-6xl mx-auto space-y-6 pb-20">
      <div className="space-y-6">
        {/* Botón de Volver */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={16} /> Volver al listado
          </button>
        )}

        {/* Encabezado */}
        <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-md pt-2 pb-4 space-y-4 -mx-4 px-4 md:mx-0 md:px-0">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-zinc-900 text-white uppercase">
                Turno #{turnoData?.id} - {estadoActual}
              </span>
            </div>
            <div className="text-right">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight italic">
                Detalle Informativo de Turno
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Estación: {turnoData?.estacion?.nombre} | Islero: {turnoData?.usuario?.name || turnoData?.user?.name}
              </p>
            </div>
          </header>

          {/* Banner de Esperado, Reportado y Balance */}
          <div
            className={`p-5 rounded-[2rem] shadow-md border flex items-center justify-between transition-colors ${
              balance === 0
                ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                : balance < 0
                ? 'bg-rose-50 border-rose-100 text-rose-900'
                : 'bg-blue-50 border-blue-100 text-blue-900'
            }`}
          >
            <div>
              <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider">
                Balance del Turno (Control de Caja)
              </h4>
              <p className="text-[9px] md:text-[10px] font-bold opacity-75">
                Esperado: ${totalEsperado.toLocaleString()} | Reportado: ${totalReportado.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm md:text-xl font-black">
                {balance >= 0 ? 'Sobrante' : 'Faltante'}: ${Math.abs(balance).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Alerta si fue devuelto */}
        {esDevuelto && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-rose-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
              <ShieldAlert size={18} /> Turno devuelto por el administrador
            </div>
            <p className="text-[10px] font-bold uppercase leading-relaxed text-slate-700">
              <span className="text-rose-600 font-black">Observación:</span> {turnoData.observacion_devolucion || 'Sin observaciones detalladas.'}
            </p>
          </div>
        )}

        {/* StatCards resumidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Fuel} label="Combustible" value={totalCombustible} color="bg-blue-600" />
          <StatCard icon={Package} label="Lubricantes" value={totalLubricantes} color="bg-zinc-900" />
          <StatCard icon={CreditCard} label="Créditos" value={totalCreditos} color="bg-rose-500" />
          <StatCard icon={Receipt} label="Abonos" value={totalAbonos} color="bg-emerald-600" />
        </div>

        {/* Detalle de Mangueras */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">
              Detalle de Mangueras y Lecturas
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Manguera
                  </th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Inicial
                  </th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Precio Galón
                  </th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Vendido (Gal)
                  </th>
                  <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(summary?.lecturas || turnoData?.lecturas || []).map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-slate-50/50 transition-colors text-xs font-bold"
                  >
                    <td className="p-5 uppercase text-left">
                      <p className="text-slate-800">{l.manguera?.nombre || `Manguera #${l.manguera_id}`}</p>
                      <p className="text-[9px] text-slate-400 italic">
                        {l.manguera?.bomba?.nombre} | {l.manguera?.producto?.nombre}
                      </p>
                    </td>
                    <td className="p-5 text-slate-600 text-left">
                      {Number(l.lectura_inicial).toLocaleString()}
                    </td>
                    <td className="p-5 text-slate-600 text-left">
                      $ {Number(l.precio_galon).toLocaleString()}
                    </td>
                    <td className="p-5 text-zinc-900 font-black text-left">
                      {Number(l.galones_vendidos_sistema || l.galones_vendidos || 0).toLocaleString()}
                    </td>
                    <td className="p-5 text-right font-black text-slate-800">
                      $ {Number(l.total_venta_sistema || l.total_venta || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ventas a Crédito y Abonos de Cartera */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Ventas a Crédito */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-rose-500" /> Ventas a Crédito del Turno
            </h3>
            {creditosOps.length > 0 ? (
              creditosOps.map((c) => (
                <div key={c.id} className="flex justify-between text-xs py-2 border-b border-slate-50 font-bold">
                  <div>
                    <p className="text-slate-800 uppercase">{c.cliente?.nombre || c.cliente || 'Cliente Crédito'}</p>
                    <p className="text-[9px] text-slate-400">Venta #{c.consecutivo || c.id} | Saldo: ${Number(c.saldo_pendiente || 0).toLocaleString()}</p>
                  </div>
                  <span className="font-black text-rose-600">$ {Number(c.total || 0).toLocaleString()}</span>
                </div>
              ))
            ) : summary?.ventas_credito?.length > 0 ? (
              summary.ventas_credito.map((c) => (
                <div key={c.id} className="flex justify-between text-xs py-2 border-b border-slate-50 font-bold">
                  <div>
                    <p className="text-slate-800 uppercase">{c.cliente}</p>
                    <p className="text-[9px] text-slate-400">Venta #{c.id}</p>
                  </div>
                  <span className="font-black text-rose-600">$ {Number(c.total || 0).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-slate-400 italic font-bold">No hay ventas a crédito registradas en este turno</p>
            )}
          </div>

          {/* Abonos de Cartera */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
              <Receipt size={16} className="text-emerald-500" /> Abonos de Cartera del Turno
            </h3>
            {abonosOps.length > 0 ? (
              abonosOps.map((a) => (
                <div key={a.id} className="flex justify-between text-xs py-2 border-b border-slate-50 font-bold">
                  <div>
                    <p className="text-slate-800 uppercase">{a.cliente?.nombre || a.cliente || 'Cliente Abono'}</p>
                    <p className="text-[9px] text-slate-400">Abono #{a.id} | Medio: {a.medio_pago || 'efectivo'}</p>
                  </div>
                  <span className="font-black text-emerald-600">$ {Number(a.monto || a.valor || 0).toLocaleString()}</span>
                </div>
              ))
            ) : summary?.abonos_recibidos?.length > 0 ? (
              summary.abonos_recibidos.map((a) => (
                <div key={a.id || a.cliente} className="flex justify-between text-xs py-2 border-b border-slate-50 font-bold">
                  <div>
                    <p className="text-slate-800 uppercase">{a.cliente}</p>
                    <p className="text-[9px] text-slate-400">Abono #{a.id || ''}</p>
                  </div>
                  <span className="font-black text-emerald-600">$ {Number(a.monto || a.valor || 0).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-slate-400 italic font-bold">No hay abonos a cartera registrados en este turno</p>
            )}
          </div>
        </div>

        {/* Sección Ajustes y Observaciones */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-4 text-left">
          <h3 className="text-xs font-black uppercase flex items-center gap-2 text-slate-800">
            <FileText size={16} /> Ajustes y Observaciones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase block">
                Otros Movimientos
              </label>
              <input
                type="text"
                readOnly
                disabled
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-right text-slate-800 outline-none cursor-not-allowed"
                value={`$ ${Number(summary?.turno?.otros_movimientos || summary?.datos_cierre_pendiente?.otros_movimientos || summary?.resumen?.otros_movimientos || turnoData?.otros_movimientos || 0).toLocaleString()}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase block">
                Detalle Movimientos
              </label>
              <input
                type="text"
                readOnly
                disabled
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-not-allowed"
                value={summary?.turno?.otros_movimientos_detalle || summary?.datos_cierre_pendiente?.otros_movimientos_detalle || summary?.resumen?.otros_movimientos_detalle || turnoData?.otros_movimientos_detalle || "-"}
              />
            </div>
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase block">
              Observación de Cierre
            </label>
            <textarea
              rows="2"
              readOnly
              disabled
              className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-not-allowed resize-none"
              value={summary?.turno?.observacion_cierre || summary?.datos_cierre_pendiente?.observacion_cierre || summary?.resumen?.observacion_cierre || turnoData?.observacion_cierre || "-"}
            />
          </div>
        </div>

        {/* Sección de Operaciones en Modo SOLO LECTURA */}
        <ShiftOperationsSection
          turnoId={turnoId}
          turnoEstado="cerrado"
        />
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-[2rem] p-6 border border-slate-100 space-y-4 text-left">
    <div
      className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white`}
    >
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
        {label}
      </p>
      <p className="text-sm font-black text-slate-800">
        $ {Number(value || 0).toLocaleString()}
      </p>
    </div>
  </div>
);