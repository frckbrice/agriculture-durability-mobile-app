


// import React, { useCallback, useEffect, useRef, useState } from 'react';
// import {
//     View, Text, SafeAreaView,
//     ScrollView, TouchableOpacity, TextInput, Switch,
//     Image,
//     Alert,
//     ActivityIndicator,
// } from 'react-native';
// import {
//     metaDataInitialValue
// } from '@/constants/initial-values';
// import { RadioButton } from 'react-native-paper';

// import { Farmer, FarmerData, FarmerReqType, MetaData, NonConformityInput, ResponseRequirements, TFetchType, InspectionConclusionType, Company } from '@/interfaces/types';
// import { newFarmerRegistration, showUploadButton } from '@/store/mmkv-store';
// import { mock_project } from '@/constants/project-structure';
// import CustomButton from '../../custom-button';
// import * as ImagePicker from 'expo-image-picker';
// import { FlatList } from 'react-native';
// import { styled } from 'nativewind';
// import Dropdown from '../../global/dropdown';
// import useApiOps from '@/hooks/use-api';
// import { getAllFarmersOfThisLocation, getCompanyFarmers } from '@/lib/api';
// import { useRouter } from 'expo-router';
// import PhotoList from '../../delete-photo';
// import { cn } from '@/lib/utils';
// import InspectionSummaryWithStats from './inspection-summary';
// import { uploadToS3 } from '@/lib/functions';
// import SignatureInput from '@/components/global/signatures/signature-capture';
// import { useCompanyStore } from '@/store/current-company-store';



// const StyledView = styled(View);
// const StyledText = styled(Text);
// const StyledTextInput = styled(TextInput);
// const StyledButton = styled(TouchableOpacity);

// interface FarmerDataFormProps {
//     getFarmerData?: (data: FarmerData) => void;
//     project: any;
//     resetFrom?: boolean;
//     currentCompany?: Company;
// }

// export default function ({
//     project,
//     getFarmerData,
//     currentCompany
// }: FarmerDataFormProps) {

//     const [currentRequirement, setCurrentRequirement] = useState(0);
//     const [metaValues, setMetaValues] = useState<MetaData>({
//         ...metaDataInitialValue,
//         inspection_date: new Date(Date.now()).toISOString(),
//     });
//     const [farmerReq, setFarmerReq] = useState<FarmerReqType>({
//         req_number: "",
//         status: "N/A",
//         comment: ''
//     });
//     const [notConformReqs, setNotConformReqs] = useState<NonConformityInput[] | []>([]);
//     const [currentFarmerReqs, setCurrentfarmerReqs] = useState<ResponseRequirements>([]);
//     const nextButtonRef = useRef<TouchableOpacity>(null);
//     const [isDisabled, setIsDisabled] = useState(false);
//     const [farmerPhotos, setFarmerPhotos] = useState<string[]>([]);
//     // const [farmer_id, setFarmer_id] = useState('')
//     const [submited, setSubmited] = useState(false);
//     const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
//     const mounted = useRef(false);
//     const router = useRouter();
//     const [conclusionInspectionData, setConclusionInpectionData] = useState<InspectionConclusionType>();

//     const [emptyCanvas, setEmptyCanvas] = useState(false);
//     // New state to track requirements for each requirement index
//     const [requirementsTracker, setRequirementsTracker] = useState<{
//         [key: number]: FarmerReqType
//     }>({});
//     const [isSaving, setIsSaving] = useState(false);

//     const {
//         data: farmers,
//     }: TFetchType<Farmer[]>
//         = useApiOps<Farmer>(() => {
//             if (mounted.current)
//                 return getAllFarmersOfThisLocation(project?.city)
//             return Promise.resolve([])
//         });

//     const requestPermissions = async () => {
//         const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//         if (status !== 'granted') {
//             alert('Sorry, we need camera roll permissions to make this work!');
//         }
//     };

//     useEffect(() => {
//         mounted.current = true;
//         requestPermissions();
//         if (metaValues.farmer_name) {
//             setSubmited(false)
//         }
//         return () => {
//             mounted.current = false;
//         }
//     }, []);


//     const onSubmit = async () => {
//         console.log("\n\n")
//         setIsSaving(true);
//         let data: FarmerData = Object.create({});
//         if (!metaValues?.farmer_name) {
//             setIsSaving(false);
//             return console.warn("\n\n no farmer name");
//         }

//         // if (conclusionInspectionData?.nonConformityRecom&&conclusionInspectionData?.nonConformityRecom?.length > 0)
//         //     data.project_data.inspectionConclusions = conclusionInspectionData;

//         try {
//             const photos = farmerPhotos?.map(async (photo) => {
//                 return await uploadToS3(photo, `${project?.type.toLowerCase()}-${photo.split('/').pop()}`, currentCompany?.company_bucket as string, 'image/jpeg')
//             })
//             const photosUrls = await Promise.all(photos as Promise<string>[]);

//             data = {
//                 project_id: project?.id,
//                 project_data: {
//                     metaData: {
//                         ...metaValues,
//                         farmer_photos: photosUrls,
//                         // farmer_code: farmer_id,
//                         inspection_date: new Date(Date.now()).toISOString()
//                     },
//                     requirements: currentFarmerReqs,
//                     inspectionConclusions: conclusionInspectionData,
//                     nonConformityReqs: notConformReqs // it is used in case of editing the inspection collected
//                     // and it is deleted at runtime when uploading the inspection on the draft.
//                 },
//                 uploaded: false,

//             }
//             getFarmerData && getFarmerData(data);
//             setMetaValues(metaDataInitialValue);
//             setFarmerPhotos([]);
//             setCurrentfarmerReqs([]);
//             setIsDisabled(false);
//             setCurrentRequirement(0);
//             setEmptyCanvas(true);
//             setConclusionInpectionData({
//                 metadata: {
//                     farmer_signature: "",
//                     inspector_signature: "",
//                     nextYearRecom: ''
//                 },
//                 nonConformityRecom: [],
//             })
//         } catch (err) {
//             console.error("Error saving inspection data: \n\n" + err)
//             Alert.alert("Error", "Something went wrong, please try again")
//         } finally {
//             setIsSaving(false);
//         }
//     }


