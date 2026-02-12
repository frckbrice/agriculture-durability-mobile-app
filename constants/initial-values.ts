import { AttendenceSheet, MappingFormData, MetaData, Participants } from "../interfaces/types";

export const metaDataInitialValue: MetaData = {
    farmer_name: "",
    farmer_contact: "",
    // farmer_code: "",
    farmer_ID_card_number: "",
    inspection_date: "",
    village: "",
    certification_year: "",
    inspector_name: "",
    inspector_contact: "",
    weed_application: "",
    "weed_application_quantity": 0,
    pesticide_used: "",
    "pesticide_quantity": 0,
}

export const mappingInitialValues: MappingFormData = {

    farmer_status: "Proprietaire",
    farmer_name: "",
    farmer_contact: "",
    farmer_ID_card_number: "",
    plantation_creation_date: "",
    village: "",
    collector_name: "",
    date: new Date(Date.now()).toISOString(),
    "estimated_area (ha)": "",
    location: {
        longitude: 0,
        latitude: 0
    },
    // plantationPhoto: "",
    // farmerPhoto: "",
    // coordinates: [],
};

export const AttendanceSheetInitialValues: AttendenceSheet = {
    date: '',
    title: '',
    modules: [''],
    location: "",
    trainers: [{
        name: "",
        signature: "",
        trainer_proof_of_competency: ""
    }],
    photos: [],
    report_url: '',
    participants: [
        {
            name: '',
            organization: '',
            telephone: '',
            email: '',
            signature: '',
            village: '',
        }
    ],
};

export const receiptInitialValues = {
    date: new Date(Date.now()),
    farmer_id: '',
    farmer_name: '',
    village: '',
    market_number: '',
    gpsLocation: {
        latitude: 0,
        longitude: 0,
    },
    farmer_signature: '',
    agent_signature: '',
    weight: 0,
    humidity: 0,
    refraction: 0,
    net_weight: 0,
    // total_weight: 0,
    price_per_kg: "0",
    total_price: 0,
    agent_name: '',
    currency: 'XAF',
    product_name: '',
    salePhotoUrl: ''
}


export const mock_receipt = {
    "date": "2024-10-19",
    "farmer_id": "12345",
    "village": "Example Village",
    "market_number": "67890",
    "gpsLocation": {
        "latitude": "40.7128",
        "longitude": "-74.0060"
    },
    "weight": "100kg",
    "humidity": "10%",
    "net_weight": "90kg",
    "total_weight": "95kg",
    "price_per_kg": "5 USD",
    "total_price": "450 USD",
    "agent_name": "John Doe",
    "currency": "USD",
    "product_name": "Wheat",
    "salePhotoUrl": "data:image/jpeg;base64,...", // Base64 encoded image
    // "agent_photo": "data:image/jpeg;base64,...", // Base64 encoded image
    // "product_photo": "data:image/jpeg;base64,...", // Base64 encoded image
}


export const accompagnyingSheetMetaDataInitialValue = {
    id: '',
    levelOfTraceability: '',
    // vehicleNumber: '',
    // driverName: '',
    numberOfBagsDeclared: "",
    declaredNetWeight: "",
    humidity: '',
    marketNumber: '',
}


export const transmissionInitialValues = {
    senderName: '',
    recipientName: '',
    marketNumber: '',
    ministryAgentName: '',
    vehicleRegistration: '',
    driverName: '',
    numberOfBags: '',
    productQuality: '',
    senderSignature: '',
    carrierSignature: '',
    ministrySignature: '',
}

export const transmisionMockvalues = {
    "carrierSignature": "file:///data/user/0/com.senima.agriculturedurability/cache/ReactNative-snapshot-image2097841492535461481.jpg", "driverName": "Brice",
    "ministrySignature": "file:///data/user/0/com.senima.agriculturedurability/cache/ReactNative-snapshot-image6079246352210297903.jpg", "numberOfBags": "17",
    "productQuality": "Good",
    "recipientName": "Avom",
    "senderName": "",
    "senderSignature": "file:///data/user/0/com.senima.agriculturedurability/cache/ReactNative-snapshot-image6334196838283550338.jpg", "vehicleRegistration": "Tl678"
}

