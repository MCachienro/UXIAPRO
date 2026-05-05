import React, { useState, useEffect } from "react";

const IATrainingControl = ({ expoId, initialStatus, onStatusChange }) => {
    const [status, setStatus] = useState(initialStatus || 'IDLE');
    const [loading, setLoading] = useState(false);

    // Colores y textos según el estado de la IA
    const statusConfig = {
        IDLE: { color: 'bg-slate-500', text: 'Esperant', icon: '⚪' },
        QUEUED: { color: 'bg-amber-500', text: 'A la cua', icon: '⏳' },
        RUNNING: { color: 'bg-blue-500', text: 'Entrenant...', icon: '⚙️', animate: 'animate-spin' },
        OK: { color: 'bg-emerald-500', text: 'Completat', icon: '✅' },
        ERROR: { color: 'bg-red-500', text: 'Error', icon: '❌' },
        CANCELLED: { color: 'bg-gray-700', text: 'Cancel·lat', icon: '🚫' },
        REPLACE: { color: 'bg-purple-500', text: 'Reemplaçant', icon: '🔄' },
    };

    const currentConfig = statusConfig[status] || statusConfig.IDLE;

    // Lógica de Polling: Preguntar al backend si está entrenando
    useEffect(() => {
        let interval = null;

        if (status === 'RUNNING' || status === 'QUEUED') {
            interval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/expos/${expoId}/status/`);
                    const data = await response.json();

                    setStatus(data.status);

                    // Si el estado cambia a OK o ERROR, paramos el reloj y avisamos al padre
                    if (data.status === "OK" || data.status === "ERROR") {
                        clearInterval(interval);
                        if (onStatusChange) onStatusChange(data.status);
                    }
                } catch (error) {
                    console.error("Error consultant l'estat de la IA: ", error);
                }
            }, 5000); // Cada 5 segundos
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status, expoId, onStatusChange]);

    const handleStartTraining = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/expos/${expoId}/train/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Añade aquí tu token de autenticación si es necesario
                    'Authorization': `Bearer ${localStorage.getItem('token')}` 
                }
            });

            const data = await response.json();
            setStatus(data.status);
        } catch (error) {
            setStatus('ERROR');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                <h5 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Control d'Intel·ligència Artificial
                </h5>
                <div className="mt-2 flex items-center gap-2">
                    <span className={`flex h-3 w-3 rounded-full ${currentConfig.color} ${status === 'RUNNING' ? 'animate-pulse' : ''}`}></span>
                    <span className="text-lg font-black text-slate-900 dark:text-slate-50">
                    CURRENT TRAIN: <span className="text-emerald-600 dark:text-emerald-400">{status}</span>
                    </span>
                </div>
                </div>

                <button
                onClick={handleStartTraining}
                disabled={loading || status === 'RUNNING' || status === 'QUEUED'}
                className={`relative flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-white transition-all active:scale-95 disabled:opacity-50 ${
                    status === 'OK' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
                >
                {loading ? (
                    <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    currentConfig.icon
                )}
                <span>ENTRENA IA EXPO</span>
                </button>
            </div>

            {status === 'RUNNING' && (
                <div className="mt-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div className="h-2 w-1/3 animate-[loading_2s_ease-in-out_infinite] rounded-full bg-indigo-500"></div>
                </div>
            )}

            {status === 'OK' && (
                <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                ✨ L'entrenament ha finalitzat correctament. L'exposició ja està disponible.
                </p>
            )}
        </div>
    );
};

export default IATrainingControl;