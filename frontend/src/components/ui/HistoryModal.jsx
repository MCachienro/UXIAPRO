export default function HistoryModal({ intents, onClose }) {
  const hasIntents = intents.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm dark:bg-slate-950/80">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Historial de MarIA</p>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Últims intents guardats</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Tancar
          </button>
        </div>

        <div className="max-h-[calc(85vh-74px)] overflow-y-auto p-5">
          {!hasIntents ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-lg font-black text-slate-800 dark:text-white">No hi ha historial encara</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Quan enviïs una foto a MarIA, apareixerà aquí amb la imatge i la resposta.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {intents.map((intent, index) => (
                <article key={`${intent.intentId || intent.trackedAt || index}`} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[160px_1fr] dark:border-slate-700 dark:bg-slate-800/60">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <img
                      src={intent.imageDataUrl || intent.photoUrl || intent.imageUrl || ''}
                      alt={intent.expoName || 'Intent MarIA'}
                      className="h-40 w-full object-cover sm:h-full"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">{intent.expoName || 'Expo sense nom'}</h3>
                      {intent.itemId && (
                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                          Item ID {intent.itemId}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-800 dark:text-slate-100">Resposta:</span> {intent.responseText || 'Sense resposta'}
                    </p>

                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                      {intent.trackedAt ? new Date(intent.trackedAt).toLocaleString('ca-ES') : 'Sense data'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
