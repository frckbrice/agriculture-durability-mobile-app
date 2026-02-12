import { View, Text, Image } from 'react-native';
import React, { useEffect, useState } from "react";
import { useCompanyStore } from '@/store/current-company-store';
import { Company } from '@/interfaces/types';

type LHProps = {
    title: string;
}

export const ListHeader = React.memo(({ title }: LHProps) => {

    const [currentCompany, setCurrentCompany] = useState<Company>({} as Company);
    const {
        getCompany
    } = useCompanyStore();

    useEffect(() => {
        const company = getCompany();
        console.log("\n\n company from inspection header fetched: ")
        if (company)
            setCurrentCompany(company);
    }, [getCompany]);

    return (
        <View className="px-4">
            <View className="justify-between items-center flex-row  ">
                <Text className="text-xl font-psemibold">
                    {title}
                </Text>
                <View className="">
                    <Image
                        source={currentCompany?.company_logo ? { uri: currentCompany?.company_logo } : require('../../../assets/images/senima.png')}
                        resizeMode="contain"
                        className="w-14 h-14 rounded-full"
                    />
                </View>
            </View>
            <View className="h-0.5 border border-gray-300 w-full bg-primary" />
        </View>
    )
});
