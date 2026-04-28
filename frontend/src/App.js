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
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // --- 2. ESTADO DE USUARIO ---
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('admin_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // --- 3. ESTADOS DE NAVEGACIÓN Y BÚSQUEDA ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpoId, setSelectedExpoId] = useState('');
  const [detailItemId, setDetailItemId] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // --- 4. HOOKS ---
  const { expos } = useExpos('');
  const { results, status } = useSearchResults(searchQuery);
  const { items, itemsStatus } = useExpoItems(selectedExpoId);
  const {
    consent, hasConsent, visitorId, 
    acceptCookies, rejectCookies, saveIntent,
  } = useUserTracking();

  const selectedExpo = expos.find((e) => String(e.id) === selectedExpoId);

  // --- 5. HANDLERS ---
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('admin_user');
    localStorage.removeItem('token'); // TOKEN JWT
    setIsLoginOpen(false);
  };

  const handleSelectExpo = (expo) => {
    setSearchQuery(expo.nom);
    setSelectedExpoId(String(expo.id));
  };

  // --- 6. RENDERIZADO ---
  const renderContent = () => {
    if (user) {
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    }

    if (isLoginOpen) {
      return (
        <div className="max-w-md mx-auto py-10">
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <ExpoSearch 
          searchQuery={searchQuery}
          setSearchQuery={(v) => { setSearchQuery(v); setSelectedExpoId(''); }}
          selectedExpoId={selectedExpoId}
          setSelectedExpoId={setSelectedExpoId}
          results={results}
          status={status}
          onSelectExpo={handleSelectExpo}
          onSelectItem={(item) => {
            setSearchQuery(item.nom);
            setSelectedExpoId(String(item.expo_id));
            setDetailItemId(item.id);
          }}
        />

        {selectedExpoId && (
          <div className="grid grid-cols-1 gap-8">
            <IdentificationForm 
              selectedExpoId={selectedExpoId}
              selectedExpoName={selectedExpo?.nom || ''}
              visitorId={visitorId}
              onIntentTracked={saveIntent}
            />

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
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8">
        <header className="mb-10 flex justify-between items-center">
           <h1 
             onClick={() => { setIsLoginOpen(false); setSelectedExpoId(''); setSearchQuery(''); }} 
             className="cursor-pointer text-4xl font-black uppercase tracking-tighter text-slate-800 dark:text-white"
           >
             UXIA <span className="text-indigo-600">Expos</span>
           </h1>
           
           <div className="flex gap-4 items-center">
             <button 
               onClick={() => setDarkMode(!darkMode)}
               className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-sm"
             >
               {darkMode ? '☀️' : '🌙'}
             </button>
             {!user && (
               <button 
                 onClick={() => setIsLoginOpen(!isLoginOpen)} 
                 className="px-4 py-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-sm font-bold shadow-sm hover:text-indigo-600 transition-colors"
               >
                 {isLoginOpen ? 'Tornar' : 'Login Admin'}
               </button>
             )}
           </div>
        </header>

        {renderContent()}

        {consent === null && <CookieBanner onAccept={acceptCookies} onReject={rejectCookies} />}
        
        {hasConsent && (
          <div className="mt-8 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/30 text-xs text-slate-500">
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