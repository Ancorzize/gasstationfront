export const getTodayStr = () => {
  return new Date().toLocaleDateString('sv-SE');
};

export const formatDisplayDate = (dateStr) => {
  if(!dateStr) return '---';
  // Convierte YYYY-MM-DD a algo más legible para el usuario
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toUpperCase();
};