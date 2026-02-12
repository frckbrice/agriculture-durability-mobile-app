// libs import
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFarmerMappingDataStore } from "@/store/farmer-data-storage";
//localconstant


//local components
import EmptyState from "../../empty-state";

//local local functions

import SettingsItem from "@/components/setting-items";
import { MappingData } from "@/interfaces/types";
import CustomDropdown from "@/components/drop-down";
import { ListHeader } from "../inspections/list-header";
//contentContainerStyle={{ paddingTop: headerHeight, flex: 1 }

const SentProjectDataForMapping = () => {
    const [refreshing, setRefreshing] = useState(false);
    // pull latest posts
    const [farmersDataToQueu, setFarmersDataToQueu] = useState<MappingData[]>([]);
    const mounted = useRef(false);

    // get farmer storage elements
    const {
        getMappingsData,
        saveMappingsData,

    } = useFarmerMappingDataStore();


    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        }
    }, [])
    useEffect(() => {
        getUploadedData();
    }, []);


    const getUploadedData = () => {
        // Load queue from storage on component mount
        const storedQueue = getMappingsData();
        if (storedQueue && mounted.current) {
            // get only uploaded files
            const uploadedFarmersData = storedQueue.filter((data) => data.uploaded === true);
            setFarmersDataToQueu(uploadedFarmersData);
            console.log('🚀 ~ storedQueue mapping uploaded data:', storedQueue);
        }
    };

    // acting o dropdown press
    const handlePressAction = async (action: string, projectToUpload: MappingData) => {

        if (action === 'delete') {
            console.log("\n\n action: " + action);
            // remove the concerned famer data from the list and store the rest
            const newFarmersData = getMappingsData().filter((f) => f.project_data.farmer_ID_card_number !== projectToUpload?.project_data.farmer_ID_card_number);
            saveMappingsData(newFarmersData);
        }
    }

    const onRefresh = () => {
        getUploadedData()
    }

    return (
        <SafeAreaView className=" h-full">
            <FlatList
                data={farmersDataToQueu} //
                keyExtractor={(item) => item?.project_data?.date as string}
                renderItem={({ item }) => {

                    return (
                        <View style={styles.section} >
                            <SettingsItem
                            >

                                <View className="flex-row items-center justify-between p-1 w-full">

                                    <Text className="text-muted font-bold text-[15px]">
                                        {item.project_data.farmer_name}
                                    </Text>

                                    <View className="flex-row items-center justify-end">
                                        {/* dropdown */}
                                        <CustomDropdown
                                            handlePress={(value) => handlePressAction(value as string, item)}
                                            containerStyles=" p-2 bg-gray-100 rounded-full 
                                            items-center justify-center"
                                            icons={'ellipsis-vertical'}
                                            deleteF="Delete"
                                            edit="Edit"
                                        />
                                    </View>
                                </View>

                            </SettingsItem>

                            {/* <Text>{item.metaData.farmer_name} data</Text> */}
                        </View>)
                }}
                ListHeaderComponent={<ListHeader title='Sent mapping projects' />}
                // this property displays in case the list of data above is empty. it behave like a fallback.
                ListEmptyComponent={() => (
                    <EmptyState
                        title="No Project found"
                        subtitle="Please upload mapping data to continue"
                        label="Back to menu"
                        subtitleStyle="text-[14px] text-center font-psemibold"
                        route="/(management)/(mappings)"
                    />
                )}

                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />

        </SafeAreaView>
    )
}

export default SentProjectDataForMapping;


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
