import React, { useState } from 'react';
import CreateItemModal from './CreateItemModal';

const ExpoDetailView = ({ expo, onBack, normalizeImageUrl, onEditExpo, onEditItem, onItemsUpdated }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 animate-in fade-in">
            <div className="flex items-center justify-between mb-6">
                <button 
                    onClick={onBack} 
                    className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                >
                    ← Tornar a MyExpos
                </button>
            </div>

            <h2 className="text-3xl font-black text-slate-800 mb-2">{expo.nom}</h2>
            <p className="text-slate-600 mb-8">{expo.descripcio}</p>

            {/* Botón crear item */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="mb-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
            >
                + Crear nuevo item
            </button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expo.items.map((item) => {
                    const destacadaId = item.imatge_destacada?.id;
                    const otherImages = (item.imatges || []).filter((img) => img.id !== destacadaId);

                    return (
                        <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition relative">
                            <img 
                                src={normalizeImageUrl(item.imatge_destacada?.url_imatge)} 
                                alt={item.nom} 
                                className="w-full h-48 object-cover bg-slate-100"
                            />
                            <div className="p-4">
                                <h4 className="font-bold text-slate-800 text-lg mb-2">{item.nom}</h4>
                                <p className="text-sm text-slate-600 mb-4 line-clamp-3">{item.descripcio}</p>

                                {/* Aqui deberia hacer que cuando llegue al limite de 7 imagenes, se bajen las siguientes imagenes a una nueva fila */}
                                <div className='flex gap-2 flex-wrap'>
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

                            {/* Botón editar item (arriba a la derecha) */}
                            <button
                              onClick={() => onEditItem && onEditItem(item)}
                              title="Editar item"
                              className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded shadow"
                            >
                              ✏️
                            </button>
                        </div>
                    );
                })}
            </div>
            {/* MODAL DE CREACIÓN */}
            <CreateItemModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                expoId={expo.id}
                onCreated={() => {
                    setIsModalOpen(false);
                    if (onItemsUpdated) onItemsUpdated();
                }}
            />
        </div>
    );
};

export default ExpoDetailView;