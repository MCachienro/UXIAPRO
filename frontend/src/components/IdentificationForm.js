import { useEffect, useRef, useState } from "react";
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export default function IdentificationForm({ selectedExpoId, selectedExpoName, onIntentTracked, onItemMatched }) {
  const { t } = useTranslation();
  const [idFile, setIdFile] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [matchedItem, setMatchedItem] = useState(null);
  const [matchConfidence, setMatchConfidence] = useState(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  
  // Refs para controlar el hardware
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const MAX_CAPTURE_WIDTH = 1280;
  const MAX_CAPTURE_HEIGHT = 1280;

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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const resetCamera = () => {
    stopCamera(); // Primero apaga el hardware
    setPreviewUrl(''); // Luego borra la foto
    setPreviewDataUrl('');
    setIdFile(null);
    setAiResult(null);
    setMatchedItem(null);
    setMatchConfidence(null);
  };

  const startCamera = async () => {
    try {
      setCameraError('');
      // Limpiamos estados previos
      setAiResult(null);
      setMatchedItem(null);
      setMatchConfidence(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);
    } catch (error) {
      setCameraError(t('identification.cameraError'));
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    const scale = Math.min(
      MAX_CAPTURE_WIDTH / video.videoWidth,
      MAX_CAPTURE_HEIGHT / video.videoHeight,
      1,
    );

    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);

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

      stopCamera();
    }, 'image/jpeg', 0.75);
  };

  const handleItemDescription = async () => {
    if (!idFile || !selectedExpoId) return;
    setIsIdentifying(true);
    const formData = new FormData();
    formData.append('foto', idFile);
    formData.append('expo_id', selectedExpoId);

    try {
      const response = await axios.post(`${API_BASE_URL}/item-description/`, formData);
      const payload = response.data || {};

      setMatchedItem(null);
      setMatchConfidence(null);
      setAiResult(payload.mensaje || payload.message || t('identification.noResult'));

      if (typeof onIntentTracked === 'function') {
        onIntentTracked({
          expoId: Number(selectedExpoId),
          expoName: selectedExpoName || null,
          intentId: payload.intent_id || null,
          itemId: payload.item_id || null,
          imageDataUrl: previewDataUrl || null,
          photoUrl: payload.photo_url || null,
          responseText: payload.mensaje || payload.message || null,
        });
      }

      if (payload.item_id && typeof onItemMatched === 'function') {
        onItemMatched(payload.item_id);
      }
    } catch (e) {
      setMatchedItem(null);
      setMatchConfidence(null);
      setAiResult(e?.response?.data?.message || e?.response?.data?.mensaje || t('identification.processingError'));
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleItemId = async () => {
    if (!idFile || !selectedExpoId) return;
    setIsIdentifying(true);
    const formData = new FormData();
    formData.append('image', idFile);
    formData.append('expo_id', selectedExpoId);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/classify/`, formData);
      const payload = response.data || {};

      if (payload.match && payload.item) {
        setMatchedItem(payload.item);
        setMatchConfidence(typeof payload.confidence === 'number' ? payload.confidence : null);
        setAiResult(payload.message || t('identification.matchFound', { item: payload.item.nom }));

        if (typeof onItemMatched === 'function') {
          onItemMatched(payload.item.id);
        }
      } else {
        setMatchedItem(null);
        setMatchConfidence(null);
        setAiResult(payload.message || t('identification.noResult'));
      }

      if (typeof onIntentTracked === 'function') {
        onIntentTracked({
          expoId: Number(selectedExpoId),
          expoName: selectedExpoName || null,
          intentId: payload.intent_id || null,
          itemId: payload.item_id || null,
          imageDataUrl: previewDataUrl || null,
          photoUrl: payload.photo_url || null,
          responseText: payload.message || null,
        });
      }
    } catch (e) {
      setMatchedItem(null);
      setMatchConfidence(null);
      setAiResult(e?.response?.data?.message || t('identification.processingError'));
    } finally {
      setIsIdentifying(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100">{t('identification.title')}</h2>
        {selectedExpoName && (
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t('identification.selectedExpo')}: {selectedExpoName}
          </p>
        )}
      </div>

      {cameraActive ? (
        <div className="relative mt-3 overflow-hidden rounded-2xl bg-black aspect-[3/4] min-h-[360px] sm:aspect-video sm:min-h-[320px] md:min-h-[420px]">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
              <button onClick={capturePhoto} className="w-full rounded-full bg-white px-5 py-3 text-sm font-bold shadow-lg transition hover:bg-slate-100 dark:bg-slate-100 sm:w-auto sm:px-6">
                {t('identification.capture')}
              </button>
              <button onClick={resetCamera} className="w-full rounded-full bg-red-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-600 sm:w-auto">
                ✕
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3 sm:gap-4">
          {cameraError && <p className="text-sm font-bold text-red-600 dark:text-red-400">{cameraError}</p>}
          
          {previewUrl ? (
            <>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                <img src={previewUrl} className="w-full max-h-[60vh] aspect-[3/4] object-contain bg-black sm:aspect-video" alt="Preview" />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button onClick={startCamera} className="rounded-xl border border-slate-300 px-4 py-3 font-bold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">{t('identification.repeat')}</button>
                <button 
                  onClick={handleItemDescription} 
                  disabled={isIdentifying} 
                  className="rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isIdentifying ? t('identification.analyzing') : t('identification.send')}
                </button>
                <button 
                  onClick={handleItemId} 
                  disabled={isIdentifying} 
                  className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
                >
                  {isIdentifying ? t('identification.analyzing') : t('identification.classify')}
                </button>
              </div>
            </>
          ) : (
            <button onClick={startCamera} className="w-full rounded-2xl border-2 border-dashed py-6 text-base font-bold text-slate-400 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/70 sm:py-7">
              {t('identification.openCamera')}
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

      {matchedItem && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-200">
                {t('identification.matchFound')}
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-50">
                {matchedItem.nom}
              </h3>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                {matchedItem.descripcio || t('itemDetail.noDescription')}
              </p>
              {typeof matchConfidence === 'number' && (
                <p className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  {t('identification.confidence')}: {Math.round(matchConfidence * 100)}%
                </p>
              )}
            </div>
            {typeof onItemMatched === 'function' && (
              <button
                type="button"
                onClick={() => onItemMatched(matchedItem.id)}
                className="rounded-full border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-slate-800"
              >
                {t('identification.viewDetails')}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}