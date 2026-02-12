// libs
import React from "react";
import { View, Text, Image } from "react-native";
import { Href, router, useRouter } from "expo-router";

// constants
import { images } from "../constants";

// components
import CustomButton from "./custom-button";

type ESProps = {
  title: string;
  subtitle: string;
  label: string;
  route?: string;
  subtitleStyle?: string;
}

function EmptyState({
  title,
  subtitle,
  label,
  subtitleStyle,
  route
}: ESProps) {

  const router = useRouter();
  console.log("from empty state route: ", route);

  return (
    <View className="justify-center items-center px-4 pb-4">
      <Image
        source={images.empty}
        resizeMode="contain"
        className="w-[270px] h-[215px]"
      />
      <View className="mb-5 flex justify-center items-center gap-2">
        <Text className="text-sm font-pmedium ">{title}</Text>
        <Text className={subtitleStyle}>{subtitle}</Text>
      </View>

      {/* Add a button here */}
      <CustomButton
        containerStyles="my-5 w-full ring border border-gray-500  bg-primary"
        title={label}
        handlePress={() => router.replace(`${route}` as string)}
        textStyles="text-white"
      />
    </View>
  );
}

export default EmptyState;
