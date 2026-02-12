

// import React, { useState, useEffect, useCallback } from 'react';
// import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
// import { styled } from 'nativewind';
// import { DataTable } from 'react-native-paper';
// import { Company, Receipt, ValidationErrors } from '@/interfaces/types';


// import { useReceiptDataStore } from '@/store/receiptdata-store';
// import {
//     accompagnyingSheetMetaDataInitialValue,
//     receiptInitialValues
// } from '@/constants/initial-values';
// import { AccompanyingSheet } from "@/interfaces/types";

// import PDFGenerator from './generatePDF-emailing';
// import { accompanyingHtmlStructure, uploadAccompanyingSheetData, uploadToS3, validateField } from '@/lib/functions';

// import { useMarketStore } from '@/store/current-market-store';
// import AccompagnyingSheetDocumentUpload from './upload-accompanying-sheet';
// import { useCompanyStore, useTransactionStore } from '@/store/current-company-store';
// import { uploadResource } from '@/lib/api';
// import { useNetInfo } from '@react-native-community/netinfo';

// const StyledView = styled(View);
// const StyledText = styled(Text);
// const StyledTextInput = styled(TextInput);
// const StyledButton = styled(TouchableOpacity);


// export const renderTextField = (value: string | undefined, label: string) => (
//     <StyledView className=" flex-row gap-3 ">
//         <StyledText className="text-sm font-medium text-gray-900 ">{label}</StyledText>
//         <StyledText className={`text-sm
//              font-medium
//               text-black-200
//               ${label.toLowerCase().includes('market') ? 'text-gray-400 w-full' : ''}
//               `}>{value || 'N/A'}</StyledText>
//     </StyledView>
// )

// type ValidatableReceiptField = keyof Omit<AccompanyingSheet, 'id' | 'vehicleNumber' | 'driverName'>;

// // Define required fields based on Receipt interface
// const requiredFields: ValidatableReceiptField[] = [
//     'numberOfBagsDeclared',
//     'humidity',
//     'declaredNetWeight',
//     'marketNumber',
//     'levelOfTraceability'
// ];

// export const validateReceipt = (sheet: AccompanyingSheet) => {
//     const newErrors: Record<string, string> = {};

//     // Validate each required field
//     requiredFields.forEach((field) => {
//         if (field in sheet) {
//             const error = validateField(field, sheet[field] as string | number);
//             if (error) {
//                 newErrors[field] = error;
//             }
//         }
//     });

//     return newErrors;
// };


// export const AccompanyingSheetComponent: React.FC = () => {
//     const [sheet, setSheet] = useState<Omit<AccompanyingSheet, 'vehicleNumber' | 'driverName'>>(accompagnyingSheetMetaDataInitialValue);

//     const [receipts, setReceipts] = useState<Receipt[]>([]);
//     const [uploadToDB, setUploadToDB] = useState<boolean>(false);
//     const { isConnected } = useNetInfo();
//     const [hasbeenSent, setHasbeenSent] = useState<boolean>(false);
//     const [errors, setErrors] = useState<ValidationErrors | any>({});

//     // store market object
//     const [marketData, setMarketData] = useState<any>({});

//     const {
//         getReceiptsData
//     } = useReceiptDataStore();
//     const {
//         getMarket
//     } = useMarketStore();

//     const {
//         getCompany,
//     } = useCompanyStore();

//     const {   // save the transaction Id for later use in transmission sheet
//         saveTransaction
//     } = useTransactionStore();

//     const [currentCompany, setCurrentCompany] = useState<Company>();
//     const [isSaving, setIsSaving] = useState<boolean>(false);

//     useEffect(() => {
//         // fetch all the receipts based on their market number
//         const allReceipts = getReceiptsData();
//         setReceipts(allReceipts);

