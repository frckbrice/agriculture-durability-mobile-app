import { ExpoConfig, ConfigContext } from 'expo/config';
import { withPlugins } from '@expo/config-plugins';


export default ({ config }: ConfigContext): ExpoConfig => {
    // console.log("from app.config.ts file process.env.EXPO_PUBLIC_GOOGLE_API_KEY: ", process.env.EXPO_PUBLIC_GOOGLE_API_KEY);
    return {
        ...config,
        name: config.name || "senwisetool", // Provide a default name
        slug: config.slug || "senwisetool", // Provide a default slug
        // android: {
        //     config: {
        //         googleMaps: {
        //             apiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY, // Use environment variable
        //         },
        //     },
        //     package: "com.franckbriceavom.senwisetool"
        // },
        ios: {
            bundleIdentifier: "com.senima.senwisetool",
            config: {
                googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY // Added for iOS
            }
        }
    }

};
