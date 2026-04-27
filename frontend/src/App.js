import { useState, useEffect } from 'react';
import { useExpos } from './hooks/useExpos';
import { useExpoItems } from './hooks/useExpoItems';
import ExpoSearch from './components/ExpoSearch';
import ExpoCarousel from './components/ExpoCarousel';
import ItemDetailModal from './components/ItemDetailModal';
import Footer from './components/Footer';
import IdentificationForm from './components/IdentificationForm';
import AdminDashboard from './components/AdminDashboard';

function App() {
  // --- 1. LÓGICA DE DARK MODE ---
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // --- 2. ESTADOS DE NAVEGACIÓN Y BÚSQUEDA ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpoId, setSelectedExpoId] = useState('');
  const [detailItemId, setDetailItemId] = useState(null);

  // --- 3. ESTADOS DE AUTENTICACIÓN ---
  const [user, setUser] = useState(null); 
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // --- 4. DATA FETCHING ---
  const { expos, status } = useExpos(searchQuery);
  const { items, itemsStatus } = useExpoItems(selectedExpoId);

  const selectedExpo = expos.find((e) => String(e.id) === selectedExpoId);

  // --- 5. MANEJADORES DE EVENTOS (Críticos para el Login) ---
  const handleLoginSuccess = (userData) => {
    console.log("Login exitoso para:", userData); // Para debugear en consola
    setUser(userData);
    setIsLoginOpen(false); // Cerramos el formulario al entrar
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoginOpen(false);
    setSearchQuery('');
    setSelectedExpoId('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8">
        
        {/* HEADER */}
        <header className="mb-10 flex justify-between items-center">
          <div 
            onClick={() => { if(!user) { setIsLoginOpen(false); setSelectedExpoId(''); } }} 
            className="cursor-pointer"
          >
            <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">
              UXIA <span className="text-indigo-600">Expos</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* BOTÓN DARK MODE */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-xl"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {!user && (
              <button 
                onClick={() => setIsLoginOpen(!isLoginOpen)}
                className={`px-6 py-2 rounded-xl font-bold transition-all shadow-sm border ${
                  isLoginOpen 
                  ? 'bg-slate-800 dark:bg-indigo-600 text-white' 
                  : 'bg-white dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700'
                }`}
              >
                {isLoginOpen ? 'Tornar' : 'Login Admin'}
              </button>
            )}
          </div>
        </header>

        {/* --- RENDERIZADO CONDICIONAL DE VISTAS --- */}
        
        {user ? (
          /* VISTA A: DASHBOARD (ADMIN LOGUEADO) */
          <AdminDashboard 
            user={user} 
            allExpos={expos} 
            onLogout={handleLogout} 
          />
        ) : isLoginOpen ? (
          /* VISTA B: FORMULARIO DE LOGIN (BOTÓN PULSADO) */
          <div className="max-w-md mx-auto py-10">
            <IdentificationForm 
              onLoginSuccess={handleLoginSuccess} 
              forcedAdminMode={true} 
            />
          </div>
        ) : (
          /* VISTA C: MODO PÚBLICO (BUSCADOR + CÁMARA) */
          <div className="space-y-8 animate-in fade-in duration-700">
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
                {/* IMPORTANTE: Aquí también pasamos onLoginSuccess por si el usuario 
                   usa el link de "Sóc Admin" dentro del formulario de cámara 
                */}
                <IdentificationForm 
                  selectedExpoId={selectedExpoId} 
                  onLoginSuccess={handleLoginSuccess}
                />

                {itemsStatus === 'ok' && items.length > 0 && (
                  <div className="py-4">
                    <h3 className="text-xl font-bold mb-4 dark:text-white">Contingut de l'exposició</h3>
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
              <div className="text-center py-20 opacity-40 dark:text-slate-500">
                <p className="text-lg font-medium">Busca una exposició per començar la identificació</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
      
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