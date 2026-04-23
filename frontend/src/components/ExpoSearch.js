export default function ExpoSearch({ searchQuery, setSearchQuery, selectedExpoId, setSelectedExpoId, expos, status, onSelectExpo }) {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const shouldShowSuggestions = status === 'ok' && normalizedQuery.length >= 3 && selectedExpoId === '';

    const suggestedExpos = expos.filter((expo) => 
        expos.nom.toLowerCase().includes(normalizedQuery)
    ).slice(0, 8);

    return (
        <section className="relative rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-[0_14px_35px_rgba(15,23,42,0.08)] sm:p-4">
            <label className="mb-2 block text-sm font-bold text-slate-700" htmlFor="expo-search">
                Buscador d'exposicions
            </label>
            <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-800 outline-none ring-emerald-200 transition focus:ring sm:text-sm"
                id="expo-search"
                value={searchQuery}
                onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedExpoId) setSelectedExpoId('');
                }}
                placeholder="Escriu almenys 3 lletres..."
                type="text"
            />
            {shouldShowSuggestions && (
                <div className="absolute left-3 right-3 z-10 mt-2 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg sm:left-4 sm:right-4">
                {suggestedExpos.length > 0 ? (
                    suggestedExpos.map((expo) => (
                    <button
                        key={expo.id}
                        className="block w-full border-b border-slate-100 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50"
                        onClick={() => onSelectExpo(expo)}
                    >
                        {expo.nom}
                    </button>
                    ))
                ) : (
                    <p className="px-3 py-2 text-sm text-slate-500">No s'han trobat exposicions.</p>
                )}
                </div>
            )}
        </section>
    );
}