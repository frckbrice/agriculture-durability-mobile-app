import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './mmkv-store';
import { IUser, TUser } from '@/interfaces/types';

export const useUserStore = create<IUser>()(
    persist(
        (set, get) => ({
            clearUser: () => {
                set({ userType: { role: null } });
            },
            userType: { role: null },
            saveUser: (user: TUser) => {
                set(() => ({ userType: user }));
            },
            getUserType: () => {
                return get().userType
            }
        }), {
        name: 'user-store',
        storage: createJSONStorage(() => zustandStorage),
    })
)
