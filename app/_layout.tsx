
// libraries
import React, { useState } from "react";
import { SplashScreen, Stack, useSegments } from "expo-router";
// special hook used to load the font
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { ClerkProvider, ClerkLoaded, useAuth, useUser } from '@clerk/clerk-expo';
import { ActivityIndicator, Image, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store'
import { Ionicons } from "@expo/vector-icons";
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';
import { debounce } from 'lodash';

// local import 
import { AppStateProvider, useAppState } from "../context/global-provider";
import { Colors } from "@/constants";
import { UserInactivityProvider } from "@/context/user-inactivity";

import { tokenCache } from "@/store/persist-token-cache";
import { PortalHost } from '@rn-primitives/portal';

import { useUserStore } from "@/store/user-store";
import { usePersistentAuth } from "@/hooks/use-persistent-authentication-hook";
import { queryClient } from "@/lib/react-query-client";


// prevent SplashScreen from auto hiding before the fonts are loaded
SplashScreen.preventAutoHideAsync();

// tanstack client;
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

const debouncedNavigate = debounce((router, path) => {
    router.replace(path);
}, 1000);


if (!publishableKey) {
    throw new Error(
        'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
    )
}

export function RootLayout() {
    const [loaded, error] = useFonts({
        "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
        "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
        "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
        "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
        "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
        "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
        "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
        "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
    });

    // get our position in the route stack
    // const segments = useSegments();
    const router = useRouter();
    const { userType } = useAppState();
    const { clearUser } = useUserStore();
    const { isLoaded, getToken, sessionId, isSignedIn } = useAuth();
    const { isRestoring, isSignedInPersist, clearPersistentAuth } = usePersistentAuth();
    const [errorState, setErrorState] = useState<Error | null>(null);
    const currentSegment = useSegments();
    const [newError, setNewError] = useState(null);


    useEffect(() => {
        if (errorState) throw new Error(errorState.message);
        if (loaded) {
            SplashScreen.hideAsync(); // to hide splash screen on android only.
        }

        getToken().then((token) => {
            if (token) {
                console.log("token exist: ", token)
                tokenCache.saveToken("token", token);
            }
        })
    }, [loaded, error]);

    useEffect(() => {
        // If not signed in, clear user data and redirect
        if (!isSignedIn && !isSignedInPersist) {
            setTimeout(() => {
                // redirect to correct segment
                router.push('/');
            }, 2000)
        }

    }, [isSignedIn, isSignedInPersist]);

    // check use load from clerk and  Loading state

    if (!isLoaded || isRestoring) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }



    return (
        <>
            <Stack screenOptions={{ headerShadowVisible: false, headerShown: false }}>

                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(admin)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(agriculture)/index" options={{ headerShown: false }} />
                <Stack.Screen name="(environment)/index" options={{ headerShown: false }} />
                <Stack.Screen name="(income-and-responsibilities)/index" options={{ headerShown: false }} />
                <Stack.Screen name="(management)" options={{ headerShown: false }} />
                <Stack.Screen name="(socials)/index" options={{ headerShown: false }} />
                <Stack.Screen
                    name="(traceability)"
                    options={{
                        headerShown: false,
                        headerTitle: 'Traceability',
                        headerLeft: () => (
                            <TouchableOpacity onPress={() => router.push('/(modal)/select-chapter')}>
                                <Ionicons name="arrow-back" size={34} color={'white'} />
                            </TouchableOpacity>
                        ),
                    }} />
                <Stack.Screen
                    name="(modals)"
                    options={{
                        headerShown: false,


                    }}
                />
                <Stack.Screen name="inspection/[inspection_id]" options={{ headerShown: false }} />
                <Stack.Screen name="mapping/[mapping_id]" options={{ headerShown: false }} />
                <Stack.Screen name="training/[training_id]" options={{ headerShown: false }} />
                <Stack.Screen name="edit-inspection/[inspection_id]" options={{ headerShown: false }} />
                <Stack.Screen name="edit-mapping/[mapping_id]" options={{ headerShown: false }} />
                <Stack.Screen
                    name="privacy-policy"
                    options={{
                        // headerShown: false,
                        headerTitle: 'Senwisetool Privacy Policy',
                        headerStyle: {
                            backgroundColor: Colors.primary
                        },

                        headerLeft: () => (
                            <TouchableOpacity
                                className="w-16 h-16 
                                    items-center justify-center
                                      rounded-full
                                      p-2 px-0
                                     "
                                onPress={() => router.replace('/')}>
                                <Ionicons name="arrow-back" size={24} color={'black'} />
                            </TouchableOpacity>
                        ),
                    }} />
                <Stack.Screen name="edit-training/[training_id]" options={{ headerShown: false }} />
            </Stack >
            <PortalHost />
        </>
    );
}

export default function RootProvider() {
    return (
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} >
            <ClerkLoaded>
                <QueryClientProvider client={queryClient}>
                    <AppStateProvider>

                        {/* set user to re-authenticate after period of inactivity: the app is inactive */}
                        <UserInactivityProvider>
                            <RootLayout />
                        </UserInactivityProvider>
                    </AppStateProvider>
                </QueryClientProvider>
            </ClerkLoaded>
        </ClerkProvider>
    )
}
