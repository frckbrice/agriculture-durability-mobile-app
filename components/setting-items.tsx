import { View, Text, TouchableOpacity, StyleSheet, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { Children, ReactNode } from "react";

//local local functions

import { Href, useRouter } from 'expo-router';
import { cn } from '@/lib/utils';

type SProps = {
    icon?: typeof Ionicons.defaultProps,
    children: ReactNode,
    moreStyle?: boolean,
    isLast?: boolean,
    routing?: {
        id: string,
        type: string
    },
    className?: string
    textStyle?: string;
}
const SettingsItem = ({
    icon,
    children,
    moreStyle,
    isLast,
    routing,
    className,
    textStyle
}: SProps) => {
    const router = useRouter();
    return (
        <TouchableOpacity

            className={cn(`bg-white  shadow-2xl  ${moreStyle ? className : ""}`)}
            onPress={() => {
                // route to corresponfing form collector
                if (typeof routing != 'undefined') {
                    if (routing.type.toString().toLocaleLowerCase().includes('inspection') || routing.type.toString().toLocaleLowerCase().includes('auto_evaluation'))
                        router.push(`/inspection/${routing.id}` as Href<string>);
                    if (routing.type.toString().toLocaleLowerCase().includes('mapping'))
                        router.push(`/mapping/${routing.id}` as Href<string>);
                    if (routing.type.toString().toLocaleLowerCase().includes('training'))
                        router.push(`/training/${routing.id}` as Href<string>);
                } else return;
            }}

        >
            <View className="flex-row justify-between items-center p-2 ">
                {children}
                {icon && <Text className={textStyle}>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                </Text>}
            </View>

        </TouchableOpacity>
    )
};

export default SettingsItem;


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {

        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 16,
    },
    section: {
        marginTop: 16,
        borderRadius: 8,
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,

    },
    borderBottom: {
        shadowOpacity: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowRadius: 3.84,
        elevation: 3,
        backgroundColor: '#fff',
    },
    icon: {
        marginRight: 16,
    },
    settingsText: {
        color: '#C9C8FA',
        flex: 1,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    notificationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'red',
        marginRight: 8,
    },
});
