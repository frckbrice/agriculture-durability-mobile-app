/**
 * Tests that app.config.ts injects sensitive values from environment variables
 * and does not expose them when env is unset.
 */
const baseConfig = {
  name: 'Agriculture Durability',
  slug: 'agriculture-durability-mobile-app',
  android: { package: 'com.senima.agriculturedurability' },
  ios: {},
  extra: {},
};

describe('app.config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('injects Google Maps API key when EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is set', () => {
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-google-maps-key';
    const appConfig = require('./app.config').default;
    const config = appConfig({ config: baseConfig });
    expect(config.android?.config?.googleMaps?.apiKey).toBe('test-google-maps-key');
    expect(config.ios?.config?.googleMapsApiKey).toBe('test-google-maps-key');
  });

  it('injects EAS project ID when EXPO_PUBLIC_EAS_PROJECT_ID is set', () => {
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID = 'test-eas-project-id';
    const appConfig = require('./app.config').default;
    const config = appConfig({ config: baseConfig });
    expect(config.extra?.eas?.projectId).toBe('test-eas-project-id');
  });

  it('does not inject Google Maps config when env var is unset', () => {
    delete process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    const appConfig = require('./app.config').default;
    const config = appConfig({ config: baseConfig });
    expect(config.android?.config?.googleMaps).toBeUndefined();
    expect(config.ios?.config?.googleMapsApiKey).toBeUndefined();
  });

  it('does not inject EAS projectId when env var is unset', () => {
    delete process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    const appConfig = require('./app.config').default;
    const config = appConfig({ config: baseConfig });
    expect(config.extra?.eas?.projectId).toBeUndefined();
  });

  it('preserves base config name and slug', () => {
    const appConfig = require('./app.config').default;
    const config = appConfig({ config: baseConfig });
    expect(config.name).toBe('Agriculture Durability');
    expect(config.slug).toBe('agriculture-durability-mobile-app');
  });
});
