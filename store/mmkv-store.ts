import { StateStorage } from 'zustand/middleware'
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV({
    id: 'token-storage',
})

export const zustandStorage: StateStorage = {
    setItem: (name, value) => {
        return storage.set(name, value)
    },
    getItem: (name) => {
        const value = storage.getString(name)
        return value ?? null
    },
    removeItem: (name) => {
        return storage.delete(name)
    },
}

export const userStorage = new MMKV({
    id: "user_code",
});

export const farmers_data_store = new MMKV({
    id: 'farmerDataStore',
    // encryptionKey: 'farmerDataStore',
})

export const newFarmerRegistration = new MMKV({
    id: 'new-registration',
})

export const showUploadButton = new MMKV({
    id: 'end-collecting-data',
});

export const storeCurrentMarketData = new MMKV({
    id: 'market-data',
});

export const editFarmerData = new MMKV({
    id: 'current-farmer-data',
});

export const editProjectData = new MMKV({
    id: 'current-project-data',
});
