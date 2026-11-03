import { useEffect, useCallback, useRef } from 'react';
import { authService } from '../features/auth/services/authService';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

export const useInactivityTimeout = (timeoutMinutes = 30) => {
  const backgroundTimeRef = useRef(null);
  const timerRef = useRef(null);

  const logout = useCallback(() => {
    authService.logout();
  }, []);

  useEffect(() => {
    const timeoutMs = timeoutMinutes * 60 * 1000;

    const resetTimer = (customDuration = timeoutMs) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(logout, customDuration);
    };

    const handleUserActivity = () => {
      resetTimer(timeoutMs);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, handleUserActivity));
    resetTimer(timeoutMs);

    // Detección del ciclo de vida en Android mediante Capacitor
    let appStateListenerPromise = null;
    if (Capacitor.isNativePlatform()) {
      appStateListenerPromise = CapApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          // La aplicación pasa a segundo plano: registrar momento exacto
          backgroundTimeRef.current = Date.now();
        } else if (backgroundTimeRef.current) {
          // Al regresar a primer plano: calcular tiempo transcurrido
          const elapsed = Date.now() - backgroundTimeRef.current;
          backgroundTimeRef.current = null;

          if (elapsed >= timeoutMs) {
            logout();
          } else {
            // Restaurar el temporizador para el tiempo restante
            const remainingTime = timeoutMs - elapsed;
            resetTimer(remainingTime);
          }
        }
      });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => window.removeEventListener(event, handleUserActivity));
      if (appStateListenerPromise) {
        appStateListenerPromise.then(handle => handle.remove()).catch(() => {});
      }
    };
  }, [timeoutMinutes, logout]);
};
