
// libraries
import React, { useState } from "react";
import { Image, ScrollView, Text, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router'
//constants
import { images } from "../../constants";

// local components
import FormField from "../../components/form-field";
import CustomButton from "../../components/custom-button";

//local functions

// context
import { useAppState } from "../../context/global-provider";
import { tokenCache } from "@/store/persist-token-cache";
import { useUserStore } from "@/store/user-store";
import { AppError } from "@/utils/error-class";

// will be used as custom component
type SProps = {
    agentCode: string;
    email: string;
    pwd: string;
}

export default function SignIn() {
    const { isLoaded } = useSignIn();
    const router = useRouter();
    // set the user app state
    const { setUserType } = useAppState()
    //     // persist the logged in user
    const { saveUser } = useUserStore()

    const [userCode, setUserCode] = React.useState('')
    const [isSubmiting, setIsSubmiting] = useState(false);

    console.log("user code: ", userCode)
    const chooseCollectoreWorkSpace = React.useCallback(async () => {
        // router.push('/agent-menu');
        setIsSubmiting(true);
        try {
            const agentCode = await tokenCache.getToken("user_code");
            console.log("agentCode: ", agentCode)
            console.log("user code: ", userCode)

            if (agentCode && agentCode?.toString().includes(userCode)) {
                // keep the state of the current  user
                saveUser({ role: "agent" });
                setUserType({ role: "agent" })
                router.push('/(management)');
            } else {
                // should be routed else where
                Alert.alert("Error", "Invalid Code");
            }
        } catch (error) {
            new AppError(`\n\n Error: ${error}`);
        }
        setIsSubmiting(false);
    }, [])

    return (
        <SafeAreaView className="h-full">
            <ScrollView>
                <View
                    className="
        w-full
        justify-center
        min-h-[83vh]
         px-4 my-6"
                >
                    <View className=" justify-center items-center mb-10">
                        <Image
                            source={images.senimalogo}
                            resizeMode="contain"
                            className="w-[200px] h-[50px]"
                        />
                    </View>

                    <Text className="text-2xl mb-3  text-center text-bold mt-5 font-psemibold">
                        Enter your project code
                    </Text>
                    {/* separator */}
                    <View className=" mb-10  justify-center items-center">
                        <View className="h-0.5 w-[50%] bg-gray-300  " />
                    </View>

                    <FormField
                        title={"project code"}
                        value={userCode}
                        placeholder="Enter collector project code"
                        handleChangeText={(code: string) => setUserCode(code)}
                        inputStyle="flex  font-psemibold  placeholder:text-primary"
                    />

                    <CustomButton
                        title="Sign In"
                        handlePress={chooseCollectoreWorkSpace}
                        isLoading={isSubmiting}
                        containerStyles="my-6 bg-black  rounded-xl min-h-[62px] justify-center items-center p-4"
                        textStyles='text-white text-muted font-bold text-lg '
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
