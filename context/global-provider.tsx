import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserSession } from '../store/authStorage';
import { useUserStore } from '@/store/user-store';
import { TUser } from '@/interfaces/types';

type AppStateContextType = {
    userType: TUser | null;
    setUserType: (type: TUser | null) => void;
};

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
    const [userType, setUserType] = useState<TUser | null>(null);
    // persist the logged in user
    const { getUserType } = useUserStore();

    // Load user session when the app starts
    const loadUserSession = async () => {
        // const { userType } = await getUserSession();
        const userType = getUserType();
        setUserType((userType as TUser) || null);
    };
    useEffect(() => {
        loadUserSession();
    }, []);

    return (
        <AppStateContext.Provider value={{ userType, setUserType }}>
            {children}
        </AppStateContext.Provider>
    );
};
//cm3xmjrn5000110eqsbv1uzvr
export const useAppState = () => {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppStateProvider');
    }
    return context;
};
