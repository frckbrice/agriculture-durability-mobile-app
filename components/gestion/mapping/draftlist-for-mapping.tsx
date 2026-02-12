// libs import
import {
    View, Text, FlatList,
    Image, RefreshControl, TouchableOpacity, StyleSheet, Alert,
    ActivityIndicator
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNetInfo } from "@react-native-community/netinfo";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useFarmerMappingDataStore } from "@/store/farmer-data-storage";
//localconstant
import { Colors, images } from "../../../constants";

//local components
import EmptyState from "../../empty-state";

//local local functions
// import useApiOps from "@/hooks/use-api";
import SettingsItem from "@/components/setting-items";
import { MappingFormData, MappingData, Company } from "@/interfaces/types";
// import { Checkbox } from "react-native-paper";
// import axios from "axios";
import CustomDropdown from "@/components/drop-down";
// import { API_URL } from "@/constants/constants";
import { uploadResource } from "@/lib/api";
import { useProjectMappingDataStore } from "@/store/project-data-storage -mapping";
import { editFarmerData } from "@/store/mmkv-store";
import { useEditProjectDataStore } from "@/store/edit-project-data";
import { ListHeader } from "../inspections/list-header";
// import EditMappingFormDetails from "./edit-mapping-details";
import { uploadToS3 } from "@/lib/functions";
import { useCompanyStore } from "@/store/current-company-store";
//contentContainerStyle={{ paddingTop: headerHeight, flex: 1 }

