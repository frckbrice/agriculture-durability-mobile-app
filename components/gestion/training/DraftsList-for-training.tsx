// import { AttendanceSheetType, AttendenceSheet } from '@/interfaces/types';
// import { useAttendanceDataStore } from '@/store/training-attendances-data-storage';
// import React, { useEffect, useState } from 'react';
// import {
//     View, Text,
//     FlatList, TouchableOpacity, StyleSheet,
//     Image,
//     Alert,
//     RefreshControl,
//     ActivityIndicator
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import SettingsItem from '../../setting-items';
// import { Colors, images } from '@/constants';
// import EmptyState from '../../empty-state';
// import CustomDropdown from '../../drop-down';
// import { Checkbox } from 'react-native-paper';
// // libs import

// import axios from "axios";
// import { useAuth } from "@clerk/clerk-expo";
// import { useNetInfo } from "@react-native-community/netinfo";
// import { API_URL } from "@/constants/constants";
// import { useRouter } from "expo-router";
// import { uploadResource } from '@/lib/api';
// import { editFarmerData } from '@/store/mmkv-store';
// import { useEditProjectDataStore } from '@/store/edit-project-data';
// import { useCompanyStore } from '@/store/current-company-store';


// export const DraftsList: React.FC = () => {
//     const [refreshing, setRefreshing] = useState(false);
//     const {
//         setAttendanceDataAsUploaded,
//         saveAttendancesData,
//         getAttendancesData
//     } = useAttendanceDataStore();

//     const [drafts, setDraft] = useState<AttendenceSheet[]>();
//     const [selectedAttendanceSheet, setSelectedAttendanceSheet] = useState<AttendenceSheet | null>(null);
//     const [checking, setChecking] = useState(false);
//     const { type, isConnected } = useNetInfo();

//     const router = useRouter();
//     const [isUploading, setIsUploading] = useState(false);

//     const {
//         saveProjectData: saveMappingData
//     } = useEditProjectDataStore();

//     const {
//         getCompany,
//     } = useCompanyStore();

//     const getMappingDataDrafted = () => {
//         const attendancesData = getAttendancesData();
//         console.log('refeching:', attendancesData);
//         if (attendancesData.length > 0) {
//             const onLyDrafts = attendancesData.filter((item) => item.uploaded === false);
//             setDraft(onLyDrafts);
//             console.log('🚀 ~ storedQueue training draft:', onLyDrafts);
//         }
//         console.log('refeching:');
//     }

//     const getSelectedAttendanceSheet = (data: AttendenceSheet) => {
//         // const newQueue = [...attenAttendenceSheetToQueu, data];
//         setChecking((prev) => !prev);
//         setSelectedAttendanceSheet(data);
//         console.log("item id: ", data);
//     };

//     // acting o dropdown press
//     const handlePressAction = async (str: string, currentProject: AttendenceSheet) => {
//         if (str === 'upload') {
//             setIsUploading(true);
//             const { uploaded, ...rest } = currentProject as AttendenceSheet;
//             const objectTosend = {
//                 project_id: rest?.training_id,
//                 project_data: {
//                     ...rest,
//                 }
//             }
//             // check for internet connection and upload
//             if (isConnected && typeof currentProject != 'undefined') {

//                 try {
//                     const response = await uploadResource('inspection_data', objectTosend, 'trainings')

//                     if (response) {
//                         setAttendanceDataAsUploaded(currentProject!);
//                         setSelectedAttendanceSheet(null);
//                         Alert.alert('Success', 'successfully uploaded attendance data.');
//                         setIsUploading(false);
//                     }

//                 } catch (error: any) {
//                     console.error('Upload training attendance sheet error:', error);
//                     if (error?.message?.includes("Request failed with status code 500",)) {
//                         return Alert.alert('Success', 'successfully uploaded attendance data.');
//                     }
//                     Alert.alert('Error', 'Failed to upload data. Please try again later.');
//                 }
//             } else if (!isConnected)
//                 Alert.alert('No Internet Connection', 'Please connect to the internet to upload data.');
//             else if (typeof selectedAttendanceSheet == 'undefined')
//                 Alert.alert('No data selected', 'Please select a data to upload.');

