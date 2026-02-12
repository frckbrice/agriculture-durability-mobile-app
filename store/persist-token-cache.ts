import { TokenCache } from "@/interfaces/types";
// import * as SecureStore from 'expo-secure-store'

// export const tokenCache: TokenCache = {
//     async getToken(key: string) {
//         try {
//             const item = await SecureStore.getItemAsync(key)
//             if (item) {
//                 console.log(`${key} was used 🔐 \n`)
//             } else {
//                 console.log('No values stored under key: ' + key)
//             }
//             return item
//         } catch (error) {
//             console.error('SecureStore get item error: ', error)
//             await SecureStore.deleteItemAsync(key)
//             return null
//         }
//     },
//     async saveToken(key: string, value: string) {
//         try {
//             return SecureStore.setItemAsync(key, value)
//         } catch (err) {
//             console.error('SecureStore save item error: ', err)
//             return
//         }
//     },

//     async clearToken(key: string) {
//         try {
//             return SecureStore.deleteItemAsync(key)
//         } catch (err) {
//             console.error('SecureStore delete item error: ', err)
//             return
//         }
//     }

// }
import * as SecureStore from 'expo-secure-store'

export const tokenCache: TokenCache = {
    async getToken(key: string) {
        try {
            const item = await SecureStore.getItemAsync(key)
            return item
        } catch (error) {
            console.error('SecureStore get item error: ', error)
            return null
        }
    },
    async saveToken(key: string, value: string) {
        try {
            await SecureStore.setItemAsync(key, value)
        } catch (err) {
            console.error('SecureStore save item error: ', err)
        }
    },
    async clearToken(key: string) {
        try {
            await SecureStore.deleteItemAsync(key)
        } catch (err) {
            console.error('SecureStore delete item error: ', err)
        }
    }
}