
// import React, { useState } from 'react';
// import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Switch, } from 'react-native';
// import { useForm, Controller, Control, FieldValues } from 'react-hook-form';
// import { RadioButton } from 'react-native-paper';
// import { useLocalSearchParams } from "expo-router";
// import { getAssignedProjectForm } from '@/lib/api';
// import useApiOps from '@/hooks/use-api';

// import { Project, Requirements } from '@/interfaces/types';

// type TRequirement = {
//     currentRequirement: Requirements;
//     control: Control<FieldValues, any>;
//     setReqData: React.Dispatch<React.SetStateAction<{
//         requirement: string;
//         status: string;
//         comment: string;
//     }[]>>
// }

// export const RenderRequirementForm = ({ currentRequirement, control, setReqData }: TRequirement) => {

//     const [currentReqData, setCurrentReqData] = useState({
//         requirement: "",
//         status: "",
//         comment: "",
//     });

//     return (
//         <View className="mb-6 p-4 bg-white rounded-lg shadow">

//             <Text className="text-lg font-bold mb-2">Requirement: {currentRequirement.number}</Text>
//             <Text className="mb-4">{currentRequirement.principal_requirement}</Text>

//             {/* certification du groupe */}
//             <View>
//                 <Text className="font-medium mb-2">Certification Group:</Text>
//                 {Object.entries(currentRequirement.certif_de_group || {}).map(([key, value]) => (
//                     <View key={key} className="flex-row items-center mb-2">
//                         <Controller
//                             control={control}
//                             name={`certif_de_group.${key}`}
//                             render={({ field: { onChange, value: _val } }) => (
//                                 <Switch
//                                     value={(value === "YES" || value === "yes") ? true : false}
//                                 />
//                             )}
//                         />

//                         <Text className="ml-2">{key}</Text>
//                     </View>
//                 ))}
//             </View>

//             {/* requirement */}
//             <View className="my-4">
//                 <Text className="font-medium mb-2 text-lg">Status:</Text>
//                 <View className="flex-row justify-between flex-wrap">
//                     <View className="flex-row items-center mb-2">
//                         <Controller
//                             control={control}
//                             name="status"
//                             render={({ field: { onChange, value } }) => {
//                                 console.log("currentRequirement.status value: ", value);

//                                 return (
//                                     <RadioButton.Group onValueChange={(newValue: any) => onChange(newValue)} value={value}>
//                                         <View className="flex-row justify-center flex-wrap gap-10">
//                                             {Object.keys(currentRequirement.status || {}).map((val, ind) => (
//                                                 <View key={ind} className="flex-row items-center mb-2 ">

//                                                     <RadioButton
//                                                         value={val}
//                                                         color={'#006d77'}
//                                                     // onPress={() => setCurrentStatus(val as Status)}
//                                                     />
//                                                     <Text className="ml-1">{val}</Text>
//                                                 </View>
//                                             ))}

//                                         </View>
//                                     </RadioButton.Group>
//                                 )
//                             }}
//                         />
//                     </View>
//                 </View>
//             </View>



//             {/* comment */}
//             <View className="mb-4">
//                 <Text className="font-medium mb-2">Comment:</Text>
//                 <Controller
//                     control={control}
//                     name="comment"
//                     render={({ field: { onChange, onBlur, value } }) => (
//                         <TextInput
//                             multiline
//                             numberOfLines={4}
//                             className="w-full p-2 border border-gray-300 flex items-start rounded-md bg-white"
//                             onBlur={onBlur}
//                             onChangeText={onChange}
//                             value={value}
//                         />
//                     )}
//                 />
//             </View>
//         </View>
//     );

// }