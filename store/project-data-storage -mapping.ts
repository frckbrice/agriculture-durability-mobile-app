import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './mmkv-store';
import { IProjectData, Project } from '@/interfaces/types';

// persist project data using zustand persists

export const useProjectMappingDataStore = create<IProjectData>()(
    persist(
        (set, get) => ({
            getProjectsData: () => {
                return get().projectsData ?? [];
            },
            saveProjectsData: (data: Project[]) => {
                return set({ projectsData: data })
            },
            clearProjectsData: () => {
                return set({ projectsData: [] })
            },
            projectsData: [] as Project[],
            projectData: null,
            saveProjectData: (data: Project) => {
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
            name: 'project-data-store-mapping',
            storage: createJSONStorage(() => zustandStorage),
        }
    )
)



