//libraries
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";

//constants
import { Colors, icons } from "../constants";

type FProps = {
  title: string;
  value: string;
  placeholder: string;
  handleChangeText: (str: string) => void;
  inputStyle: string;
}

const FormField = ({
  title,
  value,
  placeholder,
  handleChangeText,
  inputStyle,
}: FProps) => {
  const [showPasswd, setShowpwd] = useState(false);

  return (
    <View className="space-y-2">
      <Text className="text-base  font-semibold">{title}</Text>

      <View className="border-0.5  rounded-lg w-full 
      px-4  items-center  flex-row justify-between">
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={handleChangeText}
          placeholderTextColor={"#404757"}
          secureTextEntry={title === "Password" && !showPasswd}
          className=" font-pregular mt-0.5 p-2 flex-1 font-psemibold text-base  "
        />
        {title === "Password" && (
          <TouchableOpacity
            // name={showPasswd ? "eye-off" : "eye"}
            // size={18}
            // color="#7b7b8b"
            onPress={() => setShowpwd((value) => !value)}
          >
            <Image
              source={!showPasswd ? icons.eye : icons.eyeHide}
              className="w-6 h-6"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default FormField;
