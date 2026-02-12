

import { Company, Coordinates, MappingData, MappingFormData } from "@/interfaces/types";
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, Button,
    Image, ScrollView, SafeAreaView,
    StyleSheet, FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useForm, Controller } from 'react-hook-form';
import { mappingInitialValues } from "@/constants/initial-values";
import CustomButton from "../../custom-button";
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { useFarmerMappingDataStore } from "@/store/farmer-data-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
// import * as TaskManager from 'expo-task-manager';
import DateTimePicker from '@react-native-community/datetimepicker';
import PhotoList from "../../delete-photo";
import { editFarmerData } from "@/store/mmkv-store";
import { useEditProjectDataStore } from "@/store/edit-project-data";
import { enhancedValidatePolygon, uploadToS3, validatePolygon } from "@/lib/functions";
import { useCompanyStore } from "@/store/current-company-store";

type EditMappingProps = {
    isViewing?: boolean;
}

const EditMappingFormDetails = ({ isViewing }: EditMappingProps) => {
    const { handleSubmit } = useForm<MappingFormData>();
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
    const [plantationPhotos, setPlantationPhotos] = useState<string[]>([]);
    const [farmerPhotos, setFarmerPhotos] = useState<string[]>([]);
    const [mappingValues, setMappingValues] = useState<MappingFormData>(mappingInitialValues);
    const [isRecording, setIsRecording] = useState(false);
    const [submit, setSubmit] = useState(false);

    const router = useRouter();
    const watchPositionSubscription = useRef<Location.LocationSubscription | null>(null);
    const { mapping_id } = useLocalSearchParams();
    const { saveMappingsData, getMappingsData } = useFarmerMappingDataStore();
    const mapRef = useRef<MapView | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [currentCompany, setCurrentCompany] = useState<Company>();
    const [showDate, setShowDate] = useState(false);

    const {
        getProjectData: getEditMappingData,
    } = useEditProjectDataStore();

    // get current company store
    const {
        getCompany
    } = useCompanyStore();


    useEffect(() => {
        // const data = editFarmerData.getString('current_FarmerMappingData');
        // const farmerMappingData = JSON.parse(data as string);
        const farmerMappingData = getEditMappingData();
        console.log("farmer Mapping Data: ", farmerMappingData);

        if (farmerMappingData) {
            setMappingValues(farmerMappingData?.project_data);
            // Initialize coordinates from existing data
            if (farmerMappingData?.project_data.coordinates?.length > 0) {
                setCoordinates(farmerMappingData?.project_data?.coordinates || []);
            }
        }
        const company = getCompany();
        if (company && !currentCompany)
            setCurrentCompany(company);
    }, []);

    useEffect(() => {
        (async () => {
            let { status, } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.error('Permission to access location was denied');
                return;
            }

            // await startLocationUpdates();
            let location = await Location.getCurrentPositionAsync({});
            setLocation({
                longitude: +location.coords.longitude,
                latitude: +location.coords.latitude
            })

        })();

        return () => {
            if (watchPositionSubscription.current) {
                watchPositionSubscription.current.remove();
            }
        };

    }, [isRecording]);

    // Continuous Location Updates: This ensures that location is tracked even when /the app is in the background.
    const startLocationUpdates = async () => {
        console.log("started startLocationUpdates function: ")
        if (watchPositionSubscription.current) {
            console.log("watchPositionSubscription: ", watchPositionSubscription.current)
            watchPositionSubscription.current.remove();
        }
        let compter = 0;
        console.log("value of isRecording: ", isRecording)
        watchPositionSubscription.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.BestForNavigation,
                distanceInterval: 5, // minimum change (in meters) before receiving a location update
                timeInterval: 5000, // minimum time to wait between each update (milliseconds)
            },
            (location) => {
                if (!isRecording) {
                    console.log("add cordinate new coordinate: ", compter++)
                    addCoordinate(location);
                }
            }
        );
    };

    const takePhoto = async (setPhotos: React.Dispatch<React.SetStateAction<string[]>>) => {
        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            aspect: [4, 3],
            quality: 1,
            base64: true,
            mediaTypes: ImagePicker.MediaTypeOptions.Images // allow only images and not video
        });

        if (!result.canceled) {
            // const base64 = `data:image/png;base64,${result.assets[0].base64}`
            const { uri } = result?.assets[0];
            setPhotos([...farmerPhotos, uri as string]);
        }
    };

    const addCoordinate = (location: Location.LocationObject) => {
        const newCoord = {
            latitude: Number(location.coords.latitude.toFixed(7)),
            longitude: Number(location.coords.longitude.toFixed(7)),
        };

        console.log("inside addCoordinate function : \n\n", location)
        setCoordinates(prevCoordinates => [...prevCoordinates, newCoord]);
    };

    const startRecording = () => {
        setCoordinates([]); // Clear previous coordinates
        setIsRecording(true);
        setTimeout(async () => {
            await startLocationUpdates();
        }, 100)
    };

    const stopRecording = () => {
        setIsRecording(false);
        if (watchPositionSubscription.current) {
            watchPositionSubscription.current.remove();
        }
    };

    const resetCoordinates = () => {
        setCoordinates([]);
        setIsRecording(false);
        if (watchPositionSubscription.current) {
            watchPositionSubscription.current.remove();
        }
    };

    const onSubmit = async (data: MappingFormData) => {


        // First validate the polygon
        const polygonValidation = enhancedValidatePolygon(coordinates);

        if (!polygonValidation.isValid) {
            // Handle different types of polygon errors
            switch (polygonValidation.errorType) {
                case 'self_intersection':
                    Alert.alert(
                        "Polygon Intersection Detected",
                        "Your polygon has crossing lines. Would you like to:",
                        [
                            {
                                text: "Remove Problematic Segments",
                                onPress: () => {
                                    // Remove the last segments that caused the intersection
                                    if (polygonValidation.errorDetails?.problematicSegments) {
                                        const segmentsToRemove = new Set(
                                            polygonValidation.errorDetails.problematicSegments.flat()
                                        );

                                        const cleanedCoordinates = coordinates.filter(
                                            (_, index) => !segmentsToRemove.has(index)
                                        );

                                        setCoordinates(cleanedCoordinates);

                                        Alert.alert(
                                            "Coordinates Cleaned",
                                            "Problematic segments have been removed. Please continue recording."
                                        );
                                    }
                                }
                            },
                            {
                                text: "Reset Coordinates",
                                onPress: resetCoordinates,
                                style: "destructive"
                            },
                            {
                                text: "Cancel",
                                style: "cancel"
                            }
                        ]
                    );
                    break;

                case 'not_closed':
                    Alert.alert(
                        "Polygon Not Closed",
                        `The distance between start and end points is ${Math.round(
                            polygonValidation.errorDetails?.distance || 0
                        )} meters. Would you like to:`,
                        [
                            {
                                text: "Manually Close Polygon",
                                onPress: () => {
                                    // Add option to manually add closing point
                                    // Could open a modal or provide UI to precisely place final point
                                    Alert.alert(
                                        "Close Polygon",
                                        "Tap on the map to place the final point and close the polygon."
                                    );
                                }
                            },
                            {
                                text: "Auto-Close Polygon",
                                onPress: () => {
                                    // Automatically add a point to close the polygon
                                    const startPoint = coordinates[0];
                                    setCoordinates(prev => [...prev, startPoint]);
                                }
                            },
                            {
                                text: "Reset Coordinates",
                                onPress: resetCoordinates,
                                style: "destructive"
                            }
                        ]
                    );
                    break;

                case 'insufficient_points':
                    Alert.alert(
                        "Insufficient Points",
                        "At least 3 points are required to form a polygon. Continue recording coordinates.",
                        [{ text: "OK" }]
                    );
                    break;

                case 'small_area':
                    Alert.alert(
                        "Small Polygon Area",
                        "The polygon area is very small. Would you like to continue or reset?",
                        [
                            {
                                text: "Continue",
                                onPress: () => {
                                    // Proceed with current coordinates
                                    continueSubmission(data);
                                }
                            },
                            {
                                text: "Reset Coordinates",
                                onPress: resetCoordinates,
                                style: "destructive"
                            }
                        ]
                    );
                    break;
            }


            return;
        }

        // If polygon is valid, proceed with submission
        continueSubmission(data);
    };

    const continueSubmission = async (data: MappingFormData) => {
        setIsSaving(true);

        try {

            const fPhotos = farmerPhotos?.map(async (photo) => {
                return await uploadToS3(photo, `mapping-${formData.farmer_name}-${photo.split('/').pop()}`, currentCompany?.company_bucket as string, 'image/jpeg')
            })
            const pPhotos = plantationPhotos?.map(async (photo) => {
                return await uploadToS3(photo, `mapping-${formData.farmer_name}-${photo.split('/').pop()}`, currentCompany?.company_bucket as string, 'image/jpeg')
            })

            const fPhotosUrls = await Promise.all(fPhotos as Promise<string>[]);
            const pPhotosUrls = await Promise.all(pPhotos as Promise<string>[]);

            const formData: MappingFormData = {
                ...data,
                ...mappingValues,
                plantation_photos: pPhotosUrls,
                farmer_photos: fPhotosUrls,
                coordinates,
                location: location as Coordinates,
                date: new Date(Date.now()).toISOString()
            };
            console.log(`json object:`, formData);
            // const geoJSON = {
            //     type: 'Mapping',
            //     properties: { ...formData },
            //     geometry: {
            //         type: 'Polygon',
            //         coordinates: [
            //             coordinates.map(coord => [coord.longitude, coord.latitude])
            //         ],
            //     },
            // };

            // const fileName = `plantation_${Date.now()}.geojson`;
            // const fileUri = `${FileSystem.documentDirectory}${fileName}`;
            // await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(geoJSON));

            // console.log(`File saved at: ${fileUri}`);
            // saving data to local store... to be getting in the next step (drafted-project component)
            const existingData = getMappingsData()?.map((item: MappingData) => item.project_data?.farmer_ID_card_number === formData.farmer_ID_card_number ? {
                uploaded: false,
                project_data: formData,
                project_id: mapping_id as string
            } : item).filter((item: any) => item !== null);
            saveMappingsData(existingData);
            Alert.alert("Success", 'data saved to draft list.');
            setSubmit(true);

        } catch (error) {
            console.error(`Error saving mapping data to the draft list \n\n ${error}`);
        } finally {
            setIsSaving(false);
        }
    };

    // handle delete photo
    const handleDeletePhoto = (indexToDelete: number) => {
        setFarmerPhotos(currentPhotos =>
            currentPhotos.filter((_, index) => index !== indexToDelete)
        );
    };

    // handle delete photo
    const handleDeleteFarmPhoto = (indexToDelete: number) => {
        setPlantationPhotos(currentPhotos =>
            currentPhotos.filter((_, index) => index !== indexToDelete)
        );
    };

    // move to curent location
    const moveToCurrentLocation = () => {
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            }, 1000);
        }
    };

    const showDatepicker = () => {
        setShowDate(true);
    };
    const hideDatepicker = () => {
        setShowDate(false);
    };

    // go back to draft list
    const gobackToDraft = () => {
        Alert.alert(
            "Are you sure ?",
            "Click OK to go to draft. or Cancel to continue.",
            [
                {
                    text: "Cancel",
                    onPress: () => setSubmit(false),
                    style: "cancel",
                },
                {
                    text: "OK",
                    onPress: () => router.push('/(management)/(mappings)/drafted-project'),
                    style: 'default'
                },
            ]
        );

        setSubmit(false);
    };


    const renderMap = () => {
        if (!location) return null;

        return (
            <View className="w-full h-96 mb-4">
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    className="w-full h-full"
                    mapType="satellite"
                    customMapStyle={customMapStyle}
                    showsUserLocation={true}
                    showsBuildings={true}
                    initialRegion={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                >
                    <Marker
                        coordinate={{
                            latitude: location.latitude,
                            longitude: location.longitude,
                        }}
                        title="Current Location"
                        pinColor="blue"
                    />

                    {coordinates.length >= 3 && (
                        <Polygon
                            coordinates={coordinates}
                            strokeColor="#000"
                            fillColor="rgba(255,0,0,0.2)"
                            strokeWidth={2}
                        />
                    )}
                </MapView>
                <TouchableOpacity
                    onPress={moveToCurrentLocation}
                    className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg"
                >
                    <Text>📍</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100 py-3">
            <ScrollView className="p-4" automaticallyAdjustContentInsets alwaysBounceVertical>
                <View className="mb-8">
                    <Text className="text-2xl font-semibold mb-4">Metadata</Text>

                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-1">{"Date"}</Text>
                        <TextInput
                            className="w-full p-2 border border-gray-300 rounded-md bg-white"
                            defaultValue={mappingValues?.date}

                        />
                    </View>

                    {/* location is considered as villlage , not geoPoint
                    .filter(
                        (field) => !field.includes('location')
                    )? */}
                    {Object.keys(mappingInitialValues).filter(
                        (field) => !field.includes('location')
                    )?.map((field: string, index: number) => {
                        return (
                            <View key={index} className="mb-4">
                                <Text className="text-sm font-medium text-gray-700 mb-1">{field}</Text>
                                <TextInput
                                    className="w-full p-2 border border-gray-300 rounded-md bg-white"
                                    onChangeText={(data) => {
                                        if (isViewing) {
                                            return;
                                        } else {
                                            setMappingValues({ ...mappingValues, [field]: data });
                                        }
                                    }}
                                    defaultValue={mappingValues[field as keyof MappingFormData] as string}
                                />
                            </View>
                        )
                    })}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-1">{"Location"}</Text>
                        <TextInput
                            className="w-full p-2 border border-gray-300 rounded-md bg-white"
                            defaultValue={JSON.stringify(mappingValues?.location)}
                        />
                    </View>
                    <View className="mb-4">
                        {!isViewing && <TouchableOpacity
                            onPress={() => {
                                setMappingValues({ ...mappingValues, location: location as Coordinates })
                                // setCurrentLocation(location)
                            }}
                            className='bg-black-200  p-2 rounded '
                        >
                            <Text className='text-white text-center'>Update current location</Text>
                        </TouchableOpacity>}

                    </View>

                    {/* <Text className="font-bold mt-2">
                        Plantation creation date
                        {mappingValues?.plantation_creation_date ? <Text className=" text-end">:&nbsp;&nbsp;{new Date(mappingValues?.plantation_creation_date).toLocaleDateString()}</Text> : null}
                    </Text> */}
                    {/* date section */}
                    <View className="font-bold mt-2 items-center">
                        <Text>Plantation creation date:&nbsp;&nbsp;</Text>
                        {mappingValues?.plantation_creation_date
                            ? (
                                <TouchableOpacity onPress={showDatepicker}>
                                    <Text className=" text-end text-green-600">
                                        {new Date(mappingValues?.plantation_creation_date).toLocaleDateString()}
                                    </Text>
                                </TouchableOpacity>) : null}
                    </View>
                    {!mappingValues.plantation_creation_date && !showDate && (
                        <TouchableOpacity
                            onPress={showDatepicker}
                            className='bg-gray-500  p-2 rounded '
                        >
                            <Text className='text-white text-center'>
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
                                setMappingValues(prev => ({ ...prev, plantation_creation_date: mappingValues.plantation_creation_date }));
                                return;
                            }
                            setMappingValues({ ...mappingValues, plantation_creation_date: String(selectedDate) });
                            return hideDatepicker();
                        }}
                    />}

                </View>

                <View className="flex gap-3">
                    {/* action button */}
                    <CustomButton
                        title="Add Plantation photo"
                        handlePress={() => takePhoto(setPlantationPhotos)}
                        containerStyles=" bg-black rounded  justify-center items-center p-2"
                        textStyles='text-white text-muted font-bold text-[15px]'
                    />

                    {/* list of photos components */}
                    <View className="flex-1 p-4">
                        <PhotoList
                            photos={mappingValues?.plantation_photos as string[] || plantationPhotos}
                            onDeletePhoto={handleDeleteFarmPhoto}
                        />
                    </View>

                    <CustomButton
                        title="Add Farmer photo"
                        handlePress={() => takePhoto(setFarmerPhotos)}
                        containerStyles=" bg-black rounded  justify-center items-center p-2"
                        textStyles='text-white text-muted font-bold text-[15px] '
                    />

                    <View className="flex-1 p-4">
                        <PhotoList
                            photos={mappingValues?.farmer_photos as string[] || farmerPhotos}
                            onDeletePhoto={handleDeletePhoto}
                        />
                    </View>

                    {/* start recording */}
                    <CustomButton
                        title={isRecording === true ? "Stop Recording Perimeter" : "Start Recording Perimeter"}
                        handlePress={isRecording ? stopRecording : startRecording}
                        // handlePress={startLocationUpdates}
                        containerStyles={`my-6 ${isRecording ? 'bg-red-500' : 'bg-green-500'}
                             rounded  justify-center items-center p-2`
                        }
                        textStyles='text-white text-muted font-bold text-[15px]'
                    />

                    {/* view coordinates */}

                    <View className="mt-6">
                        {/* <Text className="text-xl font-bold mb-4">Coordinates</Text>
                        <View className="grid grid-cols-2 gap-4">
                            {(mappingValues.coordinates || []).map((coord, index) => (
                                <View key={index}>
                                    <TextInput
                                        placeholder={`Coordinate ${index + 1}`}
                                        value={`Latitude: ${coord.latitude}, Longitude: ${coord.longitude}`}
                                        editable={false}
                                    />
                                </View>
                            ))}
                            
                        </View> */}



                        {/* map section */}
                        {renderMap()}


                        {coordinates.map((coord, index) => (
                            <Text key={index} className="my-1">New Point {index + 1}: Lat: {coord.latitude}, Long: {coord.longitude}</Text>
                        ))}
                    </View>

                </View>
                <View>
                    <CustomButton
                        title="Submit"
                        handlePress={handleSubmit(onSubmit)}
                        isLoading={isSaving}
                        containerStyles="my-6 bg-slate-700 rounded justify-center items-center p-2"
                        textStyles='text-white text-muted font-bold text-[15px]'
                    />
                    {submit ? <CustomButton
                        title="back"
                        handlePress={gobackToDraft}
                        containerStyles="my-6 bg-slate-700 rounded justify-center items-center p-2"
                        textStyles='text-white text-muted font-bold text-[15px]'
                    /> : null}
                </View>

            </ScrollView>
        </SafeAreaView>
    );

};

const customMapStyle = [
    {
        "featureType": "all",
        "elementType": "labels",
        "stylers": [
            { "visibility": "off" }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
            { "visibility": "off" }
        ]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [
            { "visibility": "off" }
        ]
    },
    {
        "featureType": "poi",
        "stylers": [
            { "visibility": "off" }
        ]
    }
    // Add more rules if needed to hide additional elements
];

export default EditMappingFormDetails;