//         // get the market object passed to store from parent market component
//         const marketProps = getMarket()
//         if (marketProps) {
//             // setMarketData(JSON.parse(marketProps));
//             setMarketData(marketProps);
//             if (!sheet?.marketNumber)
//                 setSheet(prev => ({ ...prev, marketNumber: marketData?.market_number }))
//         }

//         // get the company object passed to store from parent company component
//         const company = getCompany();
//         console.log("\n\n company : ", company)
//         if (company)
//             setCurrentCompany(company);

//     }, [sheet.marketNumber, getReceiptsData, getCompany]);

//     // save the receipts to database
//     const saveReceiptsData = async (receipts: Receipt[]) => {
//         if (hasbeenSent) return;

//         try {

//             // store all farmer photos, and signatures and his product photo to S3

//             const newReceipts = await Promise.all(receipts?.map(async (r) => {
//                 const { salePhotoUrl: photo } = r;
//                 return {
//                     ...r,
//                     photo: await uploadToS3(photo[0],
//                         `receipt-${r.farmer_name}-${photo[0].split('/').pop()}`,
//                         currentCompany?.company_bucket as string, 'image/jpeg'),
//                     farmer_signature: await uploadToS3(r.farmer_signature,
//                         `signature-${r.farmer_name}-${r.farmer_signature.split('/').pop()}`,
//                         currentCompany?.company_bucket as string, 'image/jpeg'),
//                     agent_signature: await uploadToS3(r.agent_signature,
//                         `signature-${r.farmer_name}-${r.agent_signature.split('/').pop()}`,
//                         currentCompany?.company_bucket as string, 'image/jpeg'),
//                 }
//             }));


//             // we make bulk upload of receipts
//             const response = await Promise.all(newReceipts?.map(async (receipt) => {
//                 return await uploadResource('receipts', receipt);
//             }));

//             return response;
//         } catch (error) {
//             console.error(` Failed to upload receipts  \n\n: ${error}`);
//         }
//     }

//     const getGeneratedURL = useCallback((pdfUrl: string) => {

//         if (pdfUrl) {
//             console.log("\n\n pdf url: ", pdfUrl)
//             setUploadToDB(true)
//         }

//     }, []);


//     const handleInputChange = (field: keyof AccompanyingSheet, value: any) => {

//         // Validate the field
//         const error = validateField(field, value);
//         setErrors((prev: ValidationErrors) => ({
//             ...prev,
//             [field]: error || ''
//         }));

//         setSheet(prev => ({ ...prev, [field]: value }));
//     };

//     const saveAnduploadData = async () => {
//         setIsSaving(true);

//         const validationErrors = validateReceipt({ ...sheet } as any);
//         console.log('\n\n validation errors: ', validationErrors);
//         if (Object.keys(validationErrors).length > 0) {
//             setErrors(validationErrors);
//             setIsSaving(false);
//             Alert.alert('Validation Error', `Please fix all errors before saving. ${Object.keys(validationErrors).join(', ')}: ${Object.values(validationErrors).join('\n')}`);
//             return;
//         }

//         try {
//             const dataToUpload = {
//                 level_of_traceability: sheet?.levelOfTraceability,
//                 humidity: Number(sheet?.humidity),
//                 net_weight: Number(sheet?.declaredNetWeight),
//                 date: new Date(Date.now()).toISOString(),
//                 market_number: marketData?.market_number,
//                 number_of_bags: Number(sheet?.numberOfBagsDeclared),
//             };

//             console.log('\n\n receipts to upload inside accompanying sheet: ', receipts);
//             const result = await uploadAccompanyingSheetData(
//                 receipts, // receipt list
//                 dataToUpload,  // transaction
//                 currentCompany?.company_bucket as string
//             );

//             if (result?.success) {
//                 saveTransaction(result);

