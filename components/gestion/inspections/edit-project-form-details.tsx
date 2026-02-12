import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Company, Farmer, FarmerData, FarmerReqType, InspectionConclusionType, MetaData, NonConformityInput, ResponseRequirements, TFetchType } from '@/interfaces/types';
import { editFarmerData, newFarmerRegistration, showUploadButton } from '@/store/mmkv-store';
import { mock_project } from '@/constants/project-structure';
import CustomButton from '../../custom-button';
import * as ImagePicker from 'expo-image-picker';
import { styled } from 'nativewind';
import Dropdown from '../../global/dropdown';
import useApiOps from '@/hooks/use-api';
import { getAllFarmersOfThisLocation } from '@/lib/api';
import { useRouter } from 'expo-router';
import PhotoList from '../../delete-photo';
import { cn } from '@/lib/utils';
import EditInspectionSummaryWithStats from './edit-inspection-summary';
import { uploadToS3 } from '@/lib/functions';
import { useCompanyStore } from '@/store/current-company-store';


const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledButton = styled(TouchableOpacity);

interface FarmerDataFormProps {
    getFarmerData?: (data: FarmerData) => void;
    project: any;
    resetFrom?: boolean;
    initialData?: FarmerData; // Add prop for initial data when editing
    isEditing?: boolean; // Add prop to indicate edit mode
}

