

// Dropdown.tsx
import { Farmer } from '@/interfaces/types';
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ScrollView } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { fetchFarmersByName } from '@/lib/api';
import { debounce } from 'lodash';
import { ActivityIndicator } from 'react-native';


interface DropdownProps {
    items: Farmer[];
    placeholder: string;
    onChange?: (selectedItem: Farmer) => void;
    setCreateNewFarmer?: React.Dispatch<React.SetStateAction<boolean>>
    orientation?: string;
    isLoading?: boolean
}

const Dropdown: React.FC<DropdownProps> = ({
    items,
    placeholder,
    onChange,
    setCreateNewFarmer,
    isLoading
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Farmer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [farmers, setFarmers] = useState(items || []);


    // Debounced version of the search function for performance purposes of api use.
    const searchFarmers = useCallback(
        debounce(async (searchTerm: string) => {
            let results: Farmer[] = [];
            // check locally available farmer before making api search.
            if (items?.some(item => item?.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()))) {
                results = items?.filter(item =>
                    item?.farmer_name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            } else {
                try {
                    // make api search request
                    results = await fetchFarmersByName(searchTerm) ?? [];
                } catch (error) {
                    console.error(`\n\n Failed to fetch Farmers by name: ${error}`);
                }
            }
            setFarmers(results);

            // if now farmer for this location, we create a new one.
            if (farmers?.length === 0) {
                setCreateNewFarmer?.(true);
            }

        }, 400),
        [searchTerm, fetchFarmersByName]
    );
    const toggleDropdown = () => {
        setIsOpen((prev) => !prev);
        if (!isOpen) {
            setSearchTerm(''); // Clear the search term when opening
            setFarmers(items);
        }
    };

    // get the selected Item
    const handleSelectItem = (item: Farmer) => {
        setSelectedItem(item);

        onChange && onChange(item); // take curent farmer item and set it to parent compoentn
        setIsOpen(false);
    };

    // Call the debounced search function
    const handleSearchChange = (text: string) => {
        setSearchTerm(text);
        try {
            searchFarmers(searchTerm);
        } catch (error) {
            console.error('Error searching farmers:', error);
        }
    };

    return (
        <View className=" mx-2 rounded w-full">
            <TouchableOpacity
                className=" border-gray-400 px-4 p-2 rounded w-fit flex-row  justify-end items-center gap-2"
                onPress={toggleDropdown}
            >
                <Text className='font-bold text-black-200'>{selectedItem ? selectedItem.farmer_name : placeholder}</Text>
                {isLoading ? <ActivityIndicator size="small" color="gray" /> : <Ionicons name='arrow-down-circle-sharp' size={20} color="gray" />}
            </TouchableOpacity>
            {isOpen && (
                <View className="absolute translate-y-8 z-10
                 bg-white border
                  border-gray-400
                  m-2 rounded shadow-lg w-[340px]">
                    <TextInput
                        className="border-b border-gray-400 p-2"
                        placeholder="Search..."
                        value={searchTerm}
                        onChangeText={(text) => handleSearchChange(text)}
                    />
                    <FlatList

                        data={farmers?.length ? farmers : items as Farmer[]}
                        keyExtractor={(item) => item.farmer_id as string}
                        renderItem={({ item }) => {

                            return (
                                <TouchableOpacity
                                    className="p-2 hover:bg-gray-200 border-b border-gray-400"
                                    onPress={() => handleSelectItem(item)}
                                >
                                    <Text className='text-gray-500'>{item.farmer_name}</Text>
                                </TouchableOpacity>
                            )
                        }}
                        // Adjust height if no items found
                        ListEmptyComponent={
                            <View className="p-4">
                                <Text>No farmer found in this location</Text>
                            </View>
                        }
                    />
                </View>
            )}
        </View>
    );
};

export default Dropdown;
