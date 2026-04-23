import { useState } from 'react';
import { useItemDetail } from '../hooks/useItemDetail';

export default function ItemDetailModal({ itemId, onClose }) {
  const { detailItem, detailStatus } = useItemDetail(itemId);
  const [imgIdx, setImgIdx] = useState(0);
  
  if (!itemId) return null;
  const images = detailItem?.imatges_publiques || [];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4">
      <button className="absolute inset-0" onClick={onClose} />
      <section className="relative z-10 w-full max-w-5xl rounded-2xl bg-white p-5 shadow-xl max-h-[92vh] overflow-y-auto">
        <button className="absolute top-4 right-4 text-sm font-bold" onClick={onClose}>Tancar</button>
        
        {detailStatus === 'loading' && <p>Carregant...</p>}
        {detailStatus === 'ok' && detailItem && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <img src={images[imgIdx] || detailItem.imatge_destacada_url} className="w-full object-contain rounded-xl" />
              <div className="flex gap-2 mt-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`border-2 ${i === imgIdx ? 'border-emerald-500' : ''}`}>
                    <img src={img} className="w-20 h-20 object-cover" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-black">{detailItem.nom}</h4>
              <p className="text-slate-600 mt-2">{detailItem.descripcio}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}