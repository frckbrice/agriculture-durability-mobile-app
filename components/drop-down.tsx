import * as React from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Text } from './ui/text';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from './custom-button';
import { Colors } from '@/constants';
import { TestTube } from 'lucide-react-native';
import { ActivityIndicator } from 'react-native-paper';


type ButtonProps = {
    handlePress: (str: string) => void,
    containerStyles?: string,
    icons?: typeof Ionicons.defaultProps;
    project_id?: string;
    upload?: string;
    deleteF?: string;
    edit?: string
    isUploading?: boolean;
}

function CustomDropdown({
    handlePress,
    containerStyles,
    icons,
    project_id,
    deleteF,
    edit,
    upload,
    isUploading,
}: ButtonProps) {

    // const

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild className='flex flex-col justify-center  '>
                <Button
                    variant='default'
                    className={containerStyles}
                >
                    <Ionicons name={icons} size={20} color={icons === "trash-outline" ? "red" : 'gray'}
                    />
                </Button>

                {/* <Text className="absolute">More</Text> */}
            </DropdownMenuTrigger>
            <DropdownMenuContent className='border-0 w-32 mx-2 bg-white gap-0'>
                {upload ? <DropdownMenuItem className='justify-between flex my-0 ' key={"statement"} onPress={() => handlePress("upload")} >
                    <Text>{upload}</Text>
                    {isUploading ? <ActivityIndicator size={'small'} color={Colors.darkness} /> : <Ionicons name={'cloud-upload-sharp'} size={20} color={Colors.darkness}
                    />}
                </DropdownMenuItem> : null}

                <DropdownMenuSeparator className="w-full h-[0.5] bg-black-100" />

                {edit ? <DropdownMenuItem className='justify-between flex my-0 ' onPress={() => handlePress("edit")}>
                    <Text>{edit}</Text>
                    <Ionicons name={'pencil-outline'} size={20} color={Colors.darkness}
                    />
                </DropdownMenuItem> : null}

                <DropdownMenuSeparator className="w-full h-[0.5] bg-black-100" />

                {deleteF ? <DropdownMenuItem
                    className='justify-between flex my-0 '
                    key={"background"}
                    onPress={() => handlePress("delete")}>
                    <Text>{"delete data"}</Text>
                    <Ionicons name={'trash'} size={20} color={'red'} />
                </DropdownMenuItem> : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default CustomDropdown;