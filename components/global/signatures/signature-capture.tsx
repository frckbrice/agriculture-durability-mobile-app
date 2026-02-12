

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import ExpoDraw from 'expo-draw';
import { captureRef as takeSnapshotAsync } from 'react-native-view-shot';
// import { styled } from 'nativewind';

type TSignatureProps = {
    onSignature: (uri: any, author?: 'agent_' | 'farmer_' | 'sender' | 'carrier' | 'ministry' | any) => void,
    label?: string | Element | React.ReactNode,
    author?: 'agent_' | 'farmer_' | 'sender' | 'carrier' | 'ministry' | any,
    emptyCanvas?: boolean,
    className: string;
    previousStrokes?: [];
    buttonReenableDelay?: number; // Optional prop to customize delay
}

const SignatureInput = ({
    onSignature,
    label,
    author,
    emptyCanvas,
    className,
    previousStrokes,
    buttonReenableDelay = 3000 // Default 3 seconds
}: TSignatureProps) => {
    const [strokes, setStrokes] = useState(previousStrokes || []);
    const signatureRef = React.useRef<ExpoDraw>(null);
    const [isConfirmDisabled, setIsConfirmDisabled] = useState(false);


    const clearCanvas = useCallback(() => {
        signatureRef.current && signatureRef.current.clear();
        setStrokes([]);
    }, []);

    useEffect(() => {
        if (emptyCanvas)
            clearCanvas();
    }, [emptyCanvas, clearCanvas]);

    const saveCanvas = useCallback(async () => {
        try {
            const signatureResult = await takeSnapshotAsync(signatureRef.current, {
                result: 'tmpfile',
                quality: 0.5,
                format: 'png',
                // format: 'jpg',
            });

            if (!signatureResult) {
                throw new Error('Failed to capture signature.');
            }

            onSignature(signatureResult, author as any);
            setIsConfirmDisabled(true);

            // Re-enable the button after a delay
            setTimeout(() => {
                setIsConfirmDisabled(false);
            }, buttonReenableDelay);

        } catch (error) {
            console.error(error);
        }
    }, [onSignature, author, buttonReenableDelay]);

    return (
        <View className={className}>
            <Text className='font-medium text-[15px] underline mt-4 text-center'>{label as React.ReactNode}</Text>
            <View className='w-full px-5 justify-center items-center '>
                <ExpoDraw
                    strokes={strokes}
                    ref={signatureRef}
                    containerStyle={styles.canvas}
                    rewind={(undo: any) => console.log("Undo", undo)}
                    clear={(clear: any) => console.log("Clear", clear)}

                    color="#000000"
                    strokeWidth={4}
                    enabled={true}
                    onChangeStrokes={(newStrokes: any) => setStrokes(newStrokes)}
                />
                <View className="flex-row justify-between mt-4 gap-5 w-full">
                    <TouchableOpacity
                        className="bg-black-200 p-1 rounded flex-1"
                        onPress={clearCanvas}
                    >
                        <Text className='text-center text-base text-gray-300'>Reset</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="bg-black-200 p-1 rounded flex-1"
                        onPress={saveCanvas}
                        disabled={isConfirmDisabled}
                    >
                        <Text className='text-center text-base text-gray-300'>
                            Confirm
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    canvas: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        height: 200,
        width: 270,
        marginVertical: 10,
    },
});

export default memo(SignatureInput);


// import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// // import ExpoDraw from 'expo-draw';
// // import { captureRef as takeSnapshotAsync } from 'react-native-view-shot';
// // import { styled } from 'nativewind';
// import Signature from "react-native-signature-canvas";


// type TSignatureProps = {
//     onSignature: (uri: any, author?: 'agent_' | 'farmer_' | 'sender' | 'carrier' | 'ministry' | any) => void,
//     label?: string,
//     author?: 'agent_' | 'farmer_' | 'sender' | 'carrier' | 'ministry' | any,
//     emptyCanvas?: boolean,
//     className: string;
//     previousStrokes?: [];
//     buttonReenableDelay?: number; // Optional prop to customize delay
// }

// const SignatureInput = ({
//     onSignature,
//     label,
//     author,
//     emptyCanvas,
//     className,
//     previousStrokes,
//     buttonReenableDelay = 3000 // Default 3 seconds
// }: TSignatureProps) => {
//     const [strokes, setStrokes] = useState(previousStrokes || []);
//     const signatureRef = React.useRef(null);
//     const [isConfirmDisabled, setIsConfirmDisabled] = useState(false);

//     const clearCanvas = useCallback(() => {
//         // signatureRef.current && signatureRef.current.();
//         setStrokes([]);
//     }, []);

//     useEffect(() => {
//         if (emptyCanvas)
//             clearCanvas();
//     }, [emptyCanvas, clearCanvas]);

// const saveCanvas = useCallback(async () => {
//     try {
//         const signatureResult = await takeSnapshotAsync(signatureRef.current, {
//             format: 'jpg',
//             quality: 0.5,
//             result: 'tmpfile',
//         });

//         if (!signatureResult) {
//             throw new Error('Failed to capture signature.');
//         }

//         onSignature(signatureResult, author as any);
//         setIsConfirmDisabled(true);

//         // Re-enable the button after a delay
//         setTimeout(() => {
//             setIsConfirmDisabled(false);
//         }, buttonReenableDelay);

//     } catch (error) {
//         console.error(error);
//     }
// }, [onSignature, author, buttonReenableDelay]);

//     const handleOK = (signature: string) => {
//         console.log("Signature captured:", signature);
//         onSignature(signature, author as any);; // Save signature for PDF
//     };


//     return (
//         <View className={className}>
//             <Text className='font-medium text-[15px] underline mt-4 text-center'>{label}</Text>
//             <View className='w-full px-5 justify-center items-center '>
//                 {/* <ExpoDraw
//                     strokes={strokes}
//                     ref={signatureRef}
//                     containerStyle={styles.canvas}
//                     rewind={(undo: any) => console.log("Undo", undo)}
//                     clear={(clear: any) => console.log("Clear", clear)}
//                     color="#000000"
//                     strokeWidth={4}
//                     enabled={true}
//                     onChangeStrokes={(newStrokes: any) => setStrokes(newStrokes)}
//                 /> */}
//                 <Signature
//                     ref={signatureRef}
//                     onOK={handleOK}
//                     onEmpty={() => console.log("Empty Signature")}
//                     descriptionText="Sign here"
//                     clearText="Clear"
//                     confirmText="Save"
//                     webStyle={`
//                             .m-signature-pad--footer {display: none; }
//                             .m-signature-pad { border: 2px solid black; }
//                         `}
//                 />
//                 {/* <View className="flex-row justify-between mt-4 gap-5 w-full">
//                     <TouchableOpacity
//                         className="bg-black-200 p-1 rounded flex-1"
//                         onPress={clearCanvas}
//                     >
//                         <Text className='text-center text-base text-gray-300'>Reset</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                         className="bg-black-200 p-1 rounded flex-1"
//                         onPress={saveCanvas}
//                         disabled={isConfirmDisabled}
//                     >
//                         <Text className='text-center text-base text-gray-300'>
//                             Confirm
//                         </Text>
//                     </TouchableOpacity>
//                 </View> */}
//             </View>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     canvas: {
//         backgroundColor: 'rgba(0, 0, 0, 0.1)',
//         height: 200,
//         width: 270,
//         marginVertical: 10,
//     },
// });

// export default memo(SignatureInput);