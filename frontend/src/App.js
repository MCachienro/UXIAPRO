import { useState } from 'react';
import { useExpos } from './hooks/useExpos';
import { useExpoItems } from './hooks/useExpoItems';
import { useSearchResults } from './hooks/useSearchResults';
import ExpoSearch from './components/ExpoSearch';
import ExpoCarousel from './components/ExpoCarousel';
import ItemDetailModal from './components/ItemDetailModal';
import Footer from './components/Footer';
import IdentificationForm from './components/IdentificationForm';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpoId, setSelectedExpoId] = useState('');
  const [detailItemId, setDetailItemId] = useState(null);
  const [activeItemId, setActiveItemId] = useState(null);

  const { expos } = useExpos('');
  const { results, status } = useSearchResults(searchQuery);
  const { items, itemsStatus } = useExpoItems(selectedExpoId);

  const selectedExpo = expos.find((e) => String(e.id) === selectedExpoId);

  const handleSelectExpo = (expo) => {
    setSearchQuery(expo.nom);
    setSelectedExpoId(String(expo.id));
    setActiveItemId(null);
    setDetailItemId(null);
  };

  const handleSelectItem = (item) => {
    setSearchQuery(item.nom);
    setSelectedExpoId(String(item.expo_id));
    setActiveItemId(item.id);
    setDetailItemId(item.id);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setSelectedExpoId('');
    setActiveItemId(null);
    setDetailItemId(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <main className="flex-1 w-full max-w-6xl mx-auto p-4">
        <header className="mb-5">
          <h1 className="text-4xl font-black uppercase">UXIA Expos</h1>
        </header>

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

        {selectedExpoId && <IdentificationForm selectedExpoId={selectedExpoId} />}

        {itemsStatus === 'ok' && items.length > 0 && (
          <ExpoCarousel 
            items={items} 
            selectedExpo={selectedExpo}
            onItemClick={(itemId) => {
              setActiveItemId(itemId);
              setDetailItemId(itemId);
            }}
            activeItemId={activeItemId}
          />
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