//     // Modified onNextButtonClicked to store requirement data
//     const onNextButtonClicked = () => {
//         if (farmerReq.status !== "N/A" && currentRequirement <= project?.project_structure.requirements?.length - 1) {
//             if (farmerReq?.comment === '') {
//                 return Alert.alert("Comment needed", "You must fill the status and provide a comment")
//             }

//             // Store the current requirement data in the tracker
//             setRequirementsTracker(prev => ({
//                 ...prev,
//                 [currentRequirement]: farmerReq
//             }));

//             setCurrentfarmerReqs(prev => [...prev, farmerReq]);

//             // get the not conform requirements for inspection conclusion.
//             if (farmerReq.status === 'NC')
//                 setNotConformReqs(prev => [...prev, {
//                     req_number: farmerReq.req_number,
//                     comment: '',
//                     deadline: '',
//                 }]);

//             setCurrentRequirement(Math.min((project?.project_structure.requirements?.length - 1) || 0, currentRequirement + 1));

//             // Reset farmerReq for the next requirement
//             setFarmerReq({
//                 req_number: "",
//                 status: "N/A",
//                 comment: ''
//             });

//             if (currentRequirement === ((project?.project_structure.requirements?.length - 1) || 0)) {
//                 //    enable the upload button after reaching the last requirement collection.
//                 showUploadButton.set("end-collecting-data", true);
//                 Alert.alert("End of requirements", "You have reached the last requirement")
//                 return setIsDisabled(true);
//             }
//         } else if (farmerReq.status === "N/A")
//             Alert.alert("Requirement needed", "You must fill the status and provide a comment")
//     }

//     // Modified method to handle previous requirement navigation
//     const onPreviousButtonClicked = () => {
//         if (currentRequirement > 0) {
//             // Retrieve the previous requirement's data from tracker
//             const previousReqData = requirementsTracker[currentRequirement - 1];

//             // Set the previous requirement's data
//             if (previousReqData) {
//                 setFarmerReq(previousReqData);
//             } else {
//                 // Reset if no previous data found
//                 setFarmerReq({
//                     req_number: "",
//                     status: "N/A",
//                     comment: ''
//                 });
//             }

//             // Decrement current requirement
//             setCurrentRequirement(Math.max(0, currentRequirement - 1));

//             // Enable next button
//             setIsDisabled(false);
//         }
//     }

//     const onPicker = async () => {
//         console.log("before: launchCameraAsync");
//         try {
//             const result = await ImagePicker.launchCameraAsync({
//                 mediaTypes: ImagePicker.MediaTypeOptions.Images,
//                 allowsEditing: false,
//                 quality: 1,
//                 base64: true
//             });
//             // console.log("result of captured photo before: ", result.assets);
//             if (!result.canceled) {
//                 // console.log("result of captured photo after: ", result?.assets[0]);
//                 const { uri } = result?.assets[0];

//                 setFarmerPhotos([...farmerPhotos, uri as string]);
//             }
//         } catch (error) {
//             console.log("error picking the picture: ", error);
//         }
//     };


//     // go back to draft list
//     const gobackToDraft = () => {
//         Alert.alert(
//             "Are you sure ?",
//             "Click OK to go to draft. or Cancel to continue.",
//             [
//                 {
//                     text: "Cancel",
//                     style: "cancel",
//                 },
//                 {
//                     text: "OK",
//                     onPress: () => router.push('/(management)/(inspections)/drafted-project'),
//                 },
//             ]
//         );
//         setSubmited(false);
//     }
//     // "package": AIzaSyCCF68aDWnCHEAT4uPk9_G3jUoi2wgHh2I",
//     // get the selected farmer from the dropdown list
//     const getCurrentFarmerFromTheList = useCallback((selectedFarmerr: Farmer) => {
//         console.log("\n\ngetCurrentFarmerFrom the", selectedFarmer?.farmer_contact)
//         if (selectedFarmerr) {
//             setSelectedFarmer(selectedFarmerr);
//             setMetaValues(prev => ({
//                 ...prev,
//                 farmer_id: selectedFarmerr.farmer_id as string,
//                 farmer_name: selectedFarmerr.farmer_name
//             }))
//         }
//     }, [setSelectedFarmer, setMetaValues])

//     // handle delete photo
//     const handleDeletePhoto = useCallback((indexToDelete: number) => {
//         setFarmerPhotos(currentPhotos =>
//             currentPhotos.filter((_, index) => index !== indexToDelete)
//         );
//     }, [setFarmerPhotos]);

//     // signature
//     const handleSaveSignature = useCallback(async (uri: any, author: "agent_signature" | "farmer_signature") => {

//         const uploadUrl = await uploadToS3(uri, `${project?.type.toLowerCase()}-${author}-${uri.split('/').pop()}`, currentCompany?.company_bucket as string, 'image/jpeg');

//         console.log("url image : ", uploadUrl);

//         handleSignature(author, uploadUrl);
//     }, [uploadToS3]);


//     const handleSignature = useCallback((type: "agent_signature" | "farmer_signature", signature: string) => {
//         setConclusionInpectionData(prev => ({
//             ...prev,
//             metadata: {
//                 ...prev?.metadata,
//                 [type]: signature ?? '',
//             },
//             nonConformityRecom: prev?.nonConformityRecom as NonConformityInput[]
//         }));
//         setEmptyCanvas(true);
//     }, [setMetaValues, setEmptyCanvas]);

//     const handleInputChange = useCallback((field: keyof MetaData, value: any) => {
//         setMetaValues(prev => ({ ...prev, [field]: value }));
//     }, [setMetaValues]);


//     // render input field
//     const renderInputField = (field: keyof typeof metaValues, label: string, placeholder: string) => (
//         <StyledView className="my-1 w-full flex-col ">
//             <StyledText className="text-sm font-medium text-gray-700">{label}: &nbsp;</StyledText>
//             <StyledTextInput
//                 className=" p-1 border border-gray-200 rounded-md bg-white flex-1 "
//                 placeholder={placeholder}
//                 placeholderTextColor=""
//                 value={metaValues[field] as string}
//                 onChangeText={(value) => handleInputChange(field, value)}
//             />
//         </StyledView>
//     );

