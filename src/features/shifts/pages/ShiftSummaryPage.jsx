import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * ShiftSummaryPage redirige de manera transparente a la pantalla unificada de cierre (/turnos-islero/:id/cerrar).
 * Mantiene compatibilidad total con enlaces, notificaciones y marcadores existentes que apunten a /turnos-islero/:id/resumen.
 */
export const ShiftSummaryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      navigate(`/turnos-islero/${id}/cerrar`, { replace: true });
    }
  }, [id, navigate]);

  return null;
};
