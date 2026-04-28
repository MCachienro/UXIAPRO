import React, { useState } from 'react';
import CreateItemModal from './CreateItemModal';

const ExpoDetailView = ({ expo, onBack, normalizeImageUrl }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const refreshData = async () => {
        // Aquí podrías volver a llamar a tu hook o API para traer la expo de nuevo
        // O simplemente forzar un re-render
        window.location.reload(); // O mejor aún: usa una función de estado que recargue los datos
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 animate-in fade-in">
            <button 
                onClick={onBack} 
                className="mb-6 text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
                ← Tornar a MyExpos
            </button>
            {/* BOTÓN NUEVO ITEM */}
            <button
                onClick={() => setIsModalOpen(true)}
                className='bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full font-bold transition shadow-md'
            >
                + NOU ITEM
            </button>
            
            <h2 className="text-3xl font-black text-slate-800 mb-2">{expo.nom}</h2>
            <p className="text-slate-600 mb-8">{expo.descripcio}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expo.items.map((item) => {
                    const destacadaId = item.imatge_destacada?.id;

                    const otherImages = (item.imatges || []).filter(
                        (img) => img.id !== destacadaId
                    );
                    return (
                        <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                            <img 
                                src={normalizeImageUrl(item.imatge_destacada?.url_imatge)} 
                                alt={item.nom} 
                                className="w-full h-48 object-cover bg-slate-100"
                            />
                            <div className="p-4">
                                <h4 className="font-bold text-slate-800 text-lg mb-2">{item.nom}</h4>
                                <p className="text-sm text-slate-600 mb-4 line-clamp-3">{item.descripcio}</p>

                                <div className='flex gap-2'>
                                    {otherImages.map((img) => (
                                        <img 
                                            key={img.id} 
                                            src={normalizeImageUrl(img.url_imatge)} 
                                            className="w-12 h-12 rounded object-cover border border-slate-200" 
                                            alt="Detall" 
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* MODAL DE CREACIÓN */}
            <CreateItemModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                expoId={expo.id}
                onCreated={refreshData}
            />
        </div>
    );
};

export default ExpoDetailView;