import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { modalStack } from '../utils/modalStack';

/**
 * Gestor nativo para la aplicación Android Las Granjas (Capacitor 8).
 * Debe estar montado dentro de BrowserRouter para tener acceso a useNavigate y useLocation.
 *
 * Responsabilidades:
 * - Configuración de StatusBar (#09090b con iconos claros Style.Light).
 * - Ocultamiento controlado de SplashScreen al renderizar.
 * - Manejo jerárquico del botón físico/gesto Atrás de Android (Modales -> Drawer -> Navegación -> Salida).
 * - Escucha del evento global 'gasstation:logout' para redirección suave mediante React Router.
 * - Total compatibilidad con navegadores web (las funciones nativas se ejecutan solo en plataforma nativa).
 */
export const NativeAppManager = ({ isSplashActive = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Escucha universal del evento de logout (tanto en web como en Android)
  useEffect(() => {
    const handleLogout = () => {
      navigate('/login', { replace: true });
    };

    window.addEventListener('gasstation:logout', handleLogout);
    return () => {
      window.removeEventListener('gasstation:logout', handleLogout);
    };
  }, [navigate]);

  // Inicialización de plugins nativos de Capacitor (StatusBar, SplashScreen y botón Atrás)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // 1. Configurar barra de estado nativa
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#09090b' }).catch(() => {});
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});

    // 2. Ocultar la pantalla de carga (SplashScreen) cuando no haya un splash animado activo
    if (!isSplashActive) {
      SplashScreen.hide().catch(() => {});
    }

    // 3. Registrar escucha del botón físico / gesto "Atrás" de Android
    const backListenerPromise = CapApp.addListener('backButton', () => {
      // Prioridad 1 y 2: Si existe un modal o drawer activo en la pila, cerrarlo
      if (modalStack.hasModals()) {
        modalStack.closeTop();
        return;
      }

      // Prioridad 3: Navegación hacia atrás en React Router
      const rootRoutes = ['/dashboard', '/login', '/operacion/turnos'];
      const isRootRoute = rootRoutes.includes(location.pathname);
      const hasHistory = window.history.state && window.history.state.idx > 0;

      if (hasHistory && !isRootRoute) {
        navigate(-1);
        return;
      }

      // Prioridad 4: Si no hay overlays y estamos en ruta raíz o sin historial previo, salir
      CapApp.exitApp();
    });

    return () => {
      backListenerPromise.then(handler => handler.remove()).catch(() => {});
    };
  }, [navigate, location]);

  return null;
};
