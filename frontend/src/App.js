import { useState } from 'react';
import { useExpos } from './hooks/useExpos';
import { useExpoItems } from './hooks/useExpoItems';
import ExpoSearch from './components/ExpoSearch';
import ExpoCarousel from './components/ExpoCarousel';
import ItemDetailModal from './components/ItemDetailModal';
import Footer from './components/Footer';
import IdentificationForm from './components/IdentificationForm';
import AdminDashboard from './components/AdminDashboard';

function App() {
  // --- Estados de Navegación y Búsqueda ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpoId, setSelectedExpoId] = useState('');
  const [detailItemId, setDetailItemId] = useState(null);

  // --- Estados de Autenticación (Sprint 2) ---
  const [user, setUser] = useState(null); // Datos del admin logueado
  const [isLoginOpen, setIsLoginOpen] = useState(false); // Controla si se ve el Form de Login

  // --- Hooks de Datos ---
  const { expos, status } = useExpos(searchQuery);
  const { items, itemsStatus } = useExpoItems(selectedExpoId);

  const selectedExpo = expos.find((e) => String(e.id) === selectedExpoId);

  // --- Manejadores de Eventos ---
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setSearchQuery('');
    setSelectedExpoId('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 font-sans text-slate-900">
      
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8">
        
        {/* HEADER */}
        <header className="mb-10 flex justify-between items-center">
          <div onClick={() => {setUser(null); setIsLoginOpen(false);}} className="cursor-pointer">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-800">
              UXIA <span className="text-indigo-600">Expos</span>
            </h1>
          </div>
          
          {!user && (
            <button 
              onClick={() => setIsLoginOpen(!isLoginOpen)}
              className={`px-6 py-2 rounded-xl font-bold transition-all shadow-sm border ${
                isLoginOpen 
                ? 'bg-slate-800 text-white border-slate-800' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isLoginOpen ? 'Tornar a Inici' : 'Login Admin'}
            </button>
          )}
        </header>

        {/* CONTENIDO DINÁMICO */}
        {user ? (
          /* 1. MODO DASHBOARD: Se muestra cuando hay un usuario logueado */
          <AdminDashboard 
            user={user} 
            allExpos={expos} 
            onLogout={handleLogout} 
          />
        ) : isLoginOpen ? (
          /* 2. MODO LOGIN: El formulario de usuario/password */
          <div className="max-w-md mx-auto py-10">
            <IdentificationForm 
              onLoginSuccess={handleLoginSuccess} 
              forcedAdminMode={true} 
            />
          </div>
        ) : (
          /* 3. MODO PÚBLICO: Buscador e Identificación por Cámara */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section>
              <ExpoSearch 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedExpoId={selectedExpoId}
                setSelectedExpoId={setSelectedExpoId}
                expos={expos}
                status={status}
                onSelectExpo={(e) => {
                  setSearchQuery(e.nom);
                  setSelectedExpoId(String(e.id));
                }}
              />
            </section>

            {selectedExpoId && (
              <section className="grid grid-cols-1 gap-8">
                {/* Formulario de Identificación IA / Cámara */}
                <IdentificationForm 
                  selectedExpoId={selectedExpoId} 
                  onLoginSuccess={handleLoginSuccess}
                />

                {/* Resultados de la Expo (Carrusel) */}
                {itemsStatus === 'ok' && items.length > 0 && (
                  <div className="py-4">
                    <h3 className="text-xl font-bold mb-4 px-2">Explora l'exposició</h3>
                    <ExpoCarousel 
                      items={items} 
                      selectedExpo={selectedExpo}
                      onItemClick={setDetailItemId}
                    />
                  </div>
                )}
              </section>
            )}

            {!selectedExpoId && (
              <div className="text-center py-20 opacity-40">
                <p className="text-lg font-medium">Selecciona una exposició per començar</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
      
      {/* MODAL DE DETALLE (Solo si se clica un ítem del carrusel) */}
      {detailItemId && (
        <ItemDetailModal 
          itemId={detailItemId} 
          onClose={() => setDetailItemId(null)} 
        />
      )}
    </div>
  );
}

export default App;