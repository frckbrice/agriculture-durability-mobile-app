// libs import
import { View, Text, FlatList, RefreshControl, StyleSheet, Alert, ActivityIndicator } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNetInfo } from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import { useFarmerDataStore } from "@/store/farmer-data-storage";
//localconstant

//local components
import EmptyState from "../../empty-state";

//local local functions
import SettingsItem from "@/components/setting-items";
import { Company, FarmerData } from "@/interfaces/types";
import CustomDropdown from "@/components/drop-down";
import { uploadResource } from "@/lib/api";
import { useProjectInspectionDataStore } from "@/store/project-data-storage -inspection";
import { editFarmerData } from "@/store/mmkv-store";
import { ListHeader } from "./list-header";
import { isValidUrl, uploadToS3 } from "@/lib/functions";
import { useCompanyStore } from "@/store/current-company-store";
//contentContainerStyle={{ paddingTop: headerHeight, flex: 1 }

const DraftProjectForInspection = () => {
    const [refreshing, setRefreshing] = useState(false);
    // pull latest posts
    const [farmersDataToQueu, setFarmersDataToQueu] = useState<FarmerData[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const { isConnected } = useNetInfo();
    const [uploaded, setUploaded] = useState(false);
    const router = useRouter();
    const [currentProjectType, setCurrentProjectType] = useState("")
    const [currentCompany, setCurrentCompany] = useState<Company>();


    // get farmer storage elements
    const {
        saveFarmersData,
        getFarmersData,
        setFarmerDataAsUploaded
    } = useFarmerDataStore();

    const { getProjectsData } = useProjectInspectionDataStore();
    const {
        getCompany,
    } = useCompanyStore();

    useEffect(() => {

        getAllDraftProjects();
        const company = getCompany();
        if (company && !currentCompany)
            setCurrentCompany(company);
    }, []);

    useEffect(() => {

        getAllDraftProjects()

    }, [uploaded]);


    const getAllDraftProjects = useCallback(() => {
        // Load queue from storage on component mount
        const storedQueue = getFarmersData();
        if (storedQueue) {
            // console.log("stored inspction data: ", storedQueue)
            // get only uploaded files
            const uploadedFarmersData = storedQueue.filter((data) => data.uploaded === false);
            setFarmersDataToQueu(uploadedFarmersData);
            console.log('🚀 ~ storedQueue draft:', uploadedFarmersData);
        }
    }, [setFarmersDataToQueu])


    // acting on dropdown press
    const handlePressAction = async (str: string, farmersData?: FarmerData) => {

        if (typeof farmersData == 'undefined')
            Alert.alert('No data selected', 'Please select a data to upload.');
        //get the current project from the list of registered projects.
        const currentProject = getProjectsData()?.find(p => p.id === farmersData?.project_id);

        setIsUploading(true);
        if (str === 'upload') {
            console.log("\n\n uplaoding start: ");
            // check for internet connection and upload
            if (isConnected && typeof farmersData != 'undefined') {
                try {
                    // get the selected farmer data type of project

                    setCurrentProjectType(currentProject?.type!);

                    console.log("\n\ncurrent project type: ", currentProjectType);

                    // get the stored image from the bucket.
                    console.log("\n\n before farmer photo upload to s3: ", farmersData?.project_data?.metaData?.farmer_photos);
                    const photosUrls = await Promise.all(
                        (farmersData?.project_data?.metaData?.farmer_photos || [])
                            .filter(photo => {
                                console.log("\n\n current farmer photo inside filter: ", photo);
                                return !isValidUrl(photo)
                            }) // Skip URLs 
                            .map(async (photo) => {
                                console.log("\n\n current farmer photo inside map: ", photo);
                                if (!isValidUrl(photo)) {
                                    return await uploadToS3(
                                        photo,
                                        `${currentProjectType.toLowerCase()}-${photo.split('/').pop()}`,
                                        currentCompany?.company_bucket as string,
                                        'image/jpeg'
                                    );
                                }
                                return photo; // Return URL if already uploaded
                            })
                    );

                    console.log("\n\n before farmer signature upload to s3: ", farmersData?.project_data?.inspectionConclusions?.metadata);
                    const [farmer_signature, agent_signature] = await Promise.all([
                        farmersData?.project_data?.inspectionConclusions?.metadata?.farmer_signature,
                        farmersData?.project_data?.inspectionConclusions?.metadata?.agent_signature
                    ].map(async (sig: string | undefined) => {
                        return await uploadToS3(sig as string,
                            `${currentProjectType.toLowerCase()}-${sig?.split('/').pop()}`,
                            currentCompany?.company_bucket as string, 'image/png'
                        )
                    }));

                    // should not upload if no farmer|agent_signature or no farmer_photos
                    if (!farmer_signature || !agent_signature || photosUrls.length === 0) {
                        Alert.alert('Error', 'No farmer or agent signature or no photos to upload.');
                        setIsUploading(false);
                        return;
                    }

                    //    make hot delete of object field at runtime.
                    delete farmersData?.project_data?.nonConformityReqs;
                    const { uploaded, ...rest } = farmersData;
                    const objectTosend = {
                        project_id: rest?.project_id,
                        project_data: {
                            ...rest,
                            company_id: currentProject?.company_id,
                            project_data: {
                                ...rest?.project_data,
                                requirements: rest?.project_data?.requirements,
                                metaData: {
                                    ...rest?.project_data?.metaData,
                                    farmer_photos: photosUrls
                                },
                                inspectionConclusions: {
                                    ...rest?.project_data?.inspectionConclusions,
                                    metadata: {
                                        ...rest?.project_data?.inspectionConclusions?.metadata,
                                        farmer_signature,
                                        agent_signature,
                                    }
                                },
                            }
                        },
                        council: currentProject?.city
                    }

                    console.log("\n\n data to send: ", objectTosend);
                    console.log("\n data to send farmer name: ", objectTosend?.project_data?.project_data?.metaData?.farmer_name);
                    const data = await uploadResource('inspection_data', objectTosend, currentProject?.type!);
                    if (data) {
                        try {
                            Alert.alert('success', 'Data uploaded successfully');
                            setIsUploading(false);
                            console.log("\n\n data uploaded", data)
                            setFarmerDataAsUploaded(farmersData!);

                            setUploaded(true);

                        } catch (error) {
                            console.error('Failed to set farmer data as uploaded:', error);
                        }
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    setIsUploading(false);
                    Alert.alert('Error', 'Failed to upload data. Please try again.');
                } finally {
                    setIsUploading(false);
                }
            } else if (!isConnected)
                Alert.alert('No Internet Connection', 'Please connect to the internet to upload data.');

        }
        // call the editing inspection component.
        if (str === 'edit') {
            console.log("current project: ", currentProject);

            editFarmerData.set('current_FarmerData', JSON.stringify({ farmerData: farmersData }));
            // editProjectData.set('current_ProjectData', JSON.stringify({ project: currentProject }));
            router.push(`/edit-inspection/${farmersData?.project_id}`);
        }
        if (str === 'delete') {
            // remove the concerned famer data from the list and store the rest
            const newFarmersData = farmersDataToQueu.filter((f) => f.project_data.metaData.farmer_name !== farmersData?.project_data.metaData.farmer_name);
            saveFarmersData(newFarmersData);
            setIsUploading(false)
        }
    }

    const onRefresh = () => {
        getAllDraftProjects();
    }


    return (
        <SafeAreaView className=" h-full">
            <View>
                <FlatList
                    data={farmersDataToQueu} //
                    keyExtractor={(item) => item.project_data.metaData.inspection_date as string} // <VideoCard video={item} /> tells RN how we'd like to render our list.
                    renderItem={({ item }) => {
                        return (
                            <View className=" rounded-[8px] mx-4 my-2  overflow-hidden  ">
                                <SettingsItem

                                    icon={false}
                                    textStyle='justify-self-end'
                                    isLast={true}
                                >
                                    <View className="flex-row items-center justify-between   w-full">
                                        <View className="flex-row items-center">
                                            {/* <View>
                                                <Checkbox
                                                    status={checking ? 'checked' : "unchecked"}
                                                    onPress={() => getSelectedFarmerData(item)}
                                                />
                                            </View> */}
                                            {isUploading && <ActivityIndicator size={'small'} color={'gray'} />}
                                            <Text
                                                className='text-muted font-bold text-[15px] text-gray-700'
                                            >
                                                {item.project_data.metaData.farmer_name} (draft data)
                                            </Text>
                                        </View>
                                        <View className="">
                                            {/* dropdown */}
                                            {/* {isUploading ?
                                                <ActivityIndicator size="large" color={Colors.primary} />
                                                : */}
                                            <CustomDropdown
                                                handlePress={(value) => {
                                                    // setSelectedFarmerData(item);
                                                    handlePressAction(value as string, item);
                                                }}
                                                containerStyles="  bg-gray-100 rounded-full items-center justify-center"
                                                icons={'ellipsis-vertical'}
                                                deleteF="Delete"
                                                edit="Edit"
                                                upload="Upload"
                                                isUploading={isUploading}
                                            />
                                            {/* // } */}
                                        </View>
                                    </View>
                                </SettingsItem>

                            </View>)
                    }}
                    ListHeaderComponent={() => (
                        <ListHeader title=' Drafted inspection projects' />
                    )}
                    // this property displays in case the list of data above is empty. it behave like a fallback.
                    ListEmptyComponent={() => (
                        <EmptyState
                            title="No Draft Project(s) Yet"
                            subtitle=" Collect and Save the data to see them here"
                            label="Go to menu"
                            subtitleStyle="text-[14px] text-center font-psemibold"
                            route="/(management)/(inspections)"
                        />
                    )}

                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            </View>
        </SafeAreaView>
    )
}

export default DraftProjectForInspection;


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
