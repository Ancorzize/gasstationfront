import { useEffect, useCallback } from 'react';
import { authService } from '../features/auth/services/authService';

export const useInactivityTimeout = (timeoutMinutes = 30) => {
  console.log('pasoo');
  const logout = useCallback(() => {
    console.log('pasoo22');
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