//     console.log("\n\n donnee de conclusion: ", conclusionInspectionData);
//     console.log("\n\n farmers: ", farmers);
//     console.log("\n\n farmer data: ", metaValues);


//     const currentReq = project?.project_structure?.requirements[currentRequirement];

//     const metaData = project?.project_structure?.metaData.length ? project?.project_structure?.metaData : mock_project?.project_structure?.metaData;


//     console.log("\n\n metadata: ", metaData)

//     return (
//         <SafeAreaView className="flex-1 bg-gray-100 mt-6 ">
//             <Text className="text-xl font-bold ">{project?.type} </Text>
//             <ScrollView
//                 className="py-4"
//                 automaticallyAdjustContentInsets
//                 alwaysBounceVertical
//             >

//                 <View className="">
//                     <Text className="text-xl font-semibold mb-4 text-right">Farmer Metadata</Text>
//                     <View className="mb-2">
//                         <Text className="text-sm font-medium text-gray-700 mb-1">
//                             {"Date de l'inspection"}
//                         </Text>
//                         <TextInput
//                             className="w-full p-1 border border-gray-300 rounded-md bg-white"
//                             value={new Date(metaValues?.inspection_date).toLocaleString()}
//                         />
//                     </View>

//                     {/* <View className=" my-4  justify-center items-center ">
//                         <View className="h-0.5 w-[90%] bg-gray-300  " />
//                     </View> */}

//                     {/* render some farmer info base on project type */}
//                     <StyledView className="flex-row flex-wrap justify-between">
//                         {(project?.type !== 'INTERNAL_INSPECTION' && !farmers?.length) && renderInputField('farmer_name', 'Nom du planteur', 'Enter farmer name')}
//                         {(project?.type !== 'INTERNAL_INSPECTION' && !farmers?.length) && renderInputField('farmer_contact', 'Contact planteur', 'Enter farmer contact')}
//                     </StyledView>

//                     <View className=" my-4  justify-center items-center ">
//                         <View className="h-0.5 w-[90%] bg-gray-300  " />
//                     </View>

//                     {/* render some farmer info base on project type */}
//                     <StyledView className="flex-row flex-wrap justify-between">
//                         {(project?.type !== 'INTERNAL_INSPECTION' && !farmers?.length) && renderInputField('farmer_ID_card_number', 'N° CNI', 'Enter farmer ID card number')}
//                         {(project?.type !== 'INTERNAL_INSPECTION' && !farmers?.length) && renderInputField('village', 'Village', 'Enter farmer village')}
//                         {renderInputField('certification_year', 'Annee de certification', 'Enter the year of certification')}
//                     </StyledView>

//                     <View className=" my-4  justify-center items-center ">
//                         <View className="h-0.5 w-[90%] bg-gray-300  " />
//                     </View>

//                     <StyledView className="flex-row flex-wrap justify-between">
//                         {renderInputField('inspector_name', 'Nom de l\'inspecteur', 'Enter agent Name')}
//                         {renderInputField('inspector_contact', 'Contact de inspecteur', 'Enter agent phone number')}
//                     </StyledView>

//                     <View className=" my-4  justify-center items-center ">
//                         <View className="h-0.5 w-[90%] bg-gray-300  " />
//                     </View>

//                     <StyledView className="flex-row flex-wrap justify-between">
//                         {renderInputField('weed_application', 'Angrais appliqué', 'Enter weed application')}
//                         {renderInputField('weed_application_quantity', 'Quantité d\'angrais appliqué (kg/ha)', 'Enter weed quantity used in kg/ha')}
//                     </StyledView>


//                     <View className=" my-4  justify-center items-center ">
//                         <View className="h-0.5 w-[90%] bg-gray-300  " />
//                     </View>

//                     <StyledView className="flex-row flex-wrap justify-between">
//                         {renderInputField('pesticide_used', 'Pesticide utiliser', 'Enter the pesticide used')}
//                         {renderInputField('pesticide_quantity', 'Quantité de Pesticide (kg/ha)', 'Enter quantity used in kg/ha')}
//                     </StyledView>

//                     <View className=" my-4  justify-center items-center ">
//                         <View className="h-0.5 w-[90%] bg-gray-300  " />
//                     </View>

//                     {(project?.type === 'INTERNAL_INSPECTION' && farmers?.length) ? (
//                         <>
//                             <StyledView className="flex-row border border-gray-200 rounded-md bg-white flex-wrap justify-between z-20 mb-4 w-full p-1.5">
//                                 {/* {renderInputField('farmer_id', 'Farmer Name', 'Enter farmer name')} */}
//                                 <Dropdown
//                                     items={farmers as Farmer[]}
//                                     placeholder='Select farmer'
//                                     onChange={getCurrentFarmerFromTheList} // get the currentFarmer from the list
//                                 />
//                             </StyledView>
//                             <View className="mb-4">
//                                 <Text className="text-sm font-medium text-gray-700 mb-1">{'Nom du planteur'}</Text>

//                                 <TextInput
//                                     className="w-full p-2 border border-gray-300 rounded-md bg-white"
//                                     onChangeText={(data) => setMetaValues({ ...metaValues, farmer_name: data })}
//                                     defaultValue={selectedFarmer?.farmer_name}
//                                 />
//                             </View>
//                             <View className="mb-4">
//                                 <Text className="text-sm font-medium text-gray-700 mb-1">{'Contact planteur'}</Text>

//                                 <TextInput
//                                     className="w-full p-2 border border-gray-300 rounded-md bg-white"
//                                     onChangeText={(data) => setMetaValues({ ...metaValues, farmer_contact: data })}
//                                     defaultValue={selectedFarmer?.farmer_contact}
//                                 />
//                             </View>
//                             <View className="mb-4">
//                                 <Text className="text-sm font-medium text-gray-700 mb-1">{'No CNI'}</Text>

