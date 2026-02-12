

import React, { useState } from 'react';
import { View, Alert, Text, Platform, Linking, ActivityIndicator, TextInput } from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import { generatePdf, sanitizeFileName } from '@/lib/functions';
import { Receipt, TransmissionForm } from '@/interfaces/types';
import { styled } from 'nativewind';
import { TouchableOpacity } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import { Modal } from 'react-native';
import { StyleSheet } from 'react-native';
import * as Print from 'expo-print';
import { images } from '@/constants';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Share from 'react-native-share';

const StyledButton = styled(TouchableOpacity);

type PDFProps = {
    contentUri: string;
    uploadUrl: string;
    iosUri: Print.FilePrintResult;
    fileUri: string;
};

type Props<T = any> = {
    values: Partial<T | any>;
    fileName: string;
    company_logo: string;
    htmlHanlder: (values: T, arg1: string, arg2: string, arg3: string) => string;
    company_name: string;
    bucket_name: string;
    handleSave?: () => Promise<void | string>
}



const ReceiptPdfPrint = <T extends Receipt | TransmissionForm>({
    values,
    fileName,
    htmlHanlder,
    company_name,
    bucket_name,
    company_logo,
    handleSave
}: Props<T>) => {
    const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
    const [isRenameModalVisible, setRenameModalVisible] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [fileNameError, setFileNameError] = useState('');
    const [currentPdfData, setCurrentPdfData] = useState<{
        contentUri: string;
        fileUri: string;
        base64File: string;
    } | null>(null);

    const saveDataToDraft = async () => {
        if (handleSave) {
            await handleSave();
        }
    };

    const visualizePdf = async (fileUri: string) => {
        try {
            if (Platform.OS === 'android') {
                // Get a content URI using expo-sharing
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
                // Use expo-sharing for Android
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Share ${fileName}`,
                });
            } else {
                // Use react-native-share for iOS
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

            // Check if file already exists
            const fileInfo = await FileSystem.getInfoAsync(newFileUri);
            if (fileInfo.exists) {
                setFileNameError('A Receipt file with this name already exists');
                return;
            }

            await FileSystem.moveAsync({
                from: currentPdfData.fileUri,
                to: newFileUri
            });

            // Share and visualize the PDF using the new functions
            await sharePdf(newFileUri, currentPdfData.base64File, sanitizedFileName);
            await visualizePdf(newFileUri);

            setRenameModalVisible(false);
            setNewFileName('');
            setCurrentPdfData(null);
            setFileNameError('');

            Alert.alert('Success', 'Receipt File saved and shared successfully');
        } catch (error) {
            console.error('Error handling file:', error);
            Alert.alert('Error', 'Failed to process the file. Please try again.');
        }
    };

    const generatePdfFile = async () => {
        setGeneratingPdf(true);

        try {
            try {
                await saveDataToDraft();
            } catch (e) {
                console.error('Error saving data to draft:', e);
                Alert.alert('Error', 'Failed to save data to draft. Please try again.');
                return;
            }

            const isAvailable = await MailComposer.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert('Error', 'Mail composer is not available on this device');
                return;
            }

            const { contentUri, fileUri } = (await generatePdf({
                data: values,
                logo: company_logo ?? images.rainforest,
                contentHtml: htmlHanlder,
                filename: sanitizeFileName(fileName),
                company_name,
                bucket_name
            })) as PDFProps;

            const base64File = await FileSystem.readAsStringAsync(fileUri, {
                encoding: FileSystem.EncodingType.Base64
            });

            setCurrentPdfData({
                contentUri,
                fileUri,
                base64File
            });

            setNewFileName(fileName);
            setRenameModalVisible(true);
        } catch (error) {
            console.error('Error generating PDF:', error);
            Alert.alert('Error', 'Failed to generate PDF file. Please try again.');
        } finally {
            setGeneratingPdf(false);
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
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
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

export default ReceiptPdfPrint;