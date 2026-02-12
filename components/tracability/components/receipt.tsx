


import React, { useState, useEffect, memo, useRef, useCallback, useMemo } from 'react';
import {
    View, Text, TextInput,
    Button, Image, ScrollView, TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import { styled } from 'nativewind';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Receipt, Farmer, Coordinates, Company, Market, ReceiptProps, ValidationErrors } from '@/interfaces/types';
import { receiptInitialValues } from '@/constants/initial-values';
import {
    calculateNetWeight, calculateTotalPrice, contentHtmlForReceipt,
    ERROR_MESSAGES, validateField, VALIDATION_PATTERNS
} from '@/lib/functions';
import SignatureInput from '../../global/signatures/signature-capture';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReceiptDataStore } from '@/store/receiptdata-store';
import Dropdown from '@/components/global/dropdown';

import { useFarmerStore } from '@/store/farmer-person-store';
import { Ionicons } from '@expo/vector-icons';
import ReceiptPdfPrint from './generate-receiptpdf-for-print';
import { newFarmerRegistration } from '@/store/mmkv-store';
import { useMarketStore } from '@/store/current-market-store';
import { useCompanyStore } from '@/store/current-company-store';
import { cn } from '@/lib/utils';


const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledButton = styled(TouchableOpacity);

type ValidatableReceiptField = keyof Omit<Receipt, 'id' | 'date' | 'time' | 'gpsLocation' | 'farmer'>;

// Add conversion rates (as of February 2025)
const CONVERSION_RATES = {
    XAF: 1, // Base currency
    USD: 0.00166, // 1 XAF = 0.00166 USD
    EUR: 0.00152, // 1 XAF = 0.00152 EUR
    NGN: 1.53, // 1 XAF = 1.53 NGN
};

// type ValidationErrors = Partial<Record<ValidatableReceiptField, string>>;

// Define required fields based on Receipt interface
const requiredFields: ValidatableReceiptField[] = [
    'agent_name',
    'weight',
    'humidity',
    'refraction',
    // 'farmer_name',  // there is no need for farmer name in the receipt, we just display the name for the sake of visual, behind we are using the farmer ID
    // 'village',       // no need of the village for validation also, since the market location, farmer village are considered
    'farmer_signature',
    'agent_signature',

];

export const validateReceipt = (receipt: Receipt) => {
    const newErrors: Record<string, string> = {};

    // Validate each required field
    requiredFields.forEach((field) => {
        if (field in receipt) {
            const error = validateField(field, receipt[field] as string | number);
            if (error) {
                newErrors[field] = error;
            }
        }
    });

    // Special validation for farmer object if present
    if (receipt.farmer) {
        if (!receipt.farmer.farmer_contact || !VALIDATION_PATTERNS.PHONE.test(receipt.farmer.farmer_contact)) {
            newErrors.farmer_id = ERROR_MESSAGES.PHONE;
        }
        if (!receipt.farmer.farmer_ID_card_number ||
            !VALIDATION_PATTERNS.ID_CARD.test(receipt.farmer.farmer_ID_card_number)) {
            newErrors.farmer_id = ERROR_MESSAGES.ID_CARD;
        }
    }

    return newErrors;
};


// Available currencies
const CURRENCIES = [
    { label: 'XAF (FCFA)', value: 'XAF' },
    { label: 'USD ($)', value: 'USD' },
    { label: 'EUR (€)', value: 'EUR' },
    // { label: 'NGN (₦)', value: 'NGN' },
];