//                                 <TextInput
//                                     className="w-full p-2 border border-gray-300 rounded-md bg-white"
//                                     onChangeText={(data) => setMetaValues({ ...metaValues, farmer_ID_card_number: data })}
//                                     defaultValue={selectedFarmer?.farmer_ID_card_number}
//                                 />
//                             </View>
//                             <View className="mb-4">
//                                 <Text className="text-sm font-medium text-gray-700 mb-1">{'Village du planteur'}</Text>

//                                 <TextInput
//                                     className="w-full p-2 border border-gray-300 rounded-md bg-white"
//                                     onChangeText={(data) => setMetaValues({ ...metaValues, village: data })}
//                                     defaultValue={selectedFarmer?.village}
//                                 />
//                             </View>
//                         </>
//                     ) : null}

//                     <CustomButton
//                         title="Add Farmer photo"
//                         handlePress={onPicker}
//                         containerStyles="-z-10 mt-2 bg-black rounded-xl  justify-center items-center p-4 py-3 mb-4"
//                         textStyles='text-white text-muted font-bold text-[15px]'
//                     />

//                     <View className="flex-1 p-4">
//                         <PhotoList
//                             photos={farmerPhotos}
//                             onDeletePhoto={handleDeletePhoto}
//                         />
//                     </View>
//                 </View>

//                 <View className="">
//                     <Text className="text-xl font-semibold mb-2 text-right">Requirements: </Text>

//                     <View className="mb-6 p-4 bg-white rounded-lg shadow">

//                         <Text className="text-xl font-bold mb-2 ">Requirement: {currentReq?.number}</Text>
//                         <Text className="mb-4">{currentReq?.principal_requirement}</Text>


//                         <View>
//                             <Text className="font-medium mb-2">Certification Group:</Text>
//                             {Object.entries(currentReq?.certif_de_group || {}).map(([key, value]) => (
//                                 <View key={key} className="flex-row items-center mb-2">

//                                     <Switch
//                                         value={(value === "YES" || value === "yes") ? true : false}
//                                     />
//                                     <Text className="ml-2">{key}</Text>
//                                 </View>
//                             ))}
//                         </View>

//                         <View className="my-4">
//                             <Text className="font-medium mb-2 text-lg">Status:</Text>
//                             <View className="flex-row justify-between flex-wrap">
//                                 <View className="flex-row items-center mb-2">

//                                     <RadioButton.Group
//                                         onValueChange={(newValue) => setFarmerReq({ ...farmerReq, status: newValue as FarmerReqType['status'], req_number: currentReq.number })}
//                                         value={farmerReq?.status ?? null}
//                                     >
//                                         <View className="flex-row justify-center flex-wrap gap-10">
//                                             {Object.keys(currentReq?.status || {}).map((val, ind) => (
//                                                 <View key={ind} className="flex-row items-center mb-2 ">

//                                                     <RadioButton
//                                                         value={val}
//                                                         color={'#006d77'}

//                                                     />
//                                                     <Text className="ml-1">{val}</Text>
//                                                 </View>
//                                             ))}

//                                         </View>
//                                     </RadioButton.Group>
//                                 </View>
//                             </View>
//                         </View>
//                         <View className="mb-4">
//                             <Text className="font-medium mb-2">Comment:</Text>
//                             <TextInput
//                                 multiline
//                                 numberOfLines={4}
//                                 className="w-full p-2 border border-gray-300 flex items-start rounded-md bg-white"

//                                 onChangeText={(text) => { // we add empty string to avoid error undefind in front-end
//                                     setFarmerReq({ ...farmerReq, comment: text ?? "" });
//                                 }}
//                                 defaultValue={farmerReq?.comment}
//                             />
//                         </View>
//                     </View>
//                     {/* <View className="flex-row justify-between mt-4">
//                         <TouchableOpacity
//                             className={cn("bg-blue-500 p-2 rounded-md", {
//                                 "opacity-50": currentRequirement >= 1
//                             })}
//                             onPress={() => setCurrentRequirement(Math.max(0, currentRequirement - 1))}
//                         // disabled={currentRequirement >= 1}
//                         >
//                             <Text className="text-white">Previous</Text>
//                         </TouchableOpacity>

//                         <TouchableOpacity
//                             className={cn("bg-blue-500 p-2 rounded-md", {
//                                 "opacity-50": isDisabled
//                             })}
//                             onPress={() => onNextButtonClicked()}
//                             disabled={isDisabled}
//                             ref={nextButtonRef}
//                         >
//                             <Text className="text-white">Next</Text>
//                         </TouchableOpacity> */}
//                     <View className="flex-row justify-between mt-4">
//                         <TouchableOpacity
//                             className={cn("bg-blue-500 p-2 rounded-md", {
//                                 "opacity-50": currentRequirement === 0
//                             })}
//                             onPress={onPreviousButtonClicked}
//                             disabled={currentRequirement === 0}
//                         >
//                             <Text className="text-white">Previous</Text>
//                         </TouchableOpacity>

//                         <TouchableOpacity
//                             className={cn("bg-blue-500 p-2 rounded-md", {
//                                 "opacity-50": isDisabled
//                             })}
//                             onPress={onNextButtonClicked}
//                             disabled={isDisabled}
//                             ref={nextButtonRef}
//                         >
//                             <Text className="text-white">Next</Text>
//                         </TouchableOpacity>
//                     </View>

//                 </View>

//                 {/* inspection summary/conclusion */}

//                 <InspectionSummaryWithStats
//                     currentFarmerReqs={currentFarmerReqs}
//                     nonConformRequirements={notConformReqs}
//                     setConclusionInpectionData={setConclusionInpectionData as React.Dispatch<React.SetStateAction<InspectionConclusionType>>}
//                     conclusionInspectionData={conclusionInspectionData}
//                 />

//                 {/* Signatures Section */}
//                 <StyledView className=' flex-col gap-3 mb-8'>
//                     <View className='space-y-4 '>
//                         <SignatureInput
//                             onSignature={handleSaveSignature}
//                             label='Farmer Signature'
//                             author='farmer_signature'
//                             emptyCanvas={emptyCanvas}
//                             className='flex-1, justify-center items-center px-[20px]'
//                         />
//                         <SignatureInput
//                             onSignature={handleSaveSignature}
//                             label='Agent Signature'
//                             author='agent_signature'
//                             emptyCanvas={emptyCanvas}
//                             className='flex-1, justify-center items-center px-[20px]'
//                         />
//                     </View>
//                 </StyledView>

