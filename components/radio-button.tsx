import React from 'react';
import { View, Text } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { Controller } from 'react-hook-form';

const StatusSelection = ({ control, status }: { control: any, status: any }) => {
    return (
        <View className="mb-4">
            <Text className="font-medium mb-2">Status:</Text>
            <Controller
                control={control}
                name="status"
                render={({ field: { onChange, value } }) => (
                    <RadioButton.Group onValueChange={(newValue) => onChange(newValue)} value={value}>
                        <View className="flex-row justify-between flex-wrap">
                            {Object.keys(status || {}).map((val, ind) => (
                                <View key={ind} className="flex-row items-center mb-2">
                                    <RadioButton value={val} />
                                    <Text className="ml-2">{val}</Text>
                                </View>
                            ))}

                        </View>
                    </RadioButton.Group>
                )}
            />
        </View>
    );
};

export default StatusSelection;

