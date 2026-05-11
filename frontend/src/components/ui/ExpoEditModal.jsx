import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ExpoEditModal - Componente para editar la información de una expo
 * 
 * Props:
 * - isOpen: bool - Si el modal está abierto
 * - onClose: function - Callback para cerrar el modal
 * - expo: object - Datos de la expo actual { id, nom, descripcio }
 * - onSaveSuccess: function - Callback después de guardar exitosamente
 */
export default function ExpoEditModal({ isOpen, onClose, expo, onSaveSuccess }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ nom: '', descripcio: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar datos del expo cuando abra el modal
  useEffect(() => {
    if (expo && isOpen) {
      setFormData({
        nom: expo.nom || '',
        descripcio: expo.descripcio || ''
      });
      setError(null);
    }
  }, [expo, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Guardar cambios
  // PUT /api/rest/expos/{id}/
  const handleSave = async () => {
    if (!formData.nom.trim()) {
      setError(t('expoEdit.errors.requiredName'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://uxiaweb1.ieti.site/api/rest/expos/${expo.id}/`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      );

      if (!response.ok) {
        throw new Error(t('expoEdit.errors.saveFailed'));
      }

      const updatedExpo = await response.json();

      if (onSaveSuccess) {
        onSaveSuccess(updatedExpo);
      }

      onClose();

    } catch (err) {
      setError(err.message || t('expoEdit.errors.saveFailed'));
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('expoEdit.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-2xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('expoEdit.nameLabel')}
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder={t('expoEdit.namePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('expoEdit.descriptionLabel')}
            </label>
            <textarea
              name="descripcio"
              value={formData.descripcio}
              onChange={handleChange}
              disabled={loading}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder={t('expoEdit.descriptionPlaceholder')}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition font-medium"
          >
            {loading ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
