import React, { useCallback, useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity,
    ActivityIndicator, ScrollView, Alert, Image, ImageBackground
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { updateResource, uploadResource } from '@/lib/api';
import { storeCurrentMarketData } from '@/store/mmkv-store';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMarketStore } from '@/store/current-market-store';
import { uploadToS3 } from '@/lib/functions';


interface DocumentUploadProps {
    onUploadComplete?: (documents: UploadedDocument[]) => void;
    maxFiles?: number;
    allowedTypes?: string[];
    endpoint: string;
}

interface UploadedDocument {
    id?: string;
    name: string;
    uri: string;
    type: string;
    size: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
}

const MAX_FILES = 1; // set Max quantity of files to upload
const ALLOW_TYPES = ['application/pdf', 'image/*'];

export default function SaleSlipDocumentUpload() {
    const [documents, setDocuments] = useState<UploadedDocument[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    // store market object
    const [marketData, setMarketData] = useState<any>({});
    const [isLoadingfile, setIsLoadingfile] = useState(false);

    const router = useRouter();

    const {
        getMarket
    } = useMarketStore();

    useEffect(() => {
        // get the market object passed to store from parent market component
        const marketProps = getMarket()
        if (marketProps) {
            setMarketData(marketProps);
        }
    }, []);

    const updateDocumentStatus = (uri: string, status: UploadedDocument['status'], error?: string) => {
        setDocuments(prev => prev.map(doc =>
            doc.uri === uri ? { ...doc, status, error } : doc
        ));

    };

    const pickDocument = async () => {
        setIsLoadingfile(true);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ALLOW_TYPES,
                multiple: true,
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets) {
                const newDocs = await Promise.all(result.assets.map(async (asset) => {

                    // get the upload url from bucket s3
                    const uploadUrl = await uploadToS3(asset.uri, `store_entry_voucher-${asset.uri.split('/').pop()}`, marketData?.company_bucket ?? '', 'application/pdf');

                    console.log("\n\nUploaded uri photo in promise all: ", uploadUrl);

                    return {
                        name: asset.name,
                        uri: uploadUrl,
                        type: asset.mimeType || 'application/octet-stream',
                        size: asset.size || 0,
                        status: 'pending' as const
                    }
                }));

                // Check if adding new documents exceeds maxFiles
                if (documents.length + newDocs.length > MAX_FILES) {
                    Alert.alert(`You can only upload up to ${MAX_FILES} files`);
                    return;
                }

                console.log("\n\nnewDocs: ", newDocs);

                setDocuments([...documents, ...newDocs]);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Failed to pick document');
        } finally {
            setIsLoadingfile(false);
        }
    };

    // take direct photo
    const handlePhotoUpload = async () => {
        setIsLoadingfile(true);
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                aspect: [4, 3],
                quality: 1,
                // base64: true,
            });

            if (!result.canceled) {
                const base64 = `data:image/png;base64,${result.assets[0].base64}`;
                const { uri } = result.assets[0];

                // get the upload url from bucket s3
                const uploadUrl = await uploadToS3(uri, `SSS_${marketData?.market_number}-${uri.split('/').pop()}`, marketData?.company_bucket ?? '', 'application/pdf');

                console.log("\n\nUploaded uri photo: ", uploadUrl);

                let newDoc = {
                    name: 'Photo',
                    uri: uploadUrl,
                    type: result.assets[0].mimeType || 'image/png',
                    size: result.assets[0].fileSize || 0,
                    status: 'pending' as const
                };

                // Check if adding new documents exceeds maxFiles
                if (documents.length + 1 > MAX_FILES) {
                    Alert.alert(`You can only upload up to ${MAX_FILES} files`);
                    return;
                }

                setDocuments((prev) => ([...prev, newDoc]));
            }
        } catch (error) {
            console.error(`Error uploading photo: ${error}`);
            Alert.alert('Failed to upload photo');
        } finally {
            setIsLoadingfile(false);
        }
    };


    const uploadDocuments = useCallback(async () => {
        setIsUploading(true);
        const pendingDocs = documents.filter(doc => doc.status === 'pending');

        try {

            const objToSend = {
                bordereau_vente_url: pendingDocs[0].uri
            };

            // cannot upload if no market number.
            if (!marketData?.market_number) {
                Alert.alert('Warning', 'No market number set. Please set a market number first')
                return
            }
            const response = await updateResource('markets', objToSend, marketData?.market_number)

            if (response) {
                updateDocumentStatus(pendingDocs[0].uri, 'completed');
            } else {
                updateDocumentStatus(pendingDocs[0].uri, 'error', 'Failed to update resource');
            }
        } catch (error) {
            console.error('Error uploading documents:', error);
            Alert.alert('Failed to upload documents');
        } finally {
            setIsUploading(false);
        }
    }, [documents, marketData, updateResource]);

    const removeDocument = (uri: string) => {
        setDocuments(prev => prev.filter(doc => doc.uri !== uri));
    };

    const getDocumentStatusColor = (status: UploadedDocument['status']) => {
        switch (status) {
            case 'completed':
                return 'text-green-500';
            case 'error':
                return 'text-red-500';
            case 'uploading':
                return 'text-blue-500';
            default:
                return 'text-gray-500';
        }
    };

    const getDocumentStatusIcon = (status: UploadedDocument['status']) => {
        switch (status) {
            case 'completed':
                return <MaterialIcons name="check-circle" size={24} color="#22c55e" />;
            case 'error':
                return <MaterialIcons name="error" size={24} color="#ef4444" />;
            case 'uploading':
                return <ActivityIndicator size="small" color="#3b82f6" />;
            default:
                return <MaterialIcons name="hourglass-empty" size={24} color="#6b7280" />;
        }
    };
    return (
        <View className="flex-1">
            {/* Full-page Background Image */}
            <ImageBackground
                source={{ uri: marketData?.company_logo }}
                className="flex-1 w-full h-full"
                resizeMode="cover"
            >
                {/* Gradient Overlay */}
                <View className="flex-1 bg-black/50">
                    {/* Main Content */}
                    <View className="flex-1 justify-center p-5">
                        <View className="flex-col justify-between h-2/3">
                            <View className="p-6 bg-white/70 rounded-xl shadow-lg backdrop-blur-sm">
                                <View className="border-b border-white/50 pb-4 mb-4">
                                    <Text className="text-2xl font-bold text-center text-gray-800">
                                        Upload Sale Slip Sheet
                                    </Text>
                                    <Text className="text-sm text-gray-800/80 text-center mt-1">
                                        (Bordereau de vente)
                                    </Text>
                                </View>

                                <ScrollView className="max-h-60 mb-4">
                                    {documents.map((doc, index) => (
                                        <View
                                            key={index}
                                            className="flex-row items-center justify-between p-4 mb-2 bg-white/30 rounded-lg border border-white/30"
                                        > <View className="flex-1 flex-row items-center">
                                                <View className="mr-3">
                                                    {getDocumentStatusIcon(doc.status)}
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="font-medium" numberOfLines={1}>{doc.name}</Text>
                                                    <Text className={`text-sm ${getDocumentStatusColor(doc.status)}`}>
                                                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                                    </Text>
                                                    {doc.error && (
                                                        <Text className="text-xs text-red-500">{doc.error}</Text>
                                                    )}
                                                </View>
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => removeDocument(doc.uri)}
                                                className="ml-2 p-2 rounded-full bg-white/80"
                                                disabled={isUploading}
                                            >
                                                <MaterialIcons name="delete" size={24} color="#FF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>

                                {/* pick document */}
                                <View className="space-y-4">
                                    <View className="flex-row justify-between">
                                        <TouchableOpacity
                                            onPress={pickDocument}
                                            disabled={isUploading}
                                            className={`bg-blue-500/80 px-6 py-3 rounded-lg ${isUploading ? 'opacity-50' : ''}`}
                                        >
                                            {isLoadingfile ? (<View className='flex-row justify-center gap-1 items-center'>
                                                <ActivityIndicator size="small" color="white" />
                                                <Text className=' text-white'>loading ...</Text>
                                            </View>) : <Text className=' text-white'>Select document</Text>}
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={uploadDocuments}
                                            disabled={isUploading || documents.filter(d => d.status === 'pending').length === 0}
                                            className={`bg-green-500/80 px-6 py-3 rounded-lg ${isUploading || documents.filter(d => d.status === 'pending').length === 0
                                                ? 'opacity-50'
                                                : ''
                                                }`}
                                        >
                                            {isUploading ? (
                                                <ActivityIndicator color="white" size={"small"} />
                                            ) : (
                                                <Text className="text-gray-800 font-semibold">Upload</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    <View className="flex items-center">
                                        <Text className="text-gray-800/90 my-2">OR</Text>
                                        <TouchableOpacity
                                            onPress={handlePhotoUpload}
                                            className="bg-gray-800/80 w-full p-3 rounded-lg"
                                        >

                                            {isLoadingfile ? (<View className='flex-row justify-center gap-1 items-center'>
                                                <ActivityIndicator size="small" color="white" />
                                                <Text className=' text-white'>loading ...</Text>
                                            </View>) : <Text className="text-gray-300 text-center font-semibold">
                                                Take Direct Photo
                                            </Text>}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => router.replace('/markets')}
                                className="bg-gray-800/80 p-3 rounded-lg mt-4"
                            >
                                <Text className="text-white text-center font-semibold">Back</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </View>
    );
}
