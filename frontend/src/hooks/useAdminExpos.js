import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useAdminExpos = (shouldFetch) => {
  const [adminExpos, setAdminExpos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchExpos = useCallback(async () => {
    if (!shouldFetch) return;
    setLoading(true);
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/expos');
      setAdminExpos(res.data);
    } catch (e) {
      console.error("Error fetching admin expos", e);
    } finally {
      setLoading(false);
    }
  }, [shouldFetch]);

  useEffect(() => {
    fetchExpos();
  }, [fetchExpos]);

  return { adminExpos, loading, refreshExpos: fetchExpos };
};