//         }
//         if (str === 'edit') {
//             console.log("selectedAttendanceSheetData inside edit: ", selectedAttendanceSheet)
//             editFarmerData.set('current_trainingData', JSON.stringify({ trainingData: selectedAttendanceSheet }));
//             saveMappingData(currentProject);
//             router.push(`/edit-training/${selectedAttendanceSheet?.training_id as string}`);
//         }
//         if (str === 'delete') {
//             console.log("delete: ")
//             // remove the concerned famer data from the list and store the rest
//             const newAttendanceSheetData = getAttendancesData()?.filter((f) => f.date !== selectedAttendanceSheet?.date);
//             saveAttendancesData(newAttendanceSheetData);
//             // Alert.alert("Success", "data deleted!!");
//         }
//     }

//     const onRefresh = () => {
//         getMappingDataDrafted();
//     }

//     const newList = drafts?.reduce((acc, curr) => {
//         if (!acc.find((item) => item.title === curr.title)) {
//             acc.push(curr);
//         }
//         return acc;
//     }, [] as AttendenceSheet[]);

//     return (
//         <SafeAreaView className='flex-1'>

//             <FlatList
//                 data={newList}
//                 keyExtractor={(item) => item?.date as string}
//                 renderItem={({ item }) => {
//                     return (

//                         <View className="rounded-[8px] mx-4 my-1  overflow-hidden" >

//                             <SettingsItem
//                                 isLast={false}
//                                 textStyle='justify-self-end'
//                             >

//                                 <View className="flex-row items-center justify-between   w-full">
//                                     <View className="flex-row items-center justify-between w-full p-1 flex-wrap">

//                                         <Text
//                                             className='text-muted font-bold text-[15px] text-gray-500'
//                                         >
//                                             {item.title.substring(0, 30)}...
//                                         </Text>


//                                         <CustomDropdown
//                                             handlePress={(value) => {
//                                                 // setSelectedAttendanceSheet(item);

//                                                 handlePressAction(value as string, item);

//                                             }}
//                                             containerStyles="  bg-gray-100 rounded-full items-center justify-center"
//                                             icons={'ellipsis-vertical'}
//                                             deleteF="Delete"
//                                             edit="Edit"
//                                             upload="Upload"
//                                         />

//                                     </View>
//                                 </View>
//                             </SettingsItem>


//                         </View>

//                     )
//                 }}

//                 ListHeaderComponent={() => (
//                     <View className="  px-4 ">
//                         <View className="justify-between items-center flex-row  ">
//                             <View>
//                                 <Text className="text-xl font-psemibold ">
//                                     Draft attendance sheets.
//                                 </Text>
//                             </View>
//                             <View className="mt-1.5">
//                                 {getCompany()?.company_logo ? <Image
//                                     source={{ uri: getCompany()?.company_logo }}
//                                     resizeMode="contain"
//                                     className="w-14 h-14 rounded-full"
//                                 /> : <Image
//                                     source={images.senimalogo}
//                                     resizeMode="contain"
//                                     className="w-16 h-14 "
//                                 />}
//                             </View>
//                         </View>
//                         <View className="h-0.5 border border-gray-300 w-full bg-primary" />
//                         {/* search input */}
//                         {/* <SearchInput placeholder={"Search for a video topic"} /> */}
//                     </View>
//                 )}
//                 // this property displays in case the list of data above is empty. it behave like a fallback.
//                 ListEmptyComponent={() => (
//                     <EmptyState
//                         title="No Training Project attendance sheet previously drafted"
//                         subtitle="Please fill a new attendance and save it to drafts."
//                         label="Go back projects..."
//                         subtitleStyle="text-[14px] text-center font-psemibold"
//                         route={'/(management)/(trainings)'}
//                     />
//                 )}
//                 refreshControl={
//                     <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//                 }
//             />
//         </SafeAreaView>
//     )
// }


// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//     },
//     header: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 16,
//         borderBottomWidth: 1,
//     },
//     headerTitle: {

//         fontSize: 18,
//         fontWeight: 'bold',
//         marginLeft: 16,
//     },
//     section: {
//         marginTop: 16,
//         borderRadius: 8,
//         marginHorizontal: 16,
//         overflow: 'hidden',
//     },
//     settingsItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 16,
//     },
//     borderBottom: {
//         // borderBottomWidth: 1,
//         shadowOpacity: 1,
//         shadowColor: '#000',
//         shadowOffset: {
//             width: 0,
//             height: 2,
//         },
//         shadowRadius: 3.84,
//         elevation: 5,
//         backgroundColor: '#fff',
//     },
//     icon: {
//         marginRight: 16,
//     },
//     settingsText: {
//         color: '#C9C8FA',
//         flex: 1,
//     },
//     rightContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     notificationDot: {
//         width: 8,
//         height: 8,
//         borderRadius: 4,
//         backgroundColor: 'red',
//         marginRight: 8,
//     },
// });



