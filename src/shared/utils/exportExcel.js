import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName = 'Reporte') => {
  if (!data || data.length === 0) return;

  const processedData = data.map(item => {
    const row = {};
    
    Object.keys(item).forEach(key => {
      if (['id', 'marca_id', 'categoria_producto_id', 'unidad_medida_id'].includes(key)) return;

      const columnName = key.replace(/_/g, ' ').toUpperCase();

      const value = item[key];

      if (value === null || value === undefined) {
        row[columnName] = 'N/A';
      } else if (typeof value === 'object') {
        row[columnName] = value.nombre || 'N/A';
      } else if (typeof value === 'boolean') {
        if (key === 'is_active') row[columnName] = value ? 'ACTIVO' : 'INACTIVO';
        else row[columnName] = value ? 'SÍ' : 'NO';
      } else {
        row[columnName] = value;
      }
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(processedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

  XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
};