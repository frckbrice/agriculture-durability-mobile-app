import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { NativeWindStyleSheet } from "nativewind";
import { Image, TouchableOpacity } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from 'expo-status-bar';
import { useCompanyStore } from '@/store/current-company-store';
import { Company } from '@/interfaces/types';


NativeWindStyleSheet.setOutput({
  default: "native",
});

export default function Layout() {



  const router = useRouter();

  // redirect user to senwisetoo.com when the user click on the logo
  const handleRedictToWebsite = () => {
    router.push('https://www.senwisetool.com');
  }

  return (
    <>
      <Stack screenOptions={{
        headerTitle: '',
        headerLargeTitleShadowVisible: true,
        // headerStyle: {
        //   backgroundColor: ''
        // },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerLeft: () => (
          <TouchableOpacity
            className="w-16 h-16 
          items-center justify-center
           mr-3 rounded-full

            p-2
           "
            onPress={() => handleRedictToWebsite()}>
            <Image
              source={require('@/assets/images/icon.png')}
              resizeMode="contain"
              className="w-[36px] h-[36px] rounded-full"
            />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            className="w-16 h-16 
        items-center justify-center
          rounded-full
          p-2
         "
            onPress={() => router.push('/(modals)/account')}>
            <Ionicons name="settings" size={30} color={'white'} />
          </TouchableOpacity>
        ),
      }} >
        <Stack.Screen
          name="lock"
          options={{
            headerShown: false,
            animation: 'none',
          }}
        />
        <Stack.Screen
          name="choose-workspace"
          options={{
            presentation: 'modal',
            headerShown: false,
            // animation: 'none'
            headerLeft: () => (
              <TouchableOpacity onPress={router.back}>
                <Ionicons name="arrow-back" size={34} color={'white'} />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="account"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            title: '',
            headerTransparent: true,
            headerLeft: () => (
              <TouchableOpacity onPress={router.back}>
                <Ionicons name="close-outline" size={34} color={'white'} />
              </TouchableOpacity>
            ),
          }} />
        <Stack.Screen
          name="select-chapter"
          options={{
            presentation: 'modal',
            animation: 'fade',
            title: '',
            headerTransparent: true,
            // headerRight: () => (
            //   <TouchableOpacity onPress={router.back}>
            //     <Ionicons name="settings-outline" size={34} color={'black'} />
            //   </TouchableOpacity>
            // ),
          }} />
      </Stack>
      <StatusBar style="dark" networkActivityIndicatorVisible />
    </>)
}