import React from 'react';

const ExpoDetailView = ({ expo, onBack, onEdit, normalizeImageUrl }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border dark:border-slate-800 p-8 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-center mb-8">
        {/* BOTÓN TORNAR: Vuelve al listado de MyExpos */}
        <button 
          onClick={onBack} 
          className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-2 hover:translate-x-[-4px] transition-transform"
        >
          ← Tornar a MyExpos
        </button>

        {/* BOTÓN EDITAR: Abre el modal de edición */}
        <button 
          onClick={onEdit}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
        >
          <span>✏️</span>
          <span>Editar dades expo</span>
        </button>
      </div>
      
      <div className="border-b dark:border-slate-800 pb-6 mb-8">
        <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-3">{expo.nom}</h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          {expo.descripcio || 'Aquesta exposició encara no té una descripció.'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {expo.items?.map((item) => (
          <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden border dark:border-slate-800">
            <img 
              src={normalizeImageUrl(item.imatge_destacada?.url_imatge)} 
              alt={item.nom} 
              className="w-full h-40 object-cover"
            />
            <div className="p-4 font-bold dark:text-white">{item.nom}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpoDetailView;