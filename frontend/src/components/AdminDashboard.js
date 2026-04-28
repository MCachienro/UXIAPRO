import React, { useState } from 'react';
import { useAdminExpos } from '../hooks/useAdminExpos';
import ExpoDetailView from './ExpoDetailView';
import EditExpoModal from './EditExpoModal';

const AdminDashboard = ({ user, onLogout }) => {
  const { adminExpos, loading, refreshExpos } = useAdminExpos(!!user);
  
  // Estado para saber qué expo estamos viendo (Detalle)
  const [selectedExpoId, setSelectedExpoId] = useState(null);
  // Estado para saber qué expo estamos editando (Modal)
  const [editingExpo, setEditingExpo] = useState(null);

  const currentExpo = adminExpos.find(e => e.id === selectedExpoId);

  if (loading && adminExpos.length === 0) {
    return <div className="p-12 text-center dark:text-white font-bold">Carregant...</div>;
  }

  // SI HAY EXPO SELECCIONADA -> VISTA DETALLE
  if (currentExpo) {
    return (
      <>
        <ExpoDetailView 
          expo={currentExpo} 
          onBack={() => setSelectedExpoId(null)} // TORNAR: Limpia el ID para volver al listado
          onEdit={() => setEditingExpo(currentExpo)} // EDITAR: Abre el modal
          normalizeImageUrl={(url) => url?.startsWith('http') ? url : `http://127.0.0.1:8000${url}`}
        />
        {/* Renderizamos el modal aquí también para que sea visible desde el detalle */}
        {editingExpo && (
          <EditExpoModal 
            expo={editingExpo} 
            onClose={() => setEditingExpo(null)} 
            onRefresh={refreshExpos} 
          />
        )}
      </>
    );
  }

  // SI NO -> VISTA LISTADO
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border dark:border-slate-800 shadow-xl">
      <div className="flex justify-between items-center mb-8 border-b dark:border-slate-800 pb-6">
        <h2 className="text-3xl font-black dark:text-white">Hola, {user.username}</h2>
        <button onClick={onLogout} className="bg-red-500 text-white px-6 py-2 rounded-full font-bold">Logout</button>
      </div>

      <div className="grid gap-4">
        {adminExpos.map(expo => (
          <div 
            key={expo.id} 
            onClick={() => setSelectedExpoId(expo.id)} 
            className="group relative p-6 border dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <h4 className="font-bold text-lg dark:text-white">{expo.nom}</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{expo.descripcio || 'Sense descripció'}</p>
            
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setEditingExpo(expo); 
              }}
              className="absolute top-1/2 -translate-y-1/2 right-6 p-3 opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-700 rounded-xl shadow-md border text-indigo-600"
            >
              ✏️
            </button>
          </div>
        ))}
      </div>

      {editingExpo && (
        <EditExpoModal 
          expo={editingExpo} 
          onClose={() => setEditingExpo(null)} 
          onRefresh={refreshExpos} 
        />
      )}
    </div>
  );
};

export default AdminDashboard;