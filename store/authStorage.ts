import * as SecureStore from 'expo-secure-store';

/* THIS CLASS WILL BE USE FOR REFACTORING. FOR THE MOMENT, LET's IT MAKE IT WORK FIRST, THEN LATER CUSTOMIZED*/

// export class AuthStorage {
//     async storeUserSession(userType: 'agent' | 'admin') {
//         await SecureStore.setItemAsync('userType', userType);
//     };


//     async getUserSession() {
//         const userType = await SecureStore.getItemAsync('userType');
//         return { userType };
//     };

//     async clearUserSession() {
//         await SecureStore.deleteItemAsync('userType');
//     };
// }

export const storeUserSession = (userType: 'agent' | 'admin') => {
     SecureStore.setItemAsync('userType', userType);
};

export const getUserSession = async () => {
    const userType = await SecureStore.getItemAsync('userType');
    return { userType };
};

export const clearUserSession = async () => {
    await SecureStore.deleteItemAsync('userType');
};


