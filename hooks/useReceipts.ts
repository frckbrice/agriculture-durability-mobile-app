
import { useState, useCallback } from 'react';
import { Receipt } from '@/interfaces/types';
import { fetchResourceByItsID } from '@/lib/api';


export const useReceipts = () => {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReceipts = useCallback(async (marketNumber: string) => {
        setLoading(true);
        setError(null);
        try {
            const fetchedReceipts = await fetchResourceByItsID('markets', marketNumber);
            setReceipts(fetchedReceipts);
        } catch (err) {
            setError('Failed to fetch receipts. Please try again.');
            console.error('Error fetching receipts:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    return { receipts, loading, error, fetchReceipts };
};