// // import SentProjects from "./sent-project";

// // export default SentProjects;


// import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import {
//     View, Text, FlatList, Image, Alert,
//     RefreshControl, StyleSheet
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import SettingsItem from '../../setting-items';
// import { images } from '@/constants';
// import EmptyState from '../../empty-state';
// import CustomDropdown from '../../drop-down';
// import { useNetInfo } from "@react-native-community/netinfo";
// import { useRouter } from "expo-router";
// import { uploadResource } from '@/lib/api';
// import { editFarmerData } from '@/store/mmkv-store';
// import { useEditProjectDataStore } from '@/store/edit-project-data';
// import { useCompanyStore } from '@/store/current-company-store';
// import { AttendenceSheet, Company } from '@/interfaces/types';
// import { useAttendanceDataStore } from '@/store/training-attendances-data-storage';
// import { uploadToS3 } from '@/lib/functions';

// // Memoized list item component
// const DraftItem = React.memo(({
//     item,
//     onAction
// }: {
//     item: AttendenceSheet;
//     onAction: (action: string, item: AttendenceSheet) => void;
// }) => (
//     <View className="rounded-[8px] mx-4 my-1 overflow-hidden">
//         <SettingsItem isLast={false} textStyle="justify-self-end">
//             <View className="flex-row items-center justify-between w-full">
//                 <View className="flex-row items-center justify-between w-full p-1 flex-wrap">
//                     <Text className="text-muted font-bold text-[15px] text-gray-500">
//                         {item.title.substring(0, 30)}...
//                     </Text>
//                     <CustomDropdown
//                         handlePress={(value) => onAction(value as string, item)}
//                         containerStyles="bg-gray-100 rounded-full items-center justify-center"
//                         icons="ellipsis-vertical"
//                         deleteF="Delete"
//                         edit="Edit"
//                         upload="Upload"
//                     />
//                 </View>
//             </View>
//         </SettingsItem>
//     </View>
// ));

// // Memoized header component
// const ListHeader = React.memo(({ companyLogo }: { companyLogo?: string }) => (
//     <View className="px-4">
//         <View className="justify-between items-center flex-row">
//             <View>
//                 <Text className="text-xl font-psemibold">
//                     Draft attendance sheets.
//                 </Text>
//             </View>
//             <View className="mt-1.5">
//                 {companyLogo ? (
//                     <Image
//                         source={{ uri: companyLogo }}
//                         resizeMode="contain"
//                         className="w-14 h-14 rounded-full"
//                     />
//                 ) : (
//                     <Image
//                         source={images.senimalogo}
//                         resizeMode="contain"
//                         className="w-16 h-14"
//                     />
//                 )}
//             </View>
//         </View>
//         <View className="h-0.5 border border-gray-300 w-full bg-primary" />
//     </View>
// ));

// export const DraftsList: React.FC = () => {
//     const router = useRouter();
//     const { isConnected } = useNetInfo();
//     const uploadingRef = useRef(new Set<string>()); // keep track of the uploaded project
//     const [currentCompany, setCurrentCompany] = useState<Company>();

//     // Zustand store selectors
//     const {
//         setAttendanceDataAsUploaded,
//         saveAttendancesData,
//         getAttendancesData,
//         clearAttendanceData
//     } = useAttendanceDataStore();

//     const { saveProjectData: saveTrainingData } = useEditProjectDataStore();
//     const { getCompany } = useCompanyStore();

//     useEffect(() => {
//         const company = getCompany();
//         if (company && !currentCompany)
//             setCurrentCompany(company);
//     }, []);

//     // Memoized drafts
//     const drafts = useMemo(() => {
//         const attendancesData = getAttendancesData();
//         return attendancesData
//             .filter(item => !item.uploaded)
//         // .reduce((acc, curr) => { // remove duplicates
//         //     if (!acc.find(item => item.title === curr.title)) {
//         //         acc.push(curr);
//         //     }
//         //     return acc;
//         // }, [] as AttendenceSheet[]);
//     }, [getAttendancesData]);

//     // Handlers
//     const handleUpload = useCallback(async (currentProject: AttendenceSheet) => {
//         if (!isConnected) {
//             Alert.alert('No Internet Connection', 'Please connect to the internet to upload data.');
//             return;
//         }

//         const projectId = currentProject?.date;
//         // avoid upload the same attendance twice
//         if (uploadingRef.current.has(projectId as string)) return;

