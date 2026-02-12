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
    // persist the logged in user
    const { saveUser } = useUserStore()
    const [emailAddress, setEmailAddress] = React.useState('')
    const [password, setPassword] = React.useState('');
    const [isSubmiting, setIsSubmiting] = useState(false);


    const chooseAdminWorkspace = React.useCallback(async () => {
        const adminEmail = await tokenCache.getToken("email_address");
        const adminPass = await tokenCache.getToken("password");
        setIsSubmiting(true);
        if (adminEmail === emailAddress && adminPass === password) {
            // keep the state of the current  user
            saveUser({ role: "admin" });
            setUserType({ role: "admin" })
            router.push('/(admin)/home');
        } else {
            // should be routed else where
            Alert.alert("Error", "Invalid credentials")
        }
        setIsSubmiting(false);
    }, [isLoaded, emailAddress, password])

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
                    {/* form fields  */}

                    <View className="h-0.5 w-full bg-lightGray " />
                    {/* separator */}
                    <Text className="text-2xl  text-center text-bold mt-10 font-psemibold">
                        Enter your credentials
                    </Text>


                    <FormField
                        title={"Email"}
                        value={emailAddress}
                        placeholder="Enter your username"
                        handleChangeText={(email: string) => setEmailAddress(email)}
                        inputStyle="flex  font-psemibold  placeholder:text-primary"
                    />

                    <FormField
                        title={"Password"}
                        value={password}
                        placeholder="Enter your password"
                        handleChangeText={(pass: string) => setPassword(pass)}
                        inputStyle=""

                    />
                    <CustomButton
                        title="Sign In"
                        handlePress={chooseAdminWorkspace}
                        isLoading={isSubmiting}
                        containerStyles="my-6 bg-black  rounded-xl min-h-[62px] justify-center items-center p-4"
                        textStyles='text-white text-muted font-bold text-lg '
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
