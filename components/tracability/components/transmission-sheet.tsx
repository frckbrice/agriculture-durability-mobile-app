

import React, {
    useCallback,
    useEffect, useState,
    memo
} from 'react';
import {
    View, Text, TextInput,
    Button, ActivityIndicator,
    TouchableOpacity, ScrollView
} from 'react-native';
import { styled } from 'nativewind';
import { generatePDF } from '@/lib/pdf';
import { sendEmail } from '@/lib/email';
import { transmissionInitialValues } from '@/constants/initial-values';
import SignatureInput from '../../global/signatures/signature-capture';

import ReceiptPdfPrint from './generate-receiptpdf-for-print';
import { contentHtmlForTransmission, uploadToS3 } from '@/lib/functions';
import { Company, Market } from '@/interfaces/types';
import { useMarketStore } from '@/store/current-market-store';
import AccompagnyingSheetDocumentUpload from './upload-accompanying-sheet';
import { useCompanyStore, useTransactionStore } from '@/store/current-company-store';
import { updateResource, uploadResource } from '@/lib/api';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';



const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);


interface TransmissionForm {
    transactionId?: string;
    senderName: string;
    recipientName: string;
    vehicleRegistration: string;
    ministryAgentName: string;
    driverName: string;
    numberOfBags: string;
    productQuality: string;
    senderSignature: string;
    carrierSignature: string;
    ministrySignature: string;
    marketNumber: string;
}

interface ValidationErrors {
    vehicleRegistration?: string;
    ministryAgentName?: string;
    driverName?: string;
    numberOfBags?: string;
    productQuality?: string;
    senderSignature?: string;
    carrierSignature?: string;
    ministrySignature?: string;
    marketNumber?: string;
    senderName?: string;
    recipientName?: string;
}

export const renderTextField = (value: string | undefined, label: string, required?: boolean) => (
    <StyledView className="flex-row gap-3 items-center">
        <StyledText className="text-sm font-medium text-gray-900">
            {label} {required && <Text className="text-red-500">*</Text>}
        </StyledText>
        <StyledText className="p-3 border border-gray-200 rounded-md bg-white w-full">
            {value || 'N/A'}
        </StyledText>
    </StyledView>
);



