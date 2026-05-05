import { useState, useEffect } from 'react';
import api from '../api';

export const useExpos = (searchTerm) => {
    const [data, setData] = useState([]);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        const fetchExpos = async () => {
            setStatus('loading');
            try {
                const url = searchTerm
                    ? `/expos/search?q=${encodeURIComponent(searchTerm)}`
                    : '/expos';

                const response = await api.get(url);

                setData(response.data);
                setStatus('ok');
            } catch (error) {
                console.error('Error fetching expos:', error);
                setStatus('error');
            }
        };

        const handler = setTimeout(fetchExpos, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    return { expos: data, status };
};