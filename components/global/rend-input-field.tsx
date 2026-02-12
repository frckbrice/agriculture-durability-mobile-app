import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import React from 'react';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledButton = styled(TouchableOpacity);

type TInputType = {
    field: string, label: string, placeholder: string,
    handleInputChange: (value: any) => void
}

const RenderInputField = ({
    field,
    label,
    placeholder,
    handleInputChange
}: TInputType) => (
    <StyledView className="my-1 w-full flex-row flex-wrap items-center">
        <StyledText className="text-sm font-medium text-gray-700">{label}: &nbsp;</StyledText>
        <StyledTextInput
            className=" p-2 border border-gray-200 rounded-md bg-white flex-1 "
            placeholder={placeholder}
            placeholderTextColor=""
            value={field as string}
            onChangeText={(value) => handleInputChange(value)}
        />
    </StyledView>
);


export default RenderInputField;