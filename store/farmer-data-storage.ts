import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { farmers_data_store, zustandStorage } from './mmkv-store';
import { IFarmerData, FarmerData, IMappingData, MappingData, } from '@/interfaces/types';
import {
    mappingInitialValues,
    metaDataInitialValue
} from '@/constants/initial-values';

// persist farmer data using zustand persists

export const useFarmerDataStore = create<IFarmerData>()(
    persist(
        (set, get) => ({
            getFarmersData: () => {
                return get().farmersData
            },
            saveFarmersData: (data: FarmerData[]) => {
                return set({ farmersData: data })
            },
            clearFarmersData: () => {
                return set({ farmersData: [] })
            },
            farmersData: [] as FarmerData[],
            farmerData: {
                project_id: '',
                project_data: {
                    metaData: metaDataInitialValue,
                    requirements: [],
                },
                uploaded: false
            },
            saveFarmerData: (data: FarmerData) => {
                return set({ farmerData: data })
            },
            clearFarmerData: () => {
                return set({
                    farmerData: {
                        project_id: '',
                        project_data: {
                            metaData: metaDataInitialValue,
                            requirements: [],
                        },
                        uploaded: false
                    }
                })
            },
            getFarmerData: () => {
                return get().farmerData ?? null
            },
            setFarmerDataAsUploaded(data) {
                // update this data object in the array of existing savec data
                const newArrayOfFarmerData = get().farmersData.map(f => f.project_data?.metaData?.farmer_ID_card_number === data.project_data?.metaData?.farmer_ID_card_number ? {
                    ...f, uploaded: true
                } : f) as FarmerData[];
                return set({ farmersData: newArrayOfFarmerData });
            },
        }),
        {
            name: 'farmer-data-store',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
)


export const useFarmerMappingDataStore = create<IMappingData>()(
    persist(
        (set, get) => ({
            getMappingsData: () => {
                return get().mappingsData
            },
            saveMappingsData: (data: MappingData[]) => {
                return set({ mappingsData: data })
            },
            clearMappingsData: () => {
                return set({ mappingsData: [] })
            },
            mappingsData: [] as MappingData[],
            mappingData: {
                project_id: '',
                project_data: mappingInitialValues,
                uploaded: false
            },
            saveMappingData: (data: MappingData) => {
                return set({ mappingData: data })
            },
            clearMappingData: (id: string) => {
                const newArrayOfAttendanceData = get().mappingsData.filter(a => a?.project_data?.farmer_ID_card_number !== id)
                return set({ mappingsData: newArrayOfAttendanceData });
            },
            getMappingData: () => {
                return get().mappingData ?? null
            },
            setMappingDataAsUploaded(data) {

                // update this data object in the array of existing savec data
                const newArrayOfFarmerData = get().mappingsData?.map(m => m?.project_data?.farmer_ID_card_number === data.project_data?.farmer_ID_card_number ? {
                    ...m,
                    uploaded: true
                } : m);
                return set({ mappingsData: newArrayOfFarmerData });
            },
        }),
        {
            name: 'farmer-data-store',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
)


