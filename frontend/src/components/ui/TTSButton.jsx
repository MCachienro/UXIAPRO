import { useState, useEffect } from 'react';

export default function TTSButton({ text, lang = 'ca'}) {
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Mapeo de idiomas para la API del navegador
    const langMap = {
        ca: 'ca-ES',
        es: 'es-ES',
        en: 'en-GB',
        fr: 'fr-FR',
    };

    useEffect(() => {
        // Si el componente se desmonta, paramos la voz
        return () => window.speechSynthesis.cancel();
    }, []);

    const handleToggleSpeech = () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        if (!text) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langMap[lang] || 'ca-ES';

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    return (
        <button
            onClick={handleToggleSpeech}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-all shadow-sm ${
                isSpeaking
                ? 'bg-emerald-500 text-white animate-pulse'
                : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
            title={isSpeaking ? "Aturar lectura": "Escoltar descripció"}
            type='button'
        >
            {isSpeaking ? (
                // Icono de Pausa / Detener
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
                </svg>
            ) : (
                // Icono de Altavoz
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 1 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
                </svg>
            )}
        </button>
    );
}