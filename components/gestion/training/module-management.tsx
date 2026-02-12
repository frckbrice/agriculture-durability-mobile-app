
import React, { memo, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { Trash2 } from 'lucide-react-native';
import { AttendenceSheet } from '@/interfaces/types';

interface ModuleManagementProps {
    availableModules: string[];
    // selectedModules: string[];
    isProjectModules?: boolean;
    setForm: (value: React.SetStateAction<AttendenceSheet>) => void;
}

const ModuleManagement = ({
    availableModules,
    //  selectedModules,
    isProjectModules = false,
    setForm
}: ModuleManagementProps) => {

    const [updatesModules, setUpdatesModules] = React.useState<string[]>([]);    // Handle selecting/deselecting modules
    const handleToggleModule = (module: string): void => {
        const isSelected = updatesModules.includes(module);
        let updatedSelection = [];


        if (isSelected) {
            updatedSelection = updatesModules.filter(m => m !== module); // Remove if already selected
            setUpdatesModules(updatedSelection);
        } else {
            setUpdatesModules(prev => [...prev, module]); // add modules to the constituted list.
        }


    };

    useEffect(() => {
        setForm(prev => ({ ...prev, modules: updatesModules })); // Update the form state with the selected modules
    }, [updatesModules]);

    return (
        <View className="space-y-2">
            {availableModules.map((module, index) => (
                <View key={`module-${index}`} className="flex-row items-center p-2 border rounded">
                    <Checkbox
                        status={updatesModules?.includes(module) ? "checked" : "unchecked"}
                        onPress={() => handleToggleModule(module)}
                    />
                    <Text className="flex-1 ml-2">{module}</Text>
                    {!isProjectModules && (
                        <TouchableOpacity
                            onPress={() => handleToggleModule(module)}
                            className="bg-red-500 p-2 rounded"
                        >
                            <Trash2 size={20} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            ))}
        </View>
    );
};

export default memo(ModuleManagement);
