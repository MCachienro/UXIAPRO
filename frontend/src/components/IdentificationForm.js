import { useState } from "react";
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export default function IdentificationForm({ selectedExpoId }) {
  const [idFile, setIdFile] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [isIdentifying, setIsIdentifying] = useState(false);

  const handleIdentify = async () => {
    if (!idFile || !selectedExpoId) return;
    setIsIdentifying(true);
    const formData = new FormData();
    formData.append('foto', idFile);
    formData.append('expo_id', selectedExpoId);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/identificar/`, formData);
      setAiResult(response.data.mensaje);
    } catch (e) {
      setAiResult("Error al processar.");
    } finally {
      setIsIdentifying(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Identificació IDEM</h2>
        <div className="mt-3 flex flex-col gap-3">
            <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={(e) => setIdFile(e.target.files[0])}
            className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            <button
            onClick={handleIdentify}
            disabled={isIdentifying || !idFile}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
            >
            {isIdentifying ? 'Analitzant amb MarIA 2...' : 'Enviar foto per identificar'}
            </button>
        </div>

        {aiResult && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase">Resultat de la IA:</p>
            <p className="mt-1 text-sm text-slate-800">{aiResult}</p>
            </div>
        )}
    </section>
  );
}