
// libs imports
import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// local import
import CustomHeader from '@/components/custom-header';
import { Colors, icons } from '@/constants';
import { Image, TouchableOpacity, View } from 'react-native';



const TabsLayout = () => {

    const router = useRouter();

    return (
        <>
            <Tabs
                initialRouteName='inspections'
                screenOptions={{
                    tabBarActiveTintColor: Colors.background,
                    headerLeft: () => (
                        <TouchableOpacity
                            className='ml-2 rounded-full 
                             p-2 flex justify-center items-center'
                            onPress={() => router.push('/(modals)/select-chapter')}
                        >
                            <Image
                                source={icons.leftArrow}
                                resizeMode="contain"
                                style={{ tintColor: Colors.darkness, marginLeft: 10, width: 20, height: 20 }}
                                className='w-10 h-10'
                            />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity className='px-4' onPress={() => router.push('/(modals)/account')}>
                            <Ionicons name='settings-outline' size={30} color={'black'} />
                        </TouchableOpacity>
                    ),
                    headerTitle: 'ADMINISTRATION WORKSPACE',

                    tabBarBackground: () => (
                        // adding the blur with BlurView component.
                        <BlurView
                            intensity={80}
                            tint='light'
                        // className={` bg-transparent `}
                        // className="bg-[rgb(0,0,0)] flex-1 "
                        />
                    ),
                    tabBarStyle: {
                        backgroundColor: '#232533',
                        borderTopWidth: 0,
                        elevation: 0,
                        position: 'absolute',
                        borderTopRightRadius: 20,
                        borderTopLeftRadius: 20,
                        bottom: 0,
                        left: 0,
                        right: 0,
                    },
                }
                }
            >

                <Tabs.Screen
                    name="inspections"
                    options={{
                        title: 'Inspection',
                        tabBarLabel: "Inspection",
                        tabBarIcon: ({ size, color, focused }: { size: number, color: string, focused: boolean }) => (
                            <Ionicons name="home" size={size} color={color} />
                        ),
                        // header: () => <CustomHeader />,
                        // headerTransparent: true
                    }}
                />
                <Tabs.Screen
                    name="mappings"
                    options={{
                        title: 'Mapping',
                        tabBarLabel: "Mapping",
                        tabBarIcon: ({ size, color, focused }: { size: number, color: string, focused: boolean }) => (
                            <FontAwesome name="th" size={size} color={color} />
                        ),
                        // header: () => <CustomHeader />,
                        // headerTransparent: true
                    }}
                />

                <Tabs.Screen
                    name="trainings"
                    options={{
                        title: 'Training',
                        headerShown: false,
                        tabBarLabel: "Trainings",
                        tabBarIcon: ({ size, color, focused }: { size: number, color: string, focused: boolean }) => (
                            <Ionicons name="woman-sharp" size={size} color={color} />
                        ),
                        // header: () => <CustomHeader />,
                        // headerTransparent: true
                    }}
                />
            </Tabs >
        </>
    )
}

export default TabsLayout;
