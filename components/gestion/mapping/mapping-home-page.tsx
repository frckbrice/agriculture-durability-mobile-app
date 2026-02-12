

import { View, Text, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList } from 'react-native';
import { useNetInfo } from "@react-native-community/netinfo";

// Local imports
import { Colors } from "../../../constants";
import EmptyState from "../../../components/empty-state";
import SettingsItem from '@/components/setting-items';
import { fetchResourceByItsID } from "../../../lib/api";
import { Project } from '@/interfaces/types';
import { useProjectMappingDataStore } from '@/store/project-data-storage -mapping';
import { useCompanyStore } from '@/store/current-company-store';
import { ListHeader } from '@/components/gestion/inspections/list-header';
import { useAgentProjects } from '@/hooks/use-agent-projects';

// Moved types to top for better organization
type ProjectWithType = Project & {
    type: string;
    village?: string;
};

const MappingMappingFormDatas: React.FC = () => {
    const mounted = useRef(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [error, setError] = useState<string | null>(null);

    const { isConnected } = useNetInfo();
    const { saveProjectsData, getProjectsData } = useProjectMappingDataStore();
    const { saveCompany } = useCompanyStore();

    // get mappings projects from the store set by tanstack react-query
    const { mappingProjects } = useAgentProjects()

    // Fetch and process company data
    const processCompanyData = useCallback(async (companyId: string) => {
        if (!companyId) return;

        try {
            const company = await fetchResourceByItsID('companies', companyId);
            if (company?.data) {
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

    // Filter mapping projects
    const filterMappingProjects = useCallback((projectsList: Project[] | undefined): Project[] => {
        if (!Array.isArray(projectsList)) return [];

        return projectsList.filter(project =>
            project?.type?.toLowerCase?.()?.includes('mapping') ?? false
        );
    }, []);

    // Main data fetching function
    const fetchAndProcessProjects = useCallback(async () => {
        try {
            setError(null);

            if (mappingProjects?.length > 0) {
                setProjects(mappingProjects);
                // saveProjectsData(mappingProjects);

                // Process company data for the first project
                if (mappingProjects[0]?.company_id) {
                    await processCompanyData(mappingProjects[0]?.company_id);
                }
            } else {
                setProjects([]);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error fetching projects:', errorMessage);
            setError(errorMessage);
        }
    }, [filterMappingProjects, processCompanyData, saveProjectsData]);

    // Load offline data
    const loadOfflineData = useCallback(async () => {
        try {
            setError(null);
            const offlineProjects = getProjectsData();
            if (Array.isArray(offlineProjects) && offlineProjects.length > 0) {
                setProjects(offlineProjects);
            } else {
                setProjects([]);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error loading offline data';
            console.error('Error loading offline data:', errorMessage);
            setError(errorMessage);
        }
    }, [getProjectsData]);

    // Initial data loading
    useEffect(() => {
        mounted.current = true;

        const initializeData = async () => {
            setIsLoading(true);
            try {
                if (isConnected) {
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
    }, [isConnected, fetchAndProcessProjects, loadOfflineData]);

    const {
        getCompany
    } = useCompanyStore();

    // Refresh handler
    const onRefresh = useCallback(async () => {
        if (isConnected && !refreshing) {
            setRefreshing(true);
            await fetchAndProcessProjects();
            setRefreshing(false);
        }
    }, [isConnected, refreshing, fetchAndProcessProjects]);

    // Render item component
    const renderItem = useCallback(({ item }: { item: Project }) => (
        <View style={styles.section}>
            <SettingsItem
                routing={{ type: "mapping", id: item?.id as string }}
                icon={true}
                textStyle='justify-self-end'
            >
                <Text className='text-muted font-bold text-[15px] text-gray-600'>
                    {item?.title ?? 'Untitled Project'}
                </Text>
            </SettingsItem>
        </View>
    ), []);


    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Error: {"\n" + "error fetching the project!" + "\n"}</Text>
                {isConnected && (
                    <Text style={styles.retryText} onPress={onRefresh}>
                        Tap to retry
                    </Text>
                )}
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={projects}
                keyExtractor={(item) => item?.id?.toString() ?? Math.random().toString()}
                renderItem={renderItem}
                ListHeaderComponent={<ListHeader title='assigned mapping projects' />}
                ListEmptyComponent={() => (
                    <EmptyState
                        title="No Mapping projects found"
                        subtitle="Please enter the correct mapping code or check between on of the tab below."
                        label="Go back to Agent Menu"
                        subtitleStyle="text-[14px] text-center font-psemibold"
                        route={'/(management)/(inspections)/index'}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
        </SafeAreaView>
    );
};

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
        marginTop: 8,
        borderRadius: 8,
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    retryText: {
        color: Colors.primary,
        textDecorationLine: 'underline',
    }
});

export default React.memo(MappingMappingFormDatas);