

import React, { useEffect, useState } from 'react';
import { Text, Alert, SafeAreaView, TouchableOpacity, } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { FarmerData, Project, } from '@/interfaces/types';
import { useFarmerDataStore } from "@/store/farmer-data-storage"

import { editFarmerData, editProjectData, showUploadButton } from '@/store/mmkv-store';

import EditFarmerDataForm from './edit-project-form-details';
import useApiOps from '@/hooks/use-api';
import { fetchResourceByItsID } from '@/lib/api';
import { useNetInfo } from "@react-native-community/netinfo";

import { useProjectInspectionDataStore } from '@/store/project-data-storage -inspection';


export default function EditInspectionFormsCollectors() {

    const { inspection_id } = useLocalSearchParams();
    // check network
    const { isConnected } = useNetInfo();
    const [currentProject, setCurrentProject] = useState<Project>();

    const { refetch,
        data: project,
        isLoading } =
        useApiOps<Project>(() => {
            return fetchResourceByItsID('projects', inspection_id as string)
        });

    const [existingFarmerData, setExistingFarmerData] = useState<FarmerData>();
    // const [project, setProject] = useState<Project>()
    const router = useRouter()

    // get farmer storage elements
    const {
        saveFarmersData,
        getFarmersData
    } = useFarmerDataStore();

    // get store project
    const {
        getProjectsData
    } = useProjectInspectionDataStore();

    useEffect(() => {

        const farmerData = editFarmerData.getString('current_FarmerData');
        // const currentProject = editProjectData.getString('current_ProjectData');

        if (farmerData) {
            const data = JSON.parse(farmerData as string);
            setExistingFarmerData(data.farmerData);
            console.log('\n\n\n  farmer data to edit: ', { farmer: data.farmerData });
        }
        if (!project) {
            refetch()
        }
    }, [])

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

                } catch (error) {
                    console.error('Error loading offline data:', error);
                }
            }
        };

        loadOfflineData();
    }, [isConnected]);

    const saveToQueue = (data: FarmerData) => {

        // save to the correct farmer, to avoid duplication of same object.
        const farmerDataToQueu = getFarmersData();
        const newFarmerDataList = farmerDataToQueu?.map(f => f.project_data.metaData.farmer_contact === data.project_data.metaData.farmer_contact ? data : f)

        saveFarmersData(newFarmerDataList as FarmerData[]);

        Alert.alert('Success', 'Farmer data saved to draft!');
    };

    console.log("current project: ", project)


    return (
        <SafeAreaView className="flex-1 p-4 bg-gray-100">
            <EditFarmerDataForm
                project={project ? project : currentProject}
                getFarmerData={saveToQueue}
                initialData={existingFarmerData}
                isEditing={true}
            />
            {/* show this button only when we rich the last requirment during the collection */}
            {showUploadButton.getString("end-collecting-data") ? <TouchableOpacity
                className="bg-blue-500 p-4 rounded-md mt-4"
                onPress={() => router.replace('/(management)/(inspections)/drafted-project')}
            >
                <Text className="text-white text-center font-bold">End Collection</Text>
            </TouchableOpacity> : null}
        </SafeAreaView>
    );
};
