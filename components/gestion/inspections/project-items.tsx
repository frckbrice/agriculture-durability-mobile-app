import { View, Text, TouchableOpacity, StyleSheet, } from 'react-native';
import React from "react";

// Local imports

import { Project } from '@/interfaces/types';
import SettingsItem from '@/components/setting-items';

export const ProjectItem = React.memo(({ item }: { item: Project }) => (
    <View style={styles.container}>
        <TouchableOpacity style={styles.section}>
            <SettingsItem
                routing={{ type: "inspection", id: item?.id }}
                icon={true}
                textStyle='justify-self-end'
                moreStyle={true}
                className='flex-row'
                isLast={false}
            >
                <Text className='text-muted font-bold text-[13px] text-gray-700'>
                    {item.title}
                </Text>
            </SettingsItem>
        </TouchableOpacity>
    </View>
), (prevProps, nextProps) => prevProps.item.id === nextProps.item.id);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginTop: 16,
        borderRadius: 8,
        marginHorizontal: 16,
        overflow: 'hidden',
    }
});