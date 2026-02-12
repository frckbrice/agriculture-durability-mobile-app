

import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { tokenCache } from '@/store/persist-token-cache';

export function usePersistentAuth() {
    const [isSignedInPersist, setIsSignedInPersist] = useState(false);
    const [isRestoring, setIsRestoring] = useState(true);

    useEffect(() => {
        const checkPersistentAuth = async () => {
            try {
                // Check for stored authentication tokens
                const sessionId = await tokenCache.getToken('clerk_session_id');
                const emailAddress = await tokenCache.getToken('email_address');

                console.log("from usePersistentAuth: ", sessionId, emailAddress);

                // Determine sign-in status based on stored tokens
                if (sessionId && emailAddress) {
                    setIsSignedInPersist(true);
                } else {
                    setIsSignedInPersist(false);
                }
            } catch (error) {
                console.error('Error checking persistent auth:', error);
                setIsSignedInPersist(false);
            } finally {
                setIsRestoring(false);
            }
        };

        checkPersistentAuth();
    }, []);

    const clearPersistentAuth = async () => {
        try {
            // Clear all stored authentication tokens
            await SecureStore.deleteItemAsync('clerk_session_id');
            await SecureStore.deleteItemAsync('email_address');
            await SecureStore.deleteItemAsync('user_code');
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('password');

            setIsSignedInPersist(false);
        } catch (error) {
            console.error('Error clearing persistent auth:', error);
        }
    };

    return {
        isSignedInPersist,
        isRestoring,
        clearPersistentAuth
    };
}