import React from 'react';

const AdminDashboard = ({ user, allExpos, onLogout }) => {
  // Filtramos para mostrar solo las exposiciones del admin logueado
  const myExpos = allExpos.filter(expo => expo.propietari === user.id);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 animate-in fade-in">
      <div className="flex justify-between items-center border-b pb-6 mb-8">
        <div>
          <h2 className="text-indigo-600 font-bold text-xs uppercase tracking-widest">Dashboard Administrador</h2>
          {/* ITEM 1: Nom de l'usuari admin */}
          <p className="text-3xl font-black text-slate-800">Hola, {user.first_name || user.username}</p>
        </div>
        
        {/* ITEM 2: Logout */}
        <button 
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg shadow-red-100"
        >
          Logout
        </button>
      </div>

      {/* ITEM 3: MyExpos */}
      <section>
        <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
          📁 MyExpos 
          <span className="text-sm font-normal text-slate-400">({myExpos.length})</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myExpos.map(expo => (
            <div key={expo.id} className="p-6 rounded-xl bg-slate-50 border-2 border-slate-100 hover:border-indigo-200 transition-colors">
              <h4 className="font-bold text-slate-800">{expo.nom}</h4>
              <p className="text-slate-500 text-sm mt-2">{expo.descripcio || 'Sense descripció'}</p>
            </div>
          ))}
          {myExpos.length === 0 && (
            <p className="text-slate-400 italic">No tens exposicions assignades.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;