export default function EditFarmerDataForm({
    project,
    getFarmerData,
    initialData,
    isEditing = false
}: FarmerDataFormProps) {

    const { data: farmers
    }: TFetchType<Farmer[]>
        = useApiOps<Farmer>(() => {
            if (project.type === 'INTERNAL_INPECTION')
                return getAllFarmersOfThisLocation(project?.city);
            return Promise.resolve([]);
        });


    // Initialize state with either initial data or default values
    const [currentRequirement, setCurrentRequirement] = useState(0);
    const [metaValues, setMetaValues] = useState<MetaData>(
        isEditing ? initialData?.project_data.metaData ?? metaDataInitialValue : metaDataInitialValue
    );
    const [farmerReq, setFarmerReq] = useState<FarmerReqType>({
        req_number: "",
        status: "N/A",
        comment: ''
    });
    const [currentFarmerReqs, setCurrentfarmerReqs] = useState<ResponseRequirements>(
        isEditing ? initialData?.project_data.requirements ?? [] : []
    );
    const [farmerPhotos, setFarmerPhotos] = useState<string[]>(
        isEditing ? (initialData?.project_data.metaData.farmer_photos as string[]) ?? [] : []
    );
    const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
    const [isDisabled, setIsDisabled] = useState(false);
    // Other state variables remain the same...
    const [submited, setSubmited] = useState(false);
    const [notConformReqs, setNotConformReqs] = useState<NonConformityInput[] | []>([]);
    const [conclusionInspectionData, setConclusionInpectionData] = useState<InspectionConclusionType>();
    const [currentCompany, setCurrentCompany] = useState<Company>({} as Company);
    const {
        getCompany
    } = useCompanyStore();

    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const company = getCompany();
        console.log("\n\n company : ", company)
        if (company)
            setCurrentCompany(company);

        // If we're editing, pre-populate the form with existing data
        if (isEditing && initialData) {
            setMetaValues(initialData?.project_data?.metaData);
            setCurrentfarmerReqs(initialData?.project_data.requirements);
            setFarmerPhotos(initialData?.project_data.metaData.farmer_photos as string[] ?? []);
            setNotConformReqs(initialData?.project_data.nonConformityReqs as NonConformityInput[] ?? []);
            setConclusionInpectionData(initialData?.project_data?.inspectionConclusions as InspectionConclusionType);
        }
    }, [isEditing, initialData]);

    // access the specific requirement according to its index.
    const navigateToRequirement = (index: number) => {
        if (index >= 0 && index < (project?.project_structure.requirements?.length ?? 0)) {
            setCurrentRequirement(index);

            // If we're editing, load the existing requirement data
            if (isEditing && currentFarmerReqs[index]) {
                setFarmerReq(currentFarmerReqs[index]);
            } else {
                setFarmerReq({
                    req_number: "",
                    status: "N/A",
                    comment: ''
                });
            }
        }
    };

    // Modified to update existing requirements instead of always adding new ones
    const onNextButtonClicked = () => {
        if (farmerReq.status !== "N/A" && currentRequirement <= project?.project_structure.requirements?.length - 1) {
            setCurrentfarmerReqs(prev => {
                const updated = [...prev];
                updated[currentRequirement] = farmerReq;
                return updated;
            });
            // navigate to specific requirement.
            navigateToRequirement(currentRequirement + 1);

            if (currentRequirement === ((project?.project_structure.requirements?.length - 1) || 0)) {
                showUploadButton.set("end-collecting-data", true); // to show the end collecting data button from inspection detail page
                setIsDisabled(true);
            }
        }
    };

    // Add a function to handle requirement selection for editing
    const handleRequirementSelect = (index: number) => {
        navigateToRequirement(index);
    };

    // Modified submit function to handle both create and update
    const onSubmit = async () => {
        setIsSaving(true)
        if (!metaValues?.farmer_name) return;

        try {
            const photos = farmerPhotos?.map(async (photo) => {
                return await uploadToS3(photo, `${project?.type.toLowerCase()}-${photo.split('/').pop()}`, currentCompany?.company_bucket as string, 'image/jpeg')
            })
            const photosUrls = await Promise.all(photos as Promise<string>[]);


            const updatedData: FarmerData = {
                project_id: project?.id,
                project_data: {
                    metaData: {
                        ...metaValues,
                        farmer_photos: photosUrls,
                        inspection_date: isEditing
                            ? metaValues.inspection_date
                            : new Date(Date.now()).toISOString()
                    },
                    requirements: currentFarmerReqs,
                    inspectionConclusions: conclusionInspectionData,
                },
                uploaded: false
            };

            getFarmerData && getFarmerData(updatedData);
            setSubmited(true);
        } catch (error) {
            console.error("Error submitting updated inspection data:", error);
        } finally {

            setIsSaving(false);
        }

    };

    // get the selected farmer from the dropdown list
    const getCurrentFarmerFromTheList = (selectedFarmerr: Farmer) => {
        console.log("\n\ngetCurrentFarmerFrom the", selectedFarmer?.farmer_contact)
        if (selectedFarmerr) {
            setSelectedFarmer(selectedFarmerr);
            setMetaValues(prev => ({
                ...prev,
                farmer_id: selectedFarmerr.farmer_id as string,
                farmer_name: selectedFarmerr.farmer_name
            }))
        }
    }

    // take a picture 
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
                const { uri, mimeType } = result?.assets[0];
                const uploadUrl = await uploadToS3(uri, `${project?.type.toLowerCase()}-${uri.split('/').pop()}`, currentCompany?.company_bucket as string, mimeType);

                setFarmerPhotos([...farmerPhotos, uploadUrl as string]);
            }
        } catch (error) {
            console.log("error picking the picture: ", error);
        }
    };

    // handle delete photo
    const handleDeletePhoto = useCallback((indexToDelete: number) => {
        setFarmerPhotos(currentPhotos =>
            currentPhotos.filter((_, index) => index !== indexToDelete)
        );
    }, [setFarmerPhotos]);

    // initialize the current requirement.
    const currentReq = project?.project_structure?.requirements[currentRequirement];
    const metadataValues = useMemo(() => {
        return Object.keys(metaValues)?.filter(key => metaValues[key as keyof MetaData] !== '');
    }, [])

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


    // at the top of the page
    // Add a requirements overview section for easy navigation in edit mode
    const RequirementsOverview = () => (
        isEditing && (
            <View className=" bg-white p-4 rounded-lg">
                <Text className="text-lg font-bold mb-2">Requirements Overview</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {currentFarmerReqs.map((req, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handleRequirementSelect(index)}
                            className={cn(`mr-2 p-2 rounded ${currentRequirement === index ? 'bg-blue-500' : 'bg-gray-200'
                                }`)}
                        >
                            <Text
                                className={cn(`${currentRequirement === index ? 'text-white' : 'text-black'
                                    }`)}
                            >
                                {/* <Text></Text> */}
                                {/* Req {index + 1} ({req.status}) */}
                                Req {currentFarmerReqs[index].req_number + 1}  <Text className='text-green-500'>({req.status})</Text>
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        )
    );
    console.log(" edit component conclusion de l'inspection: ", conclusionInspectionData);
    return (
        <SafeAreaView className="flex-1 bg-gray-100 mt-6 ">
            <Text> {isEditing ? 'Edit Inspection Form' : 'Inspection Form'}</Text>
            <ScrollView
                className="py-4"
                automaticallyAdjustContentInsets
                alwaysBounceVertical
            >
                <RequirementsOverview />
                {/* Metadata Section */}
                <View className="mb-8">
                    <Text className="text-xl font-semibold mb-4 text-right">Metadata</Text>
                    {/* Inspection Date */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-1">
                            Date de l'inspection
                        </Text>
                        <TextInput
                            className="w-full p-2 border border-gray-300 rounded-md bg-white"
                            value={new Date(
                                isEditing ? metaValues.inspection_date : Date.now()
                            ).toLocaleString()}
                            editable={false}
                        />
                    </View>

                    {Object.keys(metaValues)?.filter((field: string) => !field.includes('Code du planteur')).map((field: string, index: number) => {
                        const newField = Object.keys(metaValues)[index];
                        if (field.includes('Date de l\'inspection') || field.includes('farmer_photos')) return null;

                        // if (metaValues[field as keyof MetaData] as string == '') return null;

                        if (project?.type === 'INTERNAL_INSPECTION')
                            if (field.includes('Nom du planteur') || field.includes('Contact planteur') || field.includes('Nom du planteur') || field.includes('CNI')) return null;

                        return (
                            <View key={index} className="mb-4">
                                <Text className="text-sm font-medium text-gray-700 mb-1">{field}</Text>

                                <TextInput
                                    className="w-full p-2 border border-gray-300 rounded-md bg-white"
                                    onChangeText={(data) => setMetaValues({ ...metaValues, [newField]: data })}
                                    defaultValue={metaValues[field as keyof MetaData] as string}
                                />
                            </View>
                        );
                    })}

                    {/* Farmer Selection (Internal Inspection) */}
                    {project?.type === 'INTERNAL_INSPECTION' && (
                        <>
                            <StyledView className="flex-row border border-gray-200 rounded-md bg-white flex-wrap justify-between z-20 mb-4 w-full p-1.5">
                                <Dropdown
                                    items={farmers as Farmer[]}
                                    placeholder='Select farmer'
                                    onChange={getCurrentFarmerFromTheList}
                                // defaultValue={selectedFarmer}
                                />
                            </StyledView>

                            {/* Farmer Details Fields */}
                            {['farmer_name', 'farmer_contact', 'farmer_ID_card_number', 'village'].map((field) => (
                                <View key={field} className="mb-4">
                                    <Text className="text-sm font-medium text-gray-700 mb-1">
                                        {field.split('_').join(' ').toUpperCase()}
                                    </Text>
                                    <TextInput
                                        className="w-full p-2 border border-gray-300 rounded-md bg-white"
                                        onChangeText={(data) => setMetaValues({ ...metaValues, [field]: data })}
                                        defaultValue={metaValues[field as keyof MetaData] as string}
                                    />
                                </View>
                            ))}
                        </>
                    )}

                    <CustomButton
                        title="Add Farmer photo"
                        handlePress={onPicker}
                        containerStyles="-z-10 bg-black rounded-xl  justify-center items-center p-4 py-3 mb-4"
                        textStyles='text-white text-muted font-bold text-[15px]'
                    />

                    <View className="flex-1 p-4">
                        <PhotoList
                            photos={farmerPhotos}
                            onDeletePhoto={handleDeletePhoto}
                        />
                    </View>
                </View>

                {/* Requirements Section */}
                <View className="mb-8">
                    <Text className="text-xl font-semibold mb-4 text-right">Requirements: </Text>

                    <View className="mb-6 p-4 bg-white rounded-lg shadow">

                        <Text className="text-xl font-bold mb-2 ">Requirement: {currentReq?.number}</Text>
                        <Text className="mb-4">{currentReq?.principal_requirement}</Text>

                        {/* Certification Group */}
                        <View>
                            <Text className="font-medium mb-2">Certification Group:</Text>
                            {Object.entries(currentReq?.certif_de_group || {}).map(([key, value]) => (
                                <View key={key} className="flex-row items-center mb-2">
                                    <Switch
                                        value={(value === "YES" || value === "yes")}
                                        disabled={true}
                                    />
                                    <Text className="ml-2">{key}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Status Selection */}
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

                        {/* Comment Section */}
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
                    <View className="flex-row justify-between mt-4">
                        <TouchableOpacity
                            className="bg-blue-500 p-3 rounded-md"
                            onPress={() => setCurrentRequirement(Math.max(0, currentRequirement - 1))}
                            disabled={currentRequirement === 0}
                        >
                            <Text className="text-white">Previous</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="bg-blue-500 p-3 rounded-md"
                            onPress={() => onNextButtonClicked()}
                            disabled={isDisabled}
                        >
                            <Text className="text-white">Next</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* inspection summary/conclusion */}

                <EditInspectionSummaryWithStats
                    currentFarmerReqs={currentFarmerReqs}
                    nonConformRequirements={notConformReqs}
                    setConclusionInpectionData={setConclusionInpectionData as React.Dispatch<React.SetStateAction<InspectionConclusionType>>}
                    conclusionInspectionData={conclusionInspectionData}
                />

                {/* <View className='flex-row justify-between gap-3 '>
                    <TouchableOpacity
                        className="bg-green-500 p-4 rounded-md  flex-1"
                        onPress={onSubmit}

                    >
                        <Text className="text-white text-center font-bold">Save to Draft</Text>
                    </TouchableOpacity>
                    {submited ? <TouchableOpacity
                        className="bg-blue-900 p-4 rounded-md mb-8"
                        onPress={gobackToDraft}

                    >
                        <Text className="text-white text-center font-bold">Back to Drafted list</Text>
                    </TouchableOpacity> : null}
                </View> */}
                <View className='flex-row justify-between gap-3 mt-2'>
                    <TouchableOpacity
                        className="bg-green-500 p-3 rounded-md mb-8 flex-1"
                        onPress={onSubmit}

                    >
                        {isSaving ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white text-center font-bold">Save to Draft</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-blue-900 p-3 rounded-md mb-8"
                        onPress={() => gobackToDraft()}

                    >
                        <Text className="text-white text-center font-bold">Back to Draft list</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
