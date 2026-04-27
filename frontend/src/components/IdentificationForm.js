import { useEffect, useRef, useState } from "react";
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export default function IdentificationForm({ selectedExpoId, selectedExpoName, visitorId, onIntentTracked }) {
  const [idFile, setIdFile] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Refs para controlar el hardware
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // 1. Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  // 2. LA CLAVE: Conectar el stream al elemento de video cuando se activa
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    try {
      setCameraError('');
      // Limpiamos estados previos
      setAiResult(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);
    } catch (error) {
      setCameraError('No s\'ha pogut accedir a la càmera. Assegura\'t de donar permisos.');
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "captura.jpg", { type: "image/jpeg" });
      setIdFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleIdentify = async () => {
    if (!idFile || !selectedExpoId) return;
    setIsIdentifying(true);
    const formData = new FormData();
    formData.append('foto', idFile);
    formData.append('expo_id', selectedExpoId);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/identificar/`, formData);
      const message = response.data.mensaje || 'Sense resultat';
      setAiResult(message);

      if (typeof onIntentTracked === 'function') {
        onIntentTracked({
          visitorId,
          expoId: Number(selectedExpoId),
          expoName: selectedExpoName || null,
          intentId: response.data.intent_id || null,
          itemId: response.data.item_id || null,
          imageUrl: response.data.photo_url || null,
          resultText: message,
        });
      }
    } catch (e) {
      setAiResult("Error al processar la identificació.");
    } finally {
      setIsIdentifying(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Identificació</h2>

      {cameraActive ? (
        <div className="mt-3 rounded-xl bg-black overflow-hidden relative">
          <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-video object-cover" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <button onClick={capturePhoto} className="bg-white px-6 py-2 rounded-full font-bold">Capturar</button>
            <button onClick={stopCamera} className="bg-red-500 text-white px-4 py-2 rounded-full font-bold">✕</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {cameraError && <p className="text-sm text-red-600 font-bold">{cameraError}</p>}
          
          {previewUrl ? (
            <>
              <img src={previewUrl} className="w-full h-48 object-cover rounded-xl" alt="Preview" />
              <div className="flex gap-2">
                <button onClick={startCamera} className="flex-1 border p-2 rounded-lg font-bold">Repetir</button>
                <button onClick={handleIdentify} disabled={isIdentifying} className="flex-1 bg-emerald-600 text-white p-2 rounded-lg font-bold">
                  {isIdentifying ? 'Analitzant...' : 'Enviar'}
                </button>
              </div>
            </>
          ) : (
            <button onClick={startCamera} className="w-full border-2 border-dashed py-6 rounded-xl text-slate-400 font-bold hover:bg-slate-50">
              Obrir càmera
            </button>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {aiResult && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-700">{aiResult}</p>
        </div>
      )}
    </section>
  );
}