//                 if (result?.failedReceipts) {
//                     Alert.alert(
//                         'Partial Success',
//                         `Upload completed with ${result?.failedReceipts.length} failed receipts. These will need to be retried.`
//                     );
//                 } else {
//                     console.log("\n\n transaction id ", result?.transactionId)
//                     Alert.alert('Success', 'Accompanying sheet and all receipts uploaded successfully');
//                 }
//             } else {
//                 Alert.alert('Upload Failed', result?.error || 'Unknown error occurred');
//             }
//         } catch (error) {
//             console.error('Failed to upload data:', error);
//             Alert.alert('Failure', 'Failed to upload data to database');
//         } finally {
//             setIsSaving(false);
//         }
//     };
//     // console.log("\n\n current receipt list: ", receipts);

//     const renderInputField = (field: keyof typeof accompagnyingSheetMetaDataInitialValue, label: string, placeholder: string) => (
//         <StyledView className="my-1 w-full flex-row flex-wrap items-center">
//             <StyledText className="text-sm font-medium text-gray-700">{label}: &nbsp; <Text className="text-red-500">*</Text></StyledText>
//             <StyledTextInput
//                 className={` w-[97%] p-2 border  rounded-md bg-white flex-1 ${errors['farmer_contact'] ? 'border-red-500' : 'border-gray-200'
//                     }`}
//                 placeholder={placeholder}
//                 placeholderTextColor=""
//                 value={String(sheet[field])}
//                 onChangeText={(value) => {
//                     handleInputChange(field, value);
//                     validateAndUpdateField(field, value);
//                 }}
//             />
//         </StyledView>
//     );


//     const validateAndUpdateField = (field: string, value: string) => {
//         const error = validateField(field, value);
//         setErrors((prev: ValidationErrors) => ({
//             ...prev,
//             [field]: error || ''
//         }));
//         return !error;
//     };
//     // console.log("these are the receipts: ", receipts);

//     return (
//         <ScrollView
//             className="p-4 pb-10"
//         // onPointerEnter={() => fetchReceipts(sheet.marketNumber)}
//         >
//             {/* <StyledText className="text-xl font-bold mb-4">Accompanying Sheet</StyledText> */}

//             <StyledView className="flex-row flex-wrap justify-between ">
//                 {renderTextField(String(marketData?.market_number), 'Market number:')}

//             </StyledView>

//             {/* <View className=" my-4  justify-center items-center ">
//                 <View className="h-0.5 w-[90%] bg-gray-300  " />
//             </View> */}

//             {/* <StyledView className="flex-row flex-wrap justify-between">
//                 {renderInputField('driverName', 'Driver Name', 'Enter the driver name')}
//                 {renderInputField('vehicleNumber', 'Vehicle Number', 'Enter the vehicle number')}
//             </StyledView> */}

//             <View className=" my-4  justify-center items-center ">
//                 <View className="h-0.5 w-[90%] bg-gray-300  " />
//             </View>


//             <StyledView className="flex-row flex-wrap justify-between">
//                 {renderInputField('numberOfBagsDeclared', 'Number of bags ', 'Enter the num of bags')}
//                 {renderInputField('declaredNetWeight', 'Declared weight (Ton)', 'Enter the declared weight')}
//             </StyledView>

//             <View className=" my-4  justify-center items-center ">
//                 <View className="h-0.5 w-[90%] bg-gray-300  " />
//             </View>

//             <StyledView className="flex-row flex-wrap justify-between">
//                 {renderInputField('levelOfTraceability', 'Level of Traceability', 'Enter Level of Traceability')}
//                 {renderInputField('humidity', 'Humidity (%)', 'Enter humidity percentage')}
//             </StyledView>

//             <View className=" my-4  justify-center items-center ">
//                 <View className="h-0.5 w-[90%] bg-gray-300  " />
//             </View>


//             <StyledText className="text-lg font-bold mt-4 mb-2">
//                 Receipts
//             </StyledText>

//             <ScrollView horizontal={true} style={styles.container}>
//                 <View style={styles.table}>

//                     {/* set table header */}
//                     <View style={styles.headerRow}>
//                         {Object.keys(receiptInitialValues)?.map((field, index) => {