//                 <View className='flex-row justify-between gap-3'>
//                     <TouchableOpacity
//                         className="bg-green-500 p-3 rounded-md mb-8 flex-1"
//                         onPress={onSubmit}

//                     >
//                         {isSaving ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white text-center font-bold">Save To Draft</Text>}
//                     </TouchableOpacity>

//                     <TouchableOpacity
//                         className="bg-blue-900 p-3 rounded-md mb-8"
//                         onPress={() => gobackToDraft()}

//                     >
//                         <Text className="text-white text-center font-bold">Back to Draft list</Text>
//                     </TouchableOpacity>
//                 </View>
//             </ScrollView>
//         </SafeAreaView >
//     );
// }





import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View, Text, SafeAreaView,
    ScrollView, TouchableOpacity, TextInput, Switch,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import {
    metaDataInitialValue
} from '@/constants/initial-values';
import { RadioButton } from 'react-native-paper';

import { Farmer, FarmerData, FarmerReqType, MetaData, NonConformityInput, ResponseRequirements, TFetchType, InspectionConclusionType, Company } from '@/interfaces/types';
import { newFarmerRegistration, showUploadButton } from '@/store/mmkv-store';
import { mock_project } from '@/constants/project-structure';
import CustomButton from '../../custom-button';
import * as ImagePicker from 'expo-image-picker';
import { FlatList } from 'react-native';
import { styled } from 'nativewind';
import Dropdown from '../../global/dropdown';
import useApiOps from '@/hooks/use-api';
import { getAllFarmersOfThisLocation, getCompanyFarmers } from '@/lib/api';
import { useRouter } from 'expo-router';
import PhotoList from '../../delete-photo';
import { cn } from '@/lib/utils';
import InspectionSummaryWithStats from './inspection-summary';
import { uploadToS3, validateFarmerName, validateIDCardNumber, validatePhoneNumber } from '@/lib/functions';
import SignatureInput from '@/components/global/signatures/signature-capture';
import { useCompanyStore } from '@/store/current-company-store';



const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledButton = styled(TouchableOpacity);

interface FarmerDataFormProps {
    getFarmerData?: (data: FarmerData) => void;
    project: any;
    resetFrom?: boolean;
    currentCompany?: Company;
};

interface ValidationErrors {
    farmer_name?: string;
    farmer_contact?: string;
    farmer_ID_card_number?: string;
    inspector_name?: string;
    inspector_contact?: string;
}

