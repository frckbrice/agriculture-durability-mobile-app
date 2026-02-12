// libs import
import { View, Text, FlatList, RefreshControl, StyleSheet, } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFarmerDataStore } from "@/store/farmer-data-storage";
//localconstant

//local components
import EmptyState from "../../empty-state";

//local local functions
import SettingsItem from "@/components/setting-items";
import { FarmerData } from "@/interfaces/types";
import CustomDropdown from "@/components/drop-down";
import { ListHeader } from "./list-header";
//contentContainerStyle={{ paddingTop: headerHeight, flex: 1 }

const SentProjectDataForInspections = () => {
    const [refreshing, setRefreshing] = useState(false);
    // pull latest posts
    const [farmersDataToQueu, setFarmersDataToQueu] = useState<FarmerData[]>([]);
    const [selectedFarmerData, setSelectedFarmerData] = useState<FarmerData | null>(null);
    const router = useRouter();

    const mounted = useRef(false);

    // get farmer storage elements
    const {
        saveFarmersData,
        getFarmersData,
        clearFarmerData,
        setFarmerDataAsUploaded
    } = useFarmerDataStore();

    useEffect(() => {
        mounted.current = true;
        getAllProjectTobeUploaded();
        return () => {
            mounted.current = false;
        }
    }, [])


    const getAllProjectTobeUploaded = () => {
        // Load queue from storage on component mount
        const storedQueue = getFarmersData();

        if (storedQueue.length && mounted.current) {
            // get only uploaded files
            const uploadedFarmersData = storedQueue.filter((data) => data.uploaded);
            setFarmersDataToQueu(uploadedFarmersData);
            console.log('🚀 ~ storedQueue uploaded:', storedQueue);
        }
    }

    // acting o dropdown press
    const handlePressAction = async (str: string) => {

        if (str === 'delete') {
            // remove the concerned famer data from the list and store the rest
            const newFarmersData = farmersDataToQueu.filter((f) => f.project_data?.metaData.farmer_contact !== selectedFarmerData?.project_data?.metaData?.farmer_contact);
            saveFarmersData(newFarmersData);
            clearFarmerData();
        }
    }

    const onRefresh = () => {
        getAllProjectTobeUploaded()
    }


    return (
        <SafeAreaView className=" h-full">
            <FlatList
                data={farmersDataToQueu} //
                keyExtractor={(item) => item.project_data.metaData.inspection_date as string} // <VideoCard video={item} /> tells RN how we'd like to render our list.
                renderItem={({ item }) => {

                    return (
                        <View style={styles.section} >
                            <SettingsItem
                            >
                                <View className="flex-row   items-center justify-between">
                                    <View className="flex-row items-center justify-between  w-full">
                                        {/* <Checkbox
                                            status={checking ? 'checked' : "unchecked"}
                                            onPress={() => getSelectedAttendanceSheet(item)}

                                        /> */}
                                        <Text className="text-muted font-bold text-[15px] p-3">
                                            {item.project_data.metaData.farmer_name} (sent data)
                                        </Text>

                                        <View className="">
                                            <CustomDropdown
                                                handlePress={(value) => handlePressAction(value as string)}
                                                containerStyles=" bg-gray-100 rounded-full items-center justify-center"
                                                icons={'ellipsis-vertical'}
                                                deleteF="Delete"
                                            />
                                        </View>
                                    </View>
                                </View>
                            </SettingsItem>

                            {/* <Text>{item.metaData.farmer_name} data</Text> */}
                        </View>
                    )
                }}
                ListHeaderComponent={() => (
                    <ListHeader title=' Sent inspection projects' />
                )}
                // this property displays in case the list of data above is empty. it behave like a fallback.
                ListEmptyComponent={() => (
                    <EmptyState
                        title="No Project "
                        subtitle="You have not uploaded any project yet."
                        label="Back to menu"
                        subtitleStyle="text-[14px] text-center font-psemibold"
                        route="/(management)/(inspections)"
                    />
                )}

                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
        </SafeAreaView>
    )
}

export default SentProjectDataForInspections;


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
