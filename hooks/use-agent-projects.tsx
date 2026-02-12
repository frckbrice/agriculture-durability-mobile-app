import { useQuery } from "@tanstack/react-query";
import { getAllProjectsAssignedToAgent } from "@/lib/api";
import { useProjectMappingDataStore } from "@/store/project-data-storage -mapping";
import { useProjectInspectionDataStore } from "@/store/project-data-storage -inspection";
import { useProjectTrainingDataStore } from "@/store/project-data-storage-training";
import { useEffect } from "react";
import { useMarketStore } from "@/store/current-market-store";

export const useAgentProjects = () => {
    const { saveProjectsData: saveMappingProjects } = useProjectMappingDataStore();
    const { saveProjectsData: saveInspectionProjects } = useProjectInspectionDataStore();
    const { saveProjectsData: saveTrainingProjects } = useProjectTrainingDataStore();
    const { saveAllMarkets } = useMarketStore();

    const {
        data: projects,
        error,
        isLoading,
        isError,
        refetch
    } = useQuery({
        queryKey: ['agent-projects'],
        queryFn: () => getAllProjectsAssignedToAgent('project_assignee/projects_per_code'),
        staleTime: 1000 * 60 * 60, // Data is considered fresh for 1 hour
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        retry(failureCount, error) {
            return failureCount < 3 || !!error;
        }
    });

    useEffect(() => {
        if (projects) {
            const { mappings, inspections, trainings, markets } = projects;

            // Update each store with its corresponding data
            if (mappings?.length) saveMappingProjects(mappings);
            if (inspections?.length) saveInspectionProjects(inspections);
            if (trainings?.length) saveTrainingProjects(trainings);
            if (markets?.length) saveAllMarkets(markets);
        }
    }, [projects]);

    return {
        inspectionsProjects: projects?.inspections,
        mappingProjects: projects?.mappings,
        trainingProjects: projects?.trainings,
        marketProjects: projects?.markets,
        isLoading,
        isError,
        error,
        refetch
    };
};