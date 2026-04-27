// hooks/useAdminExpos.js
import { useState, useEffect } from 'react';
import api from './api'; // Esta es la instancia que tiene el interceptor de Auth

export const useAdminExpos = (isUserLogged) => {
  const [adminExpos, setAdminExpos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isUserLogged) return;

    // Llamamos a la ruta protegida que configuramos en Django
    api.get('/api/rest/expos')
      .then(response => {
        setAdminExpos(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error cargando expos del admin:", error);
        setLoading(false);
      });
  }, [isUserLogged]);

  return { adminExpos, loading };
};