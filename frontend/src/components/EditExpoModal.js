import React, { useState } from 'react';
import axios from 'axios';

const EditExpoModal = ({ expo, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    nom: expo.nom,
    descripcio: expo.descripcio || '',
    estat: expo.estat || 'esborrany'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`http://127.0.0.1:8000/api/exposicions/${expo.id}/`, formData);
      onRefresh(); // Actualiza los datos en segundo plano
      onClose();   // Cierra el modal, pero seguimos en la misma vista de detalle
    } catch (err) {
      alert("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl shadow-2xl border dark:border-slate-800">
        <h3 className="text-2xl font-black mb-6 dark:text-white">Editar dades</h3>
        <input 
          className="w-full p-4 mb-4 bg-slate-50 dark:bg-slate-800 rounded-2xl dark:text-white"
          value={formData.nom} 
          onChange={e => setFormData({...formData, nom: e.target.value})} 
          required 
        />
        <textarea 
          className="w-full p-4 mb-6 bg-slate-50 dark:bg-slate-800 rounded-2xl dark:text-white h-40"
          value={formData.descripcio} 
          onChange={e => setFormData({...formData, descripcio: e.target.value})} 
        />
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-slate-500">Cancel·lar</button>
          <button type="submit" disabled={loading} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold">
            {loading ? 'Guardant...' : 'Guardar canvis'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditExpoModal;