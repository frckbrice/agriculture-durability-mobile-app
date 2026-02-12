import * as React from 'react';

// libraries
import { Text, View, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";


// constants
import { images } from "../constants";
import CustomButton from "../components/custom-button";

// context
// import { useAppState } from '@/context/global-provider';
import { useAuth } from '@clerk/clerk-expo';

import { requestLocationPermission } from '@/lib/functions';
import { ActivityIndicator } from 'react-native';
import { usePersistentAuth } from '@/hooks/use-persistent-authentication-hook';

export default function Index() {
    // const { userType } = useAppState();

    const router = useRouter();
    const [isReady, setIsReady] = React.useState(false);
    const { sessionId, isSignedIn } = useAuth();
    const { isSignedInPersist, isRestoring } = usePersistentAuth();


    console.log("from main index page, isSignedIn: ", isSignedIn);
    console.log("from main index page, offline SignedIn: ", isSignedInPersist);
    console.log("from main index page, who is isReady", isReady);

    const initializeApp = React.useCallback(async () => {        // verify location enabled and process according to.
        const permissionGranted = await requestLocationPermission();
        if (permissionGranted) {
            setIsReady(true);
        }
    }, [requestLocationPermission, setIsReady]);

    React.useEffect(() => {
        initializeApp();
    }, [sessionId]);

    React.useEffect(() => {
        if (!isRestoring && isReady && (isSignedIn || isSignedInPersist)) {
            router.replace('/(modals)/select-chapter');
        }
    }, [isRestoring, isReady, isSignedIn, isSignedInPersist]);

    if (isRestoring || !isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
                <Text>loading data...</Text>
            </View>
        );
    }

    const handleGetStarted = () => {
        if (isSignedIn || isSignedInPersist) {
            router.replace('/(modals)/select-chapter');
        } else {
            router.push("/sign-in");
        }
    };

    return (
        <SafeAreaView className=" h-full">
            <ScrollView contentContainerStyle={{ height: "100%" }}>
                <View className="w-full justify-center items-center px-4 min-h-[85vh]">
                    <Image
                        source={images.senimalogo}
                        className="max-w-[320px] w-full h-[200px]"
                        resizeMode="contain" // contain the image between its w and h
                    />

                    <View className="relative mt-16">
                        <Text className="text-3xl  font-bold text-center">
                            Discover Endless Possibilities with{" "}
                            <Text className="">Senwisetool</Text>
                        </Text>

                        {/* design of the image under the name */}
                        <Image
                            source={images.path}
                            className="w-[136px] h-[15px] absolute -bottom-2 -right-8"
                            resizeMode="contain"
                        />
                    </View>

                    <Text className="text-lg font-pregular mt-7 text-center">
                        We help you collect, save and use your data.
                    </Text>

                    {/* custom button */}
                    <CustomButton
                        title="Get started"
                        handlePress={() => handleGetStarted()}
                        containerStyles="
                        w-full mt-7 font-bold border 
                        border-lightGray
                         bg-primary 
                         "
                        textStyles='text-white'
                    />
                </View>
            </ScrollView>

            {/* status bar at the top of the screen */}
            {/* <StatusBar backgroundColor="#161622" style="dark" /> */}
        </SafeAreaView>
    );
}
