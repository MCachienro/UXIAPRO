import axios from 'axios';
import { useEffect, useState } from 'react';

export const useSearchResults = (searchTerm) => {
    const [results, setResults] = useState([]);
    const [status, setStatus] = useState('idle');

    useEffect(() => {
        const query = searchTerm.trim();

        if (query.length < 3) {
            setResults([]);
            setStatus('idle');
            return;
        }

        const fetchResults = async () => {
            setStatus('loading');
            try {
                const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
                setResults(response.data);
                setStatus('ok');
            } catch {
                setResults([]);
                setStatus('error');
            }
        };

        const handler = setTimeout(fetchResults, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    return { results, status };
};