//                             // ignore the signatures and photo in the receit list.
//                             if (field.includes('signature') || field.includes('salePhotoUrl') || field.includes('farmer_id')) return;
//                             return (
//                                 <Text key={index} style={[styles.headerCell, styles.cell]}>{field}</Text>
//                             )
//                         })}
//                     </View>
//                     {/* set table rows */}
//                     {receipts.map((receipt: Receipt, index) => {

//                         return (
//                             <View key={index} >
//                                 {receiptDisplay(receipt)}
//                             </View>
//                         )
//                     })}
//                 </View>
//             </ScrollView>
//             <Text className='text-green-600'>
//                 <Text className='text-blue-700 underline'>NB:</Text>
//                 generate the pdf file first before uploading it to database
//             </Text>

//             {/* upload to database */}
//             {!uploadToDB ? <StyledButton
//                 className="bg-black-200  p-2 rounded-md my-6"
//                 onPress={saveAnduploadData}
//             >

//                 <StyledText className="text-white text-center font-bold">
//                     1. {isSaving && <ActivityIndicator size="small" color="white" />}
//                     Upload all data</StyledText>
//             </StyledButton> : null
//             }

//             {/* generate accomanying sheet pdf */}
//             {!!sheet?.declaredNetWeight && !!sheet?.levelOfTraceability && !!sheet?.numberOfBagsDeclared && !!sheet?.humidity
//                 ? (
//                     <>
//                         <PDFGenerator
//                             company_logo={marketData?.company_logo}
//                             sheet={sheet as AccompanyingSheet}
//                             receipts={receipts}
//                             fileName="AccompanyingSheet"
//                             htmlHandler={accompanyingHtmlStructure as (sheet: AccompanyingSheet, receipts: Receipt[]) => string}
//                             company_name={marketData?.company_name}
//                             bucket_name={currentCompany?.company_bucket}
//                             getGeneratedURL={getGeneratedURL}
//                         />
//                         <View className=" my-4  justify-center items-center ">
//                             <View className="h-0.5 w-[90%] bg-gray-300  " />
//                         </View>
//                         <AccompagnyingSheetDocumentUpload
//                             concernedFile='accompanying_url'
//                             title='Accompanying'
//                         />
//                     </>
//                 )
//                 : <Text className='text-red-400 my-6 text-center'>
//                     please fill all the fields before generating the pdf.
//                 </Text>
//             }



//         </ScrollView>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flexGrow: 0,
//         overflow: 'scroll',
//     },
//     table: {
//         flexDirection: 'column',
//     },
//     headerRow: {
//         flexDirection: 'row',
//         backgroundColor: '#f0f0f0',
//     },
//     row: {
//         flexDirection: 'row',
//     },
//     headerCell: {
//         fontWeight: 'bold',
//     },
//     cell: {
//         padding: 10,
//         width: 120,
//         borderWidth: 1,
//         borderColor: '#ddd',
//     },
// });


// const receiptDisplay = (receipt: Receipt) => {

//     // console.log("\n\n individual receipt : ", receipt);
//     // const field = Object.keys(receiptInitialValues)[index]
//     return (
//         <View style={styles.row}>
//             <Text style={styles.cell}>{new Date(receipt.date).toLocaleDateString()}</Text>
//             {/* <Text style={styles.cell}>{receipt?.farmer_id}</Text> */}
//             <Text style={styles.cell}>{receipt?.farmer_name || receipt?.farmer?.farmer_name}</Text>
//             <Text style={styles.cell}>{receipt?.village || receipt?.farmer?.village}</Text>
//             <Text style={styles.cell}>{String(receipt?.market_id)}</Text>
//             <Text style={styles.cell}>
//                 <Text style={styles.cell}>lat:{receipt?.gpsLocation?.latitude}-</Text>
//                 <Text style={styles.cell}> long:{receipt?.gpsLocation?.longitude}</Text>
//             </Text>

