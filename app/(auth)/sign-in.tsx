// libraries
import React, { useState } from "react";
import { Image, ScrollView, Text, View, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router'

//constants
import { images } from "../../constants";

// local components
import FormField from "../../components/form-field";
import CustomButton from "../../components/custom-button";

//local functions


// context

import { tokenCache } from "@/store/persist-token-cache";
import { usePersistentAuth } from "@/hooks/use-persistent-authentication-hook";


// will be used as custom component
type SProps = {
  agentCode: string;
  email: string;
  pwd: string;
}

export default function SignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('');
  const [isSubmiting, setIsSubmiting] = React.useState(false);
  const [userCode, setUserCode] = useState("");
  const { isSignedInPersist } = usePersistentAuth();

  // Add effect to check persistent auth
  React.useEffect(() => {
    if (isSignedInPersist) {
      router.replace('/(modals)/select-chapter');
    }
  }, [isSignedInPersist]);

  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) {
      return
    }


    console.log({
      emailAddress,
      userCode,
      password
    })


    if (!emailAddress || !password || !userCode) {
      return Alert.alert("Error", "Please fill out all the fields")
    }
    setIsSubmiting(true);
    try {
      // Attempt Clerk authentication
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {

        //   await Promise.all([
        //     tokenCache.saveToken("clerk_session_id", signInAttempt.createdSessionId),
        //     tokenCache.saveToken("email_address", emailAddress),
        //     tokenCache.saveToken("user_code", userCode)
        // ]);

        tokenCache.saveToken("clerk_session_id", signInAttempt.createdSessionId as string)
          .then(() => console.log("session saved"))
          .catch(err => console.error(err)),
          tokenCache.saveToken("email_address", emailAddress)
            .then(() => console.log("user email saved"))
            .catch(err => console.error(err)),
          tokenCache.saveToken("user_code", userCode)
            .then(() => console.log("user code saved"))
            .catch(err => console.error(err));

        // Set the active session
        await setActive({ session: signInAttempt.createdSessionId })

        // Navigate to the next screen
        return router.replace("/(modals)/select-chapter");
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2))
        // Handle incomplete sign-in
        Alert.alert("Sign-in Error", "Unable to complete sign-in. Please try again.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2))
      // Handle sign-in error (show error to user)
      Alert.alert("Sign-in Error", err instanceof Error ? err.message : "An unknown error occurred");
      if (err?.clerkError && err.errors[0]?.code === 'session_exists')
        return router.replace("/(modals)/select-chapter");
    } finally {
      setIsSubmiting(false);
    }
  }, [isLoaded, emailAddress, password, userCode])

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
              className="w-[115px] h-[50px]"
            />
          </View>
          {/* form fields  */}
          <Text className="text-xl  text-center font-bold mt-5 mb-3 font-psemibold">
            Add Farmer Identifier or Code
            {/* <Text className="text-sm text-green-600">"IF" any management project.</Text> */}
          </Text>
          <FormField
            title={"project code"}
            value={userCode}
            placeholder="Enter collector project code "
            handleChangeText={(code: string) => setUserCode(code)}
            inputStyle="flex  font-psemibold  placeholder:text-primary text-gray-300 "
          />
          <View className=" mt-10  justify-center items-center">
            <View className="h-0.5 w-[60%] bg-gray-300  " />
          </View>
          {/* separator */}
          <Text className="text-2xl  text-center font-bold mt-10 font-psemibold">
            Log In
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
            inputStyle="flex  font-psemibold  placeholder:text-primary"
          />
          <CustomButton
            title="Sign In"
            handlePress={onSignInPress}
            isLoading={isSubmiting}
            containerStyles="my-6 bg-black-200  rounded-xl  justify-center items-center p-4 py-2"
            textStyles='text-white text-muted font-bold text-xl '
          />

          {/* Privacy Policy Link */}
          <Link href="/privacy-policy" asChild>
            <TouchableOpacity>
              <Text className="text-center text-blue-500 underline mt-4">
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
