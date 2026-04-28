import React, { useState } from 'react';

const CreateItemModal = ({ expoId, isOpen, onClose, onCreated }) => {
    const [formData, setFormData] = useState({ nom: '', descripcio: '', tags: ''});
    const [files, setFiles] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Crear el formData
            const data = new FormData();
            data.append('nom', formData.nom);
            data.append('descripcio', formData.descripcio);
            data.append('expo', expoId);

            // Añadir imágenes si existen
            if (files && files.length > 0) {
                Array.from(files).forEach(file => data.append('imatges', file));
            }

            // Logica de actualización de estado (Si hay imagenes)
            if (files && files.length > 0) {
                await fetch(`http://127.0.0.1:8000/api/expos/${expoId}/`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json'},
                    body: JSON.stringify({ estat: "ACTUALITZABLE" }),
                });
            }

            // Crear el item
            await fetch('http://127.0.0.1:8000/api/items', {
                method: 'POST',
                body: data, // FormData se encarga del content-Type multipart/form-data
            });

            onCreated(); // Recargar
            onClose(); // Cerrar modal
        } catch (error) {
            console.error("Error al crear el item: ", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in zoom-in-95">
                <h3 className="text-xl font-black text-slate-800 mb-4">Nou Item</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                    className="w-full rounded-lg border p-2" 
                    placeholder="Nom de l'item"
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    required
                />
                <textarea 
                    className="w-full rounded-lg border p-2" 
                    placeholder="Descripció"
                    onChange={(e) => setFormData({...formData, descripcio: e.target.value})}
                />
                <input 
                    type="file" multiple 
                    onChange={(e) => setFiles(e.target.files)}
                    className="w-full"
                />
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500">Cancel·lar</button>
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold">
                    {loading ? 'Creant...' : 'Guardar Item'}
                    </button>
                </div>
                </form>
            </div>
        </div>
    );
};

export default CreateItemModal;