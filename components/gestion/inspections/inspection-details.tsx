

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Text, Alert, SafeAreaView, TouchableOpacity, View, ActivityIndicator } from 'react-native';

// import { useForm } from 'react-hook-form';
import FarmerDataForm from './project-form-details';
// import { project } from '@/constants/project-structure';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAuth } from '@clerk/clerk-expo';
import { Company, FarmerData, InspectionConclusionType, NonConformityInput, Project, TFetchType, } from '@/interfaces/types';
import { useFarmerDataStore } from "@/store/farmer-data-storage"

import useApiOps from '@/hooks/use-api';
import { fetchResourceByItsID } from '@/lib/api';
import { showUploadButton } from '@/store/mmkv-store';
import { Colors } from '@/constants';
import { useProjectDataStore } from '@/store/project-data-storage';
import { mock_project } from '@/constants/project-structure';
import { useProjectInspectionDataStore } from '@/store/project-data-storage -inspection';
import { useNetInfo } from "@react-native-community/netinfo";
import { useCompanyStore } from '@/store/current-company-store';

export default function InspectionFormsCollectors() {

    const [farmerDataToQueu, setFarmerDataToQueu] = useState<FarmerData[]>([]);
    const [resetForm, setResetForm] = useState(false);
    const router = useRouter()
    const [currentProject, setCurrentProject] = useState<Project>();
    const [currentCompany, setCurrentCompany] = useState<Company>();
    // check network
    const { isConnected } = useNetInfo();

    // get farmer storage elements
    const {
        saveFarmersData,
        getFarmersData
    } = useFarmerDataStore();

    const {
        getProjectsData
    } = useProjectInspectionDataStore();

    const {
        getCompany,
    } = useCompanyStore();

    const mounted = useRef(false)

    const { inspection_id } = useLocalSearchParams();

    const { refetch,
        data: project,
        isLoading }: TFetchType<Project> =
        useApiOps<Project>(() => {
            if (mounted.current) {
                return fetchResourceByItsID('projects', inspection_id as string)
            }
            return Promise.resolve(mock_project);
        });

    useEffect(() => {
        mounted.current = true;
        if (!project)
            refetch();
        return () => { mounted.current = false; }
    }, []);

    // Handle offline mode
    useEffect(() => {
        const loadOfflineData = async () => {
            if (!isConnected && !project) {
                try {
                    const storedQueue = getProjectsData();
                    if (storedQueue.length > 0) {

                        // get the project corresponding to the params Id
                        const storedProject = storedQueue?.find(p => p.id === inspection_id);
                        if (!project && storedProject)
                            setCurrentProject(storedProject as Project);
                    }
                    const company = getCompany();
                    if (company && !currentCompany)
                        setCurrentCompany(company);
                } catch (error) {
                    console.error('Error loading offline data:', error);
                }
            }
        };

        loadOfflineData();
    }, [isConnected]);
    /**
    * Save the farmer's collected data to the queue in local storage.
    * This includes the inspection_id which is extracted from the URL parameter.
    * After saving the data to the queue, clear the form and display a success alert.
    */

    const saveToQueue = useCallback((data: FarmerData) => {
        console.log('\n\n farmer collected data: ', data);
        // Load queued data from storage on component mount for editing.
        const storedFarmerData = getFarmersData();

        const newQueue = [...storedFarmerData, data];
        saveFarmersData(newQueue as FarmerData[]);

        // setFarmerDataToQueu(newQueue as FarmerData[]);
        setResetForm(true); // Clear the form
        Alert.alert('Success', 'Farmer data saved to  draft!');
    }, [getFarmersData, saveFarmersData]);


    if (isLoading)
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );

    return (
        <SafeAreaView className="flex-1 p-4 bg-gray-100">
            <FarmerDataForm
                getFarmerData={saveToQueue}
                project={project ? project : currentProject}
                resetFrom={resetForm}
                currentCompany={currentCompany}
            />
            {/* show this button only when we rich the last requirment during the collection */}
            {showUploadButton.getString("end-collecting-data") ? <TouchableOpacity
                className="bg-blue-500 p-4 rounded-md mt-4"
                onPress={() => router.replace('/drafted-project')}
            >
                <Text className="text-white text-center font-bold">
                    End Collection
                </Text>
            </TouchableOpacity> : null}
        </SafeAreaView>
    );
};
