 import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { useToast } from '../../../context/ToastContext';
import { Loader2, Save, Search, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';

export const DashboardConfigPage = () => {
  const { showToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");

  useEffect(() => {
    dashboardService.getRoles().then(res => {
    
    if (res.status && res.data) {
      setRoles(res.data);
    }
  });
  }, []);

  const loadConfig = async (roleId) => {
    try {
        const response = await dashboardService.getConfig(roleId);
        
        if (response && response.data && Array.isArray(response.data.widgets)) {
        
        const sortedWidgets = [...response.data.widgets].sort((a, b) => a.orden - b.orden);
        setWidgets(sortedWidgets);
        } else {
        console.error("La estructura de los datos no es la esperada", response);
        setWidgets([]); 
        }
    } catch (error) {
        console.error("Error al cargar configuración:", error);
    }
    };

  const toggleVisible = (id) => {
    setWidgets(widgets.map(w => w.widget_id === id ? { ...w, visible: !w.visible } : w));
  };

  const handleSave = async () => {
    setSaving(true);
    await dashboardService.saveConfig(selectedRole, widgets);
    showToast("Configuración guardada correctamente", "success");
    setSaving(false);
  };

  const filteredWidgets = widgets.filter(w => 
    (w.nombre.toLowerCase().includes(search.toLowerCase()) || w.codigo.includes(search)) &&
    (filter === "Todos" || w.tipo === filter.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <header className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800 uppercase">Configuración de Widgets</h2>
        <select className="p-3 border rounded-2xl font-bold text-xs" onChange={(e) => { setSelectedRole(e.target.value); loadConfig(e.target.value); }}>
          <option value="">Seleccione un Rol...</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </header>

      {selectedRole && (
        <div className="bg-white rounded-2xl border p-6 space-y-4">
          <div className="flex gap-4">
            <input placeholder="Buscar widget..." className="flex-1 p-3 border rounded-xl text-xs" onChange={e => setSearch(e.target.value)} />
            <select onChange={e => setFilter(e.target.value)} className="p-3 border rounded-xl text-xs font-bold uppercase">
              {["Todos", "KPI", "Bar", "Pie", "Line", "Table"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {loading ? <Loader2 className="animate-spin mx-auto" /> : (
            <table className="w-full text-left">
              <thead><tr className="text-[10px] text-slate-400 uppercase"><th>Orden</th><th>Widget</th><th>Tipo</th><th>Visible</th></tr></thead>
              <tbody>
                {filteredWidgets.map((w, index) => (
                  <tr key={w.widget_id} className="border-t border-slate-50">
                    <td className="py-4"><GripVertical size={16} className="text-slate-300"/></td>
                    <td className="font-bold text-xs">{w.nombre}</td>
                    <td className="text-xs uppercase font-black text-slate-400">{w.tipo}</td>
                    <td>
                      <button onClick={() => toggleVisible(w.widget_id)}>
                        {w.visible ? <ToggleRight className="text-emerald-500" /> : <ToggleLeft className="text-slate-300" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button onClick={handleSave} disabled={saving} className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase flex justify-center gap-2">
            {saving ? <Loader2 className="animate-spin"/> : <Save size={16}/>} Guardar Cambios
          </button>
        </div>
      )}
    </div>
  );
};