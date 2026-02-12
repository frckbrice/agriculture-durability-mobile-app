

import { Company, Coordinate, Coordinates, Farmer, MappingFormData, Project, TFetchType, ValidationResult } from "@/interfaces/types";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, TextInput,
    ScrollView, SafeAreaView,
    TouchableOpacity,
    Alert,
    AppState
} from 'react-native';
import { styled } from 'nativewind';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useForm } from 'react-hook-form';
import { mappingInitialValues } from "@/constants/initial-values";
import CustomButton from "../../custom-button";
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { useFarmerMappingDataStore } from "@/store/farmer-data-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
// import * as TaskManager from 'expo-task-manager';
import DateTimePicker from '@react-native-community/datetimepicker';
import PhotoList from "../../delete-photo";
import useApiOps from "@/hooks/use-api";
import { getAllFarmersOfThisLocation } from "@/lib/api";
import { useProjectMappingDataStore } from "@/store/project-data-storage -mapping";
import Dropdown from "../../global/dropdown";
import {
    addCoordinateWithValidation,
    calculateDistance,
    calculatePolygonAreaInMeters,
    enhancedValidatePolygon,
    validateField, validateMappingForm
} from "@/lib/functions";
import { useFarmerStore } from '@/store/farmer-person-store';
import { useCompanyStore } from "@/store/current-company-store";
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAgentProjects } from "@/hooks/use-agent-projects";
import { useQuery } from "@tanstack/react-query";

type BackgroundLocationTaskData = {
    locations: Array<{
        coords: {
            latitude: number;
            longitude: number;
            altitude: number | null;
            accuracy: number;
            altitudeAccuracy: number | null;
            heading: number | null;
            speed: number | null;
        };
        timestamp: number;
    }>;
    error: Error | null;
};
const StyledView = styled(View);
const StyledText = styled(Text);

// setup keys for storage
const BACKGROUND_LOCATION_TASK = 'background-location-task';
const LOCATION_STORAGE_KEY = 'temp-coordinates';
const MAX_COORDINATE_STORAGE = 500; // Limit to prevent excessive memory usage
const LOCATION_ACCURACY_THRESHOLD = 10; // meters
const LOCATION_TIME_THRESHOLD = 30000; // 30 seconds

// Type for our simplified coordinate storage

type StoredCoordinate = {
    latitude: number;
    longitude: number;
    timestamp: number;
};


// Type-safe background task definition
TaskManager.defineTask<BackgroundLocationTaskData>(BACKGROUND_LOCATION_TASK,
    async ({ data, error }) => {
        // Extensive error and data validation
        if (error) {
            console.error("Background location task error:", error);
            return;
        }

        // Defensive check for data structure
        if (!data.locations?.length) {
            console.warn("No location data received", JSON.stringify(data));
            return;
        }

        try {
            // Ensure locations is an array
            const locations = Array.isArray(data.locations) ? data.locations : [];

            if (locations.length === 0) {
                console.warn("Empty locations array received");
                return;
            }

            // Get existing coordinates from storage
            const storedCoordsJson = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
            const currentCoords: StoredCoordinate[] = storedCoordsJson
                ? JSON.parse(storedCoordsJson)
                : [];

            // Transform and validate incoming location data
            const newCoords: StoredCoordinate[] = locations
                .filter((location: any) =>
                    location &&
                    location.coords &&
                    location.coords.latitude !== undefined &&
                    location.coords.longitude !== undefined
                )
                .map((location: any) => ({
                    latitude: Number(location.coords.latitude.toFixed(7)),
                    longitude: Number(location.coords.longitude.toFixed(7)),
                    timestamp: location.timestamp || Date.now()
                }));

            // Combine and limit coordinates
            const combinedCoords = [...currentCoords, ...newCoords]
                .slice(-MAX_COORDINATE_STORAGE);

            // Save combined coordinates
            await AsyncStorage.setItem(
                LOCATION_STORAGE_KEY,
                JSON.stringify(combinedCoords)
            );

            console.log(`Saved ${newCoords.length} new coordinates`);
        } catch (err) {
            console.error("Comprehensive error in background location task:", err);
        }
    });

