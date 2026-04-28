export default function ExpoSearch({ searchQuery, setSearchQuery, selectedExpoId, setSelectedExpoId, results, status, onSelectExpo, onSelectItem }) {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const shouldShowSuggestions = status === 'ok' && normalizedQuery.length >= 3 && selectedExpoId === '';

    const suggestedResults = results.slice(0, 12);

    const renderTypeBadge = (tipus) => (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] ${tipus === 'EXPO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {tipus === 'EXPO' ? 'Expo' : 'Item'}
        </span>
    );

    return (
        <section className="relative rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-[0_14px_35px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 sm:p-4">
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200" htmlFor="expo-search">
                Buscador d'exposicions
            </label>
            <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-800 outline-none ring-emerald-200 transition placeholder:text-slate-400 focus:ring dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 sm:text-sm"
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
                <div className="absolute left-3 right-3 z-10 mt-2 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:left-4 sm:right-4">
                {suggestedResults.length > 0 ? (
                    suggestedResults.map((result) => (
                    <button
                        key={`${result.tipus}-${result.id}`}
                        className="block w-full border-b border-slate-100 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800"
                        onClick={() => (result.tipus === 'EXPO' ? onSelectExpo(result) : onSelectItem(result))}
                        type="button"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900 dark:text-slate-50">{result.nom}</p>
                                {result.tipus === 'ITEM' && result.expo_nom && (
                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">Expo: {result.expo_nom}</p>
                                )}
                            </div>
                            {renderTypeBadge(result.tipus)}
                        </div>
                        {result.tipus === 'ITEM' && result.imatge_destacada_url && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Té imatge destacada</p>
                        )}
                    </button>
                    ))
                ) : (
                    <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No s'han trobat resultats.</p>
                )}
                </div>
            )}
        </section>
    );
}
