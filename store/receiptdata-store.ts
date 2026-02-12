import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './mmkv-store';
import { IReceipt, Receipt } from '@/interfaces/types';

// persist receipt data using zustand persists

export const useReceiptDataStore = create<IReceipt>()(
    persist(
        (set, get) => ({
            getReceiptsData: () => {
                return get().receiptsData ?? []
            },
            saveReceiptsData: (data: Receipt[]) => {
                return set({
                    receiptsData: data
                })
            },
            clearReceiptsData: () => ({
                receiptsData: []
            }),
            receiptsData: [],
            receiptData: null,
            saveReceiptData: (data: Receipt) => {
                return set({
                    receiptData: data
                })
            },
            getReceiptData: () => {
                return get().receiptData ?? null
            },
            clearReceiptData: () => {
                return set({
                    receiptData: null
                })
            },
            setReceiptDataAsUploaded(data: Receipt) {
                const receipts = get().receiptsData;
                // update this data object in the array of existing savec data
                const receiptdata = receipts.map(f => f.id === data.id ? {
                    ...f, uploaded: true
                } : f) as Receipt[];

                return set({ receiptsData: receiptdata });
            }
        }),
        {
            name: 'receipt-data-store',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
)



