import * as React from 'react';
import { Colors, icons, images } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Href, Link, useRouter } from 'expo-router';

type THeader = {
    logo?: string;
    search?: boolean;
    icon1?: typeof Ionicons.defaultProps;
    icon2?: typeof Ionicons.defaultProps;
    route?: string;
}

const CustomHeader = ({
    icon1,
    icon2,
    logo,
    route,
    search
}: THeader) => {
    const { top } = useSafeAreaInsets();
    console.log("custom header route: ", route)
    const router = useRouter();
    return (
        <BlurView
            intensity={80}
            tint={'dark'}
            style={{ paddingTop: top + 3, paddingBottom: 5 }}
        // className={`pt-[${top}]`}
        >
            <View

                className='flex-row  justify-center items-center h-[60px] gap-[10px] px-[20px] bg-transparent'
            >
                {/* <Link href={'/agent-menu' as Href<string>} asChild> */}
                <TouchableOpacity
                    onPress={() => router.replace(route as Href<string>)}
                    className='w-[40px] h-[40px] rounded-[20px] bg-[#626D77] justify-center items-center'
                >
                    <Text style={{ color: '#fff', fontWeight: '500', fontSize: 16 }}>
                        {logo ? <Ionicons
                            name={logo as typeof Ionicons.defaultProps}
                            size={20}
                            color={Colors.darkness}
                            className='text-darkness p-[10px]'
                        /> : "SG"}
                    </Text>
                </TouchableOpacity>
                {search && <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: Colors.lightGray,
                        borderRadius: 30,
                    }}
                // className=' flex-1 flex-row justify-center items-center text-lightGray rounded-  [30px]'
                >
                    <Ionicons
                        name="search"
                        size={20}
                        color={Colors.darkness}
                        className='text-darkness p-[10px]'
                    />
                    <TextInput

                        placeholder="Search"
                        // placeholderTextColor={Colors.dark}
                        className='
                        placeholder:text-darkness
                        py-[10px]
                        pl-0 pr-[10px]
                        bg-lightGray
                        text-darkness
                        rounded-[30px]
                        '
                    />
                </View>}
                {icon1 && <View

                    className='w-[40px] h-[40px] rounded-[30px] bg-lightGray justify-center items-center'

                >
                    {/* <Ionicons
                        name={'stats-chart'}
                        size={20}
                        color={Colors.darkness}
                        className='text-darkness'
                    /> */}
                    <Ionicons
                        name={icon1.name}
                        size={20}
                        color={Colors.darkness}
                        className='text-darkness'
                    />
                </View>}
                {icon2 && <View
                    className='w-[40px] h-[40px] rounded-[30px] bg-lightGray justify-center items-center'
                >
                    <Ionicons
                        name={images.senimalogo}
                        size={20}
                        color={Colors.darkness}
                        className='text-darkness'
                    />
                </View>}
            </View>
        </BlurView>
    );
};

export default CustomHeader;
