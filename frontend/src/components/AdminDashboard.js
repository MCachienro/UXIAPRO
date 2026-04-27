import React from 'react';
import { useAdminExpos } from '../hooks/useAdminExpos';
import { useMemo, useState } from 'react';

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

  const totalItems = useMemo(
    () => adminExpos.reduce((sum, expo) => sum + (expo.items?.length || 0), 0),
    [adminExpos]
  );

  if (loading) return <div>Carregant...</div>;

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

      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveView('expos')}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          <span aria-hidden="true">📁</span>
          <span>MyExpos</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{adminExpos.length}</span>
        </button>
        {activeView === 'expos' && (
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Tornar al resum
          </button>
        )}
      </div>

      {activeView === 'home' && (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-black text-slate-800">Resum administrador</h3>
          <p className="mt-2 text-sm text-slate-600">Tens {adminExpos.length} exposicions assignades i {totalItems} ítems en total.</p>
          <p className="mt-1 text-sm text-slate-500">Prem el botó MyExpos per veure i editar les teves exposicions.</p>
        </section>
      )}

      {activeView === 'expos' && (
        <section className="space-y-4">
          {adminExpos.map((expo) => {
            const previewItems = (expo.items || []).slice(0, PREVIEW_ITEMS_LIMIT);

            return (
              <article key={expo.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="text-lg font-black text-slate-800">{expo.nom}</h4>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    Estat: {expo.estat}
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-600">{expo.descripcio || 'Sense descripció'}</p>

                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Preview primers items</p>

                  {previewItems.length > 0 ? (
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {previewItems.map((item) => (
                        <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-2">
                          <img
                            src={normalizeImageUrl(item.imatge_destacada?.url_imatge)}
                            alt={item.nom}
                            className="h-24 w-full rounded object-cover bg-slate-100"
                          />
                          <p className="mt-2 truncate text-xs font-bold text-slate-700">{item.nom}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm italic text-slate-400">Aquesta expo encara no té ítems.</p>
                  )}
                </div>
              </article>
            );
          })}

          {adminExpos.length === 0 && (
            <p className="text-slate-400 italic">No tens exposicions assignades.</p>
          )}
        </section>
      )}
    </div>
  );
};

export default AdminDashboard;