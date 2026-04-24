import { useEffect, useState } from 'react';

export default function ExpoCarousel({ items, selectedExpo, onItemClick, activeItemId }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentItem = items[currentIndex];

    useEffect(() => {
        if (!items.length) {
            setCurrentIndex(0);
            return;
        }

        if (activeItemId) {
            const matchedIndex = items.findIndex((item) => item.id === activeItemId);
            if (matchedIndex >= 0) {
                setCurrentIndex(matchedIndex);
                return;
            }
        }

        setCurrentIndex(0);
    }, [activeItemId, items]);

    const goPrev = () => setCurrentIndex((prev) => (prev-1 + items.length) % items.length);
    const goNext = () => setCurrentIndex((prev) => (prev + 1) % items.length);

    return (
        <section className="mt-4 rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-[0_14px_35px_rgba(15,23,42,0.08)] sm:p-4 md:p-5">
            <div className="mb-2 flex items-center justify-between">
                <p className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-800">
                {selectedExpo?.nom || 'Expo'}
                </p>
                <p className="text-xs font-semibold text-slate-600">{currentIndex + 1} / {items.length}</p>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-emerald-50">
                {currentItem?.imatge_destacada_url ? (
                <button className="block w-full" onClick={() => onItemClick(currentItem.id)} type="button">
                    <img className="aspect-[4/3] w-full object-contain p-2 sm:aspect-video" src={currentItem.imatge_destacada_url} alt={currentItem.nom} />
                </button>
                ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-slate-500">Sense imatge</div>
                )}
                <button className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/75 text-white" onClick={goPrev}>&lt;</button>
                <button className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/75 text-white" onClick={goNext}>&gt;</button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
                {items.map((item, idx) => (
                <button key={item.id} onClick={() => setCurrentIndex(idx)} className="h-7 w-7 flex items-center justify-center rounded-full">
                    <span className={`block h-3 w-3 rounded-full ${idx === currentIndex ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                </button>
                ))}
            </div>
        </section>
    );
}