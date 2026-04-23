import axios from 'axios';
import { useState, useEffect } from 'react';

export const useExpos = (searchTerm) => {
    const [data, setData] = useSTate([]);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const fetchExpos = async () => {
            setStatus('loading');
            try {
                const url = searchTerm ? `/api/expos/search?q=${encodeURIComponent(searchTerm)}` : '/api/expos';
                const response = await axios.get(url);
                setData(response.data)
                setStatus('ok');
            } catch {
                setStatus('error');
            }
        };
        const handler = setTimeout(fetchExpos, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    return { expos: data, status};
};