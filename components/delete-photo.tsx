import React from 'react';
import { FlatList, Image, TouchableOpacity, View, Alert } from 'react-native';
import { XCircle } from 'lucide-react-native';

interface PhotoListProps {
    photos: string[];
    onDeletePhoto: (index: number) => void;
}

const PhotoList: React.FC<PhotoListProps> = ({ photos, onDeletePhoto }) => {
    const handleDeletePhoto = (index: number) => {
        Alert.alert(
            "Delete Photo",
            "Are you sure you want to delete this photo?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    onPress: () => onDeletePhoto(index),
                    style: "destructive"
                }
            ]
        );
    };

    const renderPhoto = ({ item, index }: { item: string; index: number }) => (
        <View className="relative mr-2">
            <Image
                source={{ uri: item }}
                className="w-[100px] h-[100px] rounded-lg"
            />
            <TouchableOpacity
                onPress={() => handleDeletePhoto(index)}
                className="absolute -top-2 -right-2 bg-white rounded-full"
                activeOpacity={0.7}
            >
                <XCircle size={24} color="red" />
            </TouchableOpacity>
        </View>
    );

    return (
        <FlatList
            data={photos}
            horizontal
            renderItem={renderPhoto}
            keyExtractor={(_, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            className="py-2"
        />
    );
};

export default PhotoList;