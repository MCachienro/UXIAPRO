import { useState, useRef, useEffect } from "react";
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export default function IdentificationForm({ selectedExpoId }) {
  // --- Estados para Cámara e IA ---
  const [idFile, setIdFile] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // --- Lógica de Cámara ---
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      // El video empezará a reproducirse solo gracias a autoPlay
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setCameraError('No s\'ha pogut accedir a la càmera.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Validación crítica para evitar errores de 0x0
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "identificacio.jpg", { type: "image/jpeg" });
      setIdFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg');
  };

  // --- Lógica de IA ---
  const handleIdentify = async () => {
    if (!idFile || !selectedExpoId) return;
    setIsIdentifying(true);
    const formData = new FormData();
    formData.append('foto', idFile);
    formData.append('expo_id', selectedExpoId);
    
    try {
      const res = await axios.post(`${API_BASE_URL}/identificar/`, formData);
      setAiResult(res.data.mensaje);
    } catch (e) {
      setAiResult("Error en la identificació.");
    } finally {
      setIsIdentifying(false);
    }
  };

  return (
    <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Identificació d'objectes</h2>
      
      {cameraActive ? (
        <div className="relative rounded-xl overflow-hidden bg-black">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-64 object-cover" 
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <button onClick={capturePhoto} className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold shadow-xl">Capturar</button>
            <button onClick={stopCamera} className="bg-red-500 text-white p-2 rounded-full shadow-xl">✕</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {previewUrl && <img src={previewUrl} className="w-full h-48 object-cover rounded-xl border" alt="Preview" />}
          <div className="flex gap-2">
            <button 
              onClick={startCamera} 
              className="flex-1 border-2 border-dashed border-slate-200 py-6 rounded-xl text-slate-400 font-bold hover:bg-slate-50 transition"
            >
              {previewUrl ? 'Canviar foto' : 'Obrir càmera'}
            </button>
            {previewUrl && (
              <button 
                onClick={handleIdentify} 
                disabled={isIdentifying}
                className="flex-1 bg-emerald-600 text-white rounded-xl font-bold"
              >
                {isIdentifying ? 'Analitzant...' : 'Identificar'}
              </button>
            )}
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      {aiResult && (
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-700">{aiResult}</p>
        </div>
      )}
      {cameraError && <p className="text-red-500 mt-2 text-sm">{cameraError}</p>}
    </section>
  );
}