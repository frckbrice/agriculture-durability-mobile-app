import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput,
    Button, ScrollView, TouchableOpacity,
    SafeAreaView, FlatList, Dimensions,
    Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import SignatureScreen from 'react-native-signature-canvas';
import { AttendanceSheetInitialValues } from '@/constants/initial-values';
import { AttendenceSheet, Participants, TrainerType } from '@/interfaces/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAttendanceDataStore } from '@/store/training-attendances-data-storage';
import SignatureInput from '../../global/signatures/signature-capture';
import { Trash2 } from 'lucide-react-native';
import { editFarmerData } from '@/store/mmkv-store';
import { useEditProjectDataStore } from '@/store/edit-project-data';
import { useCompanyStore } from '@/store/current-company-store';
import { uploadToS3 } from '@/lib/functions';
import { ActivityIndicator } from 'react-native';

// Set a fixed card width based on screen dimensions for consistent layout
const CARD_WIDTH = Dimensions.get('window').width * 0.8;
const CARD_MARGIN = 10;

export function EditAttendanceSheetForm() {



    const [showDate, setShowDate] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { training_id } = useLocalSearchParams();

    // reset the canvas signature
    const [emptyCanvas, setEmptyCanvas] = useState(false);
    // call the stoore mmkv
    const {
        getAttendancesData,
        saveAttendancesData,
    } = useAttendanceDataStore();

    const {
        getProjectData: getEditTrainingData,
    } = useEditProjectDataStore();

    // get current company store
    const {
        getCompany
    } = useCompanyStore();


    const [form, setForm] = useState<AttendenceSheet>({
        date: '',
        title: '',
        location: "",
        modules: [''],
        trainers: [{
            name: "",
            signature: "",
            trainer_proof_of_competency: ""
        }],
        photos: [],
        report_url: '',
        participants: [
            {
                name: '',
                organization: '',
                telephone: '',
                email: '',
                signature: '',
                village: '',
            }
        ],
    });
    const [uploading, setUploading] = useState(false);

    const router = useRouter();

    useEffect(() => {

        // for editing purpose, we get the existing data from store. it was set in the draft list component on "edit" function.
        const allSavedAttendances = getEditTrainingData()

        if (allSavedAttendances) {
            // we parse because we set as JSON.stringify 
            // const data = JSON.parse(allSavedAttendances)
            setForm(allSavedAttendances);

            console.log("\n\n training data: " + allSavedAttendances);
        }

    }, []);


    const handleInputChange = (field: keyof AttendenceSheet, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (field === 'date')
            hideDatepicker();
    };


    // create participant list
    const handleParticipantChange = useCallback(async (index: number, field: keyof AttendenceSheet['participants'][0], value: string) => {
        let processedValue = value;
        if (field === 'signature') {
            processedValue = await uploadToS3(
                value,
                `attendance-sheet-${value.split('/').pop()}`,
                getCompany()?.company_bucket ?? '',
                'image/jpeg'
            );
        }

        setForm(prev => {
            const newParticipants = [...prev.participants];
            newParticipants[index] = {
                ...newParticipants[index],
                [field]: processedValue
            };
            return { ...prev, participants: newParticipants };
        });
    }, [getCompany]);

    // create trainer list
    const handleTrainerChange = useCallback(async (index: number, field: keyof AttendenceSheet['trainers'][0], value: string) => {
        let processedValue = value;
        if (field === 'signature') {
            processedValue = await uploadToS3(
                value,
                `attendance-${value.split('/').pop()}`,
                getCompany()?.company_bucket ?? '',
                'image/jpeg'
            );
        }

        setForm(prev => {
            const newTrainers = [...prev.trainers];
            newTrainers[index] = {
                ...newTrainers[index],
                [field]: processedValue
            };
            return { ...prev, trainers: newTrainers };
        });
    }, [getCompany]);

    const addParticipant = useCallback(() => { // posibility to add new participant
        setForm(prev => ({
            ...prev,
            participants: [...prev.participants, {
                name: '',
                organization: '',
                // position: '',
                telephone: '',
                email: '',
                signature: '',
                village: ''
            }],
        }));
    }, [setForm]);

    const handlePhotoUpload = useCallback(async () => {
        setUploading(true)
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                aspect: [4, 3],
                quality: 1,
                // base64: true,
            });

            if (!result.canceled) {
                const base64 = `data:image/png;base64,${result.assets[0].base64}`;
                setForm(prev => ({ ...prev, photos: [...prev.photos, result.assets[0].uri] }));
            }
        } catch (error) {
            console.log(`Error: ${error}`);
        } finally {
            setUploading(false);
        }
    }, []);

    const handleDocumentUpload = useCallback(async () => {
        setUploading(true)
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });

            if (!result.canceled) {
                setForm(prev => ({ ...prev, report_url: result.assets[0].uri }));
            }
        } catch (error) {
            Alert.alert("Error", 'Failed to pick the document from device');
        } finally {
            setUploading(false);
        }
    }, []);

    const handleSaveDraft = async () => {
        // Save the form data to the drafts list 
        setIsSaving(true)
        console.log('Draft saved: ', form);
        try {
            const photos = form?.photos.map(async (photo) => {
                return await uploadToS3(photo, `attendance-sheet-${photo.split('/').pop()}`, getCompany()?.company_bucket as string, 'image/jpeg')
            })
            const photosUrls = await Promise.all(photos as Promise<string>[]);

            const updatedFormData = {
                ...form,
                photos: photosUrls,
                date: form?.date || new Date(Date.now()).toISOString(),
                training_id: training_id as string,
                uploaded: false
            }

            const currentDrafts = getAttendancesData() as AttendenceSheet[];

            // find the index of the current training data to update base on the date..
            const draftIndex = currentDrafts.findIndex(draft => draft.date === form.date);

            let updatedDrafts: AttendenceSheet[] = [];
            if (draftIndex >= 0) {
                // Update existing draft.
                updatedDrafts = currentDrafts.map((draft, index) =>
                    index === draftIndex ? updatedFormData : draft
                );
            } else {
                // Add new draft
                updatedDrafts = [...currentDrafts, updatedFormData];
            }

            saveAttendancesData(updatedDrafts);
            Alert.alert('Success', 'Data saved to Draft successfully!');
        } catch (error) {
            console.log(`Error updating draft: ${error}`);
        } finally {
            setIsSaving(false);
            // reset the form
            setForm({
                ...AttendanceSheetInitialValues,
                trainers: [{
                    name: "",
                    signature: "",
                    trainer_proof_of_competency: ""
                }],
                participants: [{
                    name: '',
                    organization: '',
                    // position: '',
                    telephone: '',
                    email: '',
                    signature: '',
                    village: ''
                }],
                photos: [],
                report_url: ''
            });

            // empty the signature canvas
            setEmptyCanvas(true);
        }

    };

    const handleSubmit = async () => {
        router.push('/(management)/(trainings)/draft-trainings');
    };

    // show date picker
    const showDatepicker = () => {
        setShowDate(true);
    };
    const hideDatepicker = () => {
        setShowDate(false);
    };
    console.log("show data from form: ", form);

    const deleteTrainer = (indexToDelete: number) => {
        Alert.alert(
            "Delete Trainer",
            "Are you sure you want to delete this trainer?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        setForm(prev => ({
                            ...prev,
                            trainers: prev.trainers.filter((_, index) => index !== indexToDelete)
                        }));
                    }
                }
            ]
        );
    };

    const deleteParticipant = (indexToDelete: number) => {
        Alert.alert(
            "Delete Participant",
            "Are you sure you want to delete this participant?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        setForm(prev => ({
                            ...prev,
                            participants: prev.participants.filter((_, index) => index !== indexToDelete)
                        }));
                    }
                }
            ]
        );
    };

    const deletePhoto = (indexToDelete: number) => {
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
                    style: "destructive",
                    onPress: () => {
                        setForm(prev => ({
                            ...prev,
                            photos: prev.photos.filter((_, index) => index !== indexToDelete)
                        }));
                    }
                }
            ]
        );
    };


    const handleUploadingProofCompetency = useCallback(async (index: number) => {
        setUploading(true);
        try {
            const result = await DocumentPicker.getDocumentAsync();
            if (!result.canceled) {
                const uploadUrl = await uploadToS3(result.assets[0].uri, `training-proof-${result.assets[0].uri.split('/').pop()}`, getCompany()?.company_bucket as string, 'image/jpeg');
                handleTrainerChange(index, 'trainer_proof_of_competency', uploadUrl);
            }
        } catch (error) {
            console.log(`Error uploading proof of competency: ${error}`);
        } finally {
            setUploading(false);
        }
    }, []);


    const deleteDocument = () => {
        Alert.alert(
            "Delete Report",
            "Are you sure you want to delete this report?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        setForm(prev => ({
                            ...prev,
                            report_url: ''
                        }));
                    }
                }
            ]
        );
    }

    // trainer fucntion ?
    const renderTrainerCard = ({ item, index }: { item: TrainerType; index: number }) => (
        <View style={{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN }} className="border p-4 rounded-lg bg-white shadow-md">
            <View className="flex-row justify-between items-center mb-2">
                <Text className="font-bold text-lg">Trainer {index + 1}</Text>
                <TouchableOpacity
                    onPress={() => deleteTrainer(index)}
                    className="bg-red-100 p-2 rounded-full"
                >
                    <Trash2 size={20} color="red" />
                </TouchableOpacity>
            </View>
            <TextInput
                className="border p-2 rounded mb-2"
                placeholder="Name"
                value={item.name}
                onChangeText={(value) => handleTrainerChange(index, 'name', value)}
            />

            <TouchableOpacity
                onPress={() => handleUploadingProofCompetency(index)}
                className="bg-gray-800 p-2 rounded mb-2"
            >
                {uploading ? <ActivityIndicator size="small" color="white" /> : <Text className='text-white text-center'>Upload Proof of Competency </Text>}
            </TouchableOpacity>

            {item.trainer_proof_of_competency && (
                <Text className="text-green-600 mb-2">Proof uploaded ✓</Text>
            )}

            <SignatureInput
                onSignature={(signature) => handleTrainerChange(index, 'signature', signature)}
                label="Trainer Signature"
                author="trainer_"
                emptyCanvas={emptyCanvas}
                className="flex-1 justify-center items-center"
            />
        </View>
    );

    // paticipant fucntion
    const renderParticipantCard = ({ item, index }: { item: Participants; index: number }) => (
        <View style={{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN }} className="border p-4 rounded-lg bg-white shadow-md">
            <View className="flex-row justify-between items-center mb-2">
                <Text className="font-bold text-lg">Participant {index + 1}</Text>
                <TouchableOpacity
                    onPress={() => deleteParticipant(index)}
                    className="bg-red-100 p-2 rounded-full"
                >
                    <Trash2 size={20} color="red" />
                </TouchableOpacity>
            </View>
            <TextInput
                className="border p-2 rounded mb-2"
                placeholder="Name"
                value={item.name}
                onChangeText={(value) => handleParticipantChange(index, 'name', value)}
            />
            <TextInput
                className="border p-2 rounded mb-2"
                placeholder="Organization"
                value={item.organization}
                onChangeText={(value) => handleParticipantChange(index, 'organization', value)}
            />
            <TextInput
                className="border p-2 rounded mb-2"
                placeholder="Village"
                value={item.village}
                onChangeText={(value) => handleParticipantChange(index, 'village', value)}
            />
            <TextInput
                className="border p-2 rounded mb-2"
                placeholder="Telephone"
                value={item.telephone}
                onChangeText={(value) => handleParticipantChange(index, 'telephone', value)}
            />
            <TextInput
                className="border p-2 rounded mb-2"
                placeholder="Email"
                value={item.email}
                onChangeText={(value) => handleParticipantChange(index, 'email', value)}
            />

            <SignatureInput
                onSignature={(signature) => handleParticipantChange(index, 'signature', signature)}
                label="Participant Signature"
                author=""
                emptyCanvas={emptyCanvas}
                className="flex-1 justify-center items-center"
            />
        </View>
    );


    // console.log("inintial value: ", AttendanceSheetInitialValues)
    return (
        <SafeAreaView className=' flex-1 mt-4' style={{ margin: 0 }}>
            <ScrollView className="space-y-4 mb-10" contentContainerStyle={{ padding: 20, }}>
                <Text className="text-xl font-bold mb-4">Attendance Sheet</Text>

                <Text className="font-bold mt-2">Date of Training:</Text>

                {form?.date && <TextInput
                    className="border p-2 rounded mt-1"
                    value={String(form?.date) || ''}
                />}

                <Text className="font-bold ">Title of Training:</Text>
                <TextInput
                    className="border p-2 rounded"
                    value={form?.title}
                    onChangeText={(value) => handleInputChange('title', value)}
                />
                <Text className="font-bold ">location of Training:</Text>
                <TextInput
                    className="border p-2 rounded"
                    value={form?.location}
                    onChangeText={(value) => handleInputChange('location', value)}
                />
                <Text className="font-bold mt-2">Modules:</Text>
                {
                    form?.modules.map((module, index) => (
                        <TextInput
                            key={index}
                            className="border p-2 rounded mt-1"
                            value={module}
                            onChangeText={(value) => {
                                const newModules = [...form?.modules];
                                newModules[index] = value;
                                handleInputChange('modules', newModules);
                            }}
                        />
                    ))

                }

                <TouchableOpacity
                    onPress={() => handleInputChange('modules', [...form?.modules, ''])}
                    className='bg-gray-800  p-2 rounded '
                >
                    <Text className='text-white text-center'>Add Module</Text>
                </TouchableOpacity>
                <Text className="font-bold mt-2">Trainers:</Text>

                <View className="mb-4">
                    <FlatList
                        data={form?.trainers}
                        renderItem={renderTrainerCard}
                        keyExtractor={(_, index) => `trainer-${index}`}
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        contentContainerStyle={{ paddingHorizontal: 10 }}
                    />
                    <TouchableOpacity
                        onPress={() => handleInputChange('trainers', [...form?.trainers, { name: '', signature: '', trainer_proof_of_competency: '' }])}
                        className="bg-gray-800 p-2 rounded mt-2"
                    >
                        <Text className="text-white text-center">Add Trainer</Text>
                    </TouchableOpacity>
                </View>

                <Text className="font-bold mt-2">Participants:</Text>

                <View className="mb-4">
                    <FlatList
                        data={form?.participants}
                        renderItem={renderParticipantCard}
                        keyExtractor={(_, index) => `participant-${index}`}
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        contentContainerStyle={{ paddingHorizontal: 10 }}
                    />
                    <TouchableOpacity
                        onPress={addParticipant}
                        className="bg-gray-800 p-2 rounded mt-2"
                    >
                        <Text className="text-white text-center">
                            Add Participant
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text className="font-bold mt-2">Photos:</Text>

                <TouchableOpacity
                    onPress={handlePhotoUpload}
                    className='bg-gray-800  p-2 rounded '
                >
                    <Text className='text-white text-center'>Upload Photo</Text>
                </TouchableOpacity>

                {/* {form.photos.map((photo, index) => (
                    <Text key={index} className='text-green-500'>{`Photo ${index + 1}`},</Text>
                ))} */}
                <View className="flex-row flex-wrap gap-2">
                    {form?.photos?.map((photo, index) => (
                        <View key={index} className="flex-row items-center bg-gray-100 p-2 rounded">
                            <Text className="text-green-500">{`Photo ${index + 1}`}</Text>
                            <TouchableOpacity
                                onPress={() => deletePhoto(index)}
                                className="ml-2 bg-red-100 p-1 rounded-full"
                            >
                                <Trash2 size={16} color="red" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <Text className="font-bold mt-2">Workshop Report:</Text>

                <TouchableOpacity
                    onPress={handleDocumentUpload}
                    className='bg-gray-800  p-2 rounded '
                >
                    {uploading ? <ActivityIndicator size="small" color="white" />
                        : <Text className='text-white text-center'>  Upload Report </Text>
                    }
                </TouchableOpacity>
                {form.report_url && (
                    <View className="flex-row items-center bg-gray-100 p-2 rounded">
                        <Text className='text-green-500'> Report added</Text>
                        <TouchableOpacity
                            onPress={() => deleteDocument()}
                            className="ml-2 bg-red-100 p-1 rounded-full"
                        >
                            <Trash2 size={16} color="red" />
                        </TouchableOpacity>
                    </View>
                )}

                <View className="flex-row justify-between mt-4">
                    <TouchableOpacity
                        onPress={handleSaveDraft}
                        className='bg-gray-800  p-2 rounded '
                    >
                        {isSaving ?
                            <ActivityIndicator size="small" color="white" />
                            : <Text className='text-white text-center'>  Save Draft </Text>
                        }
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push('/(management)/(trainings)/draft-trainings')}
                        className='bg-gray-800  p-2 rounded '
                    >
                        <Text className='text-white text-center'>end meeting</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
