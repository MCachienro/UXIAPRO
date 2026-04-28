import React, { useState, useEffect } from 'react';

/**
 * MultiImageUpload - Componente simple para cargar múltiples imágenes
 * 
 * Props:
 * - itemId: int - ID del item
 * - onImagesUpdated: function - Callback cuando cambio de imágenes
 * - initialImages: array - Imágenes iniciales
 */
export default function MultiImageUpload({
  itemId,
  onImagesUpdated,
  initialImages = []
}) {
  const [images, setImages] = useState(initialImages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [featuredId, setFeaturedId] = useState(null);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  // Subir nuevas imágenes
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));

      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/rest/items/${itemId}/upload_images/`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const newImages = [...images, ...data.images];
      setImages(newImages);
      if (onImagesUpdated) onImagesUpdated(newImages);
      e.target.value = '';
    } catch (err) {
      setError(`Error subiendo: ${err.message}`);
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Marcar como destacada
  const handleSetFeatured = async (imageId) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/rest/items/${itemId}/set_featured_image/`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ image_id: imageId })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error ${response.status}: ${errText}`);
      }

      setFeaturedId(imageId);
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Featured error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar imagen
  const handleDelete = async (imageId) => {
    if (!window.confirm('¿Eliminar esta imagen?')) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/rest/items/${itemId}/delete_image/?image_id=${imageId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error ${response.status}: ${errText}`);
      }

      const filtered = images.filter(img => img.id !== imageId);
      setImages(filtered);
      if (featuredId === imageId) setFeaturedId(null);
      if (onImagesUpdated) onImagesUpdated(filtered);
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 dark:text-white">Imágenes del item</h4>

      {error && (
        <div className="p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-sm rounded">
          {error}
        </div>
      )}

      {/* Upload input */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleUpload}
            disabled={loading}
            className="hidden"
          />
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>📸 Selecciona imágenes o arrastra aquí</p>
            <p className="text-xs mt-1">Múltiples archivos permitidos</p>
          </div>
        </label>
      </div>

      {/* Imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map(img => (
            <div key={img.id} className="relative group">
              <img
                src={img.url_imatge_absolute || img.url_imatge}
                alt="Item"
                className="w-full h-24 object-cover rounded border border-gray-300"
              />

              {/* Badge destacada */}
              {featuredId === img.id && (
                <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded font-bold">
                  ★
                </div>
              )}

              {/* Botones (visible al hover) */}
              <div className="absolute inset-0 bg-black/50 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition">
                <button
                  onClick={() => handleSetFeatured(img.id)}
                  disabled={loading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 text-xs rounded"
                  title="Marcar destacada"
                >
                  ★
                </button>
                <button
                  onClick={() => handleDelete(img.id)}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs rounded"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">Sin imágenes</p>
      )}
    </div>
  );
}
