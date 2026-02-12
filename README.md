# Agriculture Durability Mobile App

Expo / React Native app for agriculture durability (Senwisetool).

## Setup

```bash
yarn install
```

## Scripts

| Script | Description |
|--------|-------------|
| `yarn start` | Start Expo dev client |
| `yarn android` | Run on Android |
| `yarn ios` | Run on iOS |
| `yarn test` | Run tests in watch mode |
| `yarn test:ci` | Run tests once with coverage (for CI) |
| `yarn lint` | Run ESLint |
| `yarn lint:fix` | Fix lint issues |
| `yarn format` | Format with Prettier |

## EAS (Expo Application Services)

- **Build profiles** (in `eas.json`): `development`, `preview`, `preview_debug`, `production`. All extend a shared `base` with env and Node/Yarn versions.
- **Channels**: `development`, `preview`, `production` for OTA updates.
- **Build locally**: `eas build --profile preview --platform android`
- **GitHub Actions**: `.github/workflows/eas-build.yml` runs EAS builds on `v*` tags or via manual dispatch. Set `EXPO_TOKEN` in repo secrets.

## Testing

- **Jest** + **jest-expo** for unit and component tests.
- Config: `jest.config.js` (path alias `@/`, transformIgnorePatterns for RN/Expo).
- Run once: `yarn test:ci`; watch: `yarn test`.

## Code quality

- **ESLint**: `expo` config + Prettier + TypeScript (`.eslintrc.cjs`).
- **Prettier**: `.prettierrc` / `.prettierignore`.
- **CodeRabbit**: `.coderabbit.yaml` for AI code review on PRs (path filters, ESLint/Jest in pre-merge).
