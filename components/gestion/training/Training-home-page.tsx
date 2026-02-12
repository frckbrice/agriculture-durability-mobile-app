// import React from 'react';
// import { View, Text, Button, TouchableOpacity } from 'react-native';
// import { useRouter } from 'expo-router';

// export const TrainingHomeScreen: React.FC = () => {

//     const router = useRouter();
//     return (
//         <View className="flex-1 justify-center items-center">
//             <Text className="text-2xl font-bold mb-4">Training Attendance</Text>
//             <TouchableOpacity
//                 onPress={() => router.push('/attendance-sheet-form')}
//             >
//                 <Text>New Attendance Sheet</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//                 onPress={() => router.navigate('/draft-trainings')}
//             >
//                 <Text>View Drafts</Text>
//             </TouchableOpacity>
//         </View>
//     );
// };

// libs import
import { View, Text, TouchableOpacity, StyleSheet, Image, RefreshControl } from 'react-native';

import React, { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

//localconstant
import { Colors, images } from '@/constants';

//local components
import EmptyState from '../../empty-state';

//local local functions
import useApiOps from '@/hooks/use-api';

import { FlatList } from 'react-native';
import { ITrainingData, Project, TTraining } from '@/interfaces/types';
import SettingsItem from '@/components/setting-items';
import { fetchResourceByItsID, getAllTrainingsProjects } from '@/lib/api';
import { ActivityIndicator } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useProjectTrainingDataStore } from '@/store/project-data-storage-training';
import { useCompanyStore } from '@/store/current-company-store';
import { useAgentProjects } from '@/hooks/use-agent-projects';


type TFetchType = {
    data: Project[] | undefined,
    refetch: () => void,
    isLoading: boolean,
}
export default function TrainingHomeScreen() {
    const [refreshing, setRefreshing] = useState(false);

    const mounted = useRef(false);
    const [error, setError] = useState<string | null>(null);


    const [trainings, setTrainings] = useState<TTraining[]>([])
    const { saveCompany } = useCompanyStore();
    const [companylogo, setCompanyLogo] = useState('')
    /**
     * here we get all the assigned training projects
     * we just list them and call individual one and route to its att. sheet.
     * there, we get its training_id from params and append it to att. sheet to create a new one.
     */

    const { isConnected } = useNetInfo();
    const {
        saveProjectsData,
        getProjectsData
    } = useProjectTrainingDataStore();
    const [isLoading, setIsLoading] = useState(true);

    const { trainingProjects: fetchedProjects } = useAgentProjects();
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
                setCompanyLogo(company.data?.logo);
            }
        } catch (error) {
            console.error('Error processing company data:', error);
        }
    }, [saveCompany]);

    const fetchAndProcessProjects = useCallback(async () => {
        try {
            setError(null);

            if (fetchedProjects?.length > 0) {
                console.log("training project: ", fetchedProjects)
                setTrainings(fetchedProjects);
                saveProjectsData(fetchedProjects);

                // Process company data for the first project
                if (fetchedProjects[0]?.company_id) {
                    await processCompanyData(fetchedProjects[0].company_id);
                }
            } else {
                setTrainings([]);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('Error fetching projects:', errorMessage);
            setError(errorMessage);
        }
    }, [processCompanyData, saveProjectsData]);

    // Handle offline mode safely

    const loadOfflineData = useCallback(async () => {
        try {
            setError(null);
            const offlineProjects = getProjectsData();
            if (Array.isArray(offlineProjects) && offlineProjects.length > 0) {
                setTrainings(offlineProjects);
            } else {
                setTrainings([]);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error loading offline data';
            console.error('Error loading offline data:', errorMessage);
            setError(errorMessage);
        }
    }, [getProjectsData]);

    // Initial data loading
    useEffect(() => {
        // mounted.current = true;

        const initializeData = async () => {
            setIsLoading(true);
            try {
                if (isConnected) {
                    await fetchAndProcessProjects();
                } else {
                    await loadOfflineData();
                }
            } finally {
                // if (mounted.current) {
                //     setIsLoading(false);
                // }
                setIsLoading(false);
            }
        };

        initializeData();

        // return () => {
        //     mounted.current = false;
        // };
    }, [isConnected, fetchAndProcessProjects, loadOfflineData]);

    let projectList: Project[] | any = [];


    // Refresh handler
    const onRefresh = useCallback(async () => {
        if (isConnected && !refreshing) {
            setRefreshing(true);
            await fetchAndProcessProjects();
            setRefreshing(false);
        }
    }, [isConnected, refreshing, fetchAndProcessProjects]);

    if (isLoading)
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );


    console.log("all-projects: ", trainings);

    return (
        <SafeAreaView className='flex-1'>

            <FlatList
                data={trainings as typeof projectList}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    const routage = {
                        type: "training",
                        id: item.id
                    }
                    return (
                        <View style={styles.container}>
                            <TouchableOpacity style={styles.section} >
                                <SettingsItem
                                    // hasNotification={i === 3}
                                    routing={routage}
                                    icon={true}
                                    textStyle='justify-self-end'
                                >
                                    <Text
                                        className='text-muted font-bold text-[15px] text-gray-700 p-2 py-3'
                                    >
                                        {item.title}
                                    </Text>
                                </SettingsItem>
                            </TouchableOpacity>
                        </View>
                    )
                }}
                ListHeaderComponent={() => (
                    <View className="  px-4 ">
                        <View className="justify-between items-center flex-row  ">
                            <View>
                                <Text className="text-xl font-psemibold ">
                                    assigned training projects.
                                </Text>
                            </View>
                            <View className="mt-1.5">
                                {companylogo ? <Image
                                    source={{ uri: companylogo }}
                                    resizeMode="contain"
                                    className="w-14 h-14 rounded-full"
                                /> : <Image
                                    source={images.senimalogo}
                                    resizeMode="contain"
                                    className="w-16 h-14 "
                                />}
                            </View>
                        </View>
                        <View className="h-0.5 border border-gray-300 w-full bg-primary" />

                    </View>
                )}
                // this property displays in case the list of data above is empty. it behave like a fallback.
                ListEmptyComponent={() => (
                    <EmptyState
                        title="No Training Project  found"
                        subtitle="Please enter the correct project code."
                        label="Go back to Agent Menu"
                        subtitleStyle="text-[14px] text-center font-psemibold"
                        route={'/(management)/(inspections)'}
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
        </SafeAreaView>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {

        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    section: {
        marginTop: 16,
        borderRadius: 8,
        marginHorizontal: 16,
        overflow: 'hidden',

    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    borderBottom: {
        // borderBottomWidth: 1,
        shadowOpacity: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowRadius: 3.84,
        elevation: 5,
        backgroundColor: '#fff',
    },
    icon: {
        marginRight: 16,
    },
    settingsText: {
        color: '#C9C8FA',
        flex: 1,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'red',
        marginRight: 8,
    },
});


