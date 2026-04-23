import axios from 'axios';
import { useState, useEffect } from 'react';

export const useExpoItems = (selectedExpoId) => {
    const [items, setItems] = useState([]);
    const [itemsStatus, setItemsStatus] = useState('idle');

    useEffect(() => {
        if (!selectedExpoId) {
            setItems([]);
            setItemsStatus('idle');
            return;
        }

        const controller = new AbortController();
        const fetchItems = async () => {
            setItemsStatus('loading');
            try {
                const response = await axios.get(`api/expos/${selectedExpoId}/items`, {
                    signal: controller.signal,
                });
                setItems(response.data);
                setItemsStatus('ok');
            } catch (error) {
                if (error.name !== 'CanceledError') {
                    setItems([]);
                    setItemsStatus('error');
                }
            }
        };

        fetchItems();
        return () => controller.abort();
    }, [selectedExpoId]);

    return { items, itemsStatus};
};