import { useEffect, useRef, useState } from "react";
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export default function IdentificationForm({ selectedExpoId }) {
  const [idFile, setIdFile] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const checkCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraAvailable(false);
        return;
      }

      if (!navigator.mediaDevices.enumerateDevices) {
        setCameraAvailable(true);
        return;
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoInput = devices.some((device) => device.kind === 'videoinput');
        setCameraAvailable(hasVideoInput);
      } catch (_) {
        setCameraAvailable(true);
      }
    };

    checkCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Càmera no detectada en aquest dispositiu.');
      return;
    }

    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (_) {
      setCameraError('No s\'ha pogut activar la càmera. Revisa permisos del navegador.');
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }
      const photoFile = new File([blob], `captura-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setIdFile(photoFile);
      setPreviewUrl(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setIdFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

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
            {cameraAvailable === false && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Càmera no detectada en aquest dispositiu.
              </p>
            )}

            {cameraAvailable && !cameraActive && (
              <button
                onClick={startCamera}
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Activar càmera
              </button>
            )}

            {cameraActive && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={capturePhoto}
                    type="button"
                    className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white transition hover:bg-emerald-700"
                  >
                    Fer foto
                  </button>
                  <button
                    onClick={stopCamera}
                    type="button"
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Tancar càmera
                  </button>
                </div>
              </div>
            )}

            {cameraError && <p className="text-sm font-semibold text-red-700">{cameraError}</p>}

            <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={handleFileChange}
            className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />

            {previewUrl && (
              <img
                src={previewUrl}
                alt="Previsualitzacio captura"
                className="max-h-64 w-full rounded-lg border border-slate-200 object-contain bg-slate-50"
              />
            )}

            <button
            onClick={handleIdentify}
            disabled={isIdentifying || !idFile}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
            >
            {isIdentifying ? 'Analitzant amb MarIA 2...' : 'Enviar foto per identificar'}
            </button>
        </div>
        <canvas ref={canvasRef} className="hidden" />

        {aiResult && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase">Resultat de la IA:</p>
            <p className="mt-1 text-sm text-slate-800">{aiResult}</p>
            </div>
        )}
    </section>
  );
}