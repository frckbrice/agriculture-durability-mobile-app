import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import CustomButton from '@/components/custom-button';
import { useRouter } from 'expo-router';

const Choose = () => {

    const router = useRouter();

    return (
        <View className=' flex-1 justify-center items-center h-[full] gap-3 '>
            <View className="
        w-full
        justify-center 
        min-h-[83vh]
         px-4 my-6">
                <Text className='text-center text-2xl font-psemibold mb-5'>
                    Choose your Workspace
                </Text>
                <CustomButton
                    handlePress={() => router.push("/(auth)/admin-auth")}
                    title='Admin Workspace'
                    containerStyles=' bg-black-200 my-5 w-full ring border border-gray-500  '
                    textStyles='text-white text-muted font-bold text-lg '
                />
                <CustomButton
                    handlePress={() => router.push("/(auth)/agent-auth")}
                    title='Agent Workspace'
                    containerStyles=' bg-black-200 my-5 w-full ring border border-gray-500  '
                    textStyles='text-white font-bold text-lg '
                />
            </View>

        </View>
    )
}

export default Choose;
