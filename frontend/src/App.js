import { useState, useEffect } from 'react';
import { useExpos } from './hooks/useExpos';
import { useExpoItems } from './hooks/useExpoItems';
import ExpoSearch from './components/ExpoSearch';
import ExpoCarousel from './components/ExpoCarousel';
import ItemDetailModal from './components/ItemDetailModal';
import Footer from './components/Footer';
import IdentificationForm from './components/IdentificationForm';
import AdminDashboard from './components/AdminDashboard';
import LoginForm from './components/LoginForm';

function App() {
  // --- 1. LÓGICA DE DARK MODE ---
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // 1. Definimos la referencia al media query
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // 2. Función que sincroniza el sistema con nuestro estado
    const handleChange = (e) => {
      // Solo cambiamos si el usuario no ha forzado un tema manualmente
      if (!localStorage.getItem('theme')) {
        setDarkMode(e.matches);
      }
    };

    // 3. Añadimos el listener
    mediaQuery.addEventListener('change', handleChange);

    // 4. Aplicamos los estilos
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // 5. Limpieza
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [darkMode]);

  // --- 2. ESTADOS DE NAVEGACIÓN Y BÚSQUEDA ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpoId, setSelectedExpoId] = useState('');
  const [detailItemId, setDetailItemId] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const { expos, status } = useExpos(searchQuery);
  const { items, itemsStatus } = useExpoItems(selectedExpoId);
  const selectedExpo = expos.find((e) => String(e.id) === selectedExpoId);

  // --- Helpers de Renderizado ---
  const renderContent = () => {
    if (user) {
      return (
        <AdminDashboard
          user={user}
          onLogout={() => {
            localStorage.removeItem('token');
            setUser(null);
          }}
        />
      );
    }
    if (isLoginOpen) return <LoginForm onLoginSuccess={(u) => { setUser(u); setIsLoginOpen(false); }} />;

  return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <ExpoSearch 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedExpoId={selectedExpoId}
          setSelectedExpoId={setSelectedExpoId}
          expos={expos}
          status={status}
          onSelectExpo={(e) => { setSearchQuery(e.nom); setSelectedExpoId(String(e.id)); }}
        />
        {selectedExpoId && (
          <div className="grid grid-cols-1 gap-8">
            <IdentificationForm selectedExpoId={selectedExpoId} />
            {itemsStatus === 'ok' && items.length > 0 && (
               <ExpoCarousel items={items} selectedExpo={selectedExpo} onItemClick={setDetailItemId} />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-900  transition-colors duration-300">
      <main className="flex-1 w-full max-w-6xl mx-auto p-4">
        <header className="mb-10 flex justify-between items-center">
           {/* Logo */}
           <h1 onClick={() => {setIsLoginOpen(false); setSelectedExpoId('');}} className="cursor-pointer text-4xl font-black uppercase tracking-tighter text-slate-800">
             UXIA <span className="text-indigo-600">Expos</span>
           </h1>
            {/* BOTÓN DARK MODE */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-xl"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
           {/* Botón Admin */}
           {!user && (
             <button onClick={() => setIsLoginOpen(!isLoginOpen)} className="text-sm font-bold text-slate-600 hover:text-indigo-600">
               {isLoginOpen ? 'Tornar al Web' : 'Login Admin'}
             </button>
           )}
        </header>

        {renderContent()}
      </main>
      <Footer />
      {detailItemId && <ItemDetailModal itemId={detailItemId} onClose={() => setDetailItemId(null)} />}
    </div>
  );
}

export default App;