const DraftProjectForMapping = () => {
    const [refreshing, setRefreshing] = useState(false);
    // pull latest posts
    const [farmersDataToQueu, setFarmersDataToQueu] = useState<MappingData[]>([]);
    // const [selectedMappingFormData, setSelectedMappingFormData] = useState<MappingData | null>(null);
    // const [selectedFarmersData, setSelectedFarmersData] = useState<MappingData[] | []>([]);
    // const [checking, setChecking] = useState(false);
    const { type, isConnected } = useNetInfo();
    // const { getToken } = useAuth();
    const router = useRouter();
    // const [selectedFarmerData, setSelectedFarmerData] = useState<MappingData | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    // const [uploaded, setUploaded] = useState(false);
    const [currentCompany, setCurrentCompany] = useState<Company>();
    // get farmer storage elements
    const {
        saveMappingsData,
        getMappingsData,
        setMappingDataAsUploaded,
        // clearMappingData
    } = useFarmerMappingDataStore();

    const {
        getProjectsData
    } = useProjectMappingDataStore();

    const {
        saveProjectData: saveMappingForEditing
    } = useEditProjectDataStore();

    const {
        getCompany,
    } = useCompanyStore();

    useEffect(() => {
        getMappingDataDrafted();

        const company = getCompany();
        if (company && !currentCompany)
            setCurrentCompany(company);
    }, []);

    const getMappingDataDrafted = () => {
        // Load queue from storage on component mount
        const storedQueue = getMappingsData();
        if (storedQueue) {
            // get only uploaded files
            const uploadedFarmersData = storedQueue.filter((data) => data.uploaded === false);
            setFarmersDataToQueu(uploadedFarmersData as MappingData[]);
            console.log('🚀 ~ storedQueue mapping:', storedQueue);
        }
    }


    const onRefresh = () => {
        getMappingDataDrafted();
    }
    const uploadingRef = useRef(new Set<string>()); // keep track of the uploaded project

    const handleUpload = useCallback(async (projectToUpload: MappingData) => {
        if (!isConnected || !projectToUpload) {
            Alert.alert('No Internet Connection', 'Please connect to the internet to upload data.');
            return;
        }
        setIsUploading(true);
        // identify the current project inside the set.
        const projectId = projectToUpload?.project_data?.farmer_ID_card_number;
        // avoid upload the same mapping twice
        if (uploadingRef.current.has(projectId as string)) return;

        uploadingRef.current.add(projectId as string);

        // we need the current project to get its council or location information
        const currentProject = getProjectsData()?.find(p => p.id === projectToUpload?.project_id)

        console.log("\n\nselected selectedMappingFormData data: ", projectToUpload);

        try {
            const fPhotos = projectToUpload?.project_data?.farmer_photos?.map(async (photo) => {
                return await uploadToS3(photo, `mapping-${projectToUpload?.project_data?.farmer_name}-${photo.split('/').pop()}`, currentCompany?.company_bucket as string, 'image/jpeg');
            })
            const pPhotos = projectToUpload?.project_data?.plantation_photos?.map(async (photo) => {
                return await uploadToS3(photo, `mapping-${projectToUpload?.project_data?.farmer_name}-${photo.split('/').pop()}`, currentCompany?.company_bucket as string, 'image/jpeg');
            })

            const fPhotosUrls = await Promise.all(fPhotos as Promise<string>[]);
            const pPhotosUrls = await Promise.all(pPhotos as Promise<string>[]);

            const { uploaded, ...rest } = projectToUpload;
            const objectTosend = {
                project_id: rest?.project_id,
                project_data: {
                    ...rest,
                    plantation_photos: pPhotosUrls,
                    farmer_photos: fPhotosUrls,
                },
                council: currentProject?.city
            }
            const response = await uploadResource('inspection_data', objectTosend, 'mapping');

            if (response) {
                // remove the resource from draft and send to sent.
                setMappingDataAsUploaded(projectToUpload);
                Alert.alert('Success', 'Successfully uploaded mapping data.');
            }
        } catch (error: any) {
            console.error('Upload training mapping sheet error:', error);
            Alert.alert('Error', 'Failed to upload data. Please try again later.');
        } finally {
            setIsUploading(false);
            uploadingRef.current.delete(projectId as string);
        }
    }, [isConnected, setMappingDataAsUploaded]);

    const handleEdit = useCallback((currentProject: MappingData) => {
        editFarmerData.set('current_mappingData', JSON.stringify({ trainingData: currentProject }));

        router.push(`/edit-mapping/${currentProject?.project_id}`);

    }, [router, saveMappingForEditing]);

    const handleDelete = useCallback((currentProject: MappingData) => {
        const newMappingSheetData = getMappingsData()?.filter(
            (f) => f.project_data.farmer_ID_card_number !== currentProject?.project_data.farmer_ID_card_number
        );

        saveMappingsData(newMappingSheetData);
    }, [getMappingsData, saveMappingsData]);

    const handleAction = useCallback((action: string, item: MappingData) => {
        switch (action) {
            case 'upload':
                handleUpload(item);
                break;
            case 'edit':
                handleEdit(item);
                break;
            case 'delete':
                handleDelete(item);
                break;
        }
    }, [handleUpload, handleEdit, handleDelete]);


    return (
        <SafeAreaView className=" h-full">
            <FlatList
                data={farmersDataToQueu} //
                keyExtractor={(item) => item?.project_id + performance.now().toString()} // <VideoCard video={item} /> tells RN how we'd like to render our list.
                renderItem={({ item }) => {
                    return (
                        <View className=" rounded-[8px] mx-4 my-1  overflow-hidden" >

                            <SettingsItem

                                isLast={false}
                                textStyle='justify-self-end'
                            >

                                <View className="flex-row items-center justify-between   w-full">
                                    <View className="flex-row items-center">
                                        {isUploading && <ActivityIndicator size={'small'} color={'gray'} />}
                                        <Text
                                            className='text-muted font-bold text-[15px] text-gray-700'
                                        >
                                            {item.project_data.farmer_name}
                                        </Text>
                                    </View>
                                    <View className="">
                                        <CustomDropdown
                                            handlePress={(value) => {
                                                // setSelectedFarmerData(item);
                                                handleAction(value as string, item);

                                            }}
                                            containerStyles="  bg-gray-100 rounded-full items-center justify-center"
                                            icons={'ellipsis-vertical'}
                                            deleteF="Delete"
                                            edit="Edit"
                                            upload="Upload"
                                            isUploading={isUploading}
                                        />

                                    </View>
                                </View>
                            </SettingsItem>


                        </View>
                    )
                }}
                ListHeaderComponent={<ListHeader title='Drafted mapping projects' />}
                // this property displays in case the list of data above is empty. it behave like a fallback.
                ListEmptyComponent={() => (
                    <EmptyState
                        title="No Project found"
                        subtitle="Please enter the correct project code."
                        label="Go to menu"
                        subtitleStyle="text-[14px] text-center font-psemibold"
                        route="/(management)/(mappings)"
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
        </SafeAreaView >
    )
}

export default DraftProjectForMapping;


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
