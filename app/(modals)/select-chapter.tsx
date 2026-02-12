
import {
    View, Text,
    TouchableOpacity, ImageBackground,
    ActivityIndicator
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { cn } from "@/lib/utils";
import { CHAPTERS } from "@/constants/constants";
import { useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@/store/persist-token-cache";
import { useAgentProjects } from "@/hooks/use-agent-projects";


const Chapters = () => {
    const [currentTab, setCurrentTab] = useState(CHAPTERS[0].name);
    const router = useRouter();
    const { getToken } = useAuth();
    const { isLoading, isError, error } = useAgentProjects();

    // const [currentCompany, setCurrentCompany] = useState<Company>({} as Company);
    // const {
    //     getCompany
    // } = useCompanyStore();

    // useEffect(() => {
    //     const company = getCompany();
    //     console.log("\n\n company from inspection header fetched: ")
    //     if (company)
    //         setCurrentCompany(company);
    // }, [getCompany]);

    const loadToken = async () => {
        const token = await getToken();
        if (token) {
            tokenCache.saveToken("token", token);
        }
    };

    useEffect(() => {
        loadToken();
    }, []);

    const isChapterAvailable = (name: string) => {
        return name !== "Agriculture" &&
            name !== "Revenus et responsabilités partagées" &&
            name !== "Environment";
    };

    const moveToPlace = (menu: {
        name: string;
        icon: string;
        route: string;
    }) => {
        if (!isChapterAvailable(menu.name)) {
            return
            // Alert.alert(
            //     'Non available yet.',
            //     'This chapter will be availble very soon.',
            //     [{ text: 'OK', style: 'default' }]
            // );
        }
        setCurrentTab(menu?.name);
        setTimeout(() => {
            router.replace(menu?.route as Href<string>);
        }, 500);
    };

    return (
        <View className="flex-1">
            <ImageBackground
                source={require("@/assets/images/senima.png")}
                className="flex-1 w-full h-full"
                resizeMode="cover"
            >
                <View className="flex-1 bg-black/60">
                    <View className="flex-1 justify-center p-5 w-full">
                        <View className="flex-col justify-between">
                            <View className="p-6 px-3  bg-white/80 rounded-2xl shadow-lg backdrop-blur-md ">
                                {/* Status Bar for Loading/Error */}
                                {(isLoading || isError) && (
                                    <View className={cn(
                                        "mb-4 p-3 rounded-lg flex-row items-center justify-center",
                                        isError ? "bg-red-100" : "bg-blue-100"
                                    )}>
                                        {isLoading && (
                                            <>
                                                <ActivityIndicator color="#1D4ED8" className="mr-2" />
                                                <Text className="text-blue-700 font-medium">
                                                    Loading projects assigned to this agent code ...
                                                </Text>
                                            </>
                                        )}
                                        {isError && (
                                            <>
                                                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                                                <Text className="text-red-700 font-medium ml-2">
                                                    Error loading assigned projects: {error?.message}
                                                </Text>
                                            </>
                                        )}
                                    </View>
                                )}

                                <Text className="text-2xl text-center font-semibold mb-6 text-gray-800">
                                    Your Subscriptions chapters
                                </Text>

                                <View className="space-y-2 ">
                                    {CHAPTERS?.map((menu, index) => {
                                        const available = isChapterAvailable(menu.name);
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                className={cn(
                                                    "border-2 rounded-xl w-full px-4 py-3 items-center flex-row  space-x-4 ",
                                                    available
                                                        ? "border-gray-300 active:bg-blue-50"
                                                        : "border-gray-200 bg-gray-50",
                                                    currentTab === menu.name && available && "bg-blue-500 border-blue-500"
                                                )}
                                                onPress={() => moveToPlace(menu)}
                                            >
                                                <Ionicons
                                                    name={menu.icon as typeof Ionicons.defaultProps}
                                                    size={24}
                                                    color={available ? (currentTab === menu.name ? "white" : "green") : "#9CA3AF"}
                                                />
                                                <View className="flex-1 ">
                                                    <Text
                                                        className={cn(
                                                            "font-bold text-[16px]",
                                                            available
                                                                ? (currentTab === menu.name
                                                                    ? "text-white"
                                                                    : "text-gray-700")
                                                                : "text-gray-400"
                                                        )}
                                                    >
                                                        {menu.name}
                                                    </Text>
                                                    {!available && (
                                                        <Text className="text-gray-400 text-sm ">
                                                            Bientôt disponible
                                                        </Text>
                                                    )}
                                                </View>
                                                {available && (
                                                    <Ionicons
                                                        name="chevron-forward"
                                                        size={20}
                                                        color={currentTab === menu.name ? "white" : "#4B5563"}
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}

                                </View>

                            </View>


                        </View>
                        {/* <View className="bottom-0 absolute flex-row justify-between items-center px-4 py-2 ">
                            <Image
                                source={currentCompany?.company_logo ? { uri: currentCompany?.company_logo } : require('@/assets/images/icon.png')}
                                resizeMode="contain"
                                className="w-14 h-14 rounded-full"
                            />
                        </View> */}
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
};

export default Chapters;