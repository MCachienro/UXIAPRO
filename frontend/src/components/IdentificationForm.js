import { useEffect, useRef, useState } from "react";
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export default function IdentificationForm({ selectedExpoId, selectedExpoName, onIntentTracked }) {
  const [idFile, setIdFile] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const [isReviewing, setIsReviewing] = useState(false); // Nuevo estado
  
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
  }, [previewUrl]);

  // 2. LA CLAVE: Conectar el stream al elemento de video cuando se activa
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  const stopCamera = () => {
   // 1. Detener el stream (tu código actual)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // 2. Limpiar el elemento de video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // 3. LIMPIEZA: Borrar los estados de la imagen para que vuelva al botón inicial
    setPreviewUrl(null);       // Esto fuerza a que desaparezca la vista previa
    setPreviewDataUrl('');     // Limpiamos también el DataURL
    setIdFile(null);           // Limpiamos el archivo
    setAiResult(null);         // Opcional: Limpiamos resultados anteriores

    // 4. Cambiar el estado de la cámara
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

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewDataUrl(typeof reader.result === 'string' ? reader.result : '');
      };
      reader.readAsDataURL(blob);

      setIsReviewing(true); // Activamos el modo revisión
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
          expoId: Number(selectedExpoId),
          expoName: selectedExpoName || null,
          intentId: response.data.intent_id || null,
          itemId: response.data.item_id || null,
          imageDataUrl: previewDataUrl || null,
          photoUrl: response.data.photo_url || null,
          responseText: message,
        });
      }
    } catch (e) {
      setAiResult("Error al processar la identificació.");
    } finally {
      setIsIdentifying(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100">Identificació</h2>

      {cameraActive ? (
        <div className="relative mt-3 min-h-[320px] overflow-hidden rounded-xl bg-black aspect-video">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <button onClick={capturePhoto} className="rounded-full bg-white px-6 py-2 font-bold shadow-lg dark:bg-slate-100">Capturar</button>
            <button onClick={stopCamera} className="rounded-full bg-red-500 px-4 py-2 font-bold text-white shadow-lg">✕</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {cameraError && <p className="text-sm font-bold text-red-600 dark:text-red-400">{cameraError}</p>}
          
          {previewUrl ? (
            <>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                <img src={previewUrl} className="w-full max-h-[60vh] aspect-video object-contain bg-black" alt="Preview" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsReviewing(false)} className="flex-1 rounded-lg border border-slate-300 p-2 font-bold text-slate-800 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">Repetir</button>
                <button 
                  onClick={handleIdentify} 
                  disabled={isIdentifying} 
                  className="flex-1 rounded-lg bg-blue-600 p-2 font-bold text-white hover:bg-blue-700 transition"
                >
                  {isIdentifying ? 'Analitzant...' : 'Enviar'}
                </button>
              </div>
            </>
          ) : (
            <button onClick={startCamera} className="w-full rounded-xl border-2 border-dashed py-6 font-bold text-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/70">
              Obrir càmera
            </button>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {aiResult && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-sm text-slate-700 dark:text-slate-200">{aiResult}</p>
        </div>
      )}
    </section>
  );
}