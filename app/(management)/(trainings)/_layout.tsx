import React from 'react';
import {
    createMaterialTopTabNavigator,
    MaterialTopTabNavigationOptions,
    MaterialTopTabNavigationEventMap
} from "@react-navigation/material-top-tabs";

import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TouchableOpacity, View } from 'react-native';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
    MaterialTopTabNavigationOptions,
    typeof Navigator,
    TabNavigationState<ParamListBase>,
    MaterialTopTabNavigationEventMap
>(Navigator);

export default function TrainingLayout() {

    const [hasError, setHasError] = React.useState(false);

    if (hasError) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text>Something went wrong in the tab navigation.</Text>
                <TouchableOpacity
                    onPress={() => setHasError(false)}
                    className="mt-4 bg-blue-500 px-4 py-2 rounded"
                >
                    <Text className="text-white">Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const height = useSafeAreaInsets()

    return (
        <MaterialTopTabs
            screenOptions={{
                //     tabBarActiveTintColor: '#000',
                //     tabBarInactiveTintColor: 'gray',
                tabBarLabelStyle: {
                    fontSize: 14,
                    fontWeight: 'bold',
                    textTransform: 'capitalize',
                    padding: 0
                },
                //     tabBarStyle: {
                //         width: "100%",
                //     }

            }}
        // style={{ marginTop: 100 }}
        >
            <MaterialTopTabs.Screen name="index" options={{ title: "projects", }} />
            <MaterialTopTabs.Screen name="draft-trainings" options={{ title: "drafts" }} />
            <MaterialTopTabs.Screen name="sent-projects" options={{ title: "Sent" }} />
        </MaterialTopTabs>
    )
} 
