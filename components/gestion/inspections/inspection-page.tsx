import { View, Text, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList } from 'react-native';
import { useNetInfo } from "@react-native-community/netinfo";

// Local imports
import { Colors } from "../../../constants";
import EmptyState from "../../../components/empty-state";
import { fetchResourceByItsID, getAllInspectionsProjects } from "../../../lib/api";
import useApiOps from "../../../hooks/use-api";
import { Project, TFetchType } from '@/interfaces/types';
import SettingsItem from '@/components/setting-items';
import { useProjectInspectionDataStore } from '@/store/project-data-storage -inspection';
import { ProjectItem } from './project-items';
import { ListHeader } from './list-header';
import { useCompanyStore } from '@/store/current-company-store';
import { useAgentProjects } from '@/hooks/use-agent-projects';




const LoadingSpinner = React.memo(() => (
    <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
    </View>
));

// inspection page from index page on inpection tab
export default function InspectionPage() {
    const [refreshing, setRefreshing] = useState(false);
    const netInfo = useNetInfo();

    const mounted = useRef(false);
    const projectsRef = useRef<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inspectiondata, setInspectiondata] = useState<Project[]>([]);

    const {
        inspectionsProjects: projects
    } = useAgentProjects();


    const {
        saveProjectsData,
        getProjectsData,
    } = useProjectInspectionDataStore();

    const { saveCompany } = useCompanyStore();

    // Load offline data
    const loadOfflineData = useCallback(async () => {
        try {
            setError(null);
            const offlineProjects = getProjectsData();
            if (Array.isArray(offlineProjects) && offlineProjects.length > 0) {
                setInspectiondata(offlineProjects);
            } else {
                setInspectiondata([]);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error loading offline data';
            console.error('Error loading offline data:', errorMessage);
            setError(errorMessage);
        }
    }, [getProjectsData]);

    const processCompanyData = useCallback(async (companyId: string) => {
        if (!companyId) return;

        try {
            const company = await fetchResourceByItsID('companies', companyId);

            if (company?.data) {
                console.log("inspection project company: ", company?.data);
                saveCompany({
                    company_id: company.data.id,
                    company_name: company.data.name,
                    company_bucket: company.data.company_bucket,
                    company_logo: company.data.logo,
                    status: company.data.status
                });
            }
        } catch (error) {
            console.error('Error processing company data:', error);
        }
    }, [saveCompany]);

    const fetchAndProcessProjects = useCallback(async () => {
        try {
            setError(null);

            // let response: any[] = [];
            // // check first is there're already a projects set from the select-chapter componnent
            // if (getProjectsData().length)
            //     response = getProjectsData();
            // else
            //     response = await getAllInspectionsProjects();

            // // Check if response exists and is an array
            // if (!response) {
            //     throw new Error('No data received from server');
            // }

            // const fetchedProjects = Array.isArray(response) ? response : [];
            const fetchedProjects = Array.isArray(projects) ? projects : [];

            console.log("inspection project before check: ", fetchedProjects)

            if (fetchedProjects?.length > 0) {
                console.log("inspection project after check: ", fetchedProjects);
                const onlyInspectionData = fetchedProjects?.filter((project: Project) =>
                    project.type?.toString().toLowerCase().includes('_inspection')
                );
                setInspectiondata(onlyInspectionData);   // we update the inspection data with this new project
                saveProjectsData(onlyInspectionData);  // we save this project in the available list of projects

                // Process company data for the first project
                if (fetchedProjects[0]?.company_id) {
                    await processCompanyData(fetchedProjects[0].company_id);
                }
            } else {
                setInspectiondata([]);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error fetching projects:', errorMessage);
            setError(errorMessage);
        }
    }, [processCompanyData, saveProjectsData]);

    // Handle offline mode with proper dependency array
    useEffect(() => {
        mounted.current = true;

        const initializeData = async () => {

            try {
                if (netInfo.isConnected) {
                    await fetchAndProcessProjects();
                } else {
                    await loadOfflineData();
                }
            } finally {
                if (mounted.current) {
                    setIsLoading(false);
                }
            }
        };

        initializeData();

        return () => {
            mounted.current = false;
        };
    }, [netInfo.isConnected, getProjectsData, saveProjectsData]);

    // Refresh handler
    const onRefresh = useCallback(async () => {
        if (netInfo.isConnected && !refreshing) {
            setRefreshing(true);
            await fetchAndProcessProjects();
            setRefreshing(false);
        }
    }, [netInfo.isConnected, refreshing, fetchAndProcessProjects]);

    const renderItem = useCallback(({ item }: { item: Project }) => (
        <ProjectItem item={item} />
    ), []);

    const keyExtractor = useCallback((item: Project) => item?.id, []);

    const emptyComponent = useCallback(() => (
        <EmptyState
            title="No Inspection Projects found"
            subtitle="Please enter the correct project code or switch to another tab below."
            label=" back to Menu"
            subtitleStyle="text-[14px] text-center font-psemibold"
            route="/(modals)/select-chapter"
        />
    ), []);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    console.log("inspection data: ", inspectiondata);

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={inspectiondata}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                ListHeaderComponent={<ListHeader title=' Assigned Inspection projects' />}
                ListEmptyComponent={emptyComponent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={5}
            />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginTop: 16,
        borderRadius: 8,
        marginHorizontal: 16,
        overflow: 'hidden',
    }
});