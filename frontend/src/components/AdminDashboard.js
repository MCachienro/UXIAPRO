import React from 'react';
import { useAdminExpos } from '../hooks/useAdminExpos';
import { useMemo, useState } from 'react';
import  ExpoDetailView  from '../components/ExpoDetailView';

const PREVIEW_ITEMS_LIMIT = 3;

const normalizeImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `http://127.0.0.1:8000${url.startsWith('/') ? '' : '/'}${url}`;
};

const AdminDashboard = ({ user, onLogout }) => {
  const { adminExpos, loading } = useAdminExpos(!!user);
  const [activeView, setActiveView] = useState('home');
  const [selectedExpo, setSelectedExpo] = useState(null);

  const totalItems = useMemo(
    () => adminExpos.reduce((sum, expo) => sum + (expo.items?.length || 0), 0),
    [adminExpos]
  );

  if (loading) return <div>Carregant...</div>;

  // --- VISTA DETALLE (Se usa el componente nuevo) ---
  if (selectedExpo) {
    return (
      <ExpoDetailView 
        expo={selectedExpo} 
        onBack={() => setSelectedExpo(null)} 
        normalizeImageUrl={normalizeImageUrl} // Pasamos la función helper
      />
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl animate-in fade-in dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6 dark:border-slate-700">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Dashboard Administrador</h2>
          {/* ITEM 1: Nom de l'usuari admin */}
          <p className="text-3xl font-black text-slate-800 dark:text-slate-50">Hola, {user.first_name || user.username}</p>
        </div>
        
        {/* ITEM 2: Logout */}
        <button 
          onClick={onLogout}
          className="rounded-full bg-red-500 px-6 py-2 font-bold text-white shadow-lg shadow-red-100 transition-all hover:bg-red-600 dark:shadow-red-900/30"
        >
          Logout
        </button>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveView('expos')}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          <span aria-hidden="true">📁</span>
          <span>MyExpos</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{adminExpos.length}</span>
        </button>
        {activeView === 'expos' && (
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Tornar al resum
          </button>
        )}
      </div>

      {activeView === 'home' && (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-50">Resum administrador</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Tens {adminExpos.length} exposicions assignades i {totalItems} ítems en total.</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Prem el botó MyExpos per veure i editar les teves exposicions.</p>
        </section>
      )}

      {activeView === 'expos' && (
        <section className="space-y-4">
          {adminExpos.map((expo) => {
            const previewItems = (expo.items || []).slice(0, PREVIEW_ITEMS_LIMIT);

            return (
              <article key={expo.id} className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-indigo-200 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-indigo-500/40 dark:hover:bg-slate-800" onClick={() => setSelectedExpo(expo)}>
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="text-lg font-black text-slate-800 dark:text-slate-50">{expo.nom}</h4>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
                    Estat: {expo.estat}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{expo.descripcio || 'Sense descripció'}</p>

                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Preview primers items</p>

                  {previewItems.length > 0 ? (
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {previewItems.map((item) => (
                        <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                          <img
                            src={normalizeImageUrl(item.imatge_destacada?.url_imatge)}
                            alt={item.nom}
                            className="h-24 w-full rounded object-cover bg-slate-100"
                          />
                          <p className="mt-2 truncate text-xs font-bold text-slate-700 dark:text-slate-200">{item.nom}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm italic text-slate-400 dark:text-slate-500">Aquesta expo encara no té ítems.</p>
                  )}
                </div>
              </article>
            );
          })}

          {adminExpos.length === 0 && (
            <p className="text-slate-400 italic dark:text-slate-500">No tens exposicions assignades.</p>
          )}
        </section>
      )}
    </div>
  );
};

export default AdminDashboard;