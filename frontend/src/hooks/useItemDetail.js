import { useState, useEffect } from 'react';
import axios from 'axios';

export const useItemDetail = (detailItemId) => {
    const [detailItem, setDetailItem] = useState(null);
    const [detailStatus, setDetailStatus] = useState('idle');

    useEffect(() => {
        if (!detailItemId) {
            setDetailItem(null);
            setDetailStatus('idle');
            return;
        }

        const controller = new AbortController();
        const fetchDetail = async () => {
            setDetailStatus('loading');
            try {
                const response = await axios.get(`api/items/${detailItemId}`, {
                    signal: controller.signal,
                });
                // Agregar lenguaje desde la expo asociada
                const itemData = response.data;
                setDetailItem({
                    ...itemData,
                    lang: itemData.expo_lang || 'ES'
                });
                setDetailStatus('ok');
            } catch (error) {
                if (error.name !== 'CanceledError') {
                    setDetailItem(null);
                    setDetailStatus('error');
                }
            }
        };

        fetchDetail();
        return () => controller.abort();
    }, [detailItemId]);

    return { detailItem, detailStatus };
};