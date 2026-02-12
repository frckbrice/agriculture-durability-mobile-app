import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './mmkv-store';
import { ICompany, Company } from '@/interfaces/types';

// persist company using zustand persists

export const useCompanyStore = create<ICompany>()(
    persist(
        (set, get) => ({
            getCompany: () => {
                return get().company ?? null
            },
            saveCompany: (data: Company) => {
                return set({
                    company: data
                })
            },
            clearCompany: () => ({
                company: null
            }),
            company: null,
        }),
        {
            name: 'company-store',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
)



// persist transaction using zustand persists

export const useTransactionStore = create<{
    transaction_id: string;
    data: any;
    getTransaction: () => any;
    saveTransaction: (data: any) => void;
    clearTransaction: () => void
}>()(
    persist(
        (set, get) => ({
            getTransaction: () => {
                return get().data ?? ""
            },
            saveTransaction: (data: any) => {
                return set({
                    data
                })
            },
            clearTransaction: () => ({
                transData: ""
            }),
            transaction_id: "",
            data: null
        }),
        {
            name: 'transaction-store',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
)

