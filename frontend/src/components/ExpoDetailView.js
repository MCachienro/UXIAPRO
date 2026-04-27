import React from 'react';

const ExpoDetailView = ({ expo, onBack, normalizeImageUrl }) => {
    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 animate-in fade-in">
            <button 
                onClick={onBack} 
                className="mb-6 text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
                ← Tornar a MyExpos
            </button>
            
            <h2 className="text-3xl font-black text-slate-800 mb-2">{expo.nom}</h2>
            <p className="text-slate-600 mb-8">{expo.descripcio}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expo.items.map((item) => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                    <img 
                    src={normalizeImageUrl(item.imatge_destacada?.url_imatge)} 
                    alt={item.nom} 
                    className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                    <h4 className="font-bold text-slate-800 text-lg mb-2">{item.nom}</h4>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">{item.descripcio}</p>
                    
                    {item.altres_imatges?.length > 0 && (
                        <div className="flex gap-2">
                        {item.altres_imatges.map((img, idx) => (
                            <img key={idx} src={normalizeImageUrl(img.url_imatge)} className="w-12 h-12 rounded object-cover border" alt="Detall" />
                        ))}
                        </div>
                    )}
                    </div>
                </div>
                ))}
            </div>
        </div>
    );
};

export default ExpoDetailView;