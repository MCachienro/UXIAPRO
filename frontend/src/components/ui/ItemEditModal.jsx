import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import MultiImageUpload from './MultiImageUpload';

/**
 * ItemEditModal - Componente para editar un item y sus imágenes
 * 
 * Props:
 * - isOpen: bool - Si el modal está abierto
 * - onClose: function - Callback para cerrar el modal
 * - item: object - Datos del item actual { id, nom, descripcio, imatges, imatge_destacada }
 * - onSaveSuccess: function - Callback después de guardar exitosamente
 */
export default function ItemEditModal({ isOpen, onClose, item, onSaveSuccess }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ nom: '', descripcio: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagesData, setImagesData] = useState([]);
  const [showImageSection, setShowImageSection] = useState(false);

  // Cargar datos del item cuando abra el modal
  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        nom: item.nom || '',
        descripcio: item.descripcio || '',
        expo: item.expo || ''
      });
      
      // Preparar imágenes
      const imags = (item.imatges || []).map(img => ({
        id: img.id,
        url_imatge: img.url_imatge,
        url_imatge_absolute: img.url_imatge_absolute
      }));
      setImagesData(imags);
      setError(null);
    }
  }, [item, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Guardar cambios básicos del item
  // PUT /api/rest/items/{id}/
  const handleSaveItemInfo = async () => {
    if (!formData.nom.trim()) {
      setError(t('itemEdit.errors.requiredName'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://uxiaweb1.ieti.site/api/rest/items/${item.id}/`,
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
        throw new Error(t('itemEdit.errors.saveFailed'));
      }

      const updatedItem = await response.json();

      if (onSaveSuccess) {
        onSaveSuccess(updatedItem);
      }

    } catch (err) {
      setError(err.message || t('itemEdit.errors.saveFailed'));
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Callback cuando se suben imágenes exitosamente desde MultiImageUpload
  const handleImagesUpdated = (imageData) => {
    // Soportar ambos formatos: array (compat) y { images, featuredId }
    if (Array.isArray(imageData)) {
      setImagesData(imageData);
    } else {
      setImagesData(imageData.images || []);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('itemEdit.title')}
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

        {/* Sección: Información del Item */}
        <div className="space-y-3 border-b border-gray-200 dark:border-gray-700 pb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('itemEdit.basicInfo')}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('itemEdit.nameLabel')}
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder={t('itemEdit.namePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('itemEdit.descriptionLabel')}
            </label>
            <textarea
              name="descripcio"
              value={formData.descripcio}
              onChange={handleChange}
              disabled={loading}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              placeholder={t('itemEdit.descriptionPlaceholder')}
            />
          </div>

          <button
            onClick={handleSaveItemInfo}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition font-medium"
          >
            {loading ? t('common.saving') : t('itemEdit.saveInfo')}
          </button>
        </div>

        {/* Sección: Toggle para mostrar/ocultar gestor de imágenes */}
        <button
          onClick={() => setShowImageSection(!showImageSection)}
          className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition font-medium"
        >
          {showImageSection ? t('itemEdit.hideImageManager') : t('itemEdit.showImageManager')}
        </button>

        {/* Sección: MultiImageUpload (Actividad 19) */}
        {showImageSection && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <MultiImageUpload
              itemId={item.id}
              initialImages={imagesData}
              onImagesUpdated={handleImagesUpdated}
            />
          </div>
        )}

        {/* Botones de cierre */}
        <div className="flex gap-2 justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