//             {/* we ignore the signatures here */}
//             {/* <Text style={styles.cell}>{receipt.farmer_signature}</Text>
//             <Text style={styles.cell}>{receipt.agent_signature}</Text> */}
//             <Text style={styles.cell}>{receipt?.weight}</Text>
//             <Text style={styles.cell}>{receipt?.humidity}</Text>
//             <Text style={styles.cell}>{receipt?.refraction}</Text>
//             <Text style={styles.cell}>{receipt?.net_weight}</Text>

//             {/* <Text style={styles.cell}>{receipt.total_weight}</Text> */}
//             <Text style={styles.cell}>${receipt?.price_per_kg ?? 0}</Text>
//             <Text style={styles.cell}>${receipt?.total_price ?? 0}</Text>
//             <Text style={styles.cell}>{receipt?.agent_name}</Text>
//             <Text style={styles.cell}>{receipt?.currency}</Text>
//             <Text style={styles.cell}>{receipt?.product_name}</Text>
//             {/* <Text style={styles.cell}>{receipt.agent_name}</Text> */}
//         </View>
//     )
// };

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { styled } from 'nativewind';
import { DataTable } from 'react-native-paper';  // explore this deeply
import { Company, Receipt, ValidationErrors } from '@/interfaces/types';


import { useReceiptDataStore } from '@/store/receiptdata-store';
import {
    accompagnyingSheetMetaDataInitialValue,
    receiptInitialValues,
} from '@/constants/initial-values';
import { AccompanyingSheet } from "@/interfaces/types";

import PDFGenerator from './generatePDF-emailing';
import { accompanyingHtmlStructure, uploadAccompanyingSheetData, uploadToS3, validateField } from '@/lib/functions';

import { useMarketStore } from '@/store/current-market-store';
import AccompagnyingSheetDocumentUpload from './upload-accompanying-sheet';
import { useCompanyStore, useTransactionStore } from '@/store/current-company-store';
import { uploadResource } from '@/lib/api';
import { useNetInfo } from '@react-native-community/netinfo';


const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledButton = styled(TouchableOpacity);


export const renderTextField = (value: string | undefined, label: string) => (
    <StyledView className=" flex-row gap-3 ">
        <StyledText className="text-sm font-medium text-gray-900 ">{label}</StyledText>
        <StyledText className={`text-sm
             font-medium
              text-black-200
              ${label.toLowerCase().includes('market') ? 'text-gray-400 w-full' : ''}
              `}>{value || 'N/A'}</StyledText>
    </StyledView>
)

type ValidatableReceiptField = keyof Omit<AccompanyingSheet, 'id' | 'vehicleNumber' | 'driverName'>;

// Define required fields based on Receipt interface
const requiredFields: ValidatableReceiptField[] = [
    'numberOfBagsDeclared',
    'humidity',
    'declaredNetWeight',
    'marketNumber',
    'levelOfTraceability'
];

export const validateReceipt = (sheet: AccompanyingSheet) => {
    const newErrors: Record<string, string> = {};

    // Validate each required field
    requiredFields.forEach((field) => {
        if (field in sheet) {
            const error = validateField(field, sheet[field] as string | number);
            if (error) {
                newErrors[field] = error;
            }
        }
    });

    return newErrors;
};


