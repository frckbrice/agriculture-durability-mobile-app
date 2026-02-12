import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './mmkv-store';
import { IMarket, Market } from '@/interfaces/types';

// persist market using zustand persists

export const useMarketStore = create<IMarket>()(
    persist(
        (set, get) => ({
            getMarket: () => {
                return get().market ?? null
            },
            getAllMarkets: () => {
                return get().markets ?? []
            },
            saveAllMarkets: (data: Market[]) => {
                return set({
                    markets: data
                })
            },
            saveMarket: (data: Market) => {
                return set({
                    market: data
                })
            },
            clearMarket: () => ({
                market: null
            }),
            market: null,
            markets: []
        }),
        {
            name: 'market-store',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
)



