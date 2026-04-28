export default function CookieBanner({ onAccept, onReject }) {
  return (
    <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
      <p className="font-bold uppercase tracking-wide">Cookies i seguiment local</p>
      <p className="mt-1">
        Fem servir emmagatzematge local sense caducitat per guardar l'historial dels intents de MarIA (foto enviada + resposta IA + item_id).
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAccept}
          className="rounded-lg bg-amber-600 px-4 py-2 font-bold text-white transition hover:bg-amber-700"
        >
          Acceptar
        </button>
        <button
          type="button"
          onClick={onReject}
          className="rounded-lg border border-amber-300 bg-white px-4 py-2 font-bold text-amber-800 transition hover:bg-amber-100"
        >
          Rebutjar
        </button>
      </div>
    </section>
  );
}
