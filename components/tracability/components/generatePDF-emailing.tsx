

import React, { useState, memo } from 'react';
import { View, Alert, Text, Platform, Linking, TextInput } from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import { generateAccompanyingPdf, sanitizeFileName } from '@/lib/functions';
import { AccompanyingSheet, Receipt } from '@/interfaces/types';
import { styled } from 'nativewind';
import { TouchableOpacity } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { Modal } from 'react-native';
import { StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { images } from '@/constants';
import { ActivityIndicator } from 'react-native';
import * as Sharing from 'expo-sharing';
import Share from 'react-native-share';
import * as Print from 'expo-print';

const StyledButton = styled(TouchableOpacity);

interface PDFGeneratorProps<T, K> {
    company_logo: string;
    sheet: T;
    receipts: Receipt[];
    fileName: string;
    htmlHandler: (sheet: T, receipts: K[]) => string;
    company_name: string;
    bucket_name?: string;
    getGeneratedURL?: (url: string) => void;
    pdfGenerated?: boolean
}

const PDFGenerator = ({
    sheet,
    receipts,
    fileName,
    htmlHandler,
    company_logo,
    company_name,
    bucket_name,
    getGeneratedURL,

}: PDFGeneratorProps<AccompanyingSheet, Receipt>) => {
    const [generatingPdf, setGenerating] = useState(false);
    const [isRenameModalVisible, setRenameModalVisible] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [fileNameError, setFileNameError] = useState('');
    const [currentPdfData, setCurrentPdfData] = useState<{
        contentUri: string;
        fileUri: string;
        base64File: string;
        uploadedUrl?: string;
    } | null>(null);

    const visualizePdf = async (fileUri: string) => {
        try {
            if (Platform.OS === 'android') {
                const contentUri = await FileSystem.getContentUriAsync(fileUri);
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    type: 'application/pdf',
                    flags: 1,
                });
            } else if (Platform.OS === 'ios') {
                await Linking.openURL(fileUri);
            }
        } catch (error) {
            console.error('Error visualizing PDF:', error);
            Alert.alert('Error', 'Unable to open the PDF file. Please try sharing it instead.');
        }
    };

    const sharePdf = async (fileUri: string, base64File: string, fileName: string) => {
        try {
            if (Platform.OS === 'android') {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Share ${fileName}`,
                });
            } else {
                const shareOptions = {
                    title: 'Share ' + fileName,
                    message: 'Check out this document',
                    url: `data:application/pdf;base64,${base64File}`,
                    type: 'application/pdf'
                };
                await Share.open(shareOptions);
            }
        } catch (error) {
            console.error('Error sharing PDF:', error);
            Alert.alert('Error', 'Unable to share the PDF file.');
        }
    };

    const renamePdfFile = async () => {
        if (!currentPdfData || !newFileName.trim()) {
            setFileNameError('Please enter a valid filename');
            return;
        }

        try {
            const sanitizedFileName = sanitizeFileName(newFileName);
            const newFileUri = `${FileSystem.documentDirectory}${sanitizedFileName}.pdf`;

            const fileInfo = await FileSystem.getInfoAsync(newFileUri);
            if (fileInfo.exists) {
                setFileNameError('An Accompanying Sheet file with this name already exists');
                return;
            }

            await FileSystem.moveAsync({
                from: currentPdfData.fileUri,
                to: newFileUri
            });

            // Update the generated URL if available
            if (currentPdfData.uploadedUrl) {
                getGeneratedURL?.(currentPdfData.uploadedUrl);
            }

            await sharePdf(newFileUri, currentPdfData.base64File, sanitizedFileName); // share the new file via social media app
            await visualizePdf(newFileUri); // visualize and download the new file

            setRenameModalVisible(false);
            setNewFileName('');
            setCurrentPdfData(null);
            setFileNameError('');

            // Alert.alert('Success', 'Accompanying Sheet saved and shared successfully');
        } catch (error) {
            console.error('Error handling file:', error);
            Alert.alert('Error', 'Failed to process the file. Please try again.');
        }
    };

    const generatePdfFile = async () => {
        setGenerating(true);

        try {
            const isAvailable = await MailComposer.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert('Error', 'Mail composer is not available on this device');
                return;
            }

            const { contentUri, uploadedUrl, fileUri } = await generateAccompanyingPdf({
                data: receipts,
                sheet,
                filename: sanitizeFileName(fileName),
                logo: company_logo ?? images.rainforest,
                company_name,
                bucket_name
            }) as { contentUri: string; uploadedUrl: string; fileUri: string; };

            const base64File = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.Base64
            });

            setCurrentPdfData({
                contentUri,
                fileUri,
                base64File,
                uploadedUrl
            });

            setNewFileName(fileName);
            setRenameModalVisible(true);
        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Failed to generate PDF file. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <StyledButton
                className="bg-black-200 p-3 rounded-md my-6"
                onPress={generatePdfFile}
                disabled={generatingPdf}
            >
                {generatingPdf ? (
                    <View className='flex-row justify-center gap-1 items-center'>
                        <ActivityIndicator size="small" color="white" />
                        <Text className='text-white'>Generating ...</Text>
                    </View>
                ) : (
                    <Text className='text-white'>2. Generate PDF and Print</Text>
                )}
            </StyledButton>

            <Modal
                visible={isRenameModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setRenameModalVisible(false)}
            >
                <View style={styles.renameModalContent}>
                    <View style={styles.renameModalBox}>
                        <Text style={styles.modalTitle}>Save PDF File</Text>
                        <TextInput
                            style={[styles.input, fileNameError ? styles.inputError : null]}
                            value={newFileName}
                            onChangeText={(text) => {
                                setNewFileName(text);
                                setFileNameError('');
                            }}
                            placeholder="Enter filename"
                            autoFocus
                        />
                        {fileNameError ? (
                            <Text style={styles.errorText}>{fileNameError}</Text>
                        ) : null}
                        <View style={styles.buttonContainer}>
                            <StyledButton
                                className="bg-gray-500 p-3 rounded-md mx-2"
                                onPress={() => {
                                    setRenameModalVisible(false);
                                    setFileNameError('');
                                }}
                            >
                                <Text className='text-white'>Cancel</Text>
                            </StyledButton>
                            <StyledButton
                                className="bg-black-200 p-3 rounded-md mx-2"
                                onPress={renamePdfFile}
                            >
                                <Text className='text-white'>Save</Text>
                            </StyledButton>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    renameModalContent: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    renameModalBox: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
    },
    inputError: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        fontSize: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
});

export default memo(PDFGenerator);