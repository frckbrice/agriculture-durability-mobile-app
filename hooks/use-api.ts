
// import libs
import { useEffect, useRef, useState } from "react";


const useApiOps = <T>(fn: () => Promise<T>, resource?: string): T | T[] | any => {
    const abortController = useRef<AbortController | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async () => {
        // Cancel previous request if exists
        abortController.current?.abort();
        abortController.current = new AbortController();
        setIsLoading(true);

        fn()
            .then((res: any) => {
                console.log("\n\n from use api ops", res.data)
                setData(res.data);
            })
            .catch((err: any) => {
                if (err.name !== 'AbortError') {
                    setError(err as Error);
                    console.error('API Error:', err);
                }
            })
            .finally(() => setIsLoading(false));
    }

    useEffect(() => {
        fetchData();
        return () => {
            abortController.current?.abort();
        };
    }, []);

    // called when refresh the screen from home screen
    const refetch = () => fetchData()

    return { isLoading, data, refetch, error };
}

export default useApiOps;
