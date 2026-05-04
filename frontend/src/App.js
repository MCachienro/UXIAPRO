import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import HistoryModal from './components/ui/HistoryModal';
import LanguageSelector from './components/ui/LanguageSelector';

function App() {
  const { t } = useTranslation();

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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // --- 3. HOOKS ---
  const { expos } = useExpos('');
  const { results, status } = useSearchResults(searchQuery);
  const { items, itemsStatus } = useExpoItems(selectedExpoId);
  const {
    consent, intents, 
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

  const handleSelectItem = (item) => {
    setSearchQuery(item.nom);
    setSelectedExpoId(String(item.expo_id));
    setActiveItemId(item.id);
    setDetailItemId(item.id);
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
          onSelectItem={handleSelectItem}
        />

        {selectedExpoId && (
          <div className="grid grid-cols-1 gap-8">
            {/* Formulario de IA */}
            <IdentificationForm 
              selectedExpoId={selectedExpoId}
              selectedExpoName={selectedExpo?.nom || ''}
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
        <header className="mb-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
           <h1 
             onClick={() => { setIsLoginOpen(false); setSelectedExpoId(''); setSearchQuery(''); }} 
             className="cursor-pointer text-3xl font-black uppercase tracking-tighter text-slate-800 dark:text-white sm:text-4xl"
           >
             UXIA <span className="text-indigo-600">Expos</span>
           </h1>
           
           <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
             <button 
               onClick={() => setDarkMode(!darkMode)}
               className="rounded-full border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
             >
               {darkMode ? '☀️' : '🌙'}
             </button>
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="rounded-full border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
              aria-label={t('app.openHistory')}
              title={t('app.historyTitle')}
            >
              🕒
            </button>
            <LanguageSelector />
             {!user && (
               <button onClick={() => setIsLoginOpen(!isLoginOpen)} className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm font-bold leading-none text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600">
                 {isLoginOpen ? t('app.backToWeb') : t('app.loginAdmin')}
               </button>
             )}
           </div>
        </header>

        {renderContent()}

        {/* Banner de cookies fuera de renderContent para que siempre sea accesible */}
        {consent === null && <CookieBanner onAccept={acceptCookies} onReject={rejectCookies} />}
      </main>

      <Footer />
      {detailItemId && <ItemDetailModal itemId={detailItemId} onClose={() => setDetailItemId(null)} />}
      {isHistoryOpen && (
        <HistoryModal
          intents={intents}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}
    </div>
  );
}

export default App;