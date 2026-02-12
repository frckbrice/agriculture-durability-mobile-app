import { View, Text, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markets from '@/components/tracability/components/markets';
import { Market } from '@/interfaces/types';
import { storeCurrentMarketData } from '@/store/mmkv-store';

export default function MaketFunctionalities() {

    // store market objct fetched from the child market object and passed here (parent)
    const [marketProps, setMarketProps] = useState<Partial<Market>>({});

    const router = useRouter();

    useEffect(() => {
        if (!marketProps) return console.warn("No market object to store");
        // we strore the market object fetched from the child market component 
        // and store it locaally for later use in receipts and othoers.
        storeCurrentMarketData.set('market-data', JSON.stringify(marketProps))
    }, [marketProps]);

    return (
        <SafeAreaView className="flex-1  justify-start px-10 m-0 ">
            {/* <Text className="text-2xl font-bold mb-4 text-center">SenwiseTool Traceability Menu page</Text> */}

            {/* <View>
                <Markets setMarketProps={setMarketProps} />
            </View> */}
            <View className='flex space-y-4 mt-5'>

                <TouchableOpacity
                    className="bg-black-200 p-2 rounded w-full"
                    onPress={() => router.push('/receipts')}
                >
                    <Text className="text-white text-center">Create Receipts</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-black-200 p-2 rounded"
                    onPress={() => router.push('/accompanying-sheet')}
                // disabled={endMarket}
                >
                    <Text className="text-white text-center">accompanying-sheet</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-black-200 p-2 rounded"
                    onPress={() => router.push('/transmission-sheet')}
                // disabled={endMarket}
                >
                    <Text className="text-white text-center">Transmission sheet</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-black-200 p-2 rounded"
                    onPress={() => router.push('/sale-slip-sheet')}
                // disabled={endMarket}
                >
                    <Text className="text-white text-center">Upload sales slip sheet</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-black-200 p-2 rounded"
                    onPress={() => router.push('/store-entry-voucher')}
                // disabled={endMarket}
                >
                    <Text className="text-white text-center">Store entry voucher</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
