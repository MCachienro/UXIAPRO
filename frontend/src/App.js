import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Footer from './components/Footer';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

function App() {
  const [status, setStatus] = useState('loading');
  const [expos, setExpos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpoId, setSelectedExpoId] = useState('');
  const [itemsStatus, setItemsStatus] = useState('idle');
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [detailItemId, setDetailItemId] = useState(null);
  const [detailStatus, setDetailStatus] = useState('idle');
  const [detailItem, setDetailItem] = useState(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);

  useEffect(() => {
    const fetchExpos = async () => {
      setStatus('loading');
      setLoading(true);
      try {
        const url = searchTerm
          ? `${API_BASE_URL}/expos/search?q=${encodeURIComponent(searchTerm)}`
          : `${API_BASE_URL}/expos`;
        const response = await axios.get(url);
        setExpos(response.data);
        setStatus('ok');
      } catch (error) {
        console.error("Error fetching expos:", error);
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    const handler = setTimeout(() => {
      fetchExpos();
    }, 300); // Debounce search

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (!selectedExpoId) {
      setItems([]);
      setItemsStatus('idle');
      setCurrentIndex(0);
      return;
    }

    const controller = new AbortController();

    const fetchExpoItems = async () => {
      setItemsStatus('loading');
      try {
        const response = await axios.get(API_BASE_URL + '/expos/' + selectedExpoId + '/items', {
          signal: controller.signal,
        });
        setItems(response.data);
        setCurrentIndex(0);
        setItemsStatus('ok');
      } catch (error) {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          return;
        }
        setItems([]);
        setItemsStatus('error');
      }
    };

    fetchExpoItems();

    return () => {
      controller.abort();
    };
  }, [selectedExpoId]);

  useEffect(() => {
    if (!detailItemId) {
      setDetailStatus('idle');
      setDetailItem(null);
      setDetailImageIndex(0);
      return;
    }

    const controller = new AbortController();

    const fetchItemDetail = async () => {
      setDetailStatus('loading');
      try {
        const response = await axios.get(API_BASE_URL + '/items/' + detailItemId, {
          signal: controller.signal,
        });
        setDetailItem(response.data);
        setDetailImageIndex(0);
        setDetailStatus('ok');
      } catch (error) {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          return;
        }
        setDetailItem(null);
        setDetailStatus('error');
      }
    };

    fetchItemDetail();

    return () => {
      controller.abort();
    };
  }, [detailItemId]);

  const selectedExpo = useMemo(
    () => expos.find((expo) => String(expo.id) === selectedExpoId) || null,
    [expos, selectedExpoId]
  );

  const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const suggestedExpos = useMemo(() => {
    if (normalizedQuery.length < 3) {
      return [];
    }
    return expos
      .filter((expo) => expo.nom.toLowerCase().includes(normalizedQuery))
      .slice(0, 8);
  }, [expos, normalizedQuery]);

  const shouldShowSuggestions = status === 'ok' && normalizedQuery.length >= 3 && selectedExpoId === '';

  const currentItem = useMemo(() => (items.length ? items[currentIndex] : null), [items, currentIndex]);

  const detailImages = detailItem?.imatges_publiques || [];
  const detailMainImage = detailImages.length > 0 ? detailImages[detailImageIndex] : detailItem?.imatge_destacada_url || null;

  const goPrev = () => {
    if (!items.length) {
      return;
    }
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goNext = () => {
    if (!items.length) {
      return;
    }
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goPrevDetailImage = () => {
    if (detailImages.length <= 1) {
      return;
    }
    setDetailImageIndex((prev) => (prev - 1 + detailImages.length) % detailImages.length);
  };

  const goNextDetailImage = () => {
    if (detailImages.length <= 1) {
      return;
    }
    setDetailImageIndex((prev) => (prev + 1) % detailImages.length);
  };

  const handleSearchChange = (event) => {
    const nextValue = event.target.value;
    setSearchQuery(nextValue);

    if (selectedExpo && nextValue !== selectedExpo.nom) {
      setSelectedExpoId('');
    }
  };

  const handleSelectExpo = (expo) => {
    setSearchQuery(expo.nom);
    setSelectedExpoId(String(expo.id));
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-gradient-to-br from-emerald-50 via-slate-100 to-orange-50 text-slate-900">
      <div className="pointer-events-none absolute -left-14 top-12 h-44 w-44 rounded-full bg-emerald-300/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-72 h-56 w-56 rounded-full bg-orange-300/50 blur-3xl" />

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-10">
        <header className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">UXIA Web</p>
          <h1 className="mt-1 text-3xl font-black uppercase leading-tight tracking-wide text-slate-900 sm:text-4xl md:text-6xl">UXIA Expos</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
            Selecciona una expo i veuras el carrousel d'items a sota.
          </p>
        </header>

        {status === 'loading' && <p className="mt-4 text-sm text-slate-600">Carregant exposicions...</p>}
        {status === 'error' && <p className="mt-4 text-sm font-semibold text-red-700">No s'ha pogut connectar amb el backend.</p>}

        {status === 'ok' && (
          <section className="relative rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-[0_14px_35px_rgba(15,23,42,0.08)] sm:p-4">
            <label className="mb-2 block text-sm font-bold text-slate-700" htmlFor="expo-search">
              Buscador d'exposicions
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-800 outline-none ring-emerald-200 transition focus:ring sm:text-sm"
              id="expo-search"
              onChange={handleSearchChange}
              placeholder="Escriu almenys 3 lletres..."
              type="text"
              value={searchQuery}
            />

            {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
              <p className="mt-2 text-xs text-slate-500">Escriu almenys 3 lletres per activar l'autocompletat.</p>
            )}

            {shouldShowSuggestions && (
              <div className="absolute left-3 right-3 z-10 mt-2 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg sm:left-4 sm:right-4">
                {suggestedExpos.length > 0 ? (
                  suggestedExpos.map((expo) => (
                    <button
                      className="block w-full border-b border-slate-100 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50"
                      key={expo.id}
                      onClick={() => handleSelectExpo(expo)}
                      type="button"
                    >
                      {expo.nom}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-slate-500">No s'han trobat exposicions amb aquest text.</p>
                )}
              </div>
            )}
          </section>
        )}

        {selectedExpoId === '' && status === 'ok' && (
          <p className="mt-4 text-sm text-slate-600">Encara no hi ha cap expo seleccionada. Busca una expo i selecciona-la del llistat.</p>
        )}

        {selectedExpoId !== '' && itemsStatus === 'loading' && <p className="mt-4 text-sm font-semibold text-slate-700">Carregant expo...</p>}

        {selectedExpoId !== '' && itemsStatus === 'error' && (
          <p className="mt-4 text-sm font-semibold text-red-700">No s'ha pogut carregar aquesta expo. Torna-ho a provar.</p>
        )}

        {selectedExpoId !== '' && itemsStatus === 'ok' && items.length === 0 && (
          <p className="mt-4 text-sm text-slate-600">Aquesta expo encara no te items per mostrar.</p>
        )}

        {selectedExpoId !== '' && itemsStatus === 'ok' && items.length > 0 && (
          <section className="mt-4 rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-[0_14px_35px_rgba(15,23,42,0.08)] sm:p-4 md:p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-800">
                {selectedExpo?.nom || 'Expo seleccionada'}
              </p>
              <p className="text-xs font-semibold text-slate-600">{currentIndex + 1} / {items.length}</p>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-emerald-50">
              {currentItem?.imatge_destacada_url && currentItem?.id ? (
                <button className="block w-full" onClick={() => setDetailItemId(currentItem.id)} type="button">
                  <img
                    className="aspect-[4/3] w-full object-contain object-center p-2 sm:aspect-video sm:p-3"
                    src={currentItem.imatge_destacada_url}
                    alt={currentItem.nom}
                    loading="eager"
                    decoding="async"
                  />
                </button>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center px-4 text-center text-sm font-semibold text-slate-500 sm:aspect-video">
                  Sense imatge destacada
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-slate-900/70 to-transparent p-2.5 sm:p-3">
                <p className="text-xs font-semibold text-white/95 md:text-sm">{currentItem?.nom || 'Sense item'}</p>
              </div>

              <button
                aria-label="Item anterior"
                className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/75 text-xl font-black text-white transition hover:bg-slate-900"
                onClick={goPrev}
                type="button"
              >
                &lt;
              </button>
              <button
                aria-label="Seguent item"
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/75 text-xl font-black text-white transition hover:bg-slate-900"
                onClick={goNext}
                type="button"
              >
                &gt;
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-600">Clica la imatge per obrir el detall.</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item, index) => (
                  <button
                    aria-label={'Anar a item ' + item.nom}
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    key={item.id}
                    onClick={() => setCurrentIndex(index)}
                    type="button"
                  >
                    <span
                      className={
                        index === currentIndex
                          ? 'block h-3 w-3 rounded-full bg-emerald-600'
                          : 'block h-3 w-3 rounded-full bg-slate-300 transition hover:bg-slate-400'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      {detailItemId !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-2 sm:p-4">
          <button aria-label="Tancar detall" className="absolute inset-0" onClick={() => setDetailItemId(null)} type="button" />

          <section className="relative z-10 my-4 w-full max-w-5xl overflow-y-auto rounded-2xl border border-emerald-100 bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.3)] max-h-[92vh] sm:p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 sm:text-lg md:text-xl">Detall de l'item</h3>
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                onClick={() => setDetailItemId(null)}
                type="button"
              >
                Tancar
              </button>
            </div>

            {detailStatus === 'loading' && <p className="text-sm font-semibold text-slate-700">Carregant item...</p>}
            {detailStatus === 'error' && <p className="text-sm font-semibold text-red-700">No s'ha pogut carregar aquest item.</p>}

            {detailStatus === 'ok' && detailItem && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-orange-50">
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
                        <div className="px-4 text-center text-sm font-semibold text-slate-500">
                          Aquest item no te imatges publiques encara.
                        </div>
                      )}
                    </div>
                  </div>

                  {detailImages.length > 1 && (
                    <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <button
                        className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 sm:text-sm"
                        onClick={goPrevDetailImage}
                        type="button"
                      >
                        Anterior
                      </button>
                      <p className="text-center text-xs font-bold text-slate-800 sm:text-sm">{detailImageIndex + 1} / {detailImages.length}</p>
                      <button
                        className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-700 sm:text-sm"
                        onClick={goNextDetailImage}
                        type="button"
                      >
                        Seguent
                      </button>
                    </div>
                  )}

                  {detailImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                      {detailImages.map((imageUrl, index) => (
                        <button
                          className={
                            index === detailImageIndex
                              ? 'aspect-video overflow-hidden rounded-lg border-2 border-emerald-400 bg-slate-100'
                              : 'aspect-video overflow-hidden rounded-lg border-2 border-transparent bg-slate-100'
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

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">Item #{detailItem.id}</p>
                  <h4 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">{detailItem.nom}</h4>
                  <p className="mt-2 text-sm text-slate-600 md:text-base">
                    {detailItem.descripcio || 'Aquest item encara no te descripcio.'}
                  </p>

                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Etiquetes</p>
                    {detailItem.etiquetes.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {detailItem.etiquetes.map((tag) => (
                          <span
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"
                            key={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">Sense etiquetes de moment.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