export const AccompanyingSheetComponent: React.FC = () => {
    const [sheet, setSheet] = useState<Omit<AccompanyingSheet, 'vehicleNumber' | 'driverName'>>(accompagnyingSheetMetaDataInitialValue);

    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [errors, setErrors] = useState<ValidationErrors | any>({});
    const [showActionModal, setShowActionModal] = useState<boolean>(false);
    const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
    const [pdfGenerated, setPdfGenerated] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');

    // store market object
    const [marketData, setMarketData] = useState<any>({});

    const {
        getReceiptsData,
        clearReceiptsData
    } = useReceiptDataStore();

    const {
        getMarket
    } = useMarketStore();

    const {
        getCompany,
    } = useCompanyStore();

    const {   // save the transaction Id for later use in transmission sheet
        saveTransaction
    } = useTransactionStore();

    const [currentCompany, setCurrentCompany] = useState<Company>();
    const [isSaving, setIsSaving] = useState<boolean>(false);

    useEffect(() => {
        // fetch all the receipts based on their market number
        const allReceipts = getReceiptsData();
        setReceipts(allReceipts);

        // get the market object passed to store from parent market component
        const marketProps = getMarket()
        if (marketProps) {
            // setMarketData(JSON.parse(marketProps));
            setMarketData(marketProps);
            if (!sheet?.marketNumber)
                setSheet(prev => ({ ...prev, marketNumber: marketData?.market_number }))
        }

        // get the company object passed to store from parent company component
        const company = getCompany();
        console.log("\n\n company : ", company)
        if (company)
            setCurrentCompany(company);

    }, [sheet.marketNumber, getReceiptsData, getCompany]);

    const getGeneratedURL = useCallback((pdfUrl: string) => {
        if (pdfUrl) {
            console.log("\n\n pdf url: ", pdfUrl);
            setPdfGenerated(true);
            // setUploadToDB(true);

        }
    }, []);

    // get te upload status from te upload Accompanying sheet status
    const getUploadStatus = (status: string) => {
        if (status === 'completed') {
            checkBothOperationsCompleted()
        }
    }


    const handleInputChange = (field: keyof AccompanyingSheet, value: any) => {
        // Validate the field
        const error = validateField(field, value);
        setErrors((prev: ValidationErrors) => ({
            ...prev,
            [field]: error || ''
        }));

        setSheet(prev => ({ ...prev, [field]: value }));
    };

    const saveAnduploadData = async () => {
        setIsSaving(true);
        if (pdfGenerated || uploadSuccess) {
            setMessage('You cannot upload the same data twice.');
            setIsSaving(false);
            return;
        }

        const validationErrors = validateReceipt({ ...sheet } as any);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSaving(false);
            Alert.alert('Validation Error', `Please fix all errors before saving. ${Object.keys(validationErrors).join(', ')} are missing values `);
            return;
        }

        try {
            const dataToUpload = {
                level_of_traceability: sheet?.levelOfTraceability,
                humidity: Number(sheet?.humidity),
                net_weight: Number(sheet?.declaredNetWeight),
                date: new Date(Date.now()).toISOString(),
                market_number: marketData?.market_number,
                number_of_bags: Number(sheet?.numberOfBagsDeclared),
            };


            const result = await uploadAccompanyingSheetData(
                receipts, // receipt list
                dataToUpload,  // transaction
                currentCompany?.company_bucket as string
            );


            if (result?.success) {
                saveTransaction(result?.data); // save the result = { transactionId, failedReceipts, success, data }
                setUploadSuccess(true);

                if (result?.failedReceipts) {
                    Alert.alert(
                        'Partial Success',
                        `Upload completed with ${result?.failedReceipts.length} failed receipts. These will need to be retried.`,
                        // [
                        //     { text: 'OK', onPress: () => checkBothOperationsCompleted() }
                        // ]
                    );
                } else {
                    console.log("\n\n transaction id ", result?.transactionId);
                    Alert.alert(
                        'Success',
                        'Accompanying sheet and all receipts uploaded successfully',
                        // [
                        //     { text: 'OK', onPress: () => checkBothOperationsCompleted() }
                        // ]
                    );
                }
            } else {
                Alert.alert('Upload Failed', result?.error || 'Unknown error occurred');
            }

        } catch (error) {
            console.error('Failed to upload data:', error);
            Alert.alert('Failure', 'Failed to upload data to database');
        } finally {
            setIsSaving(false);
        }
    };

    const checkBothOperationsCompleted = () => {
        if (uploadSuccess && pdfGenerated) {
            setShowActionModal(true);
        }
    };

    const handleKeepReceipts = () => {
        setShowActionModal(false);
        // Keep the receipts - do nothing, just close the modal
    };

    const handleDeleteReceipts = () => {
        clearReceiptsData(); // Clear receipts from the store
        setReceipts([]); // Clear receipts in the local state
        setShowActionModal(false);
        Alert.alert('Receipts Deleted', 'All receipts have been cleared successfully');
    };

    const renderInputField = (field: keyof typeof accompagnyingSheetMetaDataInitialValue, label: string, placeholder: string) => (
        <StyledView className="my-1 w-full flex-row flex-wrap items-center">
            <StyledText className="text-sm font-medium text-gray-700">{label}: &nbsp; <Text className="text-red-500">*</Text></StyledText>
            <StyledTextInput
                className={` w-[97%] p-2 border  rounded-md bg-white flex-1 ${errors['farmer_contact'] ? 'border-red-500' : 'border-gray-200'
                    }`}
                placeholder={placeholder}
                placeholderTextColor=""
                value={String(sheet[field])}
                onChangeText={(value) => {
                    handleInputChange(field, value);
                    validateAndUpdateField(field, value);
                }}
            />
        </StyledView>
    );


    const validateAndUpdateField = (field: string, value: string) => {
        const error = validateField(field, value);
        setErrors((prev: ValidationErrors) => ({
            ...prev,
            [field]: error || ''
        }));
        return !error;
    };

    return (
        <ScrollView
            className="p-4 pb-10"
        >
            <StyledView className="flex-row flex-wrap justify-between ">
                {renderTextField(String(marketData?.market_number), 'Market number:')}
            </StyledView>

            <View className=" my-4  justify-center items-center ">
                <View className="h-0.5 w-[90%] bg-gray-300  " />
            </View>

            <StyledView className="flex-row flex-wrap justify-between">
                {renderInputField('numberOfBagsDeclared', 'Number of bags ', 'Enter the num of bags')}
                {renderInputField('declaredNetWeight', 'Declared weight (Ton)', 'Enter the declared weight')}
            </StyledView>

            <View className=" my-4  justify-center items-center ">
                <View className="h-0.5 w-[90%] bg-gray-300  " />
            </View>

            <StyledView className="flex-row flex-wrap justify-between">
                {renderInputField('levelOfTraceability', 'Level of Traceability', 'Enter Level of Traceability')}
                {renderInputField('humidity', 'Humidity (%)', 'Enter humidity percentage')}
            </StyledView>

            <View className=" my-4  justify-center items-center ">
                <View className="h-0.5 w-[90%] bg-gray-300  " />
            </View>

            <StyledText className="text-lg font-bold mt-4 mb-2">
                Receipts
            </StyledText>

            <ScrollView horizontal={true} style={styles.container}>
                <View style={styles.table}>
                    {/* set table header */}
                    <View style={styles.headerRow}>
                        {Object.keys(receiptInitialValues)?.map((field, index) => {
                            // ignore the signatures and photo in the receit list.
                            if (field.includes('signature') || field.includes('salePhotoUrl') || field.includes('farmer_id')) return;
                            return (
                                <Text key={index} style={[styles.headerCell, styles.cell]}>{field}</Text>
                            )
                        })}
                    </View>
                    {/* set table rows */}
                    {receipts.map((receipt: Receipt, index) => {
                        return (
                            <View key={index} >
                                {receiptDisplay(receipt)}
                            </View>
                        )
                    })}
                </View>
            </ScrollView>
            {/* <Text className='text-green-600'>
                <Text className='text-blue-700 underline'>NB:</Text>
                generate the pdf file first before uploading it to database
            </Text> */}

            {/* upload to database */}
            <StyledButton
                className="bg-black-200  p-2 rounded-md my-1 mt-4"
                onPress={saveAnduploadData}

            >
                <StyledText className="text-white text-center font-bold">
                    1. {isSaving && <ActivityIndicator size="small" color="white" />}
                    Upload all data</StyledText>
            </StyledButton>
            {message && <Text className='text-red-400 my-6 text-center'>{message}</Text>}
            {/* generate accomanying sheet pdf */}
            {!!sheet?.declaredNetWeight && !!sheet?.levelOfTraceability && !!sheet?.numberOfBagsDeclared && !!sheet?.humidity
                ? (
                    <>
                        <PDFGenerator
                            company_logo={marketData?.company_logo}
                            sheet={sheet as AccompanyingSheet}
                            receipts={receipts}
                            fileName="AccompanyingSheet"
                            htmlHandler={accompanyingHtmlStructure as (sheet: AccompanyingSheet, receipts: Receipt[]) => string}
                            company_name={marketData?.company_name}
                            bucket_name={currentCompany?.company_bucket}
                            getGeneratedURL={getGeneratedURL}

                        />
                        <View className=" my-4  justify-center items-center ">
                            <View className="h-0.5 w-[90%] bg-gray-300  " />
                        </View>

                    </>
                )
                : <Text className='text-red-400 my-6 text-center'>
                    {/* please fill all the fields before generating the pdf. */}

                </Text>
            }
            {pdfGenerated && <AccompagnyingSheetDocumentUpload
                concernedFile='accompanying_url'
                title='Accompanying'
                getUploadStatus={getUploadStatus}
            />}
            {/* Modal for choosing to keep or delete receipts */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showActionModal}
                onRequestClose={() => setShowActionModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Success!</Text>
                        <Text style={styles.modalText}>
                            All data has been uploaded and PDF has been generated.
                            Would you like to keep or delete the receipts list?
                        </Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.deleteButton]}
                                onPress={handleDeleteReceipts}
                            >
                                <Text style={styles.buttonText}>Delete Receipts</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.keepButton]}
                                onPress={handleKeepReceipts}
                            >
                                <Text style={styles.buttonText}>Keep Receipts</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 0,
        overflow: 'scroll',
    },
    table: {
        flexDirection: 'column',
    },
    headerRow: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
    },
    row: {
        flexDirection: 'row',
    },
    headerCell: {
        fontWeight: 'bold',
    },
    cell: {
        padding: 10,
        width: 120,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    modalText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    modalButton: {
        padding: 10,
        borderRadius: 5,
        minWidth: 120,
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: '#ff6b6b',
    },
    keepButton: {
        backgroundColor: '#4dabf7',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    }
});


