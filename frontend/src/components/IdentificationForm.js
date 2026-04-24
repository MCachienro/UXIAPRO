import { useEffect, useRef, useState } from "react";
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export default function IdentificationForm({ selectedExpoId, onLoginSuccess, forcedAdminMode = false }) {
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

  // --- Estados para Login Admin ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Lógica de Login de Administrador
  const handleAdminLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    // Validación contra las credenciales del Seeder (admin/admin123)
    if (username === 'admin' && password === 'admin123') {
      onLoginSuccess({ 
        id: 1, 
        username: 'admin', 
        first_name: 'Admin UXIA' 
      });
    } else {
      setLoginError('Usuari o contrasenya incorrectes.');
    }
  };

  // --- Lógica de Cámara (Original) ---
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
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
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setCameraError('No s\'ha pogut accedir a la càmera.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "identificacio.jpg", { type: "image/jpeg" });
      setIdFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg');
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

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

  // Renderizado Condicional: ¿Estamos logueando a un admin o identificando un objeto?
  if (forcedAdminMode) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 animate-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">Accés Gestió</h2>
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Usuari administrador</label>
            <input 
              type="text" 
              className="w-full p-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: admin"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contrasenya</label>
            <input 
              type="password" 
              className="w-full p-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {loginError && <p className="text-red-500 text-sm font-bold text-center">{loginError}</p>}
          <button 
            type="submit" 
            className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-indigo-600 transition-colors shadow-lg"
          >
            Entrar al Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Identificació d'objectes</h2>
      
      {cameraActive ? (
        <div className="relative rounded-xl overflow-hidden bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
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
    </section>
  );
}