export const sampleReceipts = {
    "data": [
        {
            "date": "2025-02-11T20:28:25.628Z",
            "farmer_name": "",
            "market_number": "",
            "gpsLocation": {
                "longitude": 11.5487844,
                "latitude": 3.8640966
            },
            "farmer_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image1220943149901785730.png",
            "agent_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image598528899914475913.png",
            "weight": "15286400",
            "humidity": "1",
            "refraction": "5",
            "net_weight": 14369216,
            "price_per_kg": 3175,
            "total_price": 45622260800,
            "agent_name": "Ngono jean Pierre ",
            "currency": "XAF",
            "product_name": "COCOA",
            "salePhotoUrl": [
                "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/receipt--a4ff96cf-89e3-4c8a-8036-9dc0296c3dfd.jpeg"
            ],
            "market_id": "cm42xj0ug000evi92egj5e85g",
            "farmer": {
                "farmer_name": "Atangana mvondo kamga bernard ",
                "village": "Atlanta ",
                "farmer_contact": "653478003",
                "farmer_ID_card_number": "112367488",
                "inspector_contact": "653639984",
                "location": "Yaoundé, Cameroon"
            }
        },
        {
            "date": "2025-02-11T20:28:25.628Z",
            "farmer_name": "",
            "market_number": "",
            "gpsLocation": {
                "longitude": 11.5487844,
                "latitude": 3.8640966
            },
            "farmer_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image2815076255334445548.png",
            "agent_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image6627533976858096243.png",
            "weight": "5000",
            "humidity": "1",
            "refraction": "1",
            "net_weight": 4900,
            "price_per_kg": 3175,
            "total_price": 15557500,
            "agent_name": "Toto Guillaume ",
            "currency": "XAF",
            "product_name": "COCOA",
            "salePhotoUrl": [
                "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/receipt--37076f93-e8d2-4f1e-86d8-b6fcf06abff2.jpeg"
            ],
            "market_id": "cm42xj0ug000evi92egj5e85g",
            "farmer": {
                "farmer_name": "Nanga Mathieu ",
                "village": "Douala bonaberie",
                "farmer_contact": "652528987",
                "farmer_ID_card_number": "11263677383",
                "inspector_contact": "673737399",
                "location": "Yaoundé, Cameroon"
            }
        },
        {
            "date": "2025-02-11T20:28:25.628Z",
            "farmer_name": "",
            "market_number": "",
            "gpsLocation": {
                "longitude": 11.5487844,
                "latitude": 3.8640966
            },
            "farmer_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image2815076255334445548.png",
            "agent_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image6627533976858096243.png",
            "weight": "5000",
            "humidity": "1",
            "refraction": "1",
            "net_weight": 4900,
            "price_per_kg": 3175,
            "total_price": 15557500,
            "agent_name": "Toto Guillaume ",
            "currency": "XAF",
            "product_name": "COCOA",
            "salePhotoUrl": [
                "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/receipt--37076f93-e8d2-4f1e-86d8-b6fcf06abff2.jpeg"
            ],
            "market_id": "cm42xj0ug000evi92egj5e85g",
            "farmer": {
                "farmer_name": "Nanga Mathieu ",
                "village": "Douala bonaberie",
                "farmer_contact": "652528987",
                "farmer_ID_card_number": "11263677383",
                "inspector_contact": "673737399",
                "location": "Yaoundé, Cameroon"
            }
        },
        {
            "date": "2025-02-12T14:03:50.017Z",
            "farmer_name": "",
            "market_number": "cm42xj0ug000evi92egj5e85g",
            "gpsLocation": {
                "longitude": 11.5487844,
                "latitude": 3.8640966
            },
            "farmer_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image7600086979377860773.png",
            "agent_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image8346350326201370621.png",
            "weight": "14000",
            "humidity": "1",
            "refraction": "6",
            "net_weight": 13020,
            "price_per_kg": 3175,
            "total_price": 41338500,
            "agent_name": "Bobo Ricard ",
            "currency": "XAF",
            "product_name": "COCOA",
            "salePhotoUrl": [
                "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/receipt--57e3608d-e5c5-4b3a-a36a-f53c231e3efd.jpeg"
            ],
            "market_id": "cm42xj0ug000evi92egj5e85g",
            "farmer": {
                "farmer_name": "Nono Flavie ",
                "village": "Nachtigal",
                "farmer_contact": "674892367",
                "farmer_ID_card_number": "12244748488",
                "inspector_contact": "653847488",
                "location": "Yaoundé, Cameroon"
            }
        },
        {
            "date": "2025-02-12T14:02:14.788Z",
            "farmer_name": "",
            "market_number": "",
            "gpsLocation": {
                "longitude": 11.5487844,
                "latitude": 3.8640966
            },
            "farmer_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image3148651428535444740.png",
            "agent_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image6491836148372838819.png",
            "weight": "5896",
            "humidity": "1",
            "refraction": "1",
            "net_weight": 5778.08,
            "price_per_kg": 3175,
            "total_price": 18345404,
            "agent_name": "Albin ethan",
            "currency": "XAF",
            "product_name": "COCOA",
            "salePhotoUrl": [
                "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/receipt--23beedb9-4fc9-49ba-aee2-bcfd8859e96e.jpeg"
            ],
            "market_id": "cm42xj0ug000evi92egj5e85g",
            "farmer": {
                "farmer_name": "Matada",
                "village": "Nilon",
                "farmer_contact": "653798368",
                "farmer_ID_card_number": "11234747488",
                "inspector_contact": "658848478",
                "location": "Yaoundé, Cameroon"
            }
        },
        {
            "date": "2025-02-12T14:02:14.788Z",
            "farmer_name": "",
            "market_number": "",
            "gpsLocation": {
                "longitude": 11.5487844,
                "latitude": 3.8640966
            },
            "farmer_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image7387785760499390847.png",
            "agent_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image5959476678220743904.png",
            "weight": "16000",
            "humidity": "1",
            "refraction": "1",
            "net_weight": 15680,
            "price_per_kg": 3175,
            "total_price": 49784000,
            "agent_name": "Bébé olamo",
            "currency": "XAF",
            "product_name": "COCOA",
            "salePhotoUrl": [
                "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/receipt--078df269-cfe0-46ae-b3c2-2203e2b0f880.jpeg"
            ],
            "market_id": "cm42xj0ug000evi92egj5e85g",
            "farmer": {
                "farmer_name": "Matada",
                "village": "New York ",
                "farmer_contact": "673848773",
                "farmer_ID_card_number": "12236474848",
                "inspector_contact": "653633884",
                "location": "Yaoundé, Cameroon"
            }
        },
        {
            "date": "2025-02-16T00:10:09.946Z",
            "farmer_name": "",
            "market_number": "cm42xj0ug000evi92egj5e85g",
            "gpsLocation": {
                "longitude": 11.4990567,
                "latitude": 3.84542
            },
            "farmer_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image1382870655241845598.png",
            "agent_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature--ReactNative-snapshot-image7679919763011751103.png",
            "weight": "15000",
            "humidity": "5",
            "refraction": "9",
            "net_weight": 12900,
            "price_per_kg": 3175,
            "total_price": 40957500,
            "agent_name": "Toto Guillaume ",
            "currency": "XAF",
            "product_name": "COCOA",
            "salePhotoUrl": [
                "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/receipt--a3cd51c1-73a6-4f21-b902-b0184b20a6b2.jpeg"
            ],
            "market_id": "cm42xj0ug000evi92egj5e85g",
            "village": "Yaoundé, Cameroon",
            "farmer": {
                "farmer_name": "Njangui mathurin",
                "village": "Nitoukou ",
                "farmer_contact": "675789939",
                "farmer_ID_card_number": "1234747478",
                "inspector_contact": "674747488",
                "location": "Yaoundé, Cameroon"
            }
        },
        {
            "date": "2025-02-16T00:50:26.143Z",
            "farmer_id": "cm76uck6y000fjz2a0833e2is",
            "farmer_name": "Matada",
            "village": "Yaoundé, Cameroon",
            "market_number": "cm42xj0ug000evi92egj5e85g",
            "gpsLocation": {
                "longitude": 11.4990567,
                "latitude": 3.84542
            },
            "farmer_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature-Matada-ReactNative-snapshot-image1528921049009483382.png",
            "agent_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature-Matada-ReactNative-snapshot-image4455700918092239843.png",
            "weight": "3698",
            "humidity": "1",
            "refraction": "2",
            "net_weight": 3587.06,
            "price_per_kg": 3175,
            "total_price": 11388915.5,
            "agent_name": "Cherlock holm",
            "currency": "XAF",
            "product_name": "COCOA",
            "salePhotoUrl": [
                "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/receipt-Matada-88c4aa05-f8e4-49c7-ac21-685fe0d9ee6b.jpeg"
            ],
            "market_id": "cm42xj0ug000evi92egj5e85g"
        },
        {
            "date": "2025-02-16T00:55:10.788Z",
            "farmer_id": "cm47in4u70001wt3syqvhe866",
            "farmer_name": "Kounta-kinte",
            "village": "Yaoundé, Cameroon",
            "market_number": "cm42xj0ug000evi92egj5e85g",
            "gpsLocation": {
                "longitude": 11.4990567,
                "latitude": 3.84542
            },
            "farmer_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature-Kounta-kinte-ReactNative-snapshot-image9022255083852217886.png",
            "agent_signature": "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/signature-Kounta-kinte-ReactNative-snapshot-image5685163531012975291.png",
            "weight": "2580",
            "humidity": "7",
            "refraction": "5",
            "net_weight": 2270.4,
            "price_per_kg": 3175,
            "total_price": 7208520,
            "agent_name": "Agent zero",
            "currency": "XAF",
            "product_name": "COCOA",
            "salePhotoUrl": [
                "https://avom-technology-co-ltd.s3.eu-west-1.amazonaws.com/receipt-Kounta-kinte-c71da02e-0854-4850-b2d9-518ff8291bfc.jpeg"
            ],
            "market_id": "cm42xj0ug000evi92egj5e85g"
        }
    ]
}