const TransmissionFormComponent: React.FC = () => {
    const [form, setForm] = useState<TransmissionForm>(transmissionInitialValues);
    const [emptyCanvas, setEmptyCanvas] = useState(false);
    const [marketData, setMarketData] = useState<Market | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadToDB, setUploadToDB] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [transactionData, setTransactransactionData] = useState<any>({});
    const {
        getMarket
    } = useMarketStore();

    const {
        getCompany,
    } = useCompanyStore();


    const [currentCompany, setCurrentCompany] = useState<Company>();
    const {   // save the transaction Id for later use in transmission sheet
        getTransaction
    } = useTransactionStore();

    useEffect(() => {

        // get the market object passed to store from parent market component
        const marketProps = getMarket()
        if (marketProps) {
            // setMarketData(JSON.parse(marketProps))
            setMarketData(marketProps);
            if (!form?.marketNumber)
                setForm(prev => ({
                    ...prev,
                    marketNumber: marketProps?.market_number as string,
                    senderName: marketProps?.provider || '',
                    recipientName: marketProps?.company_name || '',
                }))
        };

        // get the transaction id 
        const transaction = getTransaction();
        if (transaction) {
            setTransactransactionData(transaction);
            setForm(prev => ({
                ...prev,
                transactionId: transaction?.id,
                numberOfBags: transaction?.number_of_bags
            }))
        }

        // get the company object passed to store from parent company component
        const company = getCompany();
        console.log("\n\n company : ", company)
        if (company)
            setCurrentCompany(company);

    }, [form?.marketNumber, getCompany, getTransaction, getMarket]);

    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {};

        if (!form.vehicleRegistration.trim()) {
            newErrors.vehicleRegistration = 'Vehicle registration is required';
        }

        if (!form.ministryAgentName.trim()) {
            newErrors.ministryAgentName = 'Ministry agent name is required';
        }

        if (!form.driverName.trim()) {
            newErrors.driverName = 'Driver name is required';
        }

        if (!form.numberOfBags.trim()) {
            newErrors.numberOfBags = 'Number of bags is required';
        } else if (isNaN(Number(form.numberOfBags)) || Number(form.numberOfBags) <= 0) {
            newErrors.numberOfBags = 'Please enter a valid number of bags';
        }

        if (!form.productQuality.trim()) {
            newErrors.productQuality = 'Product quality is required';
        }

        if (!form.senderSignature) {
            newErrors.senderSignature = 'Sender signature is required';
        }

        if (!form.carrierSignature) {
            newErrors.carrierSignature = 'Carrier signature is required';
        }

        if (!form.ministrySignature) {
            newErrors.ministrySignature = 'Ministry signature is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof TransmissionForm, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setTouched(prev => ({ ...prev, [field]: true }));

        // Clear error when user starts typing
        if (errors[field as keyof ValidationErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };



    const handleSignature = (type: 'sender' | 'carrier' | 'ministry' | 'agent_' | 'farmer_', signature: string) => {
        console.log("type: ", signature)
        setForm(prev => ({
            ...prev,
            [`${type}Signature`]: signature,
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            // Generate PDF
            const pdfBase64 = await generatePDF(form);

            // Define recipients (you might want to store these in a config or fetch from an API)
            const recipients = [
                'maebrie2017@gmail.com',
                'bricefrkc@gmail.com',
                'avomevariste@ymail.com',
                // 'ministry@example.com'
            ];

            // Send email with PDF attachment
            await sendEmail({
                to: recipients,
                subject: 'Transmission and Declaration Form',
                body: 'Please find attached the Transmission and Declaration Form.',
                attachments: [
                    {
                        // filename: 'transmission_form.pdf',
                        // content: pdfBase64,
                        encoding: 'base64',
                        path: pdfBase64,
                        // uri: '',
                        // type: "blob",
                        mimeType: 'application/pdf',
                        name: `transmission_form for market ${marketData?.market_number}.pdf`,
                    },
                ],
            });

            alert('Transmission form submitted and sent successfully!');
        } catch (err) {
            console.error('Error submitting form:', err);
            setError('Failed to submit form. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSignature = useCallback(async (uri: any, author: 'sender' | 'carrier' | 'ministry' | 'agent_' | 'farmer_') => {
        handleSignature(author, uri);
    }, [handleSignature]);

    const renderInputField = (field: keyof typeof transmissionInitialValues, label: string, placeholder: string) => (
        <StyledView className="my-1 w-full flex-row flex-wrap items-center">
            <StyledText className="text-sm font-medium text-gray-700">
                {label} <Text className="text-red-500">*</Text>
            </StyledText>
            <View className="flex-1">
                <StyledTextInput
                    className={`p-2 border rounded-md bg-white flex-1 ${touched[field] && errors[field] ? 'border-red-500' : 'border-gray-200'
                        }`}
                    placeholder={placeholder}
                    value={field === 'numberOfBags' ? transactionData?.number_of_bags : form[field]}
                    onChangeText={(value) => handleInputChange(field, value)}
                    onBlur={() => setTouched(prev => ({ ...prev, [field]: true }))}
                />
                {touched[field] && errors[field] && (
                    <Text className="text-red-500 text-xs mt-1">{errors[field]}</Text>
                )}
            </View>
        </StyledView>
    );

    const handleSave = async () => {
        setIsSaving(true);

        if (!validateForm()) {
            Alert.alert('Validation Error', `Please fill in all required fields correctly before saving.`);
            return;
        }
        try {
            const [driverSignature, senderSignature, ministrySignature] = await Promise.all([
                uploadToS3(form?.carrierSignature, `transmission-driver${form?.carrierSignature.split('/').pop()}`, currentCompany?.company_bucket ?? '', 'image/jpeg'),
                uploadToS3(form?.senderSignature, `transmission-sender${form?.senderSignature.split('/').pop()}`, currentCompany?.company_bucket ?? '', 'image/jpeg'),
                uploadToS3(form?.ministrySignature, `transmission-ministry${form?.ministrySignature.split('/').pop()}`, currentCompany?.company_bucket ?? '', 'image/jpeg'),
            ])

            const formValues = {
                sender_name: marketData?.provider,
                receiver_name: marketData?.company_name,
                market_number: marketData?.market_number,
                minister_agent_name: form?.ministryAgentName,
                vehicule_immatriculation_number: form?.vehicleRegistration,
                driver_name: form?.driverName,
                // normally this number of bags should be the same as the number of bags declared in accompanying sheet.
                number_of_bags_for_transmission: Number(form?.numberOfBags),
                product_quality: form?.productQuality,
                sender_signature: senderSignature,
                driver_signature: driverSignature,
                min_com_sig: ministrySignature,
                date_transmission: new Date(Date.now()).toISOString(),
            }
            // const data = { ...form, formValues };
            console.log('\n\ntransmission form data: ', formValues)
            const response = await updateResource('transactions', formValues, form?.transactionId as string);
            if (response) {

                Alert.alert('Success', 'Transmission data uploaded successfully to database!');
                handleSubmit();

            } else
                Alert.alert('Error', 'Failed to upload data to database');
        } catch (error) {
            console.error(error)

        } finally {
            setIsSaving(false);
        };
    };

    const resetForm = () => {
        setEmptyCanvas(true);
        setForm(transmissionInitialValues);
        setUploadToDB(!uploadToDB);
    };

    return (
        <ScrollView className="h-full flex-1 p-4">
            {/* <StyledText className="text-xl font-bold mb-4">Transmission and Declaration Form</StyledText> */}
            <View className=' w-full flex-row m-1 justify-end'>
                <TouchableOpacity
                    onPress={() => resetForm()}
                    className={'bg-black-200 w-10 right-0  p-1 rounded'}

                >
                    <Text className='text-white text-center'>
                        <Ionicons name="refresh-outline" size={24} color="white" />
                    </Text>
                </TouchableOpacity>
            </View>

            <StyledView className="flex-row flex-wrap justify-between">
                {renderTextField(String(marketData?.market_number), 'Market number:', true)}
            </StyledView>

            <View className=" my-4  justify-center items-center ">
                <View className="h-0.5 w-[90%] bg-gray-300  " />
            </View>
            <StyledView className="flex-row flex-wrap justify-between">
                {renderTextField(String(marketData?.provider), 'supplier:', true)}
                {renderTextField(String(marketData?.company_name), 'Recipient Name:', true)}
            </StyledView>

            <View className=" my-4  justify-center items-center ">
                <View className="h-0.5 w-[90%] bg-gray-300  " />
            </View>

            <StyledView className="flex-row flex-wrap justify-between">
                {renderInputField('ministryAgentName', 'Ministry Agent Name', 'Enter the ministry agent name')}
            </StyledView>

            <View className=" my-4  justify-center items-center ">
                <View className="h-0.5 w-[90%] bg-gray-300  " />
            </View>

            <StyledView className="flex-row flex-wrap justify-between">

                {renderInputField('vehicleRegistration', 'Vehicle imatriculation', 'Enter vehicle number')}
                {renderInputField('driverName', 'Driver Name', 'Enter driver name')}
            </StyledView>

            <View className=" my-4  justify-center items-center ">
                <View className="h-0.5 w-[90%] bg-gray-300  " />
            </View>


            <StyledView className="flex-row flex-wrap justify-between">

                {renderInputField('numberOfBags', 'Number of bags', 'Enter the number of bags')}
                {renderInputField('productQuality', 'Product Quality', 'Enter product quality')}
            </StyledView>

            <View className=" my-4  justify-center items-center ">
                <View className="h-0.5 w-[90%] bg-gray-300  " />
            </View>


            <View className='space-y-4 '>
                <View>
                    <SignatureInput
                        onSignature={handleSaveSignature}
                        label={<Text>Sender Signature <Text className="text-red-500">*</Text></Text>}
                        author="sender"
                        emptyCanvas={emptyCanvas}
                        className="flex-1 justify-center items-center px-[20px]"
                    />
                    {touched.senderSignature && errors.senderSignature && (
                        <Text className="text-red-500 text-xs mt-1">{errors.senderSignature}</Text>
                    )}
                </View>

                <SignatureInput
                    onSignature={handleSaveSignature}
                    label={<Text>Carrier Signature <Text className="text-red-500">*</Text></Text>}
                    author='carrier'
                    emptyCanvas={emptyCanvas}
                    className='flex-1, justify-center items-center px-[20px]'
                />
                <SignatureInput
                    onSignature={handleSaveSignature}
                    label={<Text>Ministry Signature <Text className="text-red-500">*</Text></Text>}
                    author='ministry'
                    emptyCanvas={emptyCanvas}
                    className='flex-1, justify-center items-center px-[20px]'
                />

            </View>

            {error && <StyledText className="text-red-500 mt-2">{error}</StyledText>}
            {/* upload to database */}
            {!uploadToDB ? <TouchableOpacity
                className="bg-black-200  p-2 rounded-md my-6"
                onPress={handleSave}
            >

                <StyledText className="text-white text-center font-bold">
                    {isSaving && <ActivityIndicator size="small" color="white" />}
                    1. Save data
                </StyledText>
            </TouchableOpacity> : null
            }

            <Text className='text-green-600'>
                <Text className='text-blue-700 underline'>NB:</Text>
                generate the pdf file first before uploading it to database.
                <Text className='text-red-400 my-6 text-center ml-2'>
                    &nbsp; Fill all the fields before generating pdf.
                </Text>
            </Text>

            {/* generate receipt pdf */}
            {!!form?.ministryAgentName && !!form?.ministrySignature
                ? (
                    <>
                        <ReceiptPdfPrint
                            company_logo={marketData?.company_logo as string}
                            values={form}
                            fileName="transmission-form"
                            htmlHanlder={contentHtmlForTransmission as (data: TransmissionForm) => string}
                            company_name={marketData?.company_name as string}
                            bucket_name={currentCompany?.company_bucket as string}
                        />

                        {/* upload document. */}
                        <View className=" my-4  justify-center items-center ">
                            <View className="h-0.5 w-[90%] bg-gray-300  " />
                        </View>
                        <AccompagnyingSheetDocumentUpload
                            concernedFile='transmission_url'
                            title='Transmission'
                        />
                    </>
                ) : (
                    <Text className='text-red-400 my-6 text-center'>
                        {/* please fill all the fields before generating pdf. */}
                    </Text>
                )
            }


        </ScrollView>
    );
};

export default memo(TransmissionFormComponent);