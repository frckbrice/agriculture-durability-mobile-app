// import { View, Text } from 'react-native'

// import { SafeAreaView } from 'react-native';
// import React, { useEffect, useState, memo } from 'react';
// import { useLocalSearchParams } from "expo-router";
// import { getAssignedProjectForm } from '@/lib/api';
// import useApiOps from '@/hooks/use-api';
// import { TextInput } from 'react-native';
// import { Switch } from 'react-native';
// import { useForm, Controller, Control, FieldValues, FieldErrors } from 'react-hook-form';
// import { Project, Requirements } from '@/interfaces/types';
// import { MetaData } from '@/interfaces/types';


// type TMetaData = {
//     metaData: MetaData;
//     control: Control<FieldValues, any>;
//     errors: FieldErrors<FieldValues>
// }

// export default function MetadataForm({ metaData, control, errors }: TMetaData) {


//     return (
//         <>
//             {metaData.map((field: string, index: number) => (
//                 <View key={index} className="mb-4">
//                     <Text className="text-sm font-medium text-gray-700 mb-1">{field}</Text>
//                     <Controller
//                         control={control}
//                         rules={{ required: true }}
//                         render={({ field: { onChange, onBlur, value } }) => {
//                             console.log("metadata value: " + value)
//                             return (
//                                 <TextInput
//                                     className="w-full p-2 border border-gray-300 rounded-md bg-white"
//                                     onBlur={onBlur}
//                                     onChangeText={onChange}
//                                     value={value}
//                                 />
//                             )
//                         }}
//                         name={`metadata.${field}`}
//                         defaultValue=""
//                     />
//                     {errors[field] && <Text className="text-red-500 text-xs mt-1">This field is required.</Text>}
//                 </View>
//             ))}
//         </>
//     )
// };