//         uploadingRef.current.add(projectId as string);



//         try {
//             const { uploaded, ...rest } = currentProject;

//             const photos = currentProject?.photos.map(async (photo) => {
//                 return await uploadToS3(photo, `training-${photo.split('/').pop()}`, currentCompany?.company_bucket as string, 'image/jpeg');
//             });
//             const photosUrls = await Promise.all(photos as Promise<string>[]);

//             /**
//              * this is a design decision because we suppose that the number of trainer will be limited
//              */
//             const trainersWithSignatureUpdated = currentProject?.trainers?.map(async (t) => {
//                 return {
//                     ...t,
//                     signature: await uploadToS3(t.signature, `training-${t.signature.split('/').pop()}`, currentCompany?.company_bucket as string, 'image/jpeg'),
//                 };
//             });

//             const ParticipantsWithSignatureUpdated = currentProject?.participants?.map(async (p) => {
//                 return {
//                     ...p,
//                     signature: await uploadToS3(p.signature, `training-${p.signature.split('/').pop()}`, currentCompany?.company_bucket as string, 'image/jpeg'),
//                 };
//             });
//             const newtrainers = await Promise.all(trainersWithSignatureUpdated);
//             const newparticipants = await Promise.all(ParticipantsWithSignatureUpdated);
//             const objectToSend = {
//                 project_id: rest?.training_id,
//                 project_data: {
//                     ...rest,
//                     photos: photosUrls,
//                     trainers: newtrainers,
//                     participants: newparticipants,
//                 },

//             };

//             const response = await uploadResource('inspection_data', objectToSend, 'trainings');

//             if (response) {
//                 setAttendanceDataAsUploaded(currentProject);
//                 Alert.alert('Success', 'Successfully uploaded attendance data.');
//             }
//         } catch (error: any) {
//             console.error('Upload training attendance sheet error:', error);
//             Alert.alert('Error', 'Failed to upload data. Please try again later.');
//         } finally {
//             uploadingRef.current.delete(projectId as string);
//         }
//     }, [isConnected, setAttendanceDataAsUploaded]);

//     const handleEdit = useCallback((currentProject: AttendenceSheet) => {
//         // editFarmerData.set('current_trainingData', JSON.stringify({ trainingData: currentProject }));
//         saveTrainingData(currentProject);
//         router.push(`/edit-training/${currentProject?.training_id}`);
//     }, [router, saveTrainingData]);

//     const handleDelete = useCallback((currentProject: AttendenceSheet) => {
//         const newAttendanceSheetData = getAttendancesData()?.filter(
//             (f) => f.date !== currentProject?.date
//         );

//         saveAttendancesData(newAttendanceSheetData);
//     }, [getAttendancesData, saveAttendancesData]);

//     const handleAction = useCallback((action: string, item: AttendenceSheet) => {
//         switch (action) {
//             case 'upload':
//                 handleUpload(item);
//                 break;
//             case 'edit':
//                 handleEdit(item);
//                 break;
//             case 'delete':
//                 handleDelete(item);
//                 break;
//         }
//     }, [handleUpload, handleEdit, handleDelete]);

//     // render Item.
//     const renderItem = useCallback(({ item }: { item: AttendenceSheet }) => (
//         <DraftItem item={item} onAction={handleAction} />
//     ), [handleAction]);

//     const keyExtractor = useCallback((item: AttendenceSheet) =>
//         item?.date as string, []);

//     const companyLogo = useMemo(() => getCompany()?.company_logo, [getCompany]);

//     return (
//         <SafeAreaView className="flex-1">
//             <FlatList
//                 data={drafts}
//                 renderItem={renderItem}
//                 keyExtractor={keyExtractor}
//                 ListHeaderComponent={() => <ListHeader companyLogo={companyLogo} />}
//                 ListEmptyComponent={() => (
//                     <EmptyState
//                         title="No Training Project attendance sheet previously drafted"
//                         subtitle="Please fill a new attendance and save it to drafts."
//                         label="Go back projects..."
//                         subtitleStyle="text-[14px] text-center font-psemibold"
//                         route="/(management)/(trainings)"
//                     />
//                 )}
//                 refreshControl={
//                     <RefreshControl
//                         refreshing={false}
//                         onRefresh={() => null}
//                     />
//                 }
//             />
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//     }
// });

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View, Text, FlatList, Image, Alert,
    RefreshControl, StyleSheet, type ListRenderItem
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SettingsItem from '../../setting-items';
import { images } from '@/constants';
import EmptyState from '../../empty-state';
import CustomDropdown from '../../drop-down';
import { useNetInfo } from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import { uploadResource } from '@/lib/api';
import { useEditProjectDataStore } from '@/store/edit-project-data';
import { useCompanyStore } from '@/store/current-company-store';
import { AttendenceSheet, Company } from '@/interfaces/types';
import { useAttendanceDataStore } from '@/store/training-attendances-data-storage';
import { uploadToS3 } from '@/lib/functions';
import { ActivityIndicator } from 'react-native-paper';