const receiptDisplay = (receipt: Receipt) => {
    return (
        <View style={styles.row}>
            <Text style={styles.cell}>{new Date(receipt.date).toLocaleDateString()}</Text>
            <Text style={styles.cell}>{receipt?.farmer_name || receipt?.farmer?.farmer_name}</Text>
            <Text style={styles.cell}>{receipt?.village || receipt?.farmer?.village}</Text>
            <Text style={styles.cell}>{String(receipt?.market_id)}</Text>
            <Text style={styles.cell}>
                <Text style={styles.cell}>lat:{receipt?.gpsLocation?.latitude}-</Text>
                <Text style={styles.cell}> long:{receipt?.gpsLocation?.longitude}</Text>
            </Text>
            <Text style={styles.cell}>{receipt?.weight}</Text>
            <Text style={styles.cell}>{receipt?.humidity}</Text>
            <Text style={styles.cell}>{receipt?.refraction}</Text>
            <Text style={styles.cell}>{receipt?.net_weight}</Text>
            <Text style={styles.cell}>${receipt?.price_per_kg ?? 0}</Text>
            <Text style={styles.cell}>${receipt?.total_price ?? 0}</Text>
            <Text style={styles.cell}>{receipt?.agent_name}</Text>
            <Text style={styles.cell}>{receipt?.currency}</Text>
            <Text style={styles.cell}>{receipt?.product_name}</Text>
        </View>
    )
};