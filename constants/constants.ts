import Constants from "expo-constants";
import { logger } from "@/lib/logger";

// get the local IP address at run time.
const uri =
    Constants.expoConfig?.hostUri?.split(':').shift()?.concat(':5000') ??
    'yourapi.com';

// export const API_URL = `http://${uri}`;
export const API_URL = process.env.EXPO_PUBLIC_PROD_API_URL;


export const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
logger.debug("constants runtime API_URL resolved");


export const NAV_THEME = {
    light: {
        background: 'hsl(0 0% 100%)', // background
        border: 'hsl(240 5.9% 90%)', // border
        card: 'hsl(0 0% 100%)', // card
        notification: 'hsl(0 84.2% 60.2%)', // destructive
        primary: 'hsl(240 5.9% 10%)', // primary    
        text: 'hsl(240 10% 3.9%)', // foreground
    },
    dark: {
        background: 'hsl(240 10% 3.9%)', // background
        border: 'hsl(240 3.7% 15.9%)', // border
        card: 'hsl(240 10% 3.9%)', // card
        notification: 'hsl(0 72% 51%)', // destructive
        primary: 'hsl(0 0% 98%)', // primary
        text: 'hsl(0 0% 98%)', // foreground
    },
};

export const HOME_MENU = [
    { name: "Fill a Form", icon: "add-circle-outline", },
    // { name: "Download Form", icon: "cloud-download" },
    // { name: "Draft", icon: "pencil" },
    { name: "Sent", icon: "checkmark-done" },
    { name: "Parameters", icon: "settings" },
    { name: "Administration", icon: "folder-open-outline" }
];

export const COLLECTOR_MENU = [
    { name: "Start Collecting data", icon: "add-circle-outline", route: "/startproject" },
    // { name: "Download Form", icon: "cloud-download", route: "/sent-projects" },
    { name: "Draft", icon: "pencil", route: "/drafted-project" },
    { name: "Sent", icon: "checkmark-done", route: "/sent-projects" },
];

export const CHAPTERS = [
    { name: "Gestion", icon: "send", route: "/(management)/(inspections)" },
    { name: "Tracabilité", icon: "send", route: "/(traceability)" }, //"(traceability)" },
    // { name: "Socials", icon: "send", route: "/(socials)" },
    { name: "Agriculture", icon: "send", route: "/(agriculture)/index" },
    { name: "Revenus et responsabilités partagées", icon: "send", route: "/(income-and-responsibilities)/index" },
    { name: "Environment", icon: "send", route: "/(environment)/index" },
];

export const InitialAttendanceSheet = {
    date: '',
    title: '',
    location: "",
    modules: [''],
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
}