// Types for better type safety
type DraftItemProps = {
    item: AttendenceSheet;
    onUpload: (item: AttendenceSheet) => void;
    onEdit: (item: AttendenceSheet) => void;
    onDelete: (item: AttendenceSheet) => void;
    isUploading?: boolean;
};

type ListHeaderProps = {
    companyLogo?: string;
};

// Separate action handlers into a custom hook
const useActionHandlers = (
    isConnected: boolean | null,
    currentCompany: Company | undefined,
    setAttendanceDataAsUploaded: (data: AttendenceSheet) => void,
    saveTrainingData: (data: AttendenceSheet) => void,
    getAttendancesData: () => AttendenceSheet[],
    saveAttendancesData: (data: AttendenceSheet[]) => void,
    router: any,
    uploadingRef: React.MutableRefObject<Set<string>>, // keep uploaded project ids
    setIsUploading: React.Dispatch<React.SetStateAction<boolean>>
) => {
    const handleUpload = useCallback(async (currentProject: AttendenceSheet) => {
        if (!isConnected) {
            Alert.alert('No Internet Connection', 'Please connect to the internet to upload data.');
            return;
        }
        setIsUploading(true);
        const projectId = currentProject?.date;
        if (uploadingRef.current.has(projectId as string)) return;
        uploadingRef.current.add(projectId as string);

        try {
            const { uploaded, ...rest } = currentProject;

            const uploadPromises = await Promise.all([
                Promise.all(currentProject?.photos.map(photo =>
                    uploadToS3(photo, `training-${photo.split('/').pop()}`,
                        currentCompany?.company_bucket as string, 'image/jpeg')
                )),
                Promise.all(currentProject?.trainers?.map(async t => ({
                    ...t,
                    signature: await uploadToS3(t.signature,
                        `training-${t.signature.split('/').pop()}`,
                        currentCompany?.company_bucket as string, 'image/jpeg'),
                    trainer_proof_of_competency: await uploadToS3(t.trainer_proof_of_competency,
                        `training-${t.signature.split('/').pop()}`,
                        currentCompany?.company_bucket as string, 'application/pdf'),
                }))),
                Promise.all(currentProject?.participants?.map(async p => ({
                    ...p,
                    signature: await uploadToS3(p.signature,
                        `training-${p.signature.split('/').pop()}`,
                        currentCompany?.company_bucket as string, 'image/jpeg')
                }))),
                uploadToS3(currentProject?.report_url, `training-${currentProject?.report_url.split('/').pop()}`,
                    currentCompany?.company_bucket as string, 'application/pdf'),
            ]);

            const [photosUrls, newtrainers, newparticipants] = uploadPromises;

            const response = await uploadResource('inspection_data', {
                project_id: rest?.training_id,
                project_data: {
                    ...rest,
                    photos: photosUrls,
                    trainers: newtrainers,
                    participants: newparticipants,
                },
            }, 'trainings');

            if (response) {
                setAttendanceDataAsUploaded(currentProject);
                handleDelete(currentProject);
                Alert.alert('Success', 'Successfully uploaded attendance data.');
            }
        } catch (error) {
            console.error('Upload training attendance sheet error:', error);
            Alert.alert('Error', 'Failed to upload data. Please try again later.');
        } finally {
            setIsUploading(false);
            uploadingRef.current.delete(projectId as string);
        }
    }, [isConnected, setAttendanceDataAsUploaded, currentCompany]);

    const handleEdit = useCallback((currentProject: AttendenceSheet) => {
        saveTrainingData(currentProject);
        router.push(`/edit-training/${currentProject?.training_id}`);
    }, [router, saveTrainingData]);

    const handleDelete = useCallback((currentProject: AttendenceSheet) => {
        const newAttendanceSheetData = getAttendancesData()?.filter(
            (f) => f.date !== currentProject?.date
        );
        saveAttendancesData(newAttendanceSheetData);
    }, [getAttendancesData, saveAttendancesData]);

    return { handleUpload, handleEdit, handleDelete };
};

