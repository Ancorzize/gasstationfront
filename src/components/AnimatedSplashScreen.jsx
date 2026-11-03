import React, { useState, useEffect } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import logoGranjas from '../images/logoGranjas.png';

export const AnimatedSplashScreen = ({ onFinish }) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // 1. Ocultar el Splash Screen nativo en cuanto el componente React esté montado
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide({ fadeOutDuration: 150 }).catch(() => {});
    }

    // 2. Iniciar transición suave de salida (fade-out) a los 1500 ms
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, 1500);

    // 3. Completar y desmontar a los 1850 ms (total ~1,85s)
    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 1850);

    // 4. Temporizador de seguridad (Watchdog) para evitar bloqueos
    const watchdogTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
      clearTimeout(watchdogTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#09090b] select-none pointer-events-none transition-opacity duration-300 ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ minHeight: '100vh', width: '100vw' }}
    >
      {/* Halo radial dorado animado de fondo */}
      <div className="absolute w-72 h-72 rounded-full pointer-events-none splash-gold-aura" />

      {/* Contenedor central de marca */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6">
        {/* Contenedor del Logo con brillo dorado perimetral */}
        <div className="relative flex items-center justify-center splash-logo-container">
          <div className="absolute inset-0 rounded-full blur-xl bg-amber-500/25 scale-110" />
          <img
            src={logoGranjas}
            alt="Las Granjas"
            className="relative w-36 h-36 object-contain drop-shadow-[0_0_25px_rgba(245,158,11,0.45)]"
          />
        </div>

        {/* Título corporativo */}
        <h1 className="text-2xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 uppercase mt-6 text-center splash-title">
          LAS GRANJAS
        </h1>

        {/* Subtítulo corporativo */}
        <p className="text-[10px] font-bold tracking-[0.35em] text-slate-400 uppercase mt-2 text-center splash-subtitle">
          ESTACIÓN DE SERVICIO
        </p>
      </div>

      {/* Estilos CSS puros para animaciones fluidas sin dependencias externas */}
      <style dangerouslySetInnerHTML={{ __html: `
        .splash-gold-aura {
          background: radial-gradient(circle, rgba(245, 158, 11, 0.28) 0%, rgba(217, 119, 6, 0.12) 45%, transparent 70%);
          animation: splashAuraGlow 1.8s ease-in-out infinite;
        }

        .splash-logo-container {
          animation: splashLogoZoom 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .splash-title {
          animation: splashFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
        }

        .splash-subtitle {
          animation: splashFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both;
        }

        @keyframes splashLogoZoom {
          0% {
            transform: scale(0.82);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes splashAuraGlow {
          0%, 100% {
            transform: scale(0.95);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.95;
          }
        }

        @keyframes splashFadeUp {
          0% {
            transform: translateY(12px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}} />
    </div>
  );
};
