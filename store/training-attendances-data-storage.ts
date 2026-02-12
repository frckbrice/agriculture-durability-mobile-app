import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './mmkv-store';
import { ITrainingData, AttendenceSheet } from '@/interfaces/types';
import { AttendanceSheetInitialValues } from '@/constants/initial-values';

// persist project data using zustand persists

export const useAttendanceDataStore = create<ITrainingData>()(
    persist(
        (set, get) => ({
            getAttendancesData: () => {
                return get().attendancesData ?? [];
            },
            saveAttendancesData: (data: AttendenceSheet[]) => {
                return set({ attendancesData: data })
            },
            clearAttendancesData: () => {
                return set({ attendancesData: [] })
            },
            attendancesData: [] as AttendenceSheet[],
            AttendanceData: { ...AttendanceSheetInitialValues, training_id: '', uploaded: false },
            saveAttendanceData: (data: AttendenceSheet) => {
                return set({ AttendanceData: data })
            },
            clearAttendanceData: (id: string) => {
                // return set({ AttendanceData: { ...AttendanceSheetInitialValues, training_id: '', uploaded: false } })
                const newArrayOfAttendanceData = get().attendancesData.filter(a => a?.date !== id)
                return set({ attendancesData: newArrayOfAttendanceData });
            },
            getAttendanceData: () => {
                return get().AttendanceData ?? null;
            },
            setAttendanceDataAsUploaded(data: AttendenceSheet) {
                // update this data object in the array of existing savec data
                const newArrayOfAttendanceData = get().attendancesData.map(a => a?.date === data?.date ? {
                    ...a, uploaded: true
                } : a)
                return set({ attendancesData: newArrayOfAttendanceData });
            }
        }),
        {
            name: 'attendancesheet-data-store',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
)




