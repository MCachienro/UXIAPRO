import { useState, useEffect } from 'react';
import { useExpos } from './hooks/useExpos';
import { useExpoItems } from './hooks/useExpoItems';
import { useSearchResults } from './hooks/useSearchResults';
import { useUserTracking } from './hooks/useUserTracking';

import ExpoSearch from './components/ExpoSearch';
import ExpoCarousel from './components/ExpoCarousel';
import ItemDetailModal from './components/ItemDetailModal';
import Footer from './components/Footer';
import IdentificationForm from './components/IdentificationForm';
import AdminDashboard from './components/AdminDashboard';
import LoginForm from './components/LoginForm';
import CookieBanner from './components/ui/CookieBanner';

function App() {
  // --- 1. LÓGICA DE DARK MODE ---
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) setDarkMode(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);

    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [darkMode]);

  // --- 2. ESTADOS DE NAVEGACIÓN Y BÚSQUEDA ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpoId, setSelectedExpoId] = useState('');
  const [detailItemId, setDetailItemId] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // --- 3. HOOKS ---
  const { expos } = useExpos('');
  const { results, status } = useSearchResults(searchQuery);
  const { items, itemsStatus } = useExpoItems(selectedExpoId);
  const {
    consent, hasConsent, visitorId, intents, 
    acceptCookies, rejectCookies, saveIntent,
  } = useUserTracking();

  const selectedExpo = expos.find((e) => String(e.id) === selectedExpoId);

  // --- 4. HANDLERS ---
  const handleSelectExpo = (expo) => {
    setSearchQuery(expo.nom);
    setSelectedExpoId(String(expo.id));
    setActiveItemId(null);
    setDetailItemId(null);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setSelectedExpoId('');
    setActiveItemId(null);
    setDetailItemId(null);
  };

  // --- 5. RENDERIZADO CONDICIONAL PRINCIPAL ---
  const renderContent = () => {
    // A. Vista Admin
    if (user) {
      return (
        <AdminDashboard
          user={user}
          onLogout={() => { localStorage.removeItem('token'); setUser(null); }}
        />
      );
    }

    // B. Vista Login
    if (isLoginOpen) {
      return <LoginForm onLoginSuccess={(u) => { setUser(u); setIsLoginOpen(false); }} />;
    }

    // C. Vista Pública
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <ExpoSearch 
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
          selectedExpoId={selectedExpoId}
          setSelectedExpoId={setSelectedExpoId}
          results={results}
          status={status}
          onSelectExpo={handleSelectExpo}
        />

        {selectedExpoId && (
          <div className="grid grid-cols-1 gap-8">
            {/* Formulario de IA */}
            <IdentificationForm 
              selectedExpoId={selectedExpoId}
              selectedExpoName={selectedExpo?.nom || ''}
              visitorId={visitorId}
              onIntentTracked={saveIntent}
            />

            {/* Carrusel de items */}
            {itemsStatus === 'ok' && items.length > 0 && (
              <ExpoCarousel 
                items={items} 
                selectedExpo={selectedExpo}
                activeItemId={activeItemId}
                onItemClick={(itemId) => {
                  setActiveItemId(itemId);
                  setDetailItemId(itemId);
                }}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
      <main className="flex-1 w-full max-w-6xl mx-auto p-4">
        <header className="mb-10 flex justify-between items-center">
           <h1 
             onClick={() => { setIsLoginOpen(false); setSelectedExpoId(''); setSearchQuery(''); }} 
             className="cursor-pointer text-4xl font-black uppercase tracking-tighter text-slate-800 dark:text-white"
           >
             UXIA <span className="text-indigo-600">Expos</span>
           </h1>
           
           <div className="flex gap-4">
             <button 
               onClick={() => setDarkMode(!darkMode)}
               className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
             >
               {darkMode ? '☀️' : '🌙'}
             </button>
             {!user && (
               <button onClick={() => setIsLoginOpen(!isLoginOpen)} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600">
                 {isLoginOpen ? 'Tornar al Web' : 'Login Admin'}
               </button>
             )}
           </div>
        </header>

        {renderContent()}

        {/* Banner de cookies fuera de renderContent para que siempre sea accesible */}
        {consent === null && <CookieBanner onAccept={acceptCookies} onReject={rejectCookies} />}
        
        {hasConsent && (
          <div className="mt-8 p-3 rounded-xl border border-slate-200 bg-white/50 dark:bg-slate-800/50 text-xs text-slate-600 dark:text-slate-400">
             <p><span className="font-bold">Visitor ID:</span> {visitorId}</p>
          </div>
        )}
      </main>

      <Footer />
      {detailItemId && <ItemDetailModal itemId={detailItemId} onClose={() => setDetailItemId(null)} />}
    </div>
  );
}

export default App;