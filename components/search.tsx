import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Search Screen
const SearchScreen: React.FC = () => {
    const categories = ['Santé', 'Éducation', 'Logement', 'Alimentation'];

    return (
        <SafeAreaView className="h-full bg-gray-900 p-4 py-10">
            <View className="flex-row items-center mb-6">
                <TouchableOpacity>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View className="flex-1 ml-4 bg-gray-800 rounded-lg p-2 flex-row items-center">
                    <Ionicons name="search" size={20} color="gray" />
                    <TextInput
                        className="flex-1 ml-2 text-white"
                        placeholder="Autre"
                        placeholderTextColor="gray"
                    />
                </View>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-6 h-10"
            >
                {categories.map((category, index) => (
                    <TouchableOpacity key={index} className="bg-white rounded-2xl px-4 py-2 mr-2 h-10">
                        <Text>{category}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            <Text className="text-white text-xl mb-4">00 Resultat trouvé</Text>
            {/* Add your search results here */}
        </SafeAreaView>
    );
};

export default SearchScreen;