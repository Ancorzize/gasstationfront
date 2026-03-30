import React, { useEffect, useState } from 'react';
import { userService } from './services/userService';
import { Plus, Edit2, Trash2, UserCheck, UserX, Shield } from 'lucide-react';
import { UserModal } from './components/UserModal';

export const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data.items);
    } catch (error) {
      console.error("Error cargando usuarios:", error.message);
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

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      try {
        const result = await userService.deleteUser(id);
        if (result.status) {
          loadUsers();
        }
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    }
  };

  const handleToggleStatus = async (userToChange) => {
    const newStatus = !userToChange.is_active;
    try {
      const result = await userService.toggleStatus(userToChange.id, newStatus);
      if (result.status) {
        setUsers(users.map(u => 
          u.id === userToChange.id ? { ...u, is_active: newStatus } : u
        ));
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic">
            ADMINISTRACIÓN DE <span className="text-yellow-500">USUARIOS</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">Gestiona el personal y sus niveles de acceso</p>
        </div>
        
        <button 
          onClick={handleCreate}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-[10px] py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-yellow-500/20 uppercase tracking-wider"
        >
          <Plus size={16} strokeWidth={3} /> Nuevo Usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Información</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Rol / Cargo</th>
              {/* CORREGIDO: Cambié <td> por <th> y quité el botón de la cabecera */}
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic text-sm">
                   Cargando base de datos...
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-sm">{user.name}</span>
                      <span className="text-xs text-slate-400">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-600 bg-zinc-100 w-fit px-3 py-1 rounded-lg">
                      <Shield size={12} className="text-zinc-400" />
                      <span className="text-[10px] font-bold uppercase tracking-tight">{user.roles[0] || 'Sin Rol'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all border mx-auto
                        ${user.is_active 
                        ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' 
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}
                    >
                      {user.is_active ? <><UserCheck size={14} /> ACTIVO</> : <><UserX size={14} /> INACTIVO</>}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={loadUsers} 
        userToEdit={currentUser} 
      />
    </div>
  );
};