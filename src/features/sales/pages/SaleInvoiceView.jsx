import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const SaleInvoiceView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sale = location.state?.saleData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 flex flex-col items-center justify-start text-left">
      
      {/* Botones superiores de navegación e impresión (Se ocultan al imprimir) */}
      <div className="w-full max-w-xl flex justify-between items-center mb-6 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
        >
          ← Volver
        </button>
        <button
          onClick={handlePrint}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          🖨️ Imprimir Ticket
        </button>
      </div>

      {/* Contenedor principal de la factura optimizado para 58mm (Todo en negrita para impresión térmica) */}
      <div className="invoice-container bg-white w-full max-w-[58mm] mx-auto p-2 text-black font-sans text-[11px] font-bold print:w-full">
        
        {/* Cabecera */}
        <div className="text-center pb-3 border-b-2 border-dashed border-black space-y-0.5">
          <h1 className="text-xs font-black uppercase text-black">
            {sale?.turno_islero?.estacion?.nombre || 'PANEL ADMINISTRATIVO'}
          </h1>
          <p className="text-[10px] font-black text-black">NIT: {sale?.turno_islero?.estacion?.nit || 'NIT: --'}</p>
          <p className="text-[10px] font-black text-black mt-1">Factura de Venta POS</p>
        </div>

        {/* Datos Generales */}
        <div className="py-2 border-b-2 border-dashed border-black space-y-1 text-[10px] font-bold">
          <div className="flex justify-between">
            <span className="text-black">FECHA:</span>
            <span className="text-black">{sale?.created_at || '29/08/2026'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black">ATENDIDO POR:</span>
            <span className="text-black">{sale?.turno_islero?.user?.name || 'Islero'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black">TIPO VENTA:</span>
            <span className="text-black uppercase">{sale?.tipo_venta || 'CONTADO'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black">CLIENTE:</span>
            <span className="text-black">{sale?.cliente?.nombre || 'Consumidor Final'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black">OBS:</span>
            <span className="text-black">{sale?.observacion || 'Venta de lubricantes'}</span>
          </div>
        </div>

        {/* Detalle de Productos */}
        <div className="py-2 border-b-2 border-dashed border-black">
          <p className="text-[10px] font-black text-black mb-1">DETALLE DE PRODUCTOS</p>
          
          {sale?.detalles && sale.detalles.length > 0 ? (
            sale.detalles.map((item, index) => (
              <div key={index} className="py-1 space-y-0.5 text-[10px] font-bold">
                <div className="flex justify-between font-black">
                  <span className="truncate pr-1">{item.producto?.nombre || 'TERPEL ULTREK 90'}</span>
                  <span>${Number(item.subtotal || 24000).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold text-black">
                  <span>{item.cantidad || 1} UN x ${Number(item.precio_unitario || 24000).toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-1 space-y-0.5 text-[10px] font-bold">
              <div className="flex justify-between font-black">
                <span className="truncate pr-1">TERPEL ULTREK 90 TRANSMISION 1/4</span>
                <span>$ 24.000,00</span>
              </div>
              <div className="flex justify-between text-[9px] font-bold text-black">
                <span>1 UN x $ 24.000,00</span>
              </div>
            </div>
          )}
        </div>

        {/* Totales */}
        <div className="py-2 border-b-2 border-dashed border-black space-y-1 text-[10px] font-bold">
          <div className="flex justify-between">
            <span className="text-black">Subtotal</span>
            <span className="text-black">${Number(sale?.subtotal || 24000).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black">Impuestos / IVA</span>
            <span className="text-black">${Number(sale?.impuestos || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs font-black pt-1">
            <span>TOTAL A PAGAR</span>
            <span>${Number(sale?.total || 24000).toLocaleString()}</span>
          </div>
        </div>

        {/* Métodos de Pago */}
        <div className="py-2 border-b-2 border-dashed border-black space-y-1 text-[10px] font-bold">
          <p className="font-black text-black">MÉTODOS DE PAGO</p>
          <div className="flex justify-between">
            <span className="text-black">EFECTIVO (EFECTIVO)</span>
            <span className="text-black">${Number(sale?.total || 24000).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black">SALDO PENDIENTE</span>
            <span className="text-black">$0,00</span>
          </div>
        </div>

        {/* Pie de página */}
        <div className="text-center pt-3 space-y-1 font-black">
          <p className="text-[10px] text-black">✔ VENTA EXITOSA</p>
          <p className="text-[9px] text-black">¡GRACIAS POR SU COMPRA!</p>
        </div>

      </div>

      {/* Estilos estrictos para la impresión térmica */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-container, .invoice-container * {
            visibility: visible;
          }
          .invoice-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 58mm !important;
            margin: 0 !important;
            padding: 1mm 2mm !important;
            box-sizing: border-box;
            font-weight: 900 !important;
            color: #000 !important;
          }
          @page {
            size: 58mm auto;
            margin: 0;
          }
        }
      `}} />

    </div>
  );
};