// render label and value
export const renderTextField = (value: string | undefined, label: string, option?: string) => {

    if (label.includes('Total Price'))
        value = `${option} ${value}`;
    return (
        <StyledView className=" flex-row gap-3 items-center pr-5">
            {!!label && <StyledText className="text-sm font-medium text-gray-900  ">{label}</StyledText>}
            {!!value && <StyledText className={`p-3 border 
            border-gray-200 rounded-md
             bg-white ${label.toLowerCase().includes('per') ? ' w-[59.5%]' :
                    label.toLowerCase().includes('name') ? 'w-[66.9%]' : 'w-[65%]'} text-gray-400`}>{value || 'undefined'}</StyledText>}
        </StyledView>
    )

}
const ReceiptComponent: React.FC<ReceiptProps> = () => {
    const [receipt, setReceipt] = useState(receiptInitialValues || {});
    const [photo, setPhoto] = useState('');
    const [emptyCanvas, setEmptyCanvas] = useState(false);
    // const [receiptData, setReceiptData] = useState<Receipt[]>([]);
    const [farmerList, setFarmerList] = useState<Farmer[]>([]);
    const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
    const mounted = useRef(false); // to fetch data on.y when the component mounts
    const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
    const [location, setLocation] = useState<{ longitude: number, latitude: number }>()
    const [newFarmer, setNewFarmer] = useState<Farmer & {
        inspector_contact: string,
        location?: string
    }>({
        farmer_contact: '',
        farmer_ID_card_number: '',
        farmer_name: '',
        village: '',
        inspector_contact: '',

    });
    const [createNewFarmer, setCreateNewFarmer] = useState(false);
    const [loadingPhoto, setLoadinloadingPhoto] = useState(false);

    const [errors, setErrors] = useState<ValidationErrors | any>({});
    const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);


    // store market object
    const [marketData, setMarketData] = useState<Market>();
    // call the mmkv store for receipt
    const {
        saveReceiptsData,
        getReceiptsData
    } = useReceiptDataStore();

    // get farmer saved in the market component
    const { getFarmers } = useFarmerStore();

    // call stored market made from market component
    const {
        getMarket
    } = useMarketStore();

    const {
        getCompany,
    } = useCompanyStore();

    const [currentCompany, setCurrentCompany] = useState<Company>();
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        mounted.current = true;
        (
            async () => {

                let { status, } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.error('Permission to access location was denied');
                    return;
                }

                const location = await Location.getCurrentPositionAsync({});
                setLocation({
                    longitude: +location.coords.longitude,
                    latitude: +location.coords.latitude
                });
            }
        )()

        // get the market object passed to store from parent market component
        // const marketProps = storeCurrentMarketData.getString('market-data')!
        const marketProps = getMarket()
        if (marketProps) {
            // setMarketData(JSON.parse(marketProps))
            setMarketData(marketProps)
        }

        // add markt_id to receipt market number
        if (marketProps?.market_number)
            setReceipt({
                ...receiptInitialValues,
                market_number: marketProps?.market_number,
                product_name: marketData?.type_of_market as string
            })


        // get previously saved farmers done in market component. 
        // they are potentially fetched by locations.
        const farmerPrevSaved = getFarmers();
        console.log('��� ~ farmerPrevSaved:', farmerPrevSaved);

        if (farmerPrevSaved)
            setFarmerList(farmerPrevSaved);

        //init the receipt by the current date.

        setReceipt((prev: any) => ({
            ...prev,
            date: new Date(Date.now()).toISOString(),
            // time: now.toLocaleTimeString(),
            // id: prev.id || `REC-${now.getTime()}`
        }));

        const company = getCompany();
        console.log("\n\n company : ", company)
        if (company)
            setCurrentCompany(company);

        const reset = newFarmerRegistration.getString("new-registration");

        console.log("\n resetForm 1 : ", reset);
        if (emptyCanvas) {
            resetReceipt()
        }

        return () => {
            mounted.current = false
        }

    }, []);

    // reset the receipt
    const resetReceipt = () => {
        setReceipt(receiptInitialValues);
        setPhoto('');
        setSelectedFarmer(null);
        // empty the signature canvas
        setEmptyCanvas(true);
        setNewFarmer({
            farmer_contact: '',
            farmer_ID_card_number: '',
            farmer_name: '',
            village: '',
            inspector_contact: '',
        });
    }

    const validateAndUpdateField = (field: string, value: string) => {
        const error = validateField(field, value);
        setErrors((prev: ValidationErrors) => ({
            ...prev,
            [field]: error || ''
        }));
        return !error;
    };


    const handleInputChange = useCallback((field: keyof typeof receiptInitialValues, value: any) => {
        // Validate the field
        const error = validateField(field, value);
        setErrors((prev: ValidationErrors) => ({
            ...prev,
            [field]: error || ''
        }));

        setReceipt(prev => {
            const updated = { ...prev, [field]: value };

            // Only update calculations if there are no validation errors
            if (!error && ['weight', 'humidity', 'refraction', 'price_per_kg'].includes(field)) {
                if (VALIDATION_PATTERNS.NUMERIC.test(value)) {
                    updated.net_weight = calculateNetWeight(+updated.weight, +updated.humidity, +updated.refraction);

                    // Calculate total price in XAF first
                    const priceInXAF = calculateTotalPrice(+updated.net_weight, marketData?.price_of_day!);

                    // Convert to selected currency if not XAF
                    updated.total_price = selectedCurrency.value === 'XAF'
                        ? priceInXAF
                        : convertCurrency(priceInXAF, 'XAF', selectedCurrency.value as "XAF" | "USD" | "EUR" | "NGN");
                }
            }

            return {
                ...updated,
                total_price: Number(updated?.total_price?.toFixed(2)),
                net_weight: Number(updated?.net_weight?.toFixed(2)),
                currency: selectedCurrency.value,
            };
        });
    }, [calculateNetWeight, calculateTotalPrice, setReceipt, selectedCurrency, marketData]);


    const handlePhotoCapture = useCallback(async () => {
        setLoadinloadingPhoto(true);
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                const { uri } = result.assets[0];

                // setPhoto(uploadedUrl);
                setPhoto(uri);
                // these two line are totology : means same thing.
                setReceipt(prev => ({
                    ...prev,
                    salePhotoUrl: uri,
                }));
            }
        } catch (error) {
            console.error(`Error capturing photo: ${error}`);
        } finally {
            setLoadinloadingPhoto(false)
        }

    }, [setPhoto, location, setReceipt, ImagePicker]);

    const handleSaveSignature = async (uri: any, author: "sender" | "carrier" | "ministry" | "agent_" | "farmer_") => {
        try {
            console.log("handle signature: ", uri, "author: ", author);

            handleSignature(author, uri);
        } catch (err) {
            console.error(` Failed to sign ${author} signature: ${err}`);
        }
    };


    const handleSignature = useCallback((type: "none" | "sender" | "carrier" | "ministry" | "agent_" | "farmer_", signature: string) => {
        setReceipt(prev => ({
            ...prev,
            [`${type}signature`]: signature,
        }));
        setEmptyCanvas(true);
    }, [setReceipt, setEmptyCanvas]);


    // save the receipt data to local store.
    const handleSave = async () => {
        setIsSaving(true);

        const validationErrors = validateReceipt({ ...receipt, ...newFarmer } as any);
        console.log("\n\nvalidationErrors: ", validationErrors);
        console.log("\n\n receipt: ", receipt);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsSaving(false);
            Alert.alert('Validation Error', 'Please fix all errors before saving.');
            return;
        }


        if (!receipt?.agent_signature || !receipt?.farmer_signature) {
            setIsSaving(false);
            Alert.alert('Error', 'Please sign the receipt');
            return 'false';
        }

        try {
            /**
             * the objectie here is to make all the payment offline.
             */
            let receiptValues: any = {};

            if (selectedFarmer?.farmer_id) {
                const { farmer_name, market_number, ...rest } = receipt;
                receiptValues = {
                    ...rest as unknown as Receipt,
                    agent_signature: receipt?.agent_signature,
                    farmer_signature: receipt?.farmer_signature,
                    farmer_id: selectedFarmer?.farmer_id as string,
                    price_per_kg: marketData?.price_of_day,
                    market_id: marketData?.market_number,
                    product_name: marketData?.type_of_market ?? receipt.
                        product_name,
                    gpsLocation: location as Coordinates,
                    salePhotoUrl: [photo],
                    weight: String(receipt?.weight),
                    humidity: String(receipt?.humidity),
                    refraction: String(receipt?.refraction),
                    village: marketData?.location || selectedFarmer?.village
                }
            } else // in this case the farmer doesn't yet exist in the system or on this location(council).
            {
                const { farmer_id, village, farmer_name, market_number, ...rest } = receipt;
                receiptValues = {
                    ...rest as unknown as Receipt,
                    // agent_signature: aSign,
                    // farmer_signature: fSign,
                    agent_signature: receipt?.agent_signature,
                    farmer_signature: receipt?.farmer_signature,
                    price_per_kg: marketData?.price_of_day,
                    market_id: marketData?.market_number,   // we use market_id in the database instead of market_number which is the one in the form
                    product_name: marketData?.type_of_market ?? receipt.product_name,
                    gpsLocation: location as Coordinates,
                    salePhotoUrl: [receipt?.salePhotoUrl],
                    weight: String(receipt?.weight),
                    humidity: String(receipt?.humidity),
                    refraction: String(receipt?.refraction),
                    village: marketData?.location || selectedFarmer?.village || newFarmer?.village,
                    farmer: { // this farmer will be created in the DB via the server.
                        farmer_name: newFarmer?.farmer_name as string,
                        village: newFarmer?.village,
                        farmer_contact: newFarmer?.farmer_contact,
                        farmer_ID_card_number: newFarmer?.farmer_ID_card_number,
                        inspector_contact: newFarmer?.inspector_contact,
                        location: marketData?.location ?? ""
                    },
                }
            }

            console.log("current receipt: ", receiptValues)

            /**
             * we should be able to save a receip to local draft and offline.
             * we already used farmer_id and market_id, we no longer need farmer_name and market_number
             * 
             */

            const { farmer_name, market_number, ...rest } = receiptValues;


            // reconstruct the receipt object for printing
            const receiptToPrint = {
                ...rest,
                farmer_id: receiptValues?.farmer_id ?? "",
                farmer_name: receiptValues?.farmer_name ?? receiptValues?.farmer?.farmer_name,
                village: receiptValues?.village ?? receiptValues?.farmer?.village
            };


            // save the form to the store by appending existing receipt list.
            // check if this receipt is already saved

            const data = [...getReceiptsData(), receiptValues]
            saveReceiptsData(data);
            setCurrentReceipt(receiptToPrint);
            Alert.alert('Success', 'Receipt saved successfully to accompanying sheet!');
            setReceipt(receiptInitialValues);
            setEmptyCanvas(true);
        } catch (error) {
            console.error(`Error uploading receipt data: \n\n ${error}`);
            Alert.alert('Failure', 'Failed to save to accompanying sheet!');
        } finally {
            setIsSaving(false);
        }
    };

    // Render error message
    const renderError = (error?: string) => {
        if (!error) return null;
        return (
            <Text className="text-red-500 text-sm mt-1">{error}</Text>
        );
    };

    const convertCurrency = (
        amount: number,
        fromCurrency: keyof typeof CONVERSION_RATES,
        toCurrency: keyof typeof CONVERSION_RATES
    ): number => {
        // First convert to XAF if not already in XAF
        const amountInXAF = fromCurrency === 'XAF'
            ? amount
            : amount / CONVERSION_RATES[fromCurrency];

        // Then convert from XAF to target currency
        const convertedAmount = amountInXAF * CONVERSION_RATES[toCurrency];

        // Round to 2 decimal places
        return Number(convertedAmount.toFixed(2));
    };

    // Currency selector component
    // const renderCurrencySelector = () => (
    //     <StyledView className="my-4">
    //         <StyledText className="text-sm font-medium text-gray-700 mb-2">Select Currency:</StyledText>
    //         <View className="flex-row flex-wrap gap-2">
    //             {CURRENCIES.map((currency) => (
    //                 <TouchableOpacity
    //                     key={currency.value}
    //                     onPress={() => {
    //                         setSelectedCurrency(currency);
    //                         handleInputChange('currency', currency.value);
    //                     }}
    //                     className={cn("px-2 py-1 rounded-md", {
    //                         'bg-blue-500': selectedCurrency.value === currency.value,
    //                         'bg-gray-200': selectedCurrency.value !== currency.value,
    //                     })}
    //                 >
    //                     <Text className={cn("text-sm", {
    //                         'text-white': selectedCurrency.value === currency.value,
    //                         'text-gray-700': selectedCurrency.value !== currency.value,
    //                     })}>
    //                         {currency.label}
    //                     </Text>
    //                 </TouchableOpacity>
    //             ))}
    //         </View>
    //     </StyledView>
    // );
    const renderCurrencySelector = () => {
        const currentAmount = receipt.total_price;

        return (
            <StyledView className="my-4">
                <StyledText className="text-sm font-medium text-gray-700 mb-2">
                    Select Currency:
                </StyledText>
                <View className="flex-row flex-wrap gap-2">
                    {CURRENCIES.map((currency) => {
                        const convertedAmount = convertCurrency(
                            currentAmount,
                            selectedCurrency.value as "XAF" | "USD" | "EUR",
                            currency.value as "XAF" | "USD" | "EUR"
                        );

                        return (
                            <TouchableOpacity
                                key={currency.value}
                                onPress={() => {
                                    const newAmount = convertCurrency(
                                        receipt.total_price,
                                        selectedCurrency.value as "XAF" | "USD" | "EUR",
                                        currency.value as "XAF" | "USD" | "EUR"
                                    );
                                    setSelectedCurrency(currency);
                                    setReceipt(prev => ({
                                        ...prev,
                                        currency: currency.value,
                                        total_price: newAmount
                                    }));
                                }}
                                className={cn("px-4 py-2 rounded-md", {
                                    'bg-blue-500': selectedCurrency.value === currency.value,
                                    'bg-gray-200': selectedCurrency.value !== currency.value,
                                })}
                            >
                                <View className="items-center">
                                    <Text className={cn("text-sm", {
                                        'text-white': selectedCurrency.value === currency.value,
                                        'text-gray-700': selectedCurrency.value !== currency.value,
                                    })}>
                                        {currency.label}
                                    </Text>
                                    {/* <Text className={cn("text-xs mt-1", {
                                        'text-white': selectedCurrency.value === currency.value,
                                        'text-gray-500': selectedCurrency.value !== currency.value,
                                    })}>
                                        {convertedAmount.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </Text> */}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </StyledView>
        );
    };

    // get the selected farmer from the dropdown list
    const getCurrentFarmerFromTheList = useCallback((selectedFarmerr: Farmer) => {
        if (selectedFarmerr) {
            setSelectedFarmer(selectedFarmerr);
            setReceipt(prev => ({
                ...prev,
                farmer_id: selectedFarmerr.farmer_id as string,
                farmer_name: selectedFarmerr.farmer_name,
                village: selectedFarmerr?.village as string,
            }))
        }
    }, [setSelectedFarmer, setReceipt]);

    const resetForm = () => {
        resetReceipt();
    };

    // Modified renderInputField to include error display
    const renderInputField = (field: keyof typeof receiptInitialValues, label: string, placeholder: string) => (
        <StyledView className="my-1 w-full">
            <StyledView className="flex-row flex-wrap items-center">
                <StyledText className="text-sm font-medium text-gray-700">{label}: &nbsp;</StyledText>
                <StyledTextInput
                    className={cn("p-2 border rounded-md bg-white flex-1", {
                        'border-red-500': errors[field],
                        'border-gray-200': !errors[field]
                    })}
                    placeholder={placeholder}
                    placeholderTextColor=""
                    value={receipt[field] === 'net_weight'
                        ? String(receipt.net_weight)
                        : receipt[field] === 'total_price'
                            ? String(receipt.total_price)
                            : receipt[field] as string}
                    onChangeText={(value) => {
                        handleInputChange(field, value);
                        validateAndUpdateField(field, value);
                    }}
                    keyboardType={`${(label.toLowerCase().includes('weight')
                        || label.toLowerCase().includes('humidity')
                        || label.toLowerCase().includes('refaction')
                        || label.toLowerCase().includes('price_per_kg'))
                        ? 'numeric' : 'default'}`
                    }
                />
            </StyledView>
            {renderError(errors[field])}
        </StyledView>
    );

    console.log("create new farmer ?: " + createNewFarmer)
    // console.log(" new receipt ?: ", receipt);

    return (
        <SafeAreaView className="h-full flex-1">
            <View className="px-4">
                <View className="mb-4 flex-row flex-wrap justify-between">
                    <TouchableOpacity
                        onPress={() => setCreateNewFarmer(!createNewFarmer)}
                        className={cn('bg-black-200  p-1 rounded ', {
                            'bg-gray-300': !farmerList.length,

                        })}
                        disabled={!farmerList.length}
                    >
                        <Text className='text-white text-center'>create new farmer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => resetForm()}
                        className={'bg-black-200  p-1 rounded'}
                    >
                        <Text className='text-white text-center'>
                            <Ionicons name="refresh-outline" size={24} color="white" />
                        </Text>
                    </TouchableOpacity>
                </View>
                {!!farmerList.length && <StyledView className="flex-row flex-wrap justify-between z-20 w-full bg-gray-50 border border-gray-200 rounded-md p-2 mb-2">
                    {/* {renderInputField('farmer_id', 'Farmer Name', 'Enter farmer name')} */}
                    <Dropdown
                        items={farmerList}
                        placeholder='Select farmer'
                        onChange={getCurrentFarmerFromTheList} // get the currentFarmer from the list
                        setCreateNewFarmer={setCreateNewFarmer}
                    />
                </StyledView>}

            </View>
            <ScrollView className="px-4">

                {/*Market section. we fill the market number and the product name automatically. */}
                <StyledView className="flex-row flex-wrap justify-between">

                    {renderTextField(String(marketData?.market_number), 'Market number:')}
                    {/* if the market is not set, we give the possibility to add a new market */}
                    {!marketData?.type_of_market && renderInputField('product_name', 'Product Name', 'Enter product name')}
                    {/* if the market is set , we just display it */}
                    {marketData?.type_of_market && renderTextField(String(marketData?.type_of_market), 'Product Name:')}
                    {renderTextField(String(marketData?.price_of_day), 'Price per kg (XAF):')}
                </StyledView>

                {/*Farmer section. if there are farmers, we show the input fields that are auto filled by selecting the farmer. */}
                {(!!farmerList.length && !createNewFarmer) ?
                    <View className="flex gap-2  mt-4 justify-between">
                        <View className=" my-4  justify-center items-center ">
                            <View className="h-0.5 w-[90%] bg-gray-300  " />
                        </View>
                        <Text className="text-sm font-medium text-gray-700 ">{"farmer name"}</Text>
                        <TextInput
                            className=" w-[98%] p-2 border border-gray-200 rounded-md bg-white flex-1 "
                            onChangeText={(data) => setReceipt({ ...receipt, farmer_name: data })}
                            defaultValue={receipt.farmer_name as string}
                            placeholder='Select the famer (name) from dropdown above'
                        />
                        <Text className="text-sm font-medium text-gray-700 ">{"farmer Village"}</Text>
                        <TextInput
                            className=" p-2 border border-gray-200 rounded-md bg-white flex-1 "
                            onChangeText={(data) => setReceipt({ ...receipt, village: data })}
                            defaultValue={receipt.village as string}
                            placeholder='Select the famer (village) from dropdown above'
                        />
                        {/* we create new  farmer if the result of the search is empty */}

                    </View>
                    :
                    (
                        <StyledView className="flex gap-2 flex-wrap justify-between mt-4">
                            <View className=" my-4  justify-center items-center ">
                                <View className="h-0.5 w-[90%] bg-gray-300  " />
                            </View>
                            <Text className="text-sm font-medium text-gray-700 ">{"farmer name"}</Text>
                            <TextInput
                                className={` w-[97%] p-2 border  rounded-md bg-white flex-1 ${errors['farmer_name'] ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                onChangeText={(name: string) => {
                                    setNewFarmer({ ...newFarmer, farmer_name: name });
                                    validateAndUpdateField('farmer_name', name);
                                }}
                                defaultValue={newFarmer.farmer_name}
                                placeholder='farmer name'
                            />
                            <Text className="text-sm font-medium text-gray-700 ">{"farmer Village"}</Text>
                            <TextInput
                                className={` w-[97%] p-2 border  rounded-md bg-white flex-1 ${errors['village'] ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                onChangeText={(vilag) => {
                                    setNewFarmer({ ...newFarmer, village: vilag });
                                    validateAndUpdateField('village', vilag);
                                }}
                                defaultValue={newFarmer.village}
                                placeholder='farmer Village'
                            />
                            <Text className="text-sm font-medium text-gray-700 ">{"farmer contact"}</Text>
                            <TextInput
                                className={` w-[97%] p-2 border  rounded-md bg-white flex-1 ${errors['farmer_contact'] ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                onChangeText={(contact) => {
                                    setNewFarmer({ ...newFarmer, farmer_contact: contact });
                                    validateAndUpdateField('farmer_contact', contact);
                                }}
                                defaultValue={newFarmer.farmer_contact}
                                placeholder='farmer contact'
                            />
                            <Text className="text-sm font-medium text-gray-700 ">{"farmer ID card Number"}</Text>
                            <TextInput
                                className={` w-[97%] p-2 border  rounded-md bg-white flex-1 ${errors['farmer_ID_card_number'] ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                onChangeText={(idcardN) => {
                                    setNewFarmer({ ...newFarmer, farmer_ID_card_number: idcardN });
                                    validateAndUpdateField('farmer_ID_card_number', idcardN);
                                }}
                                defaultValue={newFarmer.farmer_ID_card_number}
                                placeholder='farmer ID card Number'
                            />
                        </StyledView>
                    )
                }


                <View className=" my-4  justify-center items-center ">
                    <View className="h-0.5 w-[90%] bg-gray-300  " />
                </View>

                <StyledView className="flex-row flex-wrap justify-between">
                    {renderInputField('agent_name', 'Agent name', 'Enter agent name')}
                </StyledView>

                {(!farmerList.length || createNewFarmer) && <StyledView>
                    <Text className="text-sm font-medium text-gray-700 ">{"Agent contact"}</Text>
                    <TextInput
                        className={` w-[97%] p-2 border  rounded-md bg-white flex-1 ${errors['collector_name'] ? 'border-red-500' : 'border-gray-200'
                            }`}
                        onChangeText={(text) => {
                            setNewFarmer({ ...newFarmer, inspector_contact: text });
                            validateAndUpdateField('collector_name', text);
                        }}
                        defaultValue={newFarmer.inspector_contact}
                        placeholder='Agent contact'
                    />
                </StyledView>}

                <View className=" my-4  justify-center items-center ">
                    <View className="h-0.5 w-[90%] bg-gray-300  " />
                </View>


                <StyledView className="flex-row flex-wrap justify-between">
                    {renderInputField('weight', 'Weight (kg)', 'Enter weight')}
                    {renderInputField('humidity', 'Humidity (%)', 'Enter humidity')}
                    {renderInputField('refraction', 'Refaction (%)', 'Enter refraction')}
                </StyledView>
                <View className=" my-4  justify-center items-center ">
                    <View className="h-0.5 w-[90%] bg-gray-300  " />
                </View>

                <StyledView className="flex-row flex-wrap justify-between">
                    {/* {renderInputField('price_per_kg', 'Price per kg', 'Enter price per kg')} */}

                    {renderTextField(String(receipt.net_weight), 'Net Weight (kg):')}
                </StyledView>

                <View className=" my-4  justify-center items-center ">
                    <View className="h-0.5 w-[90%] bg-gray-300  " />
                </View>

                {/* Add currency selector before total price */}
                {renderCurrencySelector()}

                <StyledView className="flex-row flex-wrap justify-between">
                    {/* {renderInputField('currency', 'Currency', 'Enter currency ')} */}

                    {renderTextField(String(receipt.total_price), 'Total Price :', receipt.currency)}
                </StyledView>

                <View className=" my-4  justify-center items-center ">
                    <View className="h-0.5 w-[90%] bg-gray-300  " />
                </View>
                <StyledButton
                    className="bg-black-200  p-3 rounded-md mt-4"
                    onPress={handlePhotoCapture}
                >
                    {loadingPhoto ? <ActivityIndicator size="small" color="white" /> : <StyledText className="text-white text-center ">
                        Capture Photo
                    </StyledText>}
                </StyledButton>

                {(photo || receipt?.salePhotoUrl) && (
                    <View className=' relative'>
                        <Image
                            source={{ uri: photo || receipt?.salePhotoUrl }}
                            className='w-full h-[200px] mt-3'
                            resizeMode='cover'
                        />
                        <View className='absolute bottom-10 right-10 translate-y-7'>
                            {location ? <Text className='text-white'>GPS-Coords: {location?.latitude || receipt?.gpsLocation.latitude}, {location?.longitude || receipt?.gpsLocation.longitude} </Text> : null}
                        </View>
                    </View>
                )}

                <View className='space-y-4 '>
                    <SignatureInput
                        onSignature={handleSaveSignature}
                        label='Farmer Signature'
                        author='farmer_'
                        emptyCanvas={emptyCanvas}
                        className='flex-1, justify-center items-center px-[20px]'
                    />
                    <SignatureInput
                        onSignature={handleSaveSignature}
                        label='Agent Signature'
                        author='agent_'
                        emptyCanvas={emptyCanvas}
                        className='flex-1, justify-center items-center px-[20px]'
                    />

                </View>


                <StyledButton
                    className="bg-black-200  p-3 rounded-md my-6"
                    onPress={handleSave}
                >
                    {isSaving ? (<View className='flex-row justify-center gap-1 items-center'>
                        <ActivityIndicator size="small" color="white" />
                        <StyledText className="text-white text-center ">
                            Saving ...
                        </StyledText>
                    </View>) : <StyledText className="text-white text-center font-bold">1. Save Receipt</StyledText>
                    }
                </StyledButton>
                {/* generate receipt pdf */}
                {/* <GPdfEmailing receipts={receiptData} /> */}
                {(!!receipt?.farmer_signature && !!receipt?.agent_signature) && currentReceipt && <ReceiptPdfPrint
                    values={receipt?.farmer_id ? {
                        ...receipt,
                        market_number: marketData?.market_number,
                        product_name: marketData?.type_of_market ?? receipt.product_name,
                        gpsLocation: location as Coordinates,

                        refraction: receipt.refraction,
                        price_per_kg: marketData?.price_of_day,
                        farmer_name: selectedFarmer?.farmer_name,
                        farmer_ID_card_number: selectedFarmer?.farmer_ID_card_number,
                    } : {
                        ...receipt,
                        market_number: marketData?.market_number,
                        refraction: receipt.refraction,
                        price_per_kg: marketData?.price_of_day,
                        farmer_name: newFarmer?.farmer_name, farmer_ID_card_number: newFarmer?.farmer_ID_card_number,
                        product_name: marketData?.type_of_market,
                        village: newFarmer?.village,
                        gpsLocation: location as Coordinates

                    } as unknown as Receipt}
                    fileName={'receipt'}
                    company_logo={marketData?.company_logo ?? ""}
                    htmlHanlder={contentHtmlForReceipt as (data: Receipt, farmerSig: string, agentSig: string, salephoto: string) => string}
                    company_name={marketData?.company_name as string}
                    bucket_name={currentCompany?.company_bucket as string}
                // handleSave={handleSave}
                />}
            </ScrollView>

        </SafeAreaView>
    );
};

export default memo(ReceiptComponent);