export default function ({
    project,
    getFarmerData,
    currentCompany
}: FarmerDataFormProps) {

    const [currentRequirement, setCurrentRequirement] = useState(0);
    const [metaValues, setMetaValues] = useState<MetaData>({
        ...metaDataInitialValue,
        inspection_date: new Date(Date.now()).toISOString(),
    });
    const [farmerReq, setFarmerReq] = useState<FarmerReqType>({
        req_number: "",
        status: "N/A",
        comment: ''
    });
    const [notConformReqs, setNotConformReqs] = useState<NonConformityInput[] | []>([]);
    const [currentFarmerReqs, setCurrentfarmerReqs] = useState<ResponseRequirements>([]);
    const nextButtonRef = useRef<TouchableOpacity>(null);
    const [isDisabled, setIsDisabled] = useState(false);
    const [farmerPhotos, setFarmerPhotos] = useState<string[]>([]);
    // const [farmer_id, setFarmer_id] = useState('')
    const [submited, setSubmited] = useState(false);
    const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
    const [conclusionInspectionData, setConclusionInpectionData] = useState<InspectionConclusionType>();
    const [emptyCanvas, setEmptyCanvas] = useState(false);
    // New state to track requirements for each requirement index
    const [requirementsTracker, setRequirementsTracker] = useState<{
        [key: number]: FarmerReqType
    }>({});
    const [isSaving, setIsSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors | any>({});

    const mounted = useRef(false);
    const router = useRouter();



    const {
        data: farmers,
    }: TFetchType<Farmer[]>
        = useApiOps<Farmer>(() => {
            if (mounted.current)
                return getAllFarmersOfThisLocation(project?.city)
            return Promise.resolve([])
        });

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
        }
    };

    useEffect(() => {
        mounted.current = true;
        requestPermissions();
        if (metaValues.farmer_name) {
            setSubmited(false)
        }
        return () => {
            mounted.current = false;
        }
    }, []);



    // Modified handleInputChange with validation
    const handleInputChange = useCallback((field: keyof MetaData, value: any) => {
        setMetaValues(prev => ({ ...prev, [field]: value }));

        // Clear previous error for this field
        setValidationErrors((prev: any) => ({ ...prev, [field]: undefined }));

        // Validate based on field type
        let error = "";
        switch (field) {
            case 'farmer_name':
                error = validateFarmerName(value);
                break;
            case 'farmer_contact':
                error = validatePhoneNumber(value);
                break;
            case 'farmer_ID_card_number':
                error = validateIDCardNumber(value);
                break;
            case 'inspector_name':
                error = validateFarmerName(value);
                break;
            case 'inspector_contact':
                error = validatePhoneNumber(value);
                break;
        }

        if (error) {
            setValidationErrors((prev: ValidationErrors) => ({ ...prev, [field]: error }));
        }
    }, [setMetaValues, setValidationErrors]);


    const onSubmit = async () => {
        console.log("\n\n")

        // Validate all required fields
        const nameError = validateFarmerName(metaValues.farmer_name);
        const phoneError = validatePhoneNumber(metaValues.farmer_contact);
        const idError = validateIDCardNumber(metaValues.farmer_ID_card_number);

        const newErrors = {
            farmer_name: nameError,
            farmer_contact: phoneError,
            farmer_ID_card_number: idError
        };

        setValidationErrors(newErrors);

        // Check if there are any validation errors
        if (Object.values(newErrors).some(error => error)) {
            Alert.alert("Validation Error", "Please correct the errors in the form");
            return;
        }

        setIsSaving(true);

        let data: FarmerData = Object.create({});
        if (!metaValues?.farmer_name) {
            setIsSaving(false);
            Alert.alert("Warning", " please enter farmer name");
            return console.warn("\n\n no farmer name");
        }

        // if (conclusionInspectionData?.nonConformityRecom&&conclusionInspectionData?.nonConformityRecom?.length > 0)
        //     data.project_data.inspectionConclusions = conclusionInspectionData;

        try {

            data = {
                project_id: project?.id,
                project_data: {
                    metaData: {
                        ...metaValues,
                        farmer_photos: farmerPhotos,
                        // farmer_code: farmer_id,
                        inspection_date: new Date(Date.now()).toISOString()
                    },
                    requirements: currentFarmerReqs,
                    inspectionConclusions: conclusionInspectionData,
                    nonConformityReqs: notConformReqs // it is used in case of editing the inspection collected
                    // and it is deleted at runtime when uploading the inspection on the draft.
                },
                uploaded: false,

            }
            getFarmerData && getFarmerData(data);  // get data and send them to parent component
            setMetaValues(metaDataInitialValue);
            setFarmerPhotos([]);
            setCurrentfarmerReqs([]);
            setIsDisabled(false);
            setCurrentRequirement(0);
            setEmptyCanvas(true);
            setConclusionInpectionData({
                metadata: {
                    farmer_signature: "",
                    agent_signature: "",
                    nextYearRecom: ''
                },
                nonConformityRecom: [],
            })
        } catch (err) {
            console.error("Error saving inspection data: \n\n" + err)
            Alert.alert("Error", "Something went wrong, please try again")
        } finally {
            setIsSaving(false);
        }
    }


    // Modified onNextButtonClicked to store requirement data
    const onNextButtonClicked = () => {
        if (farmerReq.status !== "N/A" && currentRequirement <= project?.project_structure.requirements?.length - 1) {
            if (farmerReq?.comment === '') {
                return Alert.alert("Comment needed", "You must fill the status and provide a comment")
            }

            // Store the current requirement data in the tracker
            setRequirementsTracker(prev => ({
                ...prev,
                [currentRequirement]: farmerReq
            }));

            setCurrentfarmerReqs(prev => [...prev, farmerReq]);

            // get the not conform requirements for inspection conclusion.
            if (farmerReq.status === 'NC')
                setNotConformReqs(prev => [...prev, {
                    req_number: farmerReq.req_number,
                    comment: '',
                    deadline: '',
                }]);

            setCurrentRequirement(Math.min((project?.project_structure.requirements?.length - 1) || 0, currentRequirement + 1));

            // Reset farmerReq for the next requirement
            setFarmerReq({
                req_number: "",
                status: "N/A",
                comment: ''
            });

            if (currentRequirement === ((project?.project_structure.requirements?.length - 1) || 0)) {
                //    enable the upload button after reaching the last requirement collection.
                showUploadButton.set("end-collecting-data", true);
                Alert.alert("End of requirements", "You have reached the last requirement")
                return setIsDisabled(true);
            }
        } else if (farmerReq.status === "N/A")
            Alert.alert("Requirement needed", "You must fill the status and provide a comment")
    }

    // Modified method to handle previous requirement navigation
    const onPreviousButtonClicked = () => {
        if (currentRequirement > 0) {
            // Retrieve the previous requirement's data from tracker
            const previousReqData = requirementsTracker[currentRequirement - 1];

            // Set the previous requirement's data
            if (previousReqData) {
                setFarmerReq(previousReqData);
            } else {
                // Reset if no previous data found
                setFarmerReq({
                    req_number: "",
                    status: "N/A",
                    comment: ''
                });
            }

            // Decrement current requirement
            setCurrentRequirement(Math.max(0, currentRequirement - 1));

            // Enable next button
            setIsDisabled(false);
        }
    }

    const onPicker = async () => {
        console.log("before: launchCameraAsync");
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
                base64: true
            });
            // console.log("result of captured photo before: ", result.assets);
            if (!result.canceled) {
                // console.log("result of captured photo after: ", result?.assets[0]);
                const { uri } = result?.assets[0];

                setFarmerPhotos([...farmerPhotos, uri as string]);
            }
        } catch (error) {
            console.log("error picking the picture: ", error);
        }
    };


    // go back to draft list
    const gobackToDraft = () => {
        Alert.alert(
            "Are you sure ?",
            "Click OK to go to draft. or Cancel to continue.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "OK",
                    onPress: () => router.push('/(management)/(inspections)/drafted-project'),
                },
            ]
        );
        setSubmited(false);
    }
    // "package": AIzaSyCCF68aDWnCHEAT4uPk9_G3jUoi2wgHh2I",
    // get the selected farmer from the dropdown list
    const getCurrentFarmerFromTheList = useCallback((selectedFarmerr: Farmer) => {
        console.log("\n\ngetCurrentFarmerFrom the", selectedFarmer?.farmer_contact)
        if (selectedFarmerr) {
            setSelectedFarmer(selectedFarmerr);
            setMetaValues(prev => ({
                ...prev,
                farmer_id: selectedFarmerr.farmer_id as string,
                farmer_name: selectedFarmerr.farmer_name
            }))
        }
    }, [setSelectedFarmer, setMetaValues])

    // handle delete photo
    const handleDeletePhoto = useCallback((indexToDelete: number) => {
        setFarmerPhotos(currentPhotos =>
            currentPhotos.filter((_, index) => index !== indexToDelete)
        );
    }, [setFarmerPhotos]);

    // signature
    const handleSaveSignature = useCallback(async (uri: any, author: "agent_signature" | "farmer_signature") => {
        handleSignature(author, uri);
    }, []);


    const handleSignature = useCallback((type: "agent_signature" | "farmer_signature", signature: string) => {
        setConclusionInpectionData(prev => ({
            ...prev,
            metadata: {
                ...prev?.metadata,
                [type]: signature ?? '',
            },
            nonConformityRecom: prev?.nonConformityRecom as NonConformityInput[]
        }));
        setEmptyCanvas(true);
    }, [setMetaValues, setEmptyCanvas]);

    // Modified renderInputField to show validation errors
    const renderInputField = (field: keyof typeof metaValues, label: string, placeholder: string) => (
        <StyledView className="my-1 w-full flex-col ">
            <StyledText className="text-sm font-medium text-gray-700">{label}: &nbsp;</StyledText>
            <StyledTextInput
                className={`p-1 border ${validationErrors[field] ? 'border-red-500' : 'border-gray-200'} rounded-md bg-white flex-1`}
                placeholder={placeholder}
                placeholderTextColor=""
                value={metaValues[field] as string}
                onChangeText={(value) => handleInputChange(field, value)}
            />
            {validationErrors[field] && (
                <StyledText className="text-xs text-red-500 mt-1">
                    {validationErrors[field]}
                </StyledText>
            )}
        </StyledView>
    );


    const currentReq = project?.project_structure?.requirements[currentRequirement];

    const metaData = project?.project_structure?.metaData.length ? project?.project_structure?.metaData : mock_project?.project_structure?.metaData;


    // Modified farmer input rendering logic
    const shouldShowFarmerInputs = project?.type !== 'INTERNAL_INSPECTION' || !farmers?.length;


    return (
        <SafeAreaView className="flex-1 bg-gray-100 mt-6 ">
            <Text className="text-xl font-bold ">{project?.type} </Text>
            <ScrollView
                className="py-4"
                automaticallyAdjustContentInsets
                alwaysBounceVertical
            >

                <View className="">
                    <Text className="text-xl font-semibold mb-4 text-right">Farmer Metadata</Text>
                    <View className="mb-2">
                        <Text className="text-sm font-medium text-gray-700 mb-1">
                            {"Date de l'inspection"}
                        </Text>
                        <TextInput
                            className="w-full p-1 border border-gray-300 rounded-md bg-white"
                            value={new Date(metaValues?.inspection_date).toLocaleString()}
                        />
                    </View>

                    {/* Conditional rendering for farmer inputs */}
                    {project?.type === 'INTERNAL_INSPECTION' && farmers?.length ? (
                        // Show dropdown and editable fields for internal inspection with farmer list
                        <>
                            <StyledView className="flex-row border border-gray-200 rounded-md bg-white flex-wrap justify-between z-20 mb-4 w-full p-1.5">
                                <Dropdown
                                    items={farmers as Farmer[]}
                                    placeholder='Select farmer'
                                    onChange={getCurrentFarmerFromTheList}
                                />
                            </StyledView>
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-700 mb-1">{'Nom du planteur'}</Text>
                                <TextInput
                                    className={`w-full p-2 border ${validationErrors.farmer_name ? 'border-red-500' : 'border-gray-300'} rounded-md bg-white`}
                                    onChangeText={(data) => handleInputChange('farmer_name', data)}
                                    defaultValue={selectedFarmer?.farmer_name}
                                />
                                {validationErrors.farmer_name && (
                                    <Text className="text-xs text-red-500 mt-1">{validationErrors.farmer_name}</Text>
                                )}
                            </View>
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-700 mb-1">{'Contact planteur'}</Text>
                                <TextInput
                                    className={`w-full p-2 border ${validationErrors.farmer_contact ? 'border-red-500' : 'border-gray-300'} rounded-md bg-white`}
                                    onChangeText={(data) => handleInputChange('farmer_contact', data)}
                                    defaultValue={selectedFarmer?.farmer_contact}
                                />
                                {validationErrors.farmer_contact && (
                                    <Text className="text-xs text-red-500 mt-1">{validationErrors.farmer_contact}</Text>
                                )}
                            </View>
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-700 mb-1">{'No CNI'}</Text>
                                <TextInput
                                    className={`w-full p-2 border ${validationErrors.farmer_ID_card_number ? 'border-red-500' : 'border-gray-300'} rounded-md bg-white`}
                                    onChangeText={(data) => handleInputChange('farmer_ID_card_number', data)}
                                    defaultValue={selectedFarmer?.farmer_ID_card_number}
                                />
                                {validationErrors.farmer_ID_card_number && (
                                    <Text className="text-xs text-red-500 mt-1">{validationErrors.farmer_ID_card_number}</Text>
                                )}
                            </View>
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-700 mb-1">{'Village du planteur'}</Text>
                                <TextInput
                                    className="w-full p-2 border border-gray-300 rounded-md bg-white"
                                    onChangeText={(data) => handleInputChange('village', data)}
                                    defaultValue={selectedFarmer?.village}
                                />
                            </View>
                        </>
                    ) : (
                        // Show regular input fields for other cases
                        <StyledView className="flex-row flex-wrap justify-between">

                            {renderInputField('farmer_name', 'Nom du planteur', 'Enter farmer name')}
                            {renderInputField('farmer_contact', 'Contact planteur', 'Enter farmer contact')}
                            {renderInputField('farmer_ID_card_number', 'N° CNI', 'Enter farmer ID card number')}
                            {renderInputField('village', 'Village', 'Enter farmer village')}

                        </StyledView>
                    )}

                    <View className=" my-4  justify-center items-center ">
                        <View className="h-0.5 w-[90%] bg-gray-300  " />
                    </View>

                    <StyledView className="flex-row flex-wrap justify-between">

                        {renderInputField('inspector_name', 'Nom de l\'inspecteur', 'Enter agent Name')}
                        {renderInputField('inspector_contact', 'Contact de inspecteur', 'Enter agent phone number')}
                    </StyledView>

                    <View className=" my-4  justify-center items-center ">
                        <View className="h-0.5 w-[90%] bg-gray-300  " />
                    </View>

                    <StyledView className="flex-row flex-wrap justify-between">
                        {renderInputField('certification_year', 'Annee de certification', 'Enter the year of certification')}
                        {renderInputField('weed_application', 'Angrais appliqué', 'Enter weed application')}
                        {renderInputField('weed_application_quantity', 'Quantité d\'angrais appliqué (kg/ha)', 'Enter weed quantity used in kg/ha')}
                    </StyledView>


                    <View className=" my-4  justify-center items-center ">
                        <View className="h-0.5 w-[90%] bg-gray-300  " />
                    </View>

                    <StyledView className="flex-row flex-wrap justify-between">
                        {renderInputField('pesticide_used', 'Pesticide utiliser', 'Enter the pesticide used')}
                        {renderInputField('pesticide_quantity', 'Quantité de Pesticide (kg/ha)', 'Enter quantity used in kg/ha')}
                    </StyledView>

                    <View className=" my-4  justify-center items-center ">
                        <View className="h-0.5 w-[90%] bg-gray-300  " />
                    </View>



                    <CustomButton
                        title="Add Farmer photo"
                        handlePress={onPicker}
                        containerStyles="-z-10 mt-2 bg-black rounded-xl  justify-center items-center p-4 py-3 mb-4"
                        textStyles='text-white text-muted font-bold text-[15px]'
                    />

                    <View className="flex-1 p-4">
                        <PhotoList
                            photos={farmerPhotos}
                            onDeletePhoto={handleDeletePhoto}
                        />
                    </View>
                </View>

                <View className="">
                    <Text className="text-xl font-semibold mb-2 text-right">Requirements: </Text>

                    <View className="mb-6 p-4 bg-white rounded-lg shadow">

                        <Text className="text-xl font-bold mb-2 ">Requirement: {currentReq?.number}</Text>
                        <Text className="mb-4">{currentReq?.principal_requirement}</Text>

                        <View>
                            <Text className="font-medium mb-2">Certification Group:</Text>
                            {Object.entries(currentReq?.certif_de_group || {}).map(([key, value]) => (
                                <View key={key} className="flex-row items-center mb-2">

                                    <Switch
                                        value={(value === "YES" || value === "yes") ? true : false}
                                    />
                                    <Text className="ml-2">{key}</Text>
                                </View>
                            ))}
                        </View>

                        <View className="my-4">
                            <Text className="font-medium mb-2 text-lg">Status:</Text>
                            <View className="flex-row justify-between flex-wrap">
                                <View className="flex-row items-center mb-2">

                                    <RadioButton.Group
                                        onValueChange={(newValue) => setFarmerReq({ ...farmerReq, status: newValue as FarmerReqType['status'], req_number: currentReq.number })}
                                        value={farmerReq?.status ?? null}
                                    >
                                        <View className="flex-row justify-center flex-wrap gap-10">
                                            {Object.keys(currentReq?.status || {}).map((val, ind) => (
                                                <View key={ind} className="flex-row items-center mb-2 ">

                                                    <RadioButton
                                                        value={val}
                                                        color={'#006d77'}

                                                    />
                                                    <Text className="ml-1">{val}</Text>
                                                </View>
                                            ))}

                                        </View>
                                    </RadioButton.Group>
                                </View>
                            </View>
                        </View>
                        <View className="mb-4">
                            <Text className="font-medium mb-2">Comment:</Text>
                            <TextInput
                                multiline
                                numberOfLines={4}
                                className="w-full p-2 border border-gray-300 flex items-start rounded-md bg-white"

                                onChangeText={(text) => { // we add empty string to avoid error undefind in front-end
                                    setFarmerReq({ ...farmerReq, comment: text ?? "" });
                                }}
                                defaultValue={farmerReq?.comment}
                            />
                        </View>
                    </View>
                    {/* <View className="flex-row justify-between mt-4">
                        <TouchableOpacity
                            className={cn("bg-blue-500 p-2 rounded-md", {
                                "opacity-50": currentRequirement >= 1
                            })}
                            onPress={() => setCurrentRequirement(Math.max(0, currentRequirement - 1))}
                        // disabled={currentRequirement >= 1}
                        >
                            <Text className="text-white">Previous</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={cn("bg-blue-500 p-2 rounded-md", {
                                "opacity-50": isDisabled
                            })}
                            onPress={() => onNextButtonClicked()}
                            disabled={isDisabled}
                            ref={nextButtonRef}
                        >
                            <Text className="text-white">Next</Text>
                        </TouchableOpacity> */}
                    <View className="flex-row justify-between mt-4">
                        <TouchableOpacity
                            className={cn("bg-blue-500 p-2 rounded-md", {
                                "opacity-50": currentRequirement === 0
                            })}
                            onPress={onPreviousButtonClicked}
                            disabled={currentRequirement === 0}
                        >
                            <Text className="text-white">Previous</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={cn("bg-blue-500 p-2 rounded-md", {
                                "opacity-50": isDisabled
                            })}
                            onPress={onNextButtonClicked}
                            disabled={isDisabled}
                            ref={nextButtonRef}
                        >
                            <Text className="text-white">Next</Text>
                        </TouchableOpacity>
                    </View>

                </View>

                {/* inspection summary/conclusion */}

                <InspectionSummaryWithStats
                    currentFarmerReqs={currentFarmerReqs}
                    nonConformRequirements={notConformReqs}
                    setConclusionInpectionData={setConclusionInpectionData as React.Dispatch<React.SetStateAction<InspectionConclusionType>>}
                    conclusionInspectionData={conclusionInspectionData}
                />

                {/* Signatures Section */}
                <StyledView className=' flex-col gap-3 mb-8'>
                    <View className='space-y-4 '>
                        <SignatureInput
                            onSignature={handleSaveSignature}
                            label='Farmer Signature'
                            author='farmer_signature'
                            emptyCanvas={emptyCanvas}
                            className='flex-1, justify-center items-center px-[20px]'
                        />
                        <SignatureInput
                            onSignature={handleSaveSignature}
                            label='Agent Signature'
                            author='agent_signature'
                            emptyCanvas={emptyCanvas}
                            className='flex-1, justify-center items-center px-[20px]'
                        />
                    </View>
                </StyledView>

                <View className='flex-row justify-between gap-3'>
                    <TouchableOpacity
                        className="bg-green-500 p-3 rounded-md mb-8 flex-1"
                        onPress={onSubmit}

                    >
                        {isSaving ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white text-center font-bold">Save To Draft</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-blue-900 p-3 rounded-md mb-8"
                        onPress={() => gobackToDraft()}

                    >
                        <Text className="text-white text-center font-bold">Back to Draft list</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView >
    );
}

