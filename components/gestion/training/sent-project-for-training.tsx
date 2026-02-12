// libs import
import { View, Text, FlatList, Image, RefreshControl, TouchableOpacity, StyleSheet, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNetInfo } from "@react-native-community/netinfo";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useAttendanceDataStore } from "@/store/training-attendances-data-storage";
//localconstant
import { images } from "../../../constants";

//local components
import EmptyState from "../../empty-state";

//local local functions
import useApiOps from "@/hooks/use-api";
import SettingsItem from "@/components/setting-items";
import { AttendenceSheet } from "@/interfaces/types";
import { Checkbox } from "react-native-paper";
import axios from "axios";
import CustomDropdown from "@/components/drop-down";
import { API_URL } from "@/constants/constants";
import { useCompanyStore } from "@/store/current-company-store";
//contentContainerStyle={{ paddingTop: headerHeight, flex: 1 }

const SentProjectDataForTraining = () => {
    const [refreshing, setRefreshing] = useState(false);
    // pull latest posts
    const [farmersDataToQueu, setFarmersDataToQueu] = useState<AttendenceSheet[]>([]);
    const [selectedAttendanceSheet, setSelectedAttendanceSheet] = useState<AttendenceSheet | null>(null);
    const [checking, setChecking] = useState(false);

    const router = useRouter();

    // get farmer storage elements
    const {
        getAttendancesData,
        saveAttendancesData,
    } = useAttendanceDataStore();

    useEffect(() => {
        getUploadedData();
    }, []);

    const {
        getCompany,
    } = useCompanyStore();

    const getUploadedData = () => {
        // Load queue from storage on component mount
        const storedQueue = getAttendancesData();
        if (storedQueue.length > 0) {
            // get only uploaded files
            const uploadedFarmersData = storedQueue?.filter((data) => data.uploaded);
            setFarmersDataToQueu(uploadedFarmersData);
            console.log('🚀 ~ storedQueue training uploaded data:', storedQueue);
        }
    }


    // acting o dropdown press
    const handlePressAction = async (str: string, projectToDelete: AttendenceSheet) => {

        if (str === 'delete') {
            // remove the concerned famer data from the list and store the rest
            const newFarmersData = farmersDataToQueu.filter((f) => f.date !== projectToDelete?.date);
            saveAttendancesData(newFarmersData);
        }
    }

    const onRefresh = () => {
        getUploadedData();
    };


    // const newList = farmersDataToQueu?.reduce((acc, curr) => {
    //     if (!acc.find((item) => item.training_id === curr.training_id)) {
    //         acc.push(curr);
    //     }
    //     return acc;
    // }, [] as AttendenceSheet[]);

    return (
        <SafeAreaView className=" h-full">
            <FlatList
                data={farmersDataToQueu} //
                keyExtractor={(item) => item.training_id as string} // <VideoCard video={item} /> tells RN how we'd like to render our list.
                renderItem={({ item }) => {
                    return (
                        <View style={styles.section} >
                            <SettingsItem
                            >
                                <View className="flex-row   items-center justify-between">
                                    <View className="flex-row items-center justify-between  w-full">

                                        <Text className="text-muted font-bold text-[15px] p-3">
                                            {item.title.toString().substring(0, 20)}... (sent data)
                                        </Text>

                                        <View className="">
                                            <CustomDropdown
                                                handlePress={(value) => handlePressAction(value as string, item)}
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
                    <View className="px-4">
                        <View className="justify-between items-center flex-row mb-1 ">
                            <View>
                                <Text className="text-xl font-psemibold ">
                                    List of sent farmers data.
                                </Text>

                            </View>
                            <View className="mt-1.5">
                                {getCompany()?.company_logo ? <Image
                                    source={{ uri: getCompany()?.company_logo }}
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
                        {/* search input */}
                        {/* <SearchInput placeholder={"Search for a video topic"} /> */}
                    </View>
                )}
                // this property displays in case the list of data above is empty. it behave like a fallback.
                ListEmptyComponent={() => (
                    <EmptyState
                        title="No Project found"
                        subtitle="Please upload training data to continue."
                        label="Back to menu"
                        subtitleStyle="text-[14px] text-center font-psemibold"
                        route="/(management)/(trainings)"
                    />
                )}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
        </SafeAreaView>
    )
}

export default SentProjectDataForTraining;


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
