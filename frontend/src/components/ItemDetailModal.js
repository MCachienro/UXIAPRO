import { useState, useEffect } from 'react';
import { useItemDetail } from '../hooks/useItemDetail';
import TTSButton from './ui/TTSButton';
import { useTranslation } from 'react-i18next';

export default function ItemDetailModal({ itemId, onClose }) {
  const { t } = useTranslation();
  const { detailItem, detailStatus } = useItemDetail(itemId);
  const [detailImageIndex, setDetailImageIndex] = useState(0);

  // Resetear el índice de imagen al cambiar de ítem
  useEffect(() => {
    setDetailImageIndex(0);
  }, [itemId]);

  if (!itemId) return null;

  const detailImages = detailItem?.imatges_publiques || [];
  const detailMainImage = detailImages.length > 0 
    ? detailImages[detailImageIndex] 
    : detailItem?.imatge_destacada_url || null;

  const goPrevDetailImage = () => {
    if (detailImages.length <= 1) return;
    setDetailImageIndex((prev) => (prev - 1 + detailImages.length) % detailImages.length);
  };

  const goNextDetailImage = () => {
    if (detailImages.length <= 1) return;
    setDetailImageIndex((prev) => (prev + 1) % detailImages.length);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-2 sm:p-4 dark:bg-slate-950/80">
      <button aria-label="Tancar detall" className="absolute inset-0" onClick={onClose} type="button" />

      <section className="relative z-10 my-4 w-full max-w-5xl overflow-y-auto rounded-2xl border border-emerald-100 bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.3)] max-h-[92vh] sm:p-4 md:p-5 dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 sm:text-lg md:text-xl dark:text-slate-50">{t('itemDetail.title')}</h3>
          <button
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={onClose}
            type="button"
          >
            {t('itemDetail.close')}
          </button>
        </div>

        {detailStatus === 'loading' && <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('itemDetail.loading')}</p>}
        {detailStatus === 'error' && <p className="text-sm font-semibold text-red-700 dark:text-red-400">{t('itemDetail.error')}</p>}

        {detailStatus === 'ok' && detailItem && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
            {/* Lado Izquierdo: Galería */}
            <div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-orange-50 dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
                <div className="flex aspect-[4/3] min-h-[240px] items-center justify-center sm:aspect-video sm:min-h-[260px]">
                  {detailMainImage ? (
                    <img
                      className="h-full w-full object-contain object-center p-2 sm:p-3"
                      src={detailMainImage}
                      alt={detailItem.nom}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="px-4 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {t('itemDetail.noPublicImages')}
                    </div>
                  )}
                </div>
              </div>

              {/* Controles y Navegación de imágenes */}
              {detailImages.length > 1 && (
                <div className="mt-3 flex items-center justify-center gap-4">
                  <button
                    aria-label={t('itemDetail.previous')}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={goPrevDetailImage}
                    type="button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <p className="text-center text-xs font-bold text-slate-800 dark:text-slate-200 sm:text-sm">{detailImageIndex + 1} / {detailImages.length}</p>
                  <button
                    aria-label={t('itemDetail.next')}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={goNextDetailImage}
                    type="button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Grid de miniaturas */}
              {detailImages.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                  {detailImages.map((imageUrl, index) => (
                    <button
                      className={
                        index === detailImageIndex
                          ? 'aspect-video overflow-hidden rounded-lg border-2 border-emerald-400 bg-slate-100 dark:bg-slate-800'
                          : 'aspect-video overflow-hidden rounded-lg border-2 border-transparent bg-slate-100 dark:bg-slate-800'
                      }
                      key={imageUrl + index}
                      onClick={() => setDetailImageIndex(index)}
                      type="button"
                    >
                      <img
                        className="h-full w-full object-cover object-center"
                        src={imageUrl}
                        alt={detailItem.nom + ' ' + (index + 1)}
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lado Derecho: Información */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                    Item #{detailItem.id}
                  </p>
                  <h4 className="mt-1 text-xl font-black text-slate-900 dark:text-slate-50 sm:text-2xl">
                    {detailItem.nom}
                  </h4>
                </div>
                
                {/* INVOCACIÓN DEL NUEVO COMPONENTE */}
                {detailItem.descripcio && (
                  <TTSButton 
                    text={detailItem.descripcio} 
                    lang={detailItem.lang || 'ca'} 
                  />
                )}
              </div>      
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 md:text-base">
                {detailItem.descripcio || t('itemDetail.noDescription')}
              </p>

              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{t('itemDetail.tags')}</p>
                {detailItem.etiquetes && detailItem.etiquetes.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detailItem.etiquetes.map((tag) => (
                      <span
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('itemDetail.noTags')}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}