import { useState } from 'react';
import { useExpos } from './hooks/useExpos';
import { useExpoItems } from './hooks/useExpoItems';
import { useItemDetail } from './hooks/useItemDetail';
import ExpoSearch from './components/ExpoSearch';
import ExpoCarousel from './components/ExpoCarousel';
import ItemDetailModal from './components/ItemDetailModal';
import Footer from './components/Footer';
import IdentificationForm from './components/IdentificationForm';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpoId, setSelectedExpoId] = useState('');
  const [detailItemId, setDetailItemId] = useState(null);

  const { expos, status } = useExpos(searchQuery);
  const { items, itemsStatus } = useExpoItems(selectedExpoId);

  const selectedExpo = expos.find((e) => String(e.id) === selectedExpoId);

  return (
    // 1. Añadimos flex flex-col para controlar la distribución vertical
    <div className="flex flex-col min-h-screen bg-slate-100">
      
      {/* 2. Añadimos flex-grow (flex-1) para que ocupe todo el espacio sobrante */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4">
        <header className="mb-5">
          <h1 className="text-4xl font-black uppercase">UXIA Expos</h1>
        </header>

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

        {selectedExpoId && <IdentificationForm selectedExpoId={selectedExpoId} />}

        {itemsStatus === 'ok' && items.length > 0 && (
          <ExpoCarousel 
            items={items} 
            selectedExpo={selectedExpo}
            onItemClick={setDetailItemId}
          />
        )}
      </main>

      {/* 3. El Footer ahora se empujará hacia abajo automáticamente gracias al mt-auto que ya tenías */}
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