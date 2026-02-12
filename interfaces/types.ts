import { AttendanceSheetInitialValues } from "@/constants/initial-values";

export interface TokenCache {
    getToken: (key: string) => Promise<string | undefined | null>
    saveToken: (key: string, token: string) => Promise<void>
    clearToken?: (key: string) => void
}


export type TUser = {
    role: ConnectedUser;
}

export type ConnectedUser = "admin" | "agent" | null;

export interface TotalProjectsState {
    totalProjects: () => number;
    projects: Project[];
    saveProject: (project: Project) => void;
}

export interface IUser {
    clearUser: () => void;
    userType: TUser;
    saveUser: (user: TUser) => void;
    getUserType: () => TUser;
}


export interface Requirements {
    number: any;
    status: {
        C: string;
        NA: string;
        NC: string;
    },
    comment: string;
    certif_de_group: {
        "Petite / grandes": string;
        "direction_du_group": string;
        "grande_exploitation_agricole": string;
        "petite_exploitation_agricole": string;
    };
    "principal_requirement": string;
};

export type MetaData = {
    farmer_name: string;
    farmer_contact: string;
    // farmer_code: string;
    farmer_ID_card_number: string;
    inspection_date: string;
    village: string;
    certification_year: string;
    inspector_name: string;
    inspector_contact: string;
    weed_application: string;
    "weed_application_quantity": number;
    pesticide_used: string;
    "pesticide_quantity": number;
    farmer_photos?: string[];
    cooperative_name?: string;
};

export interface Project {
    id: string;
    location?: string;
    modules?: string[];
    company_id?: string;
    type: string;
    title: string;
    status: string;
    start_date: string;
    end_date: string;
    city?: string;
    project_structure: {
        metadata: MetaData,
        requirements: Requirements[]
    };
}

export type RequirementData<T, K extends keyof T> = Omit<T, K>;

export type RequirementStatus = "C" | "NA" | "NC" | "N/A";

export type FarmerReqType = {
    req_number: any;
    status: RequirementStatus;
    comment: string;
};

export type InspectionConclusionType = {
    nonConformityRecom: NonConformityInput[],  // nonConformityRecommendation.
    metadata: NonConformityMetadata
}

export interface NonConformityInput {
    req_number: string;
    comment: string;
    deadline: string;
}

export interface NonConformityMetadata {
    nextYearRecom?: string;  // nextYearRecommendation
    farmer_signature?: string;
    agent_signature?: string;
}

export type ResponseRequirements = FarmerReqType[];

export type ProjectData = {
    metaData: MetaData;
    requirements: ResponseRequirements;
    inspectionConclusions?: InspectionConclusionType;
    nonConformityReqs?: NonConformityInput[]
}

export interface FarmerData {
    project_id?: string;
    project_data: ProjectData;
    uploaded?: boolean;
}

export interface IProjectData {
    getProjectsData: () => Project[] | [];
    saveProjectsData: (project: Project[]) => void;
    clearProjectsData: () => void;
    projectsData: Project[] | [];
    projectData: Project | null;
    getProjectData: () => Project | null;
    saveProjectData: (project: Project) => void;
    clearProjectData: () => void;
}

export interface IFarmerData {
    getFarmersData: () => FarmerData[] | [];
    saveFarmersData: (data: FarmerData[]) => void;
    clearFarmersData: () => void;
    farmersData: FarmerData[];
    farmerData: FarmerData | null;
    saveFarmerData: (data: FarmerData) => void;
    getFarmerData: () => FarmerData | null;
    clearFarmerData: () => void;
    setFarmerDataAsUploaded: (data: FarmerData) => void;
}

export interface IMappingData {
    getMappingsData: () => MappingData[] | [];
    saveMappingsData: (data: MappingData[]) => void;
    clearMappingsData: () => void;
    mappingsData: MappingData[];
    mappingData: MappingData | null;
    saveMappingData: (data: MappingData) => void;
    getMappingData: () => MappingData | null;
    clearMappingData: (id: string) => void;
    setMappingDataAsUploaded: (data: MappingData) => void;
}

export type MappingData = {
    project_data: MappingFormData;
    uploaded?: boolean;
    project_id?: string;
}


export type MappingFormData = {
    project_id?: string;
    farmer_name: string;
    farmer_status: FarmerStatus;
    farmer_contact: string;
    farmer_ID_card_number: string;
    plantation_creation_date: string;
    village: string;
    collector_name: string;
    location: Coordinates;
    date: string;
    "estimated_area (ha)": string;
    plantation_photos?: string[];
    farmer_photos?: string[];
    coordinates?: Coordinates[];
};

export type FarmerStatus = 'Locataire' | 'Proprietaire' | 'N/A';

export type Coordinates = { // it should be Coordinate, but to avoid creating unnecessary errors, i leave it like that.
    latitude: number;
    longitude: number
};

interface AttendancesheetObj {
    training_id: string;
    participants: Participants[];
    metadata: AttendenceSheetMetadata;
    uploaded: boolean;
}

export interface ITrainingData {
    getAttendancesData: () => AttendenceSheet[] | [];
    saveAttendancesData: (data: AttendenceSheet[]) => void;
    clearAttendancesData: () => void;
    attendancesData: AttendenceSheet[];
    AttendanceData: AttendenceSheet | null;
    saveAttendanceData: (data: AttendenceSheet) => void;
    getAttendanceData: () => AttendenceSheet | null;
    clearAttendanceData: (id: string) => void;
    setAttendanceDataAsUploaded: (data: AttendenceSheet) => void;
}

export type AttendanceSheetType = typeof AttendanceSheetInitialValues;

export interface AttendenceSheetMetadata {
    date: Date;
    title: string;
    modules: string[];
    trainers: string[];
    trainer_signature: string;
    location: string;
    photos: string[];
    report_url: string;
    trainer_proof_of_competency: string;
}

export interface Participants {
    name: string;
    organization?: string;
    telephone: string;
    email?: string;
    signature: string;
    village: string;
}

export type AttendenceSheet = {
    training_id?: string;
    date: Date | string;
    title: string;
    modules: string[];
    location: string;
    photos: string[];
    trainers: TrainerType[]
    report_url: string;

    participants: Participants[]
    uploaded?: boolean;
}

/* 
this object is created to handle the fact that:
- we may have multiple trainers
- each trainer must be attached to his attributes.
*/
export type TrainerType = {
    name: string;
    signature: string;
    trainer_proof_of_competency: string;
}

export type TTraining = {
    id?: string;
    location: string;
    title: string;
    slug?: string;
    modules: string[];
    start_date: string | Date;
    code?: string;
    end_date?: string | Date;
    status?: string;
    company_id?: string;
}


export interface Receipt {
    id?: string;
    date: string | Date;
    time?: string;
    farmer_id: string;
    farmer_name?: string; // we'll manipulate his name, under the hood, his ID will be used.
    village: string;
    weight: string | number;
    market_number: string;
    market_id?: string;
    humidity: string | number;
    net_weight: number;
    agent_name: string;
    refraction: string;
    price_per_kg: string;
    total_price: number;
    currency: string;
    // total_weight: string;
    salePhotoUrl: string[];
    gpsLocation: {
        latitude: number;
        longitude: number;
    };
    farmer_signature: string;
    agent_signature: string;
    product_name: string;
    farmer?: {
        farmer_contact: string,
        farmer_ID_card_number: string,
        farmer_name: string,
        village: string,
        location?: string
    }
}


export interface IReceipt {
    getReceiptsData: () => Receipt[] | [];
    saveReceiptsData: (data: Receipt[]) => void;
    clearReceiptsData: () => void;
    receiptsData: Receipt[];
    receiptData: Receipt | null;
    saveReceiptData: (data: Receipt) => void;
    getReceiptData: () => Receipt | null;
    clearReceiptData: () => void;
    setReceiptDataAsUploaded: (data: Receipt) => void;
}

export interface Farmer {
    farmer_id?: string;
    farmer_name: string;
    village: string;
    farmer_contact: string;
    farmer_ID_card_number: string;
}

// store farmers
export interface IFarmer {
    getFarmers: () => Farmer[] | [];
    saveFarmers: (data: Farmer[]) => void;
    clearFarmers: () => void;
    farmers: Farmer[];
    farmer: Farmer | null
}

// store current market
export interface IMarket {
    getMarket: () => Market | null;
    getAllMarkets: () => Market[] | [];
    saveMarket: (data: Market) => void;
    saveAllMarkets: (data: Market[]) => void;
    clearMarket: () => void;
    market: Market | null;
    markets: Market[]
}

export type TFetchType<T> = {
    data: T | undefined,
    refetch: () => void,
    isLoading: boolean,
    error?: any
}

export type Company = {
    company_id: string;
    company_name: string;
    company_bucket: string;
    company_logo: string;
    status: "ACTIVE" | "INACTIVE" | "EXPIRED"
}

export interface ICompany {
    getCompany: () => Company | null;
    saveCompany: (data: Company) => void;
    clearCompany: () => void;
    company: Company | null
}

export type ReceiptFormData = {
    producerCode: string;
    producerName: string;
    village: string;
    marker_number: string;
    buyer: string;
    weight: string;
    humidity: string;
    refraction: string;
    pricePerKg: string;
};

export interface AccompanyingSheet {
    id: string;
    levelOfTraceability: string;
    vehicleNumber: string;
    driverName: string;
    numberOfBagsDeclared: number | string;
    declaredNetWeight: number | string;
    humidity: number | string;
    marketNumber: string;
}

export interface TransmissionForm {
    transactionId?: string;
    senderName: string;
    marketNumber: string;
    recipientName: string;
    ministryAgentName: string;
    vehicleRegistration: string;
    driverName: string;
    numberOfBags: string;
    productQuality: string;
    senderSignature: string;
    carrierSignature: string;
    ministrySignature: string;

}

export interface Market {
    //   id of the market is consider it market number
    market_number: string;
    start_date: string;
    end_date: string;
    provider: string;
    status: 'OPEN' | 'CLOSED';
    price_of_day: number;
    location: string;
    type_of_market: string;
    company_logo: string;
    company_name: string;
    company_id: string;
}





export interface Training {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    location: string;
    modules: string[];
    company_id: string;
}


export type ValidationResult = {
    isValid?: boolean;
    message?: string;
    errorType?: string;
    errorDetails?: {
        intersectionPoints?: any,
        problematicSegments?: any,
        startPoint?: Coordinates,
        endPoint?: Coordinates,
        distance?: number
    },
    errors?: Record<string, string>;
}

// Types for clarity and reuse
export type Coordinate = {
    latitude: number;
    longitude: number;
    altitude?: number; // Optional altitude in meters
    timestamp?: number
};


export interface ReceiptProps {
    market_id: string;
}

export interface ValidationErrors {
    farmer_name?: string;
    agent_name?: string;
    weight?: string;
    humidity?: string;
    refraction?: string;
    village?: string;
    farmer_contact?: string;
    farmer_ID_card_number?: string;
    collector_name?: string;
    inspector_contact?: string;
    date?: string;
    farmer_id?: string;
    market_number?: string;
    email?: string;
    market_id?: string;
    net_weight?: string;
    price_per_kg?: string;
    total_price?: string;
}
