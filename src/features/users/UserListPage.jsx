import React, { useEffect, useState } from 'react';
import { userService } from './services/userService';
import { Plus, Edit2, Trash2, Power, Shield, Loader2, UserCircle, Warehouse } from 'lucide-react';
import { UserModal } from './components/UserModal';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../shared/components/ConfirmModal';

export const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Estados para eliminación profesional
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      if (data.items) {
        setUsers(data.items);
      }
    } catch (error) {
      showToast("Error al cargar la lista de usuarios", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const result = await userService.deleteUser(userToDelete.id);
      if (result.status) {
        showToast(result.message, "success");
        loadUsers();
        setIsConfirmOpen(false);
      }
    } catch (error) {
      showToast("No se pudo eliminar el usuario", "error");
    } finally {
      setDeleting(false);
      setUserToDelete(null);
    }
  };

  const handleToggleStatus = async (userToChange) => {
    const newStatus = !userToChange.is_active;
    try {
      const result = await userService.toggleStatus(userToChange.id, newStatus);
      if (result.status) {
        showToast(result.message, "success");
        setUsers(users.map(u => 
          u.id === userToChange.id ? { ...u, is_active: newStatus } : u
        ));
      }
    } catch (error) {
      showToast("Error al cambiar el estado", "error");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 text-left">
      {/* Header unificado con los demás módulos */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase">
            Administración de Usuarios
          </h2>
          <p className="text-slate-500 text-xs md:text-sm">Gestiona el personal, sus bodegas asignadas y niveles de acceso.</p>
        </div>
        
        <button 
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs uppercase hover:bg-black transition-all shadow-lg shadow-zinc-200"
        >
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      {/* Tabla de Usuarios con diseño responsive */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar-light">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={40} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Consultando base de datos...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px] md:min-w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Información Personal</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rol / Cargo</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bodega Asignada</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => {
                  // Manejo flexible por si el backend retorna la bodega como objeto (ej: user.bodega.nombre) o nombre directo
                  const bodegaNombre = user.bodega?.nombre || user.bodega_nombre || user.nombre_bodega || (user.bodega_id ? `Bodega #${user.bodega_id}` : null);

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <UserCircle size={20} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 text-xs uppercase">{user.name}</span>
                            <span className="text-[10px] text-slate-400 lowercase">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-zinc-600 bg-zinc-50 w-fit px-3 py-1 rounded-lg border border-zinc-100">
                          <Shield size={12} className="text-zinc-400" />
                          <span className="text-[10px] font-bold uppercase tracking-tight">
                            {user.roles && user.roles[0] ? user.roles[0] : 'Sin Rol'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-slate-600 bg-slate-50/80 w-fit px-3 py-1 rounded-lg border border-slate-100">
                          <Warehouse size={12} className="text-slate-400" />
                          <span className="text-[10px] font-bold uppercase tracking-tight">
                            {bodegaNombre || 'General / Sin Asignar'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                          user.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                          <button 
                            onClick={() => handleEdit(user)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(user)}
                            className={`p-2 rounded-xl transition-all ${
                              user.is_active ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={user.is_active ? "Desactivar" : "Activar"}
                          >
                            <Power size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(user)}
                            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={loadUsers} 
        userToEdit={currentUser} 
      />

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar a "${userToDelete?.name}"? Esta acción no se puede deshacer.`}
        loading={deleting}
      />
    </div>
  );
};