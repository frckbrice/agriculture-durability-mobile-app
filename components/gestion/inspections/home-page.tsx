

// import { View, Text, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
// import React, { useCallback, useEffect, useState } from "react";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { FlatList } from 'react-native';
// import { useNetInfo } from "@react-native-community/netinfo";

// // Local imports
// import { Colors } from "../../../constants";
// import EmptyState from "../../../components/empty-state";
// import { fetchResourceByItsID, getAllAssignedProjects } from "../../../lib/api";
// import useApiOps from "../../../hooks/use-api";
// import { Project } from '@/interfaces/types';
// import SettingsItem from '@/components/setting-items';
// import { useProjectInspectionDataStore } from '@/store/project-data-storage -inspection';

// export default function InspectionPage() {
//     const [refreshing, setRefreshing] = useState(false);
//     const [projects, setProjects] = useState<Project[]>([]);
//     const netInfo = useNetInfo();
//     const {
//         saveProjectsData,
//         getProjectsData } = useProjectInspectionDataStore();

//     // API call with proper error handling
//     const {
//         data,
//         refetch,
//         isLoading,
//         error
//     } = useApiOps<Project[]>(() => getAllAssignedProjects('projects'));



//     // Handle data processing: select only inspections project amongs all the projects fetched.
//     useEffect(() => {
//         const processProjects = async () => {
//             try {
//                 if (data?.length) {
//                     const filteredProjects = data.filter((project: Project) =>
//                         project.type?.toString().toLowerCase().includes('_inspection')
//                     );

//                     setProjects(filteredProjects);
//                     saveProjectsData(filteredProjects);
//                 }
//             } catch (error) {
//                 console.error('Error processing projects:', error);
//             }
//         };


//         processProjects();
//     }, []);

//     console.log("data: ", data)
//     // Handle offline mode
//     useEffect(() => {
//         const loadOfflineData = async () => {
//             if (!netInfo.isConnected && !projects.length) {
//                 try {
//                     const offlineProjects = getProjectsData();
//                     if (offlineProjects?.length) {
//                         setProjects(offlineProjects);
//                     }
//                 } catch (error) {
//                     console.error('Error loading offline data:', error);
//                 }
//             }
//         };

//         loadOfflineData();
//     }, [netInfo.isConnected]);

//     const onRefresh = useCallback(() => {
//         if (!isLoading) {
//             setRefreshing(true);
//             refetch()
//                 .catch((error: any) => console.error('Error refreshing:', error))
//                 .finally(() => setRefreshing(false));
//         }
//     }, [isLoading, refetch]);

//     const renderItem = useCallback(({ item }: { item: Project }) => (
//         <View style={styles.container}>
//             <TouchableOpacity style={styles.section}>
//                 <SettingsItem
//                     routing={{ type: "inspection", id: item?.id }}
//                     icon={true}
//                     textStyle='justify-self-end '
//                     moreStyle={true}
//                     className='flex-row '
//                     isLast={false}
//                 >
//                     <Text className='text-muted font-bold text-[13px] text-gray-700 '>
//                         {item.title}
//                     </Text>
//                 </SettingsItem>
//             </TouchableOpacity>
//         </View>
//     ), []);

//     const ListHeader = useCallback(() => (
//         <View className="px-4">
//             <View className="justify-between items-center flex-row">
//                 <Text className="text-xl font-psemibold">
//                     Assigned Inspection projects
//                 </Text>
//             </View>
//             <View className="h-0.5 border border-gray-300 w-full bg-primary" />
//         </View>
//     ), []);

//     if (isLoading) {
//         return (
//             <View style={styles.centerContainer}>
//                 <ActivityIndicator size="large" color={Colors.primary} />
//             </View>
//         );
//     }

//     return (
//         <SafeAreaView style={styles.container}>
//             <FlatList
//                 data={projects.length ? projects : []}
//                 keyExtractor={item => item?.id}
//                 renderItem={renderItem}
//                 ListHeaderComponent={ListHeader}
//                 ListEmptyComponent={() => (
//                     <EmptyState
//                         title="No Inspection Projects found"
//                         subtitle="Please enter the correct project code or switch to another tab below."
//                         label=" back to  Menu"
//                         subtitleStyle="text-[14px] text-center font-psemibold"
//                         route="/(modals)/select-chapter"
//                     />
//                 )}
//                 refreshControl={
//                     <RefreshControl
//                         refreshing={refreshing}
//                         onRefresh={onRefresh}
//                     />
//                 }
//                 initialNumToRender={5}
//                 maxToRenderPerBatch={5}
//                 windowSize={5}
//             // removeClippedSubviews={true}
//             />
//         </SafeAreaView>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//     },
//     centerContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     section: {
//         marginTop: 16,
//         borderRadius: 8,
//         marginHorizontal: 16,
//         overflow: 'hidden',
//     }
// });