//libraries
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { router, usePathname } from "expo-router";

//constants
import { icons } from "../constants";

const SearchInput = ({ initialQuery, placeholder }) => {
  const pathName = usePathname();
  const [query, setQuery] = useState(initialQuery);

  const handleRouting = () => {
    if (!query) {
      return Alert.alert("Missing query", "Please enter a search query");
    }
    if (pathName.startsWith("/search")) {
      router.setParams({ query });
    } else router.push(`/search/${query}`);
  };
  // {"Search for a video topic"}
  return (
    <View
      className="
    border-2
     border-black-200
     rounded-2xl
      w-full px-4 h-16  items-center
      flex-row justify-between space-x-4"
    >
      <TextInput
        placeholder={placeholder}
        className=" font-pregular  mt-0.5 flex-1 font-psemibold text-base "
        value={query}
        onChangeText={(e) => setQuery(e)}
        placeholderTextColor={"#000"} // make it pop just a bit.
        // secureTextEntry={title === "Password" && !showPasswd}
      />
      <TouchableOpacity onPress={handleRouting}>
        <Image source={icons.search} className="w-5 h-5" resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
};

export default SearchInput;
