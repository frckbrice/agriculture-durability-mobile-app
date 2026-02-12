import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
            retry: 2, // Retry failed queries twice
            refetchOnWindowFocus: false, // Avoid refetching when the app regains focus
        },
        mutations: {
            retry: 1, // Retry failed mutations once
        },
    },
});
