//libraries
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { Component } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants";

export default function AuthLayout() {
  const router = useRouter();

  return (
    <>
      <Stack>
        <Stack.Screen
          name="sign-in"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="agent-auth"

          options={{
            title: 'Agent-Auth',
            headerLeft: () => (
              <TouchableOpacity onPress={router.back}>
                <Ionicons name="arrow-back" size={34} color={Colors.darkness} />
              </TouchableOpacity>
            ),
            headerShown: false,
          }}
        />


        <Stack.Screen
          name="admin-auth"
          options={{
            headerShown: false,
          }}
        />

      </Stack>

      {/* <StatusBar backgroundColor="#161622" style="light" /> */}
    </>
  );
}
