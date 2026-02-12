import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Sensitive values (Google Maps API key, EAS project ID) are read from environment
 * variables. Set them in .env (see .env.example). Never commit .env.
 */
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const EAS_PROJECT_ID = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: config.name || 'Agriculture Durability',
    slug: config.slug || 'agriculture-durability-mobile-app',
    android: {
      ...config.android,
      config: {
        ...(config.android as { config?: { googleMaps?: { apiKey?: string } } })?.config,
        ...(GOOGLE_MAPS_API_KEY && {
          googleMaps: { apiKey: GOOGLE_MAPS_API_KEY },
        }),
      },
    },
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.senima.agriculturedurability',
      config: {
        ...(config.ios as { config?: { googleMapsApiKey?: string } })?.config,
        ...(GOOGLE_MAPS_API_KEY && { googleMapsApiKey: GOOGLE_MAPS_API_KEY }),
      },
    },
    extra: {
      ...config.extra,
      ...(EAS_PROJECT_ID && {
        eas: { projectId: EAS_PROJECT_ID },
      }),
    },
  };
};
