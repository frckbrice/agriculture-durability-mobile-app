
import React from 'react';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { NativeWindStyleSheet } from "nativewind";
import { Text, TouchableOpacity, BackHandler } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from 'expo-status-bar';



NativeWindStyleSheet.setOutput({
  default: "native",
});

export default function Layout() {

  const router = useRouter();
  // reset the registration form
  const goToAccompanyingSheet = () => {
    router.push('/accompanying-sheet');
  };

  const goToTransmissionSheet = () => {
    router.push('/transmission-sheet');
  };

  const goToSaleSlipVSheet = () => {
    router.push('/sale-slip-sheet');
  };

  // Handle Android back button press
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Check if we're on the markets page (index)
        if (router.canGoBack()) {
          router.push('/(modals)/select-chapter');
          return true; // Prevent default behavior
        }
        return false; // Let default behavior happen
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [router])
  );


  return (
    <>
      {/* <Stack screenOptions={{
        headerTitle: 'Traceability',
        headerLargeTitleShadowVisible: true,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerLeft: () => (
          <TouchableOpacity
            className="w-10 h-10 
        items-center justify-center
         mr-3 rounded-full
          bg-gray-300
          p-2
         "
            onPress={() => router.push('/(modals)/select-chapter')}>
            <Ionicons name="arrow-back" size={24} color={'black'} />
          </TouchableOpacity>
        ),
      }} >
        <Stack.Screen
          name="accompanying-sheet"
          options={{
            headerRight: () => (
              <TouchableOpacity
                className="w-16 h-16 
                items-center justify-center
                  rounded-full flex-row
                  p-2
                 "
                onPress={goToTransmissionSheet}>
                <Text>Trs. sheet</Text>
                <Ionicons name="arrow-forward" size={24} color={'black'} />
              </TouchableOpacity>
            ),
            headerLeft: () => (
              <TouchableOpacity
                className="w-16 h-16 
                items-center justify-center
                  rounded-full
                  p-2
                 "
                onPress={() => router.push('/markets')}>
                <Ionicons name="arrow-back" size={24} color={'black'} />
              </TouchableOpacity>
            ),
            headerTitle: 'Accompanying Sheet',
          }} />
        <Stack.Screen name="index"
          options={{
            headerTitle: 'Current Market',
            headerLargeTitleStyle: {
              fontWeight: 'bold',
            },

          }} /> */}

      <Stack screenOptions={{
        headerTitle: 'Traceability',
        headerLargeTitleShadowVisible: true,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerLeft: () => (
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center mr-3 rounded-full bg-gray-300 p-2"
            onPress={() => router.push('/(modals)/select-chapter')}>
            <Ionicons name="arrow-back" size={24} color={'black'} />
          </TouchableOpacity>
        ),
      }} >
        <Stack.Screen
          name="accompanying-sheet"
          options={{
            headerRight: () => (
              <TouchableOpacity
                className="w-16 h-16 items-center justify-center rounded-full flex-row p-2"
                onPress={goToTransmissionSheet}>
                <Text>Trs. sheet</Text>
                <Ionicons name="arrow-forward" size={24} color={'black'} />
              </TouchableOpacity>
            ),
            headerLeft: () => (
              <TouchableOpacity
                className="w-16 h-16 items-center justify-center rounded-full p-2"
                onPress={() => router.push('/markets')}>
                <Ionicons name="arrow-back" size={24} color={'black'} />
              </TouchableOpacity>
            ),
            headerTitle: 'Accompanying Sheet',
          }} />
        <Stack.Screen
          name="index"
          options={{
            headerTitle: 'Current Market',
            headerLargeTitleStyle: {
              fontWeight: 'bold',
            },
          }} />
        <Stack.Screen
          name="receipts"
          options={{
            headerRight: () => (
              <TouchableOpacity
                className="w-16 h-16 
                items-center justify-center
                  rounded-full flex-row
                  p-2
                 "
                onPress={goToAccompanyingSheet}>
                <Text>Acc. sheet</Text>
                <Ionicons name="arrow-forward" size={24} color={'black'} />
              </TouchableOpacity>
            ),
            headerTitle: 'Receipt',
            headerLargeTitleStyle: {
              fontWeight: 'bold',
            },
            headerLeft: () => (
              <TouchableOpacity
                className="w-16 h-16 
                items-center justify-center
                  rounded-full
                  p-2 px-0
                 "
                onPress={() => router.push('/markets')}>
                <Ionicons name="arrow-back" size={24} color={'black'} />
              </TouchableOpacity>
            ),
          }}

        />

        {/* Sale slip sheet */}
        <Stack.Screen
          name="sale-slip-sheet"
          options={{
            headerTitle: 'Borderau de Vente',
            headerLargeTitleStyle: {
              fontWeight: 'bold',
            },
            headerLeft: () => (
              <TouchableOpacity
                className="w-16 h-16 
                items-center justify-center
                  rounded-full
                  p-2
                 "
                onPress={() => router.push('/markets')}>
                <Ionicons name="arrow-back" size={24} color={'black'} />
              </TouchableOpacity>
            ),
          }} />

        {/* Store entry voucher */}
        <Stack.Screen
          name="store-entry-voucher"
          options={{
            headerTitle: 'Bon Entree Magazin',
            headerLargeTitleStyle: {
              fontWeight: 'bold',
            },
            headerLeft: () => (
              <TouchableOpacity
                className="w-16 h-16 
                items-center justify-center
                  rounded-full
                  p-2
                 "
                onPress={() => router.push('/markets')}>
                <Ionicons name="arrow-back" size={24} color={'black'} />
              </TouchableOpacity>
            ),
          }} />

        {/* Transmission section */}
        <Stack.Screen
          name="transmission-sheet"
          options={{
            headerRight: () => (
              <TouchableOpacity
                className="w-16 h-16 
                items-center justify-center
                  rounded-full flex-row
                  p-2
                 "
                onPress={goToSaleSlipVSheet}>
                <Text>sale. s. sheet</Text>
                <Ionicons name="arrow-forward" size={24} color={'black'} />
              </TouchableOpacity>
            ),
            headerTitle: 'Transmission Sheet',
            headerLargeTitleStyle: {
              fontWeight: 'bold',
            },
            headerLeft: () => (
              <TouchableOpacity
                className="w-16 h-16 
                items-center justify-center
                  rounded-full
                  p-2
                 "
                onPress={() => router.push('/markets')}>
                <Ionicons name="arrow-back" size={24} color={'black'} />
              </TouchableOpacity>
            ),
          }}
        />
      </Stack>
      <StatusBar style="dark" networkActivityIndicatorVisible />
    </>)
}
