import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  ArrowLeft,
  Banknote,
  Droplets,
  Users,
  Send,
  AlertCircle
} from 'lucide-react';

import { shiftService } from '../services/shiftService';
import { useToast } from '../../../context/ToastContext';

export const ShiftEditClosingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const [lecturas, setLecturas] = useState([]);

  const [destinos, setDestinos] = useState([
    {
      destino_recaudo_id: 1,
      nombre: 'Combustible',
      pagos: {
        efectivo: '0',
        qr: '0',
        datafono: '0',
        transferencia: '0',
        consignacion: '0',
      },
    },
    {
      destino_recaudo_id: 2,
      nombre: 'Lubricantes',
      pagos: {
        efectivo: '0',
        qr: '0',
        datafono: '0',
        transferencia: '0',
        consignacion: '0',
      },
    },
  ]);

  const formatDisplayNumber = (value, maxDecimals = 2) => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '';
    }

    const number = Number(value);

    if (isNaN(number)) {
      return '';
    }

    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
    }).format(number);
  };


  const formatMoney = (value) => {
    return formatDisplayNumber(value, 2);
  };

  const parseMoney = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return 0;
    }

    const normalized = value
      .toString()
      .replace(/\./g, '')
      .replace(',', '.');

    const number = Number(normalized);

    return isNaN(number) ? 0 : number;
  };

  

  const formatInputNumber = (value, maxDecimals = 2) => {
    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    let input = value.toString();

    if (input === '') {
      return '';
    }

    input = input.replace(/[^\d.,]/g, '');

    input = input.replace(/\./g, '');

    const commaIndex = input.indexOf(',');

    let integerPart;
    let decimalPart = null;

    if (commaIndex >= 0) {
      integerPart = input.substring(0, commaIndex);

      decimalPart = input
        .substring(commaIndex + 1)
        .replace(/\D/g, '')
        .substring(0, maxDecimals);
    } else {
      integerPart = input;
    }

    if (integerPart === '') {
      integerPart = '0';
    }

    integerPart = integerPart.replace(
      /^0+(?=\d)/,
      ''
    );

    const integerNumber = Number(integerPart);

    if (isNaN(integerNumber)) {
      return '';
    }

    const formattedInteger = new Intl.NumberFormat('es-CO', {
      maximumFractionDigits: 0,
    }).format(integerNumber);

    if (decimalPart !== null) {
      return `${formattedInteger},${decimalPart}`;
    }

    return formattedInteger;
  };

  const parseInputNumber = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return 0;
    }

    const normalized = value
      .toString()
      .replace(/\./g, '')
      .replace(',', '.');

    const number = Number(normalized);

    return isNaN(number) ? 0 : number;
  };

  useEffect(() => {
    const loadDataForEdit = async () => {
      setLoading(true);

      try {
        const res = await shiftService.editShiftClosing(id);

        if (
          res &&
          res.status &&
          res.data
        ) {
          const data = res.data;

          setSummary(data);

          const cierrePendiente =
            data.datos_cierre_pendiente || {};

          const lecturasMapeadas =
            (data.lecturas || []).map((l) => {

              const lecturaPrevia =
                cierrePendiente.lecturas_finales?.find(
                  (lf) =>
                    lf.manguera_id === l.manguera_id
                );

              const valFinalRaw =
                lecturaPrevia
                  ? lecturaPrevia.lectura_final
                  : (l.lectura_final ?? '');

              const valInicialRaw =
                l.lectura_inicial ?? 0;

              return {
                manguera_id: l.manguera_id,

                nombre:
                  l.manguera?.nombre ||
                  l.codigo_manguera ||
                  'Manguera',

                lectura_inicial:
                  formatDisplayNumber(
                    valInicialRaw,
                    3
                  ),

                lectura_inicial_num:
                  Number(valInicialRaw),

                lectura_final:
                  valFinalRaw !== ''
                    ? formatDisplayNumber(
                        valFinalRaw,
                        3
                      )
                    : '',

                precio_galon:
                  Number(
                    l.precio_galon || 0
                  ),
              };
            });

          setLecturas(
            lecturasMapeadas
          );

          if (
            cierrePendiente.destinos_recaudo &&
            cierrePendiente.destinos_recaudo.length > 0
          ) {
            setDestinos((prev) =>
              prev.map((base) => {

                const encontrado =
                  cierrePendiente.destinos_recaudo.find(
                    (d) =>
                      d.destino_recaudo_id ===
                      base.destino_recaudo_id
                  );

                if (
                  encontrado &&
                  encontrado.pagos
                ) {
                  return {
                    ...base,

                    pagos: {
                      efectivo:
                        formatDisplayNumber(
                          encontrado.pagos.efectivo,
                          2
                        ),

                      qr:
                        formatDisplayNumber(
                          encontrado.pagos.qr,
                          2
                        ),

                      datafono:
                        formatDisplayNumber(
                          encontrado.pagos.datafono,
                          2
                        ),

                      transferencia:
                        formatDisplayNumber(
                          encontrado.pagos.transferencia,
                          2
                        ),

                      consignacion:
                        formatDisplayNumber(
                          encontrado.pagos.consignacion,
                          2
                        ),
                    },
                  };
                }

                return base;
              })
            );
          }

        } else {

          showToast(
            res?.message ||
              'No se pudo cargar la información para corrección',
            'error'
          );

          navigate('/dashboard');
        }

      } catch (error) {

        console.error(
          'Error en la petición HTTP:',
          error
        );

        showToast(
          'Error de conexión al cargar el turno devuelto',
          'error'
        );

        navigate('/dashboard');

      } finally {

        setLoading(false);
      }
    };

    loadDataForEdit();

  }, [id]);


  const calculatedValues = useMemo(() => {


    const totalCombustible =
      lecturas.reduce((acc, l) => {

        const fin =
          parseInputNumber(
            l.lectura_final
          );

        const inicial =
          l.lectura_inicial_num !== undefined
            ? l.lectura_inicial_num
            : parseInputNumber(
                l.lectura_inicial
              );

        const galonesVendidos =
          Math.max(
            0,
            fin - inicial
          );

        return (
          acc +
          galonesVendidos *
          l.precio_galon
        );

      }, 0);


    const cierrePendiente =
      summary?.datos_cierre_pendiente || {};

    const totalLubricantes =
      Number(
        cierrePendiente.total_ventas_lubricantes ||
        summary?.total_ventas_lubricantes ||
        0
      );


    const totalCreditos =
      Number(
        cierrePendiente.total_abonos ||
        summary?.total_abonos ||
        0
      );


    const totalEsperado = totalCombustible +  totalLubricantes;

    const totalReportado =
      destinos.reduce(
        (acc, d) => {

          return (
            acc +
            Object.values(
              d.pagos
            ).reduce(
              (sum, val) =>
                sum +
                parseMoney(val),
              0
            )
          );

        },
        0
      );

    const balance =
      totalReportado -
      totalEsperado;

    return {
      totalEsperado,
      totalReportado,
      balance,
    };

  }, [
    lecturas,
    destinos,
    summary,
  ]);

  const handleReadingChange = (
    mangueraId,
    value
  ) => {

    const formatted =
      formatInputNumber(
        value,
        3
      );

    setLecturas((prev) =>
      prev.map((l) =>
        l.manguera_id === mangueraId
          ? {
              ...l,
              lectura_final:
                formatted,
            }
          : l
      )
    );
  };

  const handlePaymentChange = (
    destinoId,
    medio,
    value
  ) => {

    const formatted =
      formatInputNumber(
        value,
        2
      );

    setDestinos((prev) =>
      prev.map((d) =>
        d.destino_recaudo_id === destinoId
          ? {
              ...d,

              pagos: {
                ...d.pagos,

                [medio]:
                  formatted,
              },
            }
          : d
      )
    );
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {
      const destinosPayload =
        destinos.map((destino) => ({

          destino_recaudo_id:
            destino.destino_recaudo_id,

          pagos: {

            efectivo:
              parseMoney(
                destino.pagos.efectivo
              ),

            qr:
              parseMoney(
                destino.pagos.qr
              ),

            datafono:
              parseMoney(
                destino.pagos.datafono
              ),

            transferencia:
              parseMoney(
                destino.pagos.transferencia
              ),

            consignacion:
              parseMoney(
                destino.pagos.consignacion
              ),
          },
        }));

      const payload = {

        lecturas_finales:
          lecturas.map(
            ({
              manguera_id,
              lectura_final,
            }) => ({

              manguera_id,

              lectura_final:
                parseInputNumber(
                  lectura_final
                ),
            })
          ),

        destinos_recaudo:
          destinosPayload,

        otros_movimientos:
          Number(
            summary
              ?.datos_cierre_pendiente
              ?.otros_movimientos || 0
          ),

        otros_movimientos_detalle:
          summary
            ?.datos_cierre_pendiente
            ?.otros_movimientos_detalle ||
          null,

        observacion_cierre:
          summary
            ?.datos_cierre_pendiente
            ?.observacion_cierre ||
          '',
      };
      const res =
        await shiftService.requestCloseShift(
          id,
          payload
        );

      if (
        res &&
        res.status
      ) {

        showToast(
          'Corrección enviada exitosamente. Pendiente de nueva aprobación.',
          'success'
        );

        navigate(
          '/operacion/turnos'
        );

      } else {

        showToast(
          res?.message ||
            'Error al actualizar la solicitud',
          'error'
        );
      }

    } catch (error) {

      console.error(
        'Error en submit:',
        error
      );

      showToast(
        'Error al enviar la corrección del turno',
        'error'
      );

    } finally {

      setLoading(false);
    }
  };

  if (
    loading &&
    !summary
  ) {
    return (
      <div className="p-20 text-center">

        <Loader2
          className="animate-spin mx-auto text-zinc-900"
          size={32}
        />

      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto pb-20 text-left">

      {summary.observacion_devolucion && (

        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3 text-rose-900 shadow-sm">

          <AlertCircle
            className="shrink-0 mt-0.5 text-rose-600"
            size={20}
          />

          <div>

            <h4 className="text-xs font-black uppercase tracking-wider">
              Turno Devuelto por Supervisor
            </h4>

            <p className="text-xs font-medium mt-0.5">

              Motivo:{' '}

              <span className="font-bold">
                {summary.observacion_devolucion}
              </span>

            </p>

          </div>

        </div>
      )}

      <div className="sticky top-0 z-40 bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-md pt-2 pb-4 space-y-4 -mx-4 px-4 md:mx-0 md:px-0">

        <header className="flex items-center justify-between">

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-zinc-900 shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="text-right">

            <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">
              Corregir Cierre de Turno
            </h2>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Estación: {summary.estacion?.nombre}
            </p>

          </div>

        </header>

        <div
          className={`
            p-5 rounded-[2rem] shadow-md border
            flex items-center justify-between
            transition-colors

            ${
              calculatedValues.balance === 0
                ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                : calculatedValues.balance < 0
                  ? 'bg-rose-50 border-rose-100 text-rose-900'
                  : 'bg-blue-50 border-blue-100 text-blue-900'
            }
          `}
        >

          <div>

            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-wider">
              Balance del Turno
            </h4>

            <p className="text-[9px] md:text-[10px] font-bold opacity-75">

              Esperado: $
              {formatMoney(
                calculatedValues.totalEsperado
              )}

              {' | '}

              Reportado: $
              {formatMoney(
                calculatedValues.totalReportado
              )}

            </p>

          </div>

          <div className="text-right">

            <p className="text-sm md:text-xl font-black">

              {
                calculatedValues.balance >= 0
                  ? 'Sobrante'
                  : 'Faltante'
              }

              : $

              {formatMoney(
                Math.abs(
                  calculatedValues.balance
                )
              )}

            </p>

          </div>

        </div>

      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8"
      >

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm space-y-4">

            <h3 className="text-xs font-black text-slate-800 uppercase mb-6 flex items-center gap-2">

              <Droplets size={16} />

              Lecturas de Combustible

            </h3>

            {lecturas.map((l) => (

              <div
                key={l.manguera_id}
                className="p-4 bg-slate-50 rounded-2xl grid grid-cols-2 gap-4 items-center"
              >

                <div>

                  <p className="text-[10px] font-black uppercase text-slate-800">
                    {l.nombre}
                  </p>

                  <p className="text-[9px] font-bold text-slate-400">
                    Inicial: {l.lectura_inicial}
                  </p>

                  <p className="text-[10px] font-black text-slate-600">

                    $
                    {formatMoney(
                      l.precio_galon
                    )}

                    {' '}/gal

                  </p>

                </div>

                <input
                  type="text"
                  inputMode="decimal"
                  className="p-3 rounded-xl border border-slate-200 text-right font-black text-sm outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                  value={l.lectura_final}
                  onChange={(e) =>
                    handleReadingChange(
                      l.manguera_id,
                      e.target.value
                    )
                  }
                />

              </div>

            ))}

          </div>

          <div className="space-y-6">

            {destinos.map((destino) => {

              const esLubricantes =
                destino.destino_recaudo_id === 2;

              return (

                <div
                  key={destino.destino_recaudo_id}
                  className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm"
                >

                  <h3 className="text-xs font-black uppercase mb-6 flex items-center gap-2 text-slate-800">

                    <Banknote size={16} />

                    {destino.nombre}

                    {esLubricantes && (

                      <span className="text-[9px] font-bold text-slate-400 ml-auto">
                        (Automático)
                      </span>

                    )}

                  </h3>

                  <div className="grid grid-cols-2 gap-4">

                    {Object.keys(
                      destino.pagos
                    ).map((medio) => (

                      <div
                        key={medio}
                        className="space-y-1"
                      >

                        <label className="text-[9px] font-bold text-slate-400 uppercase">
                          {medio}
                        </label>

                        <input
                          type="text"
                          inputMode="decimal"
                          readOnly={
                            esLubricantes
                          }
                          disabled={
                            esLubricantes
                          }
                          className={`
                            w-full p-3 rounded-xl
                            text-xs font-black text-right
                            outline-none

                            ${
                              esLubricantes
                                ? 'bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed'
                                : 'bg-slate-50 border border-slate-200 focus:border-zinc-900 bg-white'
                            }
                          `}
                          value={
                            destino.pagos[
                              medio
                            ]
                          }
                          onChange={(e) =>
                            handlePaymentChange(
                              destino.destino_recaudo_id,
                              medio,
                              e.target.value
                            )
                          }
                        />

                      </div>

                    ))}

                  </div>

                </div>

              );

            })}

            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-sm">

              <h3 className="text-xs font-black uppercase mb-4 flex items-center gap-2 text-slate-800">

                <Users size={16} />

                Total Abonos de Cartera

              </h3>

              <div className="relative">

                <input
                  type="text"
                  readOnly
                  disabled
                  className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 text-right outline-none cursor-not-allowed"
                  value={`
                    $ ${formatMoney(
                      summary
                        .datos_cierre_pendiente
                        ?.total_abonos ||
                      summary.total_abonos ||
                      0
                    )}
                  `}
                />

              </div>

              <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest text-right">
                Abonos registrados en este turno
              </p>

            </div>

          </div>

        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs hover:bg-black transition-all shadow-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >

          {loading ? (
            <Loader2
              className="animate-spin"
              size={18}
            />
          ) : (
            <Send size={18} />
          )}

          Solicitar aprobación de cierre

        </button>

      </form>

    </div>
  );
};