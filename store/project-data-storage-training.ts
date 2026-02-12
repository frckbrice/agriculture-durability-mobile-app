import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './mmkv-store';
import { IProjectData, Project, TTraining } from '@/interfaces/types';

// persist project data using zustand persists

export const useProjectTrainingDataStore = create<any>()(
    persist(
        (set, get) => ({
            getProjectsData: () => {
                return get().projectsData ?? [];
            },
            saveProjectsData: (data: TTraining[]) => {
                return set({ projectsData: data })
            },
            clearProjectsData: () => {
                return set({ projectsData: [] })
            },
            projectsData: [] as TTraining[],
            projectData: null,
            saveProjectData: (data: TTraining) => {
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
            name: 'project-data-store-training',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
)



