import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './mmkv-store';
import { IFarmer, Farmer } from '@/interfaces/types';

// persist farmer using zustand persists

export const useFarmerStore = create<IFarmer>()(
    persist(
        (set, get) => ({
            getFarmers: () => {
                return get().farmers ?? []
            },
            saveFarmers: (data: Farmer[]) => {
                return set({
                    farmers: data
                })
            },
            clearFarmers: () => ({
                farmers: []
            }),
            farmers: [],
            farmer: null,

        }),
        {
            name: 'farmer-person-store',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
)



