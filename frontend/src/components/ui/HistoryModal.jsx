export default function HistoryModal({ intents, onClose }) {
  const hasIntents = intents.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Historial de MarIA</p>
            <h2 className="text-xl font-black text-slate-900">Últims intents guardats</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Tancar
          </button>
        </div>

        <div className="max-h-[calc(85vh-74px)] overflow-y-auto p-5">
          {!hasIntents ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <p className="text-lg font-black text-slate-800">No hi ha historial encara</p>
              <p className="mt-2 text-sm text-slate-500">
                Quan enviïs una foto a MarIA, apareixerà aquí amb la imatge i la resposta.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {intents.map((intent, index) => (
                <article key={`${intent.intentId || intent.trackedAt || index}`} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[140px_1fr]">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <img
                      src={intent.imageDataUrl || intent.photoUrl || intent.imageUrl || ''}
                      alt={intent.expoName || 'Intent MarIA'}
                      className="h-36 w-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{intent.expoName || 'Expo sense nom'}</h3>
                      {intent.itemId && (
                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                          Item ID {intent.itemId}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-bold text-slate-800">Resposta:</span> {intent.responseText || 'Sense resposta'}
                    </p>

                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
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