interface ValidationErrors {
    farmer_name?: string;
    farmer_contact?: string;
    farmer_ID_card_number?: string;
    inspector_name?: string;
    inspector_contact?: string;
}

const MappingFormDetails = () => {
    const { control, handleSubmit } = useForm<MappingFormData>();
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number, timestamp?: number }[]>([]);

    const [plantationPhotos, setPlantationPhotos] = useState<string[]>([]);
    const [farmerPhotos, setFarmerPhotos] = useState<string[]>([]);
    const [mappingValues, setMappingValues] = useState<MappingFormData>(mappingInitialValues);
    const [isRecording, setIsRecording] = useState(false);
    const [viewCoords, setViewCoords] = useState(false);
    const [showDate, setShowDate] = useState(false);
    const [submit, setSubmit] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [currentMappingProject, setCurrentMappingProject] = useState<Project | null>(null);
    const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
    const [farmerList, setFarmerList] = useState<Farmer[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    // Enhanced coordinate tracking with start point marking
    const [startPoint, setStartPoint] = useState<Coordinate | null>(null);

    const isRecordingRef = useRef(false);

    // track app state change
    const [appState, setAppState] = useState(AppState.currentState);
    const [trackingMode, setTrackingMode] = useState<'foreground' | 'background' | null>(null);

    const [fieldErrors, setFieldErrors] = useState<ValidationResult | any>({});


    const router = useRouter();

    // fetch data only when the component is mounted to avoid useless calls to api.
    const mounted = useRef(false);

    // map view reference
    const mapRef = useRef<MapView | null>(null);

    // get the project ID
    const { mapping_id } = useLocalSearchParams();

    // get store projects of type mapping
    const {
        getProjectsData
    } = useProjectMappingDataStore();

    // get the farmer mapping data.
    const {
        saveMappingsData,
        getMappingsData
    } = useFarmerMappingDataStore();

    // get current company store
    const {
        getCompany
    } = useCompanyStore();

    // get farmer saved in the market component
    const { getFarmers, saveFarmers, clearFarmers } = useFarmerStore();
    const [currentCompany, setCurrentCompany] = useState<Company>();

    const [locationError, setLocationError] = useState<string | null>(null);
    const [isLocationReady, setIsLocationReady] = useState(false);
    const [currentArea, setCurrentArea] = useState(0);

    // ref to keep track of the active location subscription
    const foregroundSubscription = useRef<Location.LocationSubscription | null>(null);

    // we want the farmers from initial inspection
    const { data: farmers,
        isLoading: farmersLoading,
        error: farmersError
    }: TFetchType<Farmer[]>
        // = useApiOps<Farmer[]>(() => getAllFarmersOfThisLocation(currentMappingProject?.city));
        = useQuery({
            queryKey: ['farmers_location', currentMappingProject?.city],
            queryFn: () => getAllFarmersOfThisLocation(currentMappingProject?.city),
            staleTime: 300000 * 6, // cache for 30 minutes
            retry(failureCount, error) {
                return failureCount < 3 || !!error;
            }
        })

    const { mappingProjects } = useAgentProjects();
    // request location permission
    const initializeLocation = async () => {
        try {
            setLocationError(null);

            // Check if location services are enabled
            const serviceEnabled = await Location.hasServicesEnabledAsync();
            if (!serviceEnabled) {
                setLocationError('Location services are disabled. Please enable them in your device settings.');
                return false;
            }

            // Request foreground permissions first
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
            if (foregroundStatus !== 'granted') {
                setLocationError('Permission to access location was denied');
                return false;
            }

            // Request background permissions
            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
            if (backgroundStatus !== 'granted') {
                setLocationError('Background location permission was denied');
                return false;
            }

            // Get initial location with high accuracy
            const initialLocation = await Location.getCurrentPositionAsync({
                // accuracy: Location.Accuracy.High,
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 5000,
                distanceInterval: 5
            });

            if (initialLocation) {
                const { latitude, longitude } = initialLocation.coords;
                setLocation({
                    latitude: Number(latitude.toFixed(7)),
                    longitude: Number(longitude.toFixed(7))
                });
                setIsLocationReady(true);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error initializing location:', error);
            setLocationError('Failed to initialize location services. Please check your device settings.');
            return false;
        }
    };

    useEffect(() => {
        initializeLocation();
        // Add app state change listener
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        // Cleanup function
        return () => {
            if (foregroundSubscription.current) {
                foregroundSubscription.current.remove();
            }
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        let syncInterval: NodeJS.Timeout;
        console.log("\n\n state of isRecording : ", isRecording);
        isRecordingRef.current = isRecording;

        if (isRecording) {
            syncInterval = setInterval(syncStoredCoordinates, 5000); // Sync every 5 seconds
        }

        return () => {
            if (syncInterval) clearInterval(syncInterval);
        };

    }, [isRecording]);


    useEffect(() => {
        // if (mounted.current)
        //     return console.warn("\n\n component not mounted on  mapping details");
        console.log("mapping ID: ", mapping_id);
        // const projectList = getProjectsData();


        // save farmers to get them offline.
        if (farmers?.length) {
            saveFarmers(farmers);
        }

        // we want to get the current project with his ID.
        const existingMappingProject = mappingProjects?.find((p: any) => p.id === mapping_id);

        console.log("existing mapping project : ", existingMappingProject);

        if (existingMappingProject)
            setCurrentMappingProject(existingMappingProject);

        const existingfarmerList = getFarmers();
        if (existingfarmerList?.length)
            setFarmerList(existingfarmerList);

        const company = getCompany();
        if (company && !currentCompany)
            setCurrentCompany(company);
    }, [mapping_id]);

    const validateAndUpdateField = (field: string, value: string) => {
        const error = validateField(field, value);
        setFieldErrors((prev: any) => ({
            ...prev,
            [field]: error || ''
        }));
        return !error;
    };


    const renderInputField = (field: string, label: string, placeholder: string) => (
        <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
            <TextInput
                className={`w-full p-2 border rounded-md bg-white ${fieldErrors[field] ? 'border-red-500' : 'border-gray-300'
                    }`}
                onChangeText={(value) => {
                    setMappingValues(prev => ({ ...prev, [field]: value }));
                    validateAndUpdateField(field, value);
                }}
                defaultValue={mappingValues[field as keyof typeof mappingInitialValues] as string}
                placeholder={placeholder}
            />
            {fieldErrors[field] && (
                <Text className="text-red-500 text-sm mt-1">{fieldErrors[field]}</Text>
            )}
        </View>
    );
    /* Continuous Location Updates: This ensures that location is tracked continuously.
     ensuring that only one location tracking operation is running at a time.
     */

    const startForegroundTracking = async () => {
        try {
            console.log("started startForegroundTracking function");
            console.log("current isRecording state:", isRecordingRef.current);

            if (foregroundSubscription.current) {
                foregroundSubscription.current.remove();
            }

            let counter = 0;

            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    distanceInterval: 5,
                    timeInterval: 10000,
                },
                (location) => {
                    // Use the ref to always get the current state
                    if (isRecordingRef.current) {
                        console.log("Recording active, adding coordinate:", counter++);
                        addCoordinate(location);
                    } else {
                        console.log("Recording inactive, skipping coordinate");
                    }
                }
            );

            foregroundSubscription.current = subscription;
            setTrackingMode('foreground');

        } catch (err) {
            console.error("Error starting location updates:", err);
        }
    };

    const startBackgroundTracking = useCallback(async () => {

        // only start background tracking when isRecording is true  
        if (!isRecordingRef.current) return;

        const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        if (!hasStarted) {
            await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
                accuracy: Location.Accuracy.BestForNavigation,
                distanceInterval: 5,
                timeInterval: 10000,
                pausesUpdatesAutomatically: false,
                foregroundService: { notificationTitle: "Location Tracking Active", notificationBody: "Recording plantation coordinates", notificationColor: "#fff" },
                deferredUpdatesInterval: 10000,
                deferredUpdatesDistance: 5,
                showsBackgroundLocationIndicator: true,
                activityType: Location.ActivityType.Other,
            });
            setTrackingMode('background');
        }
    }, []);

    // Function to stop background location tracking
    const stopBackgroundLocationTracking = useCallback(async () => {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        if (hasStarted) {
            await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        }
    }, []);

    const syncStoredCoordinates = useCallback(async () => {
        try {
            const storedCoords = JSON.parse(await AsyncStorage.getItem(LOCATION_STORAGE_KEY) || '[]');
            if (storedCoords.length > 0) {
                const newCoords = storedCoords.filter((stored: Coordinate) => !coordinates.some(existing => existing.timestamp === stored.timestamp));
                if (newCoords.length > 0) {
                    setCoordinates(prev => [...prev, ...newCoords]);
                }
                await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
            }
        } catch (error) {
            console.error("Error syncing stored coordinates:", error);
        }
    }, [coordinates]);

    // get the current area calculated
    const calculateTheCurrentArea = () => {
        try {
            const result = calculatePolygonAreaInMeters(coordinates);
            setCurrentArea(result);
            setMappingValues(prev => ({ ...prev, "estimated_area (ha)": String(result / 10000) }));
        } catch (error) {
            console.error('\n\n error in calculateTheCurrentArea : ', error);
        }
    }

    // handle the app state change
    const handleAppStateChange = async (nextAppState: "background" | "active" | "inactive" | "unknown" | "extension") => {
        if (appState.match(/active/) && nextAppState.match(/inactive|background/)) {
            // App is going to background
            if (isRecordingRef.current) {
                await startBackgroundTracking();
            }
        } else if (appState.match(/inactive|background/) && nextAppState === 'active') {
            // App is coming to foreground
            await syncStoredCoordinates();
            if (isRecordingRef.current) {
                await startForegroundTracking();
            }
        }

        setAppState(nextAppState);
    };

    const cleanupLocationTracking = async () => {
        console.error("\n\n inside cleanup isRecording:", isRecording);
        try {
            // Clean up foreground tracking
            if (foregroundSubscription.current) {
                foregroundSubscription.current.remove();
                foregroundSubscription.current = null;
            }

            // Clean up background tracking
            const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
            if (hasStarted) {
                await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
            }

            // Clear stored coordinates
            await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);

            setTrackingMode(null);
            // setCoordinates([]);
        } catch (error) {
            console.error("Error cleaning up location tracking:", error);
        }
    };

    // record coordinates
    const resetCoordinates = useCallback(async () => {
        setCoordinates([]);
        setIsRecording(false);
        await cleanupLocationTracking();
        await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
    }, [cleanupLocationTracking]);

    // start recording
    const startRecording = useCallback(async () => {
        if (coordinates.length > 0) {
            Alert.alert(
                "Existing Coordinates",
                "Starting a new recording will clear existing coordinates. Do you want to continue?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Continue",
                        onPress: async () => {
                            await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
                            resetCoordinates();
                            setIsRecording(true);  // Set recording state first
                            await startForegroundTracking(); // Then start tracking
                        }
                    }
                ]
            );
        } else {
            setIsRecording(true);  // Set recording state first
            await startForegroundTracking(); // Then start tracking
        }
    }, [coordinates.length, resetCoordinates, startForegroundTracking]);

    // stop recording of coordinates
    const stopRecording = useCallback(async () => {
        setIsRecording(false);
        try {

            console.log('\n\n inside stop isRecording: ', isRecording);
            await syncStoredCoordinates();
            await stopBackgroundLocationTracking();

            calculateTheCurrentArea(); // calculate the current area from the list of points.
            await cleanupLocationTracking();
        } catch (e) {
            console.error('\n\n error stoping recording: ', e);
        }
    }, [cleanupLocationTracking, syncStoredCoordinates, stopBackgroundLocationTracking]);


    const takePhoto = async (setPhotos: React.Dispatch<React.SetStateAction<string[]>>, type?: string) => {
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

            if (type === 'plantation_photos')
                setPlantationPhotos([...plantationPhotos, uri as string]);
            else if (type === 'farmer_photos')
                setPhotos([...farmerPhotos, uri as string]);
        }
    };

    // Advanced Coordinate Management
    const addCoordinate = useCallback((location: Location.LocationObject) => {
        // Filter out low-accuracy or redundant coordinates
        const isValidCoordinate = (newCoord: Coordinate) => {
            if (coordinates.length === 0) return true;
            const lastCoord = coordinates[coordinates.length - 1];
            const distance = calculateDistance(lastCoord, newCoord);
            return distance > 1; // At least 1 meter between points
        };

        const validatedCoord = addCoordinateWithValidation(
            location,
            coordinates,
            (intersectionPoints) => {
                // Pause recording
                setIsRecording(false);

                Alert.alert(
                    "Line Crossing Detected",
                    "The current path would cross an existing line. Would you like to:",
                    [
                        {
                            text: "Remove Last Segment",
                            onPress: () => {
                                // Remove the last coordinate and resume recording
                                setCoordinates(prev => prev.slice(0, -1));
                                setIsRecording(true);
                            }
                        },
                        {
                            text: "Start New Path",
                            onPress: () => {
                                // Clear coordinates and restart
                                resetCoordinates();
                                setIsRecording(true);
                            },
                            style: "destructive"
                        },
                        {
                            text: "Cancel Recording",
                            onPress: () => {
                                stopRecording();
                            },
                            style: "cancel"
                        }
                    ]
                );
            }
        );

        if (validatedCoord) {
            setCoordinates(prev => {
                const updated = [...prev, validatedCoord];
                return updated.slice(-MAX_COORDINATE_STORAGE);
            });
        }
    }, [coordinates, resetCoordinates, stopRecording]);

    const onSubmit = useCallback(async (data: MappingFormData) => {

        console.log('\n\n inside onSubmit: ', data, '\n\n mapping values: ', mappingValues);
        // add current date

        //Validate all form data
        const validationResult = validateMappingForm({
            ...mappingValues,
        });

        if (!validationResult.isValid) {
            setFieldErrors(validationResult.errors);
            Alert.alert(
                "Validation Error",
                "Please correct the errors in the form before submitting."
            );
            return;
        }


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
    }, [coordinates, plantationPhotos, farmerPhotos, location, getMappingsData, saveMappingsData, mapping_id, mappingValues]);

    const continueSubmission = async (data: MappingFormData) => {
        setIsSaving(true);

        try {

            const formData: MappingFormData = {
                ...data,
                ...mappingValues,
                plantation_photos: plantationPhotos,
                farmer_photos: farmerPhotos,
                coordinates,
                location: location as Coordinates,
                date: new Date(Date.now()).toISOString()
            };
            console.log(`json object:`, formData);

            // saving data to local store... to be getting in the next step (drafted-project component)
            const existingData = getMappingsData();
            saveMappingsData([...existingData, {
                uploaded: false,
                project_data: formData,
                project_id: mapping_id as string
            }]);
            Alert.alert("Success", 'data saved to draft list.');
            setSubmit(true);
            router.replace('/(management)/(mappings)/drafted-project');
        } catch (error) {
            console.error(`Error saving mapping data to the draft list \n\n ${error}`);
        } finally {
            setIsSaving(false);
        }
    };

    const showDatepicker = () => {
        setShowDate(true);
    };
    const hideDatepicker = () => {
        setShowDate(false);
    };

    // handle delete photo
    const handleDeletePhoto = (indexToDelete: number) => {
        setFarmerPhotos(currentPhotos =>
            currentPhotos.filter((_, index) => index !== indexToDelete)
        );
    };

    // handle delete photo
    const handleDeletePlantationPhoto = (indexToDelete: number) => {
        setPlantationPhotos(currentPhotos =>
            currentPhotos.filter((_, index) => index !== indexToDelete)
        );
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

    // mark the starting point.
    const markStartPoint = () => {
        if (location) {
            const currentStartPoint = {
                latitude: Number(location.latitude.toFixed(7)),
                longitude: Number(location.longitude.toFixed(7)),
            };

            setStartPoint(currentStartPoint);
            // setCoordinates([currentStartPoint]);

            Alert.alert(
                "Start Point Marked",
                `Coordinates: ${currentStartPoint.latitude}, ${currentStartPoint.longitude}`
            );
        }
    };


    // get the selected farmer from the dropdown list
    const getCurrentFarmerFromTheList = (selectedFarmerr: Farmer) => {

        if (selectedFarmerr) {
            setSelectedFarmer(selectedFarmerr);
            setMappingValues(prev => ({
                ...prev,
                farmer_ID_card_number: selectedFarmerr?.farmer_ID_card_number as string,
                farmer_name: selectedFarmerr?.farmer_name,
                farmer_contact: selectedFarmerr?.farmer_contact as string,
                village: selectedFarmerr?.village
            }))
        }
    }

    const renderMap = () => {
        if (locationError) {
            return (
                <View className="w-full h-96 mb-4 justify-center items-center bg-gray-100">
                    <Text className="text-red-500 text-center p-4">{locationError}</Text>
                    <TouchableOpacity
                        className="bg-blue-500 p-2 rounded"
                        onPress={initializeLocation}
                    >
                        <Text className="text-white">Retry Location Access</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (!isLocationReady || !location) {
            return (
                <View className="w-full h-96 mb-4 justify-center items-center bg-gray-100">
                    <Text>Loading map...</Text>
                </View>
            );
        }

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
                    {location && (
                        <Marker
                            coordinate={{
                                latitude: location.latitude,
                                longitude: location.longitude,
                            }}
                            title="Current Location"
                            pinColor="blue"
                        />
                    )}

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
                    onPress={markStartPoint}
                    className="absolute bg-gray-500 p-3 rounded-full shadow-lg top-4 left-2"
                >
                    <Text>🪧</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={moveToCurrentLocation}
                    className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg"
                >
                    <Text>📍</Text>
                </TouchableOpacity>
            </View>
        );
    };


    // console.log("\n\n current location : ", location);

    return (
        <SafeAreaView className="flex-1 bg-gray-100 py-3">
            <View className="p-4  mt-4">
                <StyledText className="text-xl font-bold mb-4">Mapping Form</StyledText>
                <StyledView className="flex-row flex-wrap justify-between z-20 w-full bg-gray-50 border border-gray-200 rounded-md px-2 my-2">
                    <Dropdown
                        items={farmerList as Farmer[]}
                        placeholder={!farmersError ? 'Select farmer' : 'is Fetching farmers...'}
                        onChange={getCurrentFarmerFromTheList} // get the currentFarmer from the list
                        isLoading={farmersLoading}
                    />
                </StyledView>

            </View>
            <ScrollView
                className="p-0 px-4"
                automaticallyAdjustContentInsets
                alwaysBounceVertical>
                <View className="mb-8">
                    <Text className="text-2xl font-semibold mb-4">Metadata</Text>

                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-1">{"Date"}</Text>
                        <TextInput
                            className="w-full p-2 border border-gray-300 rounded-md bg-white"
                            defaultValue={new Date(Date.now()).toLocaleDateString()}
                        />
                    </View>

                    {Object.keys(mappingInitialValues).filter(
                        (field) => !field.includes('location')
                    )?.map((field: string, index: number) => {
                        let value;
                        if (field.includes('date') || field.includes('location') || field.includes('estimated_area'))
                            return false
                        return (
                            <>
                                {renderInputField(field, field, 'Enter ' + field.split('_').join(' '))}
                            </>
                        )
                    })}

                    {/* take current geoLocation */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-gray-700 mb-1">{"Location"}</Text>
                        <TextInput
                            className="w-full p-2 border border-gray-300 rounded-md bg-white"
                            defaultValue={JSON.stringify(currentLocation)}
                        />
                        {errorMsg && <Text className="text-red-500">{errorMsg}</Text>}
                    </View>
                    <View className="mb-4">
                        <TouchableOpacity
                            onPress={() => setCurrentLocation(location)}
                            className='bg-black-200  p-2 rounded '
                        >
                            <Text className='text-white text-center'>Take current location</Text>
                        </TouchableOpacity>

                    </View>

                    {/* date section */}
                    <View className="font-bold my-2 items-center">
                        <Text>{'Plantation creation date:'}&nbsp;&nbsp;</Text>
                        {mappingValues?.plantation_creation_date
                            ? (
                                <TouchableOpacity onPress={showDatepicker}>
                                    <Text className=" text-end text-gray-400 border bg-green-300 border-green-600 rounded p-1 shadow-lg">
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
                    <CustomButton
                        title="Add Plantation photo"
                        handlePress={() => takePhoto(setPlantationPhotos, "plantation_photos")}
                        containerStyles="p-2 bg-black-200 rounded  justify-center items-center "
                        textStyles='text-white text-muted font-bold text-[15px]'
                    />

                    <View className="flex-1 p-4">
                        <PhotoList
                            photos={plantationPhotos}
                            onDeletePhoto={handleDeletePlantationPhoto}
                        />
                    </View>


                    <CustomButton
                        title="Add Farmer photo"
                        handlePress={() => takePhoto(setFarmerPhotos, "farmer_photos")}
                        containerStyles="p-2 bg-black-200 rounded  justify-center items-center "
                        textStyles='text-white text-muted font-bold text-[15px] '
                    />

                    <View className="flex-1 p-4">
                        <PhotoList
                            photos={farmerPhotos}
                            onDeletePhoto={handleDeletePhoto}
                        />
                    </View>

                    <CustomButton
                        title={isRecording === true ? "Stop Recording Perimeter" : "Start Recording Perimeter"}
                        handlePress={isRecording ? stopRecording : startRecording}
                        // handlePress={startLocationUpdates}
                        containerStyles={`my-6 ${isRecording ? 'bg-red-500' : 'bg-green-500'}
                             rounded justify-center items-center p-2`
                        }
                        textStyles='text-white text-muted font-bold text-[15px]'
                    />

                    {coordinates.length > 0 && !isRecording && (
                        <CustomButton
                            title="Clear Coordinates"
                            handlePress={() => {
                                Alert.alert(
                                    "Clear Coordinates",
                                    "Are you sure you want to clear all recorded coordinates?",
                                    [
                                        {
                                            text: "Cancel",
                                            style: "cancel"
                                        },
                                        {
                                            text: "Clear",
                                            onPress: resetCoordinates,
                                            style: "destructive"
                                        }
                                    ]
                                );
                            }}
                            containerStyles="my-6 bg-red-500 rounded justify-center items-center p-2 flex-1 ml-2"
                            textStyles='text-white text-muted font-bold text-[15px]'
                        />
                    )}

                    {currentArea && <Text className="text-lg font-thin mt-4 text-green-600 bg-white p-1 rounded shadow-lg">
                        Estimated area: <Text className="text-black-200">
                            <Text>{ }{currentArea} m²</Text>
                        </Text>
                    </Text>}
                    {/* map section */}
                    {renderMap()}

                    <View className="flex-row justify-between items-center">
                        <Text>Total Coords: {coordinates.length}</Text>
                        <TouchableOpacity
                            className="border border-1 border-slate-800 p-2 rounded-lg bg-slate-700 "
                            onPress={() => setViewCoords(!viewCoords)}
                        >
                            <Text className="text-white text-muted font-bold text-[15px]">View Coords</Text>
                        </TouchableOpacity>
                    </View>
                    {viewCoords && coordinates.map((coord, index) => (
                        <Text key={index}>Point {index + 1}: Lat: {coord.latitude}, Long: {coord.longitude}</Text>
                    ))}
                </View>

                {/* submit and back button section */}
                <View>

                    <CustomButton
                        title="Save to Draft"
                        handlePress={handleSubmit(onSubmit)}
                        isLoading={isSaving}
                        containerStyles="my-6 bg-slate-700 rounded justify-center items-center p-2"
                        textStyles='text-white text-muted font-bold text-[15px]'
                    />

                    {submit ? <CustomButton
                        title="Back to draft"
                        handlePress={gobackToDraft}
                        containerStyles="my-6 bg-slate-700 rounded justify-center items-center p-2"
                        textStyles='text-white text-muted font-bold text-[15px]'
                    /> : null}
                </View>

            </ScrollView>
        </SafeAreaView>
    );

};

export default MappingFormDetails;



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