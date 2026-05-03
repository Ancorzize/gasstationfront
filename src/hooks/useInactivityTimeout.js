import { useEffect, useCallback } from 'react';
import { authService } from '../features/auth/services/authService';

export const useInactivityTimeout = (timeoutMinutes = 30) => {
  const logout = useCallback(() => {
    authService.logout();
    window.location.reload();
  }, []);

  useEffect(() => {
    let timer;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, timeoutMs);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [timeoutMinutes, logout]);
};