import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { updateResource, uploadResource } from '@/lib/api';
import { storeCurrentMarketData } from '@/store/mmkv-store';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { uploadToS3 } from '@/lib/functions';
import { useMarketStore } from '@/store/current-market-store';


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

type UploadProps = {
    concernedFile?: "transmission_url" | "accompanying_url";
    title: string;
    disable?: boolean;
    getUploadStatus?: (status: string) => void
}

const MAX_FILES = 1; // set Max quantity of files to upload
const ALLOW_TYPES = ['application/pdf', 'image/*'];

export default function AccompagnyingSheetDocumentUpload({
    concernedFile,
    title,
    getUploadStatus
}: UploadProps) {
    const [documents, setDocuments] = useState<UploadedDocument[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingfile, setIsLoadingfile] = useState(false);
    // store market object
    const [marketData, setMarketData] = useState<any>({});


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

        if (status === 'completed') {
            getUploadStatus?.('completed');
        }
    };

    const pickDocument = async () => {
        setIsLoadingfile(true)
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ALLOW_TYPES,
                multiple: true,
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets) {
                const newDocs = await Promise.all(result.assets.map(async (asset) => {

                    try {
                        // get the upload url from bucket s3
                        const uploadUrl = await uploadToS3(asset.uri, `accompanying_sheet-${asset.uri.split('/').pop()}`, marketData?.company_bucket ?? '', 'application/pdf');

                        console.log("\n\nUploaded uri photo in promise all: ", uploadUrl);
                        return {
                            name: asset.name,
                            uri: uploadUrl,
                            type: asset.mimeType || 'application/octet-stream',
                            size: asset.size || 0,
                            status: 'pending' as const
                        }
                    } catch (error) {
                        console.error('Error uploading to S3:', error);
                        Alert.alert('Error', 'Failed to upload file to storage');
                        return null;
                    }
                }));

                // Check if adding new documents exceeds maxFiles
                if (documents.length + newDocs.length > MAX_FILES) {
                    Alert.alert(`You can only upload up to ${MAX_FILES} files`);
                    return;
                }

                const validDocs = newDocs.filter(doc => doc !== null) as UploadedDocument[];

                if (documents.length + validDocs.length > MAX_FILES) {
                    Alert.alert(`You can only upload up to ${MAX_FILES} files`);
                    return;
                }

                setDocuments([...documents, ...validDocs]);
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
            const uploadUrl = await uploadToS3(uri, `${concernedFile}-${uri.split('/').pop()}`, marketData?.company_bucket ?? '', 'application/pdf');

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
    };

    const uploadDocuments = useCallback(async () => {
        setIsUploading(true);
        const pendingDocs = documents.filter(doc => doc.status === 'pending');

        try {

            const objToSend = {
                [`${concernedFile}`]: pendingDocs[0].uri
            }

            // cannot upload if no market number.
            if (!marketData?.market_number) {
                Alert.alert('Warning', 'No market number set. Please set a market number first')
                return
            }
            const response = await updateResource('markets', objToSend, marketData?.market_number);
            console.log('\n\n inside uploadDocuments response of update market: ', response);

            if (response) {
                updateDocumentStatus(pendingDocs[0].uri, 'completed');
            } else {
                updateDocumentStatus(pendingDocs[0].uri, 'error', 'Failed to update resource');
            }
            Alert.alert('Success', 'Document uploaded successfully');
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
        <View className='flex-1 flex-col justify-between mb-10'>
            <View className="p-4 bg-white rounded-lg shadow">
                <Text className="text-lg font-bold mb-4">{` Upload ${title} sheet file`}</Text>

                <ScrollView className="max-h-60 mb-4">
                    {documents.map((doc, index) => (
                        <View key={index} className="flex-row items-center justify-between p-3 mb-2 bg-gray-50 rounded">

                            <View className="flex-1 flex-row items-center">
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
                                className="ml-2"
                                disabled={isUploading}
                            >
                                <MaterialIcons name="delete" size={24} color="#FF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                <View className="flex-row justify-between">
                    <TouchableOpacity
                        onPress={pickDocument}
                        disabled={isUploading}
                        className={`bg-blue-500 px-4 py-2 rounded-lg ${isUploading ? 'opacity-50' : ''}`}
                    >
                        {isLoadingfile ? (<View className='flex-row justify-center gap-1 items-center'>
                            <ActivityIndicator size="small" color="white" />
                            <Text className=' text-white'>loading ...</Text>
                        </View>) : <Text className=' text-white'>Select document</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={uploadDocuments}
                        disabled={isUploading || documents.filter(d => d.status === 'pending').length === 0}
                        className={`bg-green-500 px-4 py-2 rounded-lg ${(isUploading || documents.filter(d => d.status === 'pending').length === 0) ? 'opacity-50' : ''
                            }`}
                    >
                        {isUploading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white">Upload</Text>
                        )}
                    </TouchableOpacity>
                </View>
                {/* <Text className='text-center'>OR</Text>
                <View className='mt-4'>
                    <TouchableOpacity
                        onPress={handlePhotoUpload}
                        className='bg-gray-800  p-2 rounded '
                    >
                        <Text className='text-white text-center'>take direct Photo</Text>
                    </TouchableOpacity>
                </View> */}
            </View>
            <View className='mt-4 bottom-0'>
                <TouchableOpacity
                    onPress={() => router.replace('/markets')}
                    className='bg-gray-800  p-2 rounded '
                >
                    <Text className='text-white text-center'>back</Text>
                </TouchableOpacity>
            </View>
        </View >
    );

}
