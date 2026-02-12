import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './mmkv-store';

// persist project data using zustand persists

export const useEditProjectDataStore = create<any>()(
    persist(
        (set, get) => ({
            projectData: null,
            saveProjectData: (data: any) => {
                console.log("useEditProjectDataStore ,data to be saved: ", data);
                return set({ projectData: data })
            },
            clearProjectData: () => {
                return set({ projectData: null })
            },
            getProjectData: () => {
                return get().projectData ?? null;
            }
        }),
        {
            name: 'project-data-store-edit',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
)