// Optimized DraftItem component
const DraftItem = React.memo(({
    item,
    onUpload,
    onEdit,
    onDelete,
    isUploading
}: DraftItemProps) => {
    const handleDropdownPress = useCallback((value: string) => {
        switch (value) {
            case 'upload':
                onUpload(item);
                break;
            case 'edit':
                onEdit(item);
                break;
            case 'delete':
                onDelete(item);
                break;
        }
    }, [item, onUpload, onEdit, onDelete]);

    return (
        <View className="rounded-[8px] mx-4 my-1 overflow-hidden">
            <SettingsItem isLast={false} textStyle="justify-self-end">
                <View className="flex-row items-center justify-between w-full">
                    <View className="flex-row items-center justify-between w-full p-1 flex-wrap">

                        {isUploading && <ActivityIndicator size={'small'} color={'gray'} />}

                        <Text className="text-muted font-bold text-[15px] text-gray-500"
                            // numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {item.title.substring(0, 35) + (item.title.length > 35 ? '...' : '')}
                        </Text>
                        <View className="">
                            <CustomDropdown
                                handlePress={handleDropdownPress}
                                containerStyles="bg-gray-100 rounded-full items-center justify-center"
                                icons="ellipsis-vertical"
                                deleteF="Delete"
                                edit="Edit"
                                upload="Upload"
                            // isUploading={isUploading}
                            />
                        </View>
                    </View>
                </View>
            </SettingsItem>
        </View>
    );
});

// Optimized ListHeader component
const ListHeader = React.memo(({ companyLogo }: ListHeaderProps) => (
    <View className="px-4">
        <View className="justify-between items-center flex-row">
            <Text className="text-xl font-psemibold">
                Draft attendance sheets.
            </Text>
            <View className="mt-1.5">
                <Image
                    source={companyLogo ? { uri: companyLogo } : images.senimalogo}
                    resizeMode="contain"
                    className="w-14 h-14 rounded-full"
                />
            </View>
        </View>
        <View className="h-0.5 border border-gray-300 w-full bg-primary" />
    </View>
));

// Main component
export const DraftsList: React.FC = () => {
    const router = useRouter();
    const { isConnected } = useNetInfo();
    const uploadingRef = useRef<Set<string>>(new Set());
    const [currentCompany, setCurrentCompany] = useState<Company>();
    const [isUploading, setIsUploading] = useState(false);

    const {
        setAttendanceDataAsUploaded,
        saveAttendancesData,
        getAttendancesData,
    } = useAttendanceDataStore();

    const { saveProjectData: saveTrainingData } = useEditProjectDataStore();
    const { getCompany } = useCompanyStore();

    useEffect(() => {
        const company = getCompany();
        if (company && !currentCompany) {
            setCurrentCompany(company);
        }
    }, [currentCompany, getCompany]);

    const { handleUpload, handleEdit, handleDelete } = useActionHandlers(
        isConnected,
        currentCompany,
        setAttendanceDataAsUploaded,
        saveTrainingData,
        getAttendancesData,
        saveAttendancesData,
        router,
        uploadingRef,
        setIsUploading
    );

    const drafts = useMemo(() => {
        return getAttendancesData().filter(item => !item.uploaded);
    }, [getAttendancesData]);

    const renderItem: ListRenderItem<AttendenceSheet> = useCallback(({ item }) => (
        <DraftItem
            item={item}
            onUpload={handleUpload}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isUploading={isUploading}
        />
    ), [handleUpload, handleEdit, handleDelete]);

    const keyExtractor = useCallback((item: AttendenceSheet) =>
        item?.date.toString() || Math.random().toString(), []);

    const companyLogo = useMemo(() => getCompany()?.company_logo, [getCompany]);

    const ListHeaderMemo = useCallback(() =>
        <ListHeader companyLogo={companyLogo} />, [companyLogo]);

    const ListEmptyMemo = useCallback(() => (
        <EmptyState
            title="No Training Project attendance sheet drafted"
            subtitle="Please fill a new attendance and save it to drafts."
            label="Go back projects..."
            subtitleStyle="text-[14px] text-center font-psemibold"
            route="/(management)/(trainings)"
        />
    ), []);

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={drafts}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                ListHeaderComponent={ListHeaderMemo}
                ListEmptyComponent={ListEmptyMemo}
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={() => null}
                    />
                }
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={10}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});