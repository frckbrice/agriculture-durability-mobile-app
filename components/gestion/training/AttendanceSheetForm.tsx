

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput,
    Button, ScrollView, TouchableOpacity,
    SafeAreaView, FlatList, Dimensions,
    Alert, ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import SignatureScreen from 'react-native-signature-canvas';
import { AttendanceSheetInitialValues } from '@/constants/initial-values';
import { AttendanceSheetType, AttendenceSheet, Company, Participants, TrainerType } from '@/interfaces/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAttendanceDataStore } from '@/store/training-attendances-data-storage';
import SignatureInput from '../../global/signatures/signature-capture';
import { Trash2 } from 'lucide-react-native';
import PhotoList from '../../delete-photo';
import { Training, TFetchType } from '@/interfaces/types';
import { useCompanyStore } from '@/store/current-company-store';
import { useNetInfo } from '@react-native-community/netinfo';
import { InitialAttendanceSheet } from '@/constants/constants';
import { StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import ModuleManagement from './module-management';
import { useAgentProjects } from '@/hooks/use-agent-projects';

// Set a fixed card width based on screen dimensions for consistent layout
const CARD_WIDTH = Dimensions.get('window').width * 0.8;
const CARD_MARGIN = 10;

interface ValidationMessages {
    name?: string;
    organization?: string;
    village?: string;
    telephone?: string;
    email?: string;
    signature?: string;
    trainer_proof_of_competency?: string;
}

export function AttendanceSheetForm() {
    const [drafts, setDrafts] = useState<AttendenceSheet[] | []>([]);
    const [showDate, setShowDate] = useState(false);
    const [showSignature, setShowSignature] = useState<'none' | 'trainer_' | ''>('none');

    const { training_id } = useLocalSearchParams();
    const [project, setProject] = useState<{
        code: string,
        company_id: string,
        id: string,
        location: string,
        status: "DEPLOYED" | "DRAFT" | "ARCHIVED",
        title: string,
        modules: string[]
    } | any>({});

    // reset the canvas signature
    const [emptyCanvas, setEmptyCanvas] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [errorCreatingNewtrainer, setErrorCreatingNewtrainer] = useState({
        name: "",
        message: ""
    });
    const [errorCreatingNewparticipant, setErrorCreatingNewparticipant] = useState({
        name: "",
        message: ""
    });

    // call the stoore mmkv
    const {
        getAttendancesData,
        saveAttendancesData,
    } = useAttendanceDataStore();

    const [form, setForm] = useState<AttendenceSheet>(InitialAttendanceSheet);
    const [currentCompany, setCurrentCompany] = useState<Company>();
    const router = useRouter();
    // check network
    const { isConnected } = useNetInfo();

    const {
        getCompany,
    } = useCompanyStore();

    const [selectedTrainerIndex, setSelectedTrainerIndex] = useState<number | null>(null);
    const [selectedParticipantIndex, setSelectedParticipantIndex] = useState<number | null>(null);
    const [validationMessages, setValidationMessages] = useState<{
        trainers: ValidationMessages[];
        participants: ValidationMessages[];
    }>({
        trainers: [],
        participants: []
    });

    const { trainingProjects: fetchedProjects } = useAgentProjects();

    useEffect(() => {
        // fetch the current training project locally. this increase performance.
        if (fetchedProjects.length) {
            const currentProject = fetchedProjects?.find((p: Training) => p.id === training_id);
            console.log("\n\n the project module is: ", currentProject?.modules)
            setForm((prev) => ({ ...prev, modules: currentProject?.modules }))
            setProject(currentProject);
        }
        loadCurrentCompany();
    }, [training_id]);

    const loadCurrentCompany = useCallback(async () => {
        try {
            const company = getCompany();
            if (company && !currentCompany)
                setCurrentCompany(company);
        } catch (error) {
            console.error('Error loading offline data:', error);
        }
    }, [getCompany, setCurrentCompany]);

    // Implementation in your component
    const validateForm = (form: AttendenceSheet) => {
        let isValid = true;

        // Validate trainers
        const trainerValid = form.trainers.every((t) => validateTrainer(t));

        // Validate participants
        const participantValid = form.participants.every((p) => validateParticipant(p));

        const validReport = !!form?.report_url;
        const validPhoto = !!form?.photos;
        const validDate = !!form?.date;

        // Also check if modules are selected
        const validModules = form.modules?.length > 0;
        if (validModules)
            return trainerValid && participantValid && validReport && validPhoto && validDate && validModules;
        return trainerValid && participantValid && validReport && validPhoto && validDate;
    };

    // Validate trainer 
    const validateTrainer = (trainer: TrainerType) => {
        return trainer.name &&
            trainer.signature &&
            trainer.trainer_proof_of_competency;
    };

    // validate participant
    const validateParticipant = (participant: Participants) => {
        return participant.name &&
            participant.village &&
            participant.telephone &&
            participant.signature;
    };

    const handleInputChange = (field: keyof AttendenceSheet, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (field === 'date')
            hideDatepicker();
    };

    // create participant list
    const handleParticipantChange = useCallback(async (index: number, field: keyof AttendenceSheet['participants'][0], value: string) => {
        setForm(prev => {
            const newParticipants = [...prev.participants];
            newParticipants[index] = {
                ...newParticipants[index],
                [field]: value
            };
            return { ...prev, participants: newParticipants };
        });

        // Validate after field change
        validateParticipantContent(index, field, value);
    }, [form.participants]);

    // create trainer list
    const handleTrainerChange = useCallback(async (index: number, field: keyof AttendenceSheet['trainers'][0], value: string) => {
        setForm(prev => {
            const newTrainers = [...prev.trainers];
            newTrainers[index] = {
                ...newTrainers[index],
                [field]: value,
            };
            return { ...prev, trainers: newTrainers };
        });

        // Validate after field change
        validateTrainerContent(index, field, value);
    }, [form.trainers]);

    const addParticipant = useCallback(() => { // posibility to add new participant
        const lastParticipant = form.participants[form.participants.length - 1];

        if (!validateParticipant(lastParticipant)) {
            setErrorCreatingNewparticipant({ // check that the new participant is created when the last one is up-to-date
                name: 'Participant',
                message: 'Please complete all the current participant\'s details before adding a new one.'
            });
            setTimeout(() => {
                setErrorCreatingNewparticipant({
                    name: '',
                    message: ''
                });
            }, 4500);
            return;
        }
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
    }, [setForm, setErrorCreatingNewparticipant, validateParticipant]);

    const addTrainer = useCallback(() => {
        const lastTrainer = form.trainers[form.trainers.length - 1];

        if (!validateTrainer(lastTrainer)) {  // check that the new trainer is created when the last one is up-to-date
            setErrorCreatingNewtrainer({
                name: 'Trainer',
                message: 'Please complete all the current trainer\'s details before adding a new one.'
            });
            setTimeout(() => {
                setErrorCreatingNewtrainer({
                    name: '',
                    message: ''
                });
            }, 4500);
            return;
        }
        handleInputChange('trainers', [
            ...form.trainers,
            {
                name: '',
                signature: '',
                trainer_proof_of_competency: ''
            }])
    }, [handleInputChange, validateTrainer, setErrorCreatingNewtrainer])

    // upload photo
    const handlePhotoUpload = useCallback(async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            aspect: [4, 3],
            quality: 1,
            // base64: true,
        });

        if (!result.canceled) {
            const { uri } = result.assets[0];
            setForm(prev => ({ ...prev, photos: [...prev.photos, uri] }));
        }
    }, [setForm]);

    // upload document
    const handleDocumentUpload = useCallback(async () => {
        setUploading(true)
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });

            if (!result.canceled) {
                const { uri } = result.assets[0];
                setForm(prev => ({ ...prev, report_url: uri }));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
    }, [setForm]);

    const handleSaveDraft = async () => {
        if (!validateForm(form)) {
            Alert.alert('Validation Error', 'Please complete all required fields');
            return;
        }

        setIsSaving(true)

        try {
            const data = {
                ...form,
                photos: form?.photos,
                title: form?.title || project?.title,
                location: form?.location || project?.location,
                date: form?.date || new Date(Date.now()).toISOString(),
                modules: form.modules.length ? form.modules : project?.modules || []
            }

            const buildDrafts = [
                ...getAttendancesData() as AttendenceSheet[],
                { ...data, training_id, uploaded: false }
            ];
            console.log("attendenceSheet saved:", buildDrafts);
            setDrafts(buildDrafts as AttendenceSheet[]);
            saveAttendancesData(buildDrafts as AttendenceSheet[]);

            setEmptyCanvas(true);
            setForm(InitialAttendanceSheet);
            handleSubmit();
        } catch (error) {
            console.error(`Failed to save data to draft: ${error}`);
            Alert.alert('Failure', 'failed to save data to draft')
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async () => {
        Alert.alert(
            'Success', `data saved successfully to draft, \n Click OK to go to draft list.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'OK',
                    onPress: () => {
                        router.push('/(management)/(trainings)/draft-trainings');
                    }
                },
            ]
        )
    };

    // show date picker
    const showDatepicker = () => {
        setShowDate(true);
    };
    const hideDatepicker = () => {
        setShowDate(false);
    };

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
                        if (selectedTrainerIndex !== null) {
                            if (selectedTrainerIndex === 0) // avoid to delete all the participant. if it remain only one participant, no deletez
                                return
                            setForm(prev => ({
                                ...prev,
                                trainers: prev.trainers.filter((_, index) => index !== selectedTrainerIndex)
                            }));
                            setSelectedTrainerIndex(null);
                        }
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
                        if (selectedParticipantIndex !== null) {
                            // make sure the should not delete all the participants
                            if (selectedParticipantIndex === 0)
                                return

                            setForm(prev => ({
                                ...prev,
                                participants: prev.participants.filter((_, index) => index !== selectedParticipantIndex)
                            }));
                            setSelectedParticipantIndex(null);
                        }
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

    // delete upfoaded document
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

    const handleUploadingProofCompetency = useCallback(async (index: number) => {
        setUploading(true);
        try {
            const result = await DocumentPicker.getDocumentAsync();
            if (!result.canceled) {
                const { uri } = result.assets[0];
                handleTrainerChange(index, 'trainer_proof_of_competency', uri);
            }
        } catch (error) {
            console.log(`Error uploading proof of competency: ${error}`);
        } finally {
            setUploading(false);
        }
    }, []);

    // Trainer validation
    const validateTrainerContent = (index: number, field: keyof AttendanceSheetType['trainers'][0], value: string) => {
        const messages: ValidationMessages = {};

        if (field && field === 'name') {
            if (value.trim().length < 2) {
                setErrorCreatingNewtrainer({
                    name: 'Trainer',
                    message: 'Invalid name format. A name must be at least 2 characters long (minimum 2 caracteres).'
                });
            }
            if (!/^[a-zA-Z\s'-]+$/.test(value)) {
                setErrorCreatingNewtrainer({
                    name: 'Trainer',
                    message: 'Invalid name format. Name should only contain alphabetic characters, spaces, apostrophes, or hyphens.'
                })
            }
        }

        setTimeout(() => {
            setErrorCreatingNewtrainer({
                name: 'Trainer',
                message: ''
            })
        }, 4500);
    };

    // Participant validation
    const validateParticipantContent = (index: number, field: keyof AttendanceSheetType['participants'][0], value: string) => {
        const messages: ValidationMessages = {};

        if (field === 'telephone') {
            const isValid = /^(?:\+237\d{9}|0237\d{9}|(64|65|66|67|68|69|62)\d{7}|22\d{7}|11\d{6})$/.test(value);
            if (!isValid) {
                setErrorCreatingNewparticipant({
                    name: 'Participant',
                    message: 'Invalid phone number. Please ensure the number is in the correct Cameroon format.'
                })
                setTimeout(() => {
                    setErrorCreatingNewparticipant({
                        name: '',
                        message: ''
                    });
                }, 4500);
            }
        }

        if (field && field === 'name') {
            if (value.trim().length < 2) {
                setErrorCreatingNewparticipant({
                    name: 'Participant',
                    message: 'Invalid name format. A name must be at least 2 characters long (minimum 2 caracteres).'
                })
            }
            if (!/^[a-zA-Z\s'-]+$/.test(value)) {
                setErrorCreatingNewparticipant({
                    name: 'Participant',
                    message: 'A name can only contain letters, spaces, hyphens, and apostrophes (uniquement lettres, espace, tiret, apostrophes).'
                })
            }
            setTimeout(() => {
                setErrorCreatingNewparticipant({
                    name: '',
                    message: ''
                });
            }, 4500);
        }

        if (field && field === 'email') {
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            if (!isValid) {
                setErrorCreatingNewparticipant({
                    name: 'Participant',
                    message: 'Invalid email format. Please ensure the email address is in the correct format.'
                })
            }
            setTimeout(() => {
                setErrorCreatingNewparticipant({
                    name: '',
                    message: ''
                });
            }, 4500);
        }

        if (field && field === 'village') {
            if (value.trim().length < 2) {
                setErrorCreatingNewparticipant({
                    name: 'Participant',
                    message: 'Invalid village format. A village must be at least 2 characters long (minimum 2 caracteres).'
                })
            }
            setTimeout(() => {
                setErrorCreatingNewparticipant({
                    name: '',
                    message: ''
                });
            }, 4500);
        }
    };

    // trainer fucntion ?
    const renderTrainerCard = ({ item, index }: { item: TrainerType; index: number }) => (
        <TouchableOpacity
            style={[
                styles.card,
                selectedTrainerIndex === index && styles.selectedCard
            ]}
            onPress={() => setSelectedTrainerIndex(index)}
        >
            <Text className='text-red-500 text-xs'>{errorCreatingNewtrainer?.message}</Text>
            <View className="flex-row justify-between items-center mb-2">
                <View className='flex-row items-center'>
                    <Text className="font-bold text-lg">Trainer {index + 1}</Text>
                    <Text className='text-red-500 text-xs'>*</Text>
                </View>
                {selectedTrainerIndex === index && (
                    <TouchableOpacity
                        onPress={() => deleteTrainer(index)}
                        className="bg-red-100 p-2 rounded-full"
                    >
                        <Trash2 size={20} color="red" />
                    </TouchableOpacity>
                )}
            </View>

            <View className="mb-4">
                <TextInput
                    className={`w-full p-2 border ${validationMessages.trainers[index]?.name ? 'border-red-500' : 'border-gray-300'} rounded-md bg-white`}
                    placeholder="Name"
                    value={item.name}
                    onChangeText={(value) => handleTrainerChange(index, 'name', value)}
                />
                {validationMessages.trainers[index]?.name && (
                    <Text className="text-red-500 text-xs mt-1">{validationMessages.trainers[index].name}</Text>
                )}
            </View>

            <TouchableOpacity
                onPress={() => handleUploadingProofCompetency(index)}
                className={`bg-gray-800 p-2 rounded mb-2 ${validationMessages.trainers[index]?.trainer_proof_of_competency ? 'border-red-500' : ''}`}
            >
                <Text className="text-white text-center">
                    {uploading ? <ActivityIndicator size="small" color="white" /> : 'Upload Proof of Competency'}
                </Text>
            </TouchableOpacity>

            {validationMessages.trainers[index]?.trainer_proof_of_competency && (
                <Text className="text-red-500 text-xs mb-2">{validationMessages.trainers[index].trainer_proof_of_competency}</Text>
            )}

            {item.trainer_proof_of_competency && (
                <Text className="text-green-600 mb-2">Proof uploaded ✓</Text>
            )}

            <View className="mb-4">
                <SignatureInput
                    onSignature={(signature) => handleTrainerChange(index, 'signature', signature)}
                    label="Trainer Signature"
                    author="trainer_"
                    emptyCanvas={emptyCanvas}
                    className="flex-1 justify-center items-center"
                />
                {validationMessages.trainers[index]?.signature && (
                    <Text className="text-red-500 text-xs mt-1">{validationMessages.trainers[index].signature}</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    // paticipant fucntion
    const renderParticipantCard = ({ item, index }: { item: Participants; index: number }) => (
        <TouchableOpacity
            style={[
                styles.card,
                selectedParticipantIndex === index && styles.selectedCard
            ]}
            onPress={() => setSelectedParticipantIndex(index)}
        >
            <Text className='text-red-500 text-xs'>{errorCreatingNewparticipant?.message}</Text>
            <View className="flex-row justify-between items-center mb-2">
                <View className='flex-row items-center'>
                    <Text className="font-bold text-lg">Participant {index + 1}</Text>
                    <Text className='text-red-500 text-xs'>*</Text>
                </View>
                {selectedParticipantIndex === index && (
                    <TouchableOpacity
                        onPress={() => deleteParticipant(index)}
                        className="bg-red-100 p-2 rounded-full"
                    >
                        <Trash2 size={20} color="red" />
                    </TouchableOpacity>
                )}
            </View>

            <View className="mb-4">
                <TextInput
                    className={`border p-2 rounded ${validationMessages.participants[index]?.name ? 'border-red-500' : ''}`}
                    placeholder="Name"
                    value={item.name}
                    onChangeText={(value) => handleParticipantChange(index, 'name', value)}
                />
                {validationMessages.participants[index]?.name && (
                    <Text className="text-red-500 text-xs mt-1">{validationMessages.participants[index].name}</Text>
                )}
            </View>

            <View className="mb-4">
                <TextInput
                    className={`border p-2 rounded ${validationMessages.participants[index]?.organization ? 'border-red-500' : ''}`}
                    placeholder="Organization"
                    value={item.organization}
                    onChangeText={(value) => handleParticipantChange(index, 'organization', value)}
                />
                {validationMessages.participants[index]?.organization && (
                    <Text className="text-red-500 text-xs mt-1">{validationMessages.participants[index].organization}</Text>
                )}
            </View>

            <View className="mb-4">
                <TextInput
                    className={`border p-2 rounded ${validationMessages.participants[index]?.village ? 'border-red-500' : ''}`}
                    placeholder="Village"
                    value={item.village}
                    onChangeText={(value) => handleParticipantChange(index, 'village', value)}
                />
                {validationMessages.participants[index]?.village && (
                    <Text className="text-red-500 text-xs mt-1">{validationMessages.participants[index].village}</Text>
                )}
            </View>

            <View className="mb-4">
                <TextInput
                    className={`border p-2 rounded ${validationMessages.participants[index]?.telephone ? 'border-red-500' : ''}`}
                    placeholder="Telephone"
                    value={item.telephone}
                    onChangeText={(value) => handleParticipantChange(index, 'telephone', value)}
                />
                {validationMessages.participants[index]?.telephone && (
                    <Text className="text-red-500 text-xs mt-1">{validationMessages.participants[index].telephone}</Text>
                )}
            </View>

            <View className="mb-4">
                <TextInput
                    className={`border p-2 rounded ${validationMessages.participants[index]?.email ? 'border-red-500' : ''}`}
                    placeholder="Email"
                    value={item.email}
                    onChangeText={(value) => handleParticipantChange(index, 'email', value)}
                />
                {validationMessages.participants[index]?.email && (
                    <Text className="text-red-500 text-xs mt-1">{validationMessages.participants[index].email}</Text>
                )}
            </View>

            <View className="mb-4">
                <SignatureInput
                    onSignature={(signature) => handleParticipantChange(index, 'signature', signature)}
                    label="Participant Signature"
                    author=""
                    emptyCanvas={emptyCanvas}
                    className="flex-1 justify-center items-center"
                />
                {validationMessages.participants[index]?.signature && (
                    <Text className="text-red-500 text-xs mt-1">{validationMessages.participants[index].signature}</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    console.log("form modules: ", form?.modules);

    return (
        <SafeAreaView className='flex-1 mt-4'>
            <ScrollView className="space-y-4 mb-10" contentContainerStyle={{ padding: 20, }}>
                <Text className="text-xl font-bold mb-4">Attendance Sheet</Text>

                {!form?.date && !showDate && (
                    <TouchableOpacity
                        onPress={showDatepicker}
                        className='bg-gray-800 p-2 rounded flex-row items-center justify-center'
                    >
                        <Ionicons name='calendar-number-sharp' size={20} color={'white'} />
                        <Text className='text-center text-white ml-2'>
                            Click to Select a date
                        </Text>
                    </TouchableOpacity>
                )}

                {showDate && <DateTimePicker
                    value={new Date(Date.now())}
                    mode={'date'}
                    display="default"
                    onChange={(event, selectedDate) => {
                        // on cancel set date value to previous date
                        if (event?.type === 'dismissed') {
                            setForm(prev => ({ ...prev, date: form.date }));
                            return;
                        }
                        return handleInputChange('date', selectedDate)
                    }}
                />}

                {form?.date && (
                    <TouchableOpacity onPress={showDatepicker} className='flex-col items-center justify-start '>
                        <Text className="font-bold mt-2">Date of Training:</Text>
                        <Text className="text-end text-green-600">
                            {new Date(form.date).toLocaleDateString()}
                        </Text>
                    </TouchableOpacity>
                )}

                <Text className="font-bold">Title of Training:</Text>
                <TextInput
                    className="border p-2 rounded"
                    value={form.title || project?.title}
                />

                <Text className="font-bold">Location of Training:</Text>
                <TextInput
                    className="border p-2 rounded"
                    value={form.location || project?.location}
                    onChangeText={(value) => handleInputChange('location', value)}
                />

                {/* Module Management Component */}
                <View className="mt-4">
                    <Text className="font-bold mb-2">Training Modules:</Text>
                    <ModuleManagement
                        availableModules={project?.modules || []}
                        setForm={setForm}
                        isProjectModules={!!project?.modules?.length}
                    />
                </View>

                {/* trainer section */}
                <Text className="font-bold mt-4">Trainers:</Text>

                <View className="mb-4">
                    <FlatList
                        data={form.trainers}
                        renderItem={renderTrainerCard}
                        keyExtractor={(_, index) => `trainer-${index}`}
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        contentContainerStyle={{ paddingHorizontal: 10 }}
                    />
                    <TouchableOpacity
                        onPress={addTrainer}
                        className="bg-gray-800 p-2 rounded mt-2"
                    >
                        <Text className="text-white text-center">Add Trainer</Text>
                    </TouchableOpacity>
                </View>

                <Text className="font-bold mt-2">Participants:</Text>

                <View className="mb-4">
                    <FlatList
                        data={form.participants}
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
                        <Text className="text-white text-center">Add Participant</Text>
                    </TouchableOpacity>
                </View>

                <Text className="font-bold mt-2">Photos:</Text>

                <TouchableOpacity
                    onPress={handlePhotoUpload}
                    className='bg-gray-800  p-2 rounded '
                >
                    <Text className='text-white text-center'>Upload Photo</Text>
                </TouchableOpacity>

                <View className="flex-1 p-4">
                    <PhotoList
                        photos={form.photos}
                        onDeletePhoto={deletePhoto}
                    />
                </View>

                <TouchableOpacity
                    onPress={handleDocumentUpload}
                    className='bg-gray-800  p-2 rounded '
                >
                    {uploading ?
                        <ActivityIndicator size="small" color="white" />
                        : <Text className='text-white text-center'> Upload report</Text>
                    }

                </TouchableOpacity>
                {form.report_url && (
                    <View className="flex-row items-center bg-gray-100 p-2 rounded">
                        <Text className='text-green-500'>Report added</Text>
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
                        <Text className='text-white text-center'>
                            {isSaving ?
                                <ActivityIndicator size="small" color="white" />
                                : <Text className='text-white text-center'>Save Draft</Text>}
                        </Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity
                        onPress={() => handleSubmit()}
                        className='bg-gray-800  p-2 rounded '
                    >
                        <Text className='text-white text-center'>end meeting</Text>
                    </TouchableOpacity> */}

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        marginHorizontal: CARD_MARGIN,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 16,
        borderRadius: 8,
        backgroundColor: 'white'
    },
    selectedCard: {
        borderColor: 'blue',
        backgroundColor: '#f0f0ff'
    }
});