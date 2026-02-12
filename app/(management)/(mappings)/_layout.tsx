import React from 'react';
import {
    createMaterialTopTabNavigator,
    MaterialTopTabNavigationOptions,
    MaterialTopTabNavigationEventMap
} from "@react-navigation/material-top-tabs";

import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import { Colors } from '@/constants';
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

    return (
        <MaterialTopTabs screenOptions={{
            //     tabBarActiveTintColor: '#000',
            //     tabBarInactiveTintColor: 'gray',
            tabBarLabelStyle: {
                fontSize: 14, fontWeight: 'bold',
                textTransform: 'capitalize', padding: 0
            },
            tabBarStyle: {
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 0,
            },
            tabBarIndicatorStyle: {
                backgroundColor: Colors.background,
            },
            lazy: true, // Add lazy loading
            lazyPreloadDistance: 1

        }}
            initialRouteName="index"
        >
            <MaterialTopTabs.Screen name="index" options={{ title: 'Mappings', lazy: true }} />
            {/* <MaterialTopTabs.Screen name="[project_id]" options={{ title: 'Mapping-form' }} /> */}
            <MaterialTopTabs.Screen name="drafted-project" options={{ title: 'Drafts', lazy: true }} />
            <MaterialTopTabs.Screen name="sent-projects" options={{ title: 'Uploaded', lazy: true }} />
        </MaterialTopTabs>
    )
} 
