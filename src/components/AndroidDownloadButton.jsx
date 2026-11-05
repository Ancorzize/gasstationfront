import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Smartphone, Download } from 'lucide-react';
import { companyService } from '../features/settings/services/companyService';

/**
 * Normaliza y verifica si una ruta corresponde a la pantalla de Login.
 * Cubre '/login', '/login/', '/login?param=1', etc.
 */
export const isLoginRoute = (pathname = '') => {
  if (!pathname) return false;
  const cleanPath = pathname.replace(/\/+$/, '').toLowerCase();
  return cleanPath === '/login' || cleanPath.startsWith('/login');
};

/**
 * Detecta si el usuario está accediendo exclusivamente desde un navegador en Android.
 * 
 * Reglas estrictas:
 * 1. NUNCA dentro de la APK instalada (Capacitor.isNativePlatform() === true).
 * 2. NUNCA en navegadores de escritorio (Windows, macOS, Linux de escritorio).
 * 3. NUNCA en iPhone / iPad (iOS / iPadOS).
 * 4. NUNCA en equipos de escritorio con pantalla táctil.
 * 5. SÍ exclusivamente en navegadores web en dispositivos Android.
 */
export const isAndroidBrowser = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // 1. Si está ejecutándose dentro de la APK instalada (Capacitor nativo), NUNCA mostrar
  if (Capacitor.isNativePlatform()) {
    return false;
  }

  const ua = navigator.userAgent || navigator.vendor || window.opera || '';

  // 2. Descartar explícitamente sistemas de escritorio (Windows, Mac, Linux de escritorio)
  if (/Windows|Macintosh|X11/i.test(ua)) {
    return false;
  }

  // 3. Descartar explícitamente dispositivos Apple (iPhone, iPad, iPod)
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return false;
  }

  // 4. Exclusivamente navegadores Android
  return /Android/i.test(ua);
};

// Variable de módulo en memoria: caché compartida durante la sesión de la aplicación (SPA)
// No utiliza almacenamiento persistente del navegador (localStorage/sessionStorage)
let inMemoryApkData = null; // { disponible: boolean, url_descarga_apk: string | null }
let inMemoryApkPromise = null;

/**
 * Consulta compartida en memoria para evitar solicitudes HTTP duplicadas o redundantes
 * cuando existan varias instancias del componente o al navegar entre pantallas.
 */
const fetchApkDownloadInfo = async () => {
  if (inMemoryApkData !== null) {
    return inMemoryApkData;
  }

  if (inMemoryApkPromise) {
    return inMemoryApkPromise;
  }

  inMemoryApkPromise = companyService.getPublicApkUrl()
    .then((data) => {
      const payload = data?.data || data;
      inMemoryApkData = {
        disponible: Boolean(payload && payload.disponible && payload.url_descarga_apk),
        url_descarga_apk: payload?.url_descarga_apk || null,
      };
      return inMemoryApkData;
    })
    .catch(() => {
      // Si ocurre un error de red, se limpia la promesa para permitir reintentos futuros
      inMemoryApkPromise = null;
      return { disponible: false, url_descarga_apk: null };
    });

  return inMemoryApkPromise;
};

/**
 * Componente de descarga de APK Android de Las Granjas.
 * 
 * Soporta dos variantes:
 * - 'inline': botón integrado dentro de formularios o vistas (ej. pantalla de login).
 * - 'floating': botón flotante global para el resto de pantallas públicas y privadas.
 */
export const AndroidDownloadButton = ({ variant = 'inline', className = '' }) => {
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isAndroid, setIsAndroid] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // 1. Verificar si es exclusivamente navegador Android
    const androidDetected = isAndroidBrowser();
    setIsAndroid(androidDetected);

    if (!androidDetected) {
      return;
    }

    // 2. Evitar solicitudes HTTP duplicadas:
    // La instancia floating NO debe ejecutar ninguna consulta cuando se encuentre en la pantalla de Login.
    if (variant === 'floating' && isLoginRoute(location.pathname)) {
      return;
    }

    // 3. Consultar mediante la caché compartida en memoria
    let isMounted = true;
    fetchApkDownloadInfo()
      .then((info) => {
        if (isMounted && info && info.disponible && info.url_descarga_apk) {
          setDownloadUrl(info.url_descarga_apk);
        }
      })
      .catch(() => {
        if (isMounted) setDownloadUrl(null);
      });

    return () => {
      isMounted = false;
    };
  }, [variant, location.pathname]);

  // Si no es navegador Android o no hay URL disponible, no renderizar nada
  if (!isAndroid || !downloadUrl) {
    return null;
  }

  // Si es la variante flotante y estamos en la ruta de Login (normalizada), no mostrar
  if (variant === 'floating' && isLoginRoute(location.pathname)) {
    return null;
  }

  // Variante flotante (para pantallas privadas o navegación global móvil)
  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-4 right-4 z-50 md:hidden animate-in fade-in slide-in-from-bottom-4 duration-300 ${className}`}>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-4 py-3 bg-zinc-900 text-yellow-400 hover:bg-zinc-800 active:scale-95 font-bold text-xs uppercase tracking-wider rounded-full border border-yellow-500/40 shadow-2xl shadow-black/80 transition-all"
        >
          <div className="p-1 bg-yellow-500/10 rounded-full">
            <Smartphone size={16} className="text-yellow-400" />
          </div>
          <span>Descargar aplicación Android</span>
          <Download size={14} className="text-yellow-400/90" />
        </a>
      </div>
    );
  }

  // Variante inline (integrada dentro de la tarjeta de inicio de sesión)
  return (
    <div className={`w-full ${className}`}>
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-zinc-900 to-zinc-800 hover:from-zinc-800 hover:to-zinc-700 text-yellow-400 font-bold text-xs uppercase tracking-wider rounded-2xl border border-yellow-500/30 shadow-lg shadow-black/40 transition-all active:scale-[0.98]"
      >
        <div className="p-1.5 bg-yellow-500/10 rounded-xl text-yellow-400">
          <Smartphone size={16} />
        </div>
        <span>Descargar aplicación Android</span>
        <Download size={15} className="text-yellow-400/80 ml-auto" />
      </a>
    </div>
  );
};

export default AndroidDownloadButton;
