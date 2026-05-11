import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MultiImageUpload from './ui/MultiImageUpload';

/**
 * CreateItemModal - Activity 16: Crear nuevo item con imágenes
 * 
 * Funcionalidades:
 * - Crear item con nombre y descripción
 * - Subir múltiples imágenes
 * - Seleccionar una como destacada (automáticamente la primera)
 */
const CreateItemModal = ({ expoId, isOpen, onClose, onCreated }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ nom: '', descripcio: '' });
    const [createdItemId, setCreatedItemId] = useState(null);
    const [itemCreated, setItemCreated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [featuredImageId, setFeaturedImageId] = useState(null);

    // Paso 1: Crear el item sin imágenes
    const handleCreateItem = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.nom.trim()) {
            setError(t('createItem.errors.requiredName'));
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://uxiaweb1.ieti.site/api/rest/items/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    nom: formData.nom,
                    descripcio: formData.descripcio,
                    expo: expoId
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            setCreatedItemId(data.id);
            setItemCreated(true); // Mostrar MultiImageUpload

        } catch (err) {
            setError(err.message || t('createItem.errors.createFailed'));
            console.error('Create item error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImagesUploaded = (imageData) => {
        // 1. Obtenemos las imágenes (manejando si es array directo o el objeto con {images, featuredId})
        const rawImages = Array.isArray(imageData) ? imageData : (imageData.images || []);

        // 2. NORMALIZACIÓN: Aquí "mapeamos" los datos.
        // Esto asegura que cada objeto imagen tenga las claves que tu componente de visualización espera.
        const normalizedImages = rawImages.map(img => ({
            ...img,
            // Si tu API devuelve las rutas en campos con otros nombres (ej: 'url' o 'image'),
            // los capturamos aquí usando el operador OR (||)
            url_imatge: img.url_imatge || img.image || img.url || '',
            url_imatge_absolute: img.url_imatge_absolute || img.url_imatge || img.url || ''
        }));

        // 3. Guardamos los datos ya normalizados
        setUploadedImages(normalizedImages);
        
        // 4. Gestionamos el ID de la destacada
        setFeaturedImageId(imageData.featuredId || null);
    };

    // Botón Guardar en Paso 2
    const handleFinalize = async () => {
        if (uploadedImages.length === 0) {
            setError(t('createItem.errors.requiredImages'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Verificar si hay una imagen marcada como destacada (vía featuredImageId)
            if (!featuredImageId) {
                // Si no hay destacada, marcar la primera como destacada
                const firstImage = uploadedImages[0];
                const token = localStorage.getItem('token');
                await fetch(
                    `https://uxiaweb1.ieti.site/api/rest/items/${createdItemId}/set_featured_image/`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ image_id: firstImage.id })
                    }
                );
            }

            // Cerrar modal y recargar
            if (onCreated) onCreated();
            handleClose();

        } catch (err) {
            setError(err.message || t('createItem.errors.saveFailed'));
            console.error('Finalize error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ nom: '', descripcio: '' });
        setCreatedItemId(null);
        setItemCreated(false);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {itemCreated ? `📸 ${t('createItem.uploadImagesTitle')}` : t('createItem.createTitle')}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-2xl"
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded mb-4">
                        {error}
                    </div>
                )}

                {!itemCreated ? (
                    // PASO 1: Formulario básico del item
                    <form onSubmit={handleCreateItem} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('createItem.itemNameLabel')} *
                            </label>
                            <input
                                type="text"
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                disabled={loading}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                placeholder={t('createItem.itemNamePlaceholder')}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('createItem.descriptionLabel')}
                            </label>
                            <textarea
                                value={formData.descripcio}
                                onChange={(e) => setFormData({ ...formData, descripcio: e.target.value })}
                                disabled={loading}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                placeholder={t('createItem.descriptionPlaceholder')}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded transition font-medium"
                            >
                                {loading ? t('createItem.creating') : t('common.next')}
                            </button>
                        </div>
                    </form>
                ) : (
                    // PASO 2: Subir imágenes + botón Guardar
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded text-sm">
                            📸 {t('createItem.uploadHint')}
                        </div>
                        <MultiImageUpload
                            itemId={createdItemId}
                            initialImages={[]}
                            onImagesUpdated={handleImagesUploaded}
                        />

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={loading}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleFinalize}
                                disabled={loading || uploadedImages.length === 0}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded transition font-medium"
                            >
                                {loading ? t('common.saving') : `✓ ${t('createItem.saveItem')}`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateItemModal;