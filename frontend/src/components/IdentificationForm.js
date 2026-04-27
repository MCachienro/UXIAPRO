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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const attachStream = async () => {
      if (!cameraActive || !videoRef.current || !streamRef.current) {
        return;
      }
      videoRef.current.srcObject = streamRef.current;
      try {
        await videoRef.current.play();
      } catch (_) {
        setCameraError('La càmera s\'ha obert, pero el video no s\'ha pogut reproduir.');
      }
    };

    attachStream();
  }, [cameraActive]);

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

    if (!window.isSecureContext) {
      setCameraError('La càmera requereix connexió segura (HTTPS).');
      return;
    }

    try {
      setCameraError('');
      stopCamera();
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch (_) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraActive(true);
    } catch (error) {
      if (error && error.name === 'NotFoundError') {
        setCameraError('No s\'ha detectat cap càmera en aquest dispositiu.');
      } else if (error && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {
        setCameraError('Permís de càmera denegat. Activa\'l al navegador i torna-ho a provar.');
      } else if (error && error.name === 'NotReadableError') {
        setCameraError('La càmera està ocupada per una altra app o pestanya.');
      } else {
        setCameraError(`No s'ha pogut activar la càmera (${error?.name || 'Error'}).`);
      }
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
      setAiResult("Error al processar.");
    } finally {
      setIsIdentifying(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Identificació IDEM</h2>

      {/* 1. VISTA DE CÁMARA ACTIVA */}
      {cameraActive ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg" />
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
      ) : (
        /* 2. VISTA DE ESTADO IDLE / PREVISUALIZACIÓN (Cuando la cámara está cerrada) */
        <div className="mt-3 flex flex-col gap-3">
          {cameraError && <p className="text-sm font-semibold text-red-700">{cameraError}</p>}

          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Previsualitzacio captura"
                className="max-h-64 w-full rounded-lg border border-slate-200 object-contain bg-slate-50"
              />
              <div className="flex gap-2">
                <button
                  onClick={startCamera}
                  type="button"
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Fer una altra foto
                </button>
                <button
                  onClick={handleIdentify}
                  disabled={isIdentifying || !idFile}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
                >
                  {isIdentifying ? 'Analitzant...' : 'Enviar foto'}
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={startCamera}
              type="button"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Obrir càmera
            </button>
          )}
        </div>
      )}

      {/* Elementos ocultos o resultados */}
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