import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName = 'Reporte') => {
  const worksheetData = data.map(item => ({
    'NOMBRES': item.nombre,
    'APELLIDOS': item.apellidos,
    'DOCUMENTO': item.documento || item.nit,
    'EMAIL': item.email || 'N/A',
    'TELÉFONO 1': item.telefono_uno || item.telefono,
    'TELÉFONO 2': item.telefono_dos || 'N/A',
    'DIRECCIÓN': item.direccion || 'N/A',
    'ESTADO': item.is_active ? 'ACTIVO' : 'INACTIVO',
    'FECHA REGISTRO': item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");


  XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
};