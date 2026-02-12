// import React, { memo, useState } from 'react';
// import {
//     View, Text, ScrollView,
//     TouchableOpacity, Dimensions, TextInput
// } from 'react-native';
// import { styled } from 'nativewind';
// import { FarmerData, FarmerReqType } from '@/interfaces/types';
// import { NonConformityInput, NonConformityMetadata, InspectionConclusionType } from '@/interfaces/types';
// import { uploadToS3 } from '@/lib/functions';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import SentProjectDataForInspections from './sent-project-for-inspections';


// const StyledView = styled(View);
// const StyledText = styled(Text);

// // Get screen width
// const screenWidth = Dimensions.get('window').width;

// interface InspectionSummaryProps {
//     nonConformRequirements: NonConformityInput[];
//     setConclusionInpectionData: React.Dispatch<React.SetStateAction<InspectionConclusionType>>
//     conclusionInspectionData?: InspectionConclusionType;
// }

// const InspectionSummary = ({
//     nonConformRequirements,
//     setConclusionInpectionData,
//     conclusionInspectionData
// }: InspectionSummaryProps) => {

//     const [nonConformityInputs, setNonConformityInputs] = React.useState<NonConformityInput[]>([]);
//     const [nonConformityMetadata, setNonConformitymeMetadata] = React.useState<NonConformityMetadata>({});
//     const [emptyCanvas, setEmptyCanvas] = useState(false);


//     // Column widths
//     const columnWidths = {
//         nonConformite: 100,
//         mesures: 250,
//         delai: 100
//     };

//     // Total table width
//     const tableWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0);

//     // Group requirements by chapter
//     const groupedRequirements = React.useMemo(() => {
//         const groups: { [key: string]: NonConformityInput[] } = {};
//         nonConformRequirements.forEach(req => {
//             // get the first number of the requirement that represents the chapter number.
//             const chapter = req.req_number.split('.')[0];
//             if (!groups[chapter]) {
//                 groups[chapter] = [];
//             }
//             groups[chapter].push(req);
//         });
//         return groups;
//     }, [nonConformRequirements]);

//     // handle requirements recommendations
//     const handleInputChange = (index: number, field: keyof NonConformityInput, value: string) => {

//         setConclusionInpectionData(prev => {
//             const updated = { ...prev } as InspectionConclusionType;

//             if (updated && !updated?.nonConformityRecom[index]) { // there is not yet a value   on this index, we set it to empty.
//                 updated.nonConformityRecom[index] = {
//                     req_number: '',
//                     comment: '',
//                     deadline: '',
//                 };
//             }
//             updated.nonConformityRecom[index][field] = value;
//             return updated;

//         })
//     };

//     // handle the recommendations and signatures
//     const handleNextYearRecommendations = (value: string) => setConclusionInpectionData(prev => ({
//         ...prev,
//         metadata: {
//             ...prev?.metadata,
//             nextYearRecom: value
//         },
//         nonConformityRecom: prev?.nonConformityRecom as NonConformityInput[]
//     }));

//     return (
//         <SafeAreaView className=''>
//             {/* <ScrollView className="flex-1 bg-white py-4 px-2 rounded-lg"> */}
//             <StyledView className="flex-1 bg-white py-4 px-2 rounded-lg">
//                 <StyledText className="text-xl font-bold text-center text-blue-900 mb-4">
//                     CONCLUSION DE L'INSPECTION
//                 </StyledText>

//                 {/* Non-conformities Table with horizontal scroll */}
//                 <StyledView className="mb-6">
//                     <ScrollView
//                         horizontal
//                         showsHorizontalScrollIndicator={true}
//                         className="border border-gray-300 rounded-lg"
//                     >
//                         <StyledView style={{ width: tableWidth }}>
//                             {/* Table Header */}
//                             <StyledView className="flex-row bg-gray-100">
//                                 <StyledView style={{ width: columnWidths.nonConformite }} className="p-3 border-r border-gray-300">
//                                     <StyledText className="font-bold">Non-conformité</StyledText>
//                                 </StyledView>
//                                 <StyledView style={{ width: columnWidths.mesures }} className="p-3 border-r border-gray-300">
//                                     <StyledText className="font-bold">Mesures correctives pour l'année en cours</StyledText>
//                                 </StyledView>
//                                 <StyledView style={{ width: columnWidths.delai }} className="p-3">
//                                     <StyledText className="font-bold">DELAI</StyledText>
//                                 </StyledView>
//                             </StyledView>

//                             {/* Table Body Grouped by Chapter */}
//                             {Object.entries(groupedRequirements).map(([chapter, requirements], groupIndex) => (
//                                 <StyledView key={chapter}>
//                                     {/* Chapter Header */}
//                                     <StyledView className="flex-row bg-gray-50 border-t border-gray-300">
//                                         <StyledView style={{ width: tableWidth }} className="p-3">
//                                             <StyledText className="font-bold">Chapter {chapter}</StyledText>
//                                         </StyledView>
//                                     </StyledView>

//                                     {/* Chapter Requirements */}
//                                     {requirements.map((req, reqIndex) => {
//                                         const inputIndex = groupIndex * requirements.length + reqIndex;
//                                         return (
//                                             <StyledView key={req.req_number} className="flex-row border-t border-gray-300">
//                                                 <StyledView
//                                                     style={{ width: columnWidths.nonConformite }}
//                                                     className="p-3 border-r border-gray-300"
//                                                 >
//                                                     <TextInput
//                                                         className="w-full p-2 border border-gray-200 rounded"
//                                                         value={nonConformityInputs[inputIndex]?.req_number || ''}
//                                                         onChangeText={(value) => handleInputChange(inputIndex, 'req_number', value)}
//                                                         placeholder={req.req_number}
//                                                     />
//                                                 </StyledView>
//                                                 <StyledView
//                                                     style={{ width: columnWidths.mesures }}
//                                                     className="p-3 border-r border-gray-300"
//                                                 >
//                                                     <TextInput
//                                                         className="w-full p-2 border border-gray-200 rounded"
//                                                         multiline
//                                                         numberOfLines={2}
//                                                         value={nonConformityInputs[inputIndex]?.comment || ''}
//                                                         onChangeText={(value) => handleInputChange(inputIndex, 'comment', value)}
//                                                         placeholder="Enter corrective measures..."
//                                                     />
//                                                 </StyledView>
//                                                 <StyledView
//                                                     style={{ width: columnWidths.delai }}
//                                                     className="p-3"
//                                                 >
//                                                     <TextInput
//                                                         className="w-full p-2 border border-gray-200 rounded"
//                                                         value={nonConformityInputs[inputIndex]?.deadline || ''}
//                                                         onChangeText={(value) => handleInputChange(inputIndex, 'deadline', value)}
//                                                         placeholder="30 days"
//                                                     />
//                                                 </StyledView>
//                                             </StyledView>
//                                         );
//                                     })}
//                                 </StyledView>
//                             ))}
//                         </StyledView>
//                     </ScrollView>
//                 </StyledView>

//                 {/* Rest of the component remains the same */}
//                 {/* Recommendations Section */}
//                 <StyledView className="mb-6">
//                     <StyledText className="font-bold mb-2">
//                         Recommandations pour la prochaine année (en cas d'approbation sous condition)
//                     </StyledText>
//                     <StyledView className="border border-gray-300 rounded-lg p-3 min-h-[100px]">
//                         <TextInput
//                             multiline
//                             numberOfLines={4}
//                             className="w-full p-2"
//                             placeholder="Entrez vos recommandations ici..."
//                             onChangeText={handleNextYearRecommendations}
//                         />
//                     </StyledView>
//                 </StyledView>

//                 {/* Declaration Section */}
//                 <StyledView className="mb-6">
//                     <StyledText className="font-bold mb-2">Déclaration</StyledText>
//                     <StyledText className="text-sm">
//                         Le planteur confirme sous ce pli que les informations données dans ce rapport sont correctes et
//                         s'engage à mettre en œuvre les mesures correctives dans les délais convenus
//                     </StyledText>
//                 </StyledView>

//             </StyledView>

//         </SafeAreaView>
//     );
// }

// export default memo(InspectionSummary);


// import React, { memo, useState, useMemo } from 'react';
// import {
//     View, Text, ScrollView,
//     TextInput, Dimensions,
// } from 'react-native';
// import { styled } from 'nativewind';
// import { NonConformityInput, InspectionConclusionType, ResponseRequirements } from '@/interfaces/types';
// import { SafeAreaView } from 'react-native-safe-area-context';

// const StyledView = styled(View);
// const StyledText = styled(Text);

// // Get screen width
// const screenWidth = Dimensions.get('window').width;

// interface ChapterStats {
//     totalRequirements: number;
//     applicableRequirements: number;
//     conformity: number;
//     percentage: number;
// }

// interface StatsTableProps {
//     currentFarmerReqs: ResponseRequirements;
//     nonConformRequirements: NonConformityInput[];
//     setConclusionInpectionData: React.Dispatch<React.SetStateAction<InspectionConclusionType>>;
//     conclusionInspectionData?: InspectionConclusionType;
// }

// const InspectionSummaryWithStats = ({
//     currentFarmerReqs,
//     nonConformRequirements,
//     setConclusionInpectionData,
//     conclusionInspectionData
// }: StatsTableProps) => {
//     // Column widths for non-conformity table
//     const columnWidths = {
//         nonConformite: 100,
//         mesures: 250,
//         delai: 100
//     };

//     // Calculate stats per chapter
//     const chapterStats = useMemo(() => {
//         const stats: { [key: string]: ChapterStats } = {};

//         console.log("\n\n current farmer requirements: ", currentFarmerReqs);

//         currentFarmerReqs?.forEach(req => {
//             const chapter = req.req_number.split('.')[0];

//             if (!stats[chapter]) {
//                 stats[chapter] = {
//                     totalRequirements: 0,
//                     applicableRequirements: 0,
//                     conformity: 0,
//                     percentage: 0
//                 };
//             }

//             stats[chapter].totalRequirements++;
//             if (req.status !== 'NA') {
//                 stats[chapter].applicableRequirements++;
//                 if (req.status === 'C') {
//                     stats[chapter].conformity++;
//                 }
//             }
//         });

//         // Calculate percentages
//         Object.keys(stats).forEach(chapter => {
//             const stat = stats[chapter];
//             stat.percentage = stat.applicableRequirements > 0
//                 ? (stat.conformity / stat.applicableRequirements) * 100
//                 : 0;
//         });

//         return stats;
//     }, [currentFarmerReqs]);

//     // Calculate totals
//     const totals = useMemo(() => {
//         return Object.values(chapterStats).reduce((acc, stat) => ({
//             totalRequirements: acc.totalRequirements + stat.totalRequirements,
//             applicableRequirements: acc.applicableRequirements + stat.applicableRequirements,
//             conformity: acc.conformity + stat.conformity,
//             // percentage: acc.applicableRequirements > 0
//             //     ? (acc.conformity / acc.applicableRequirements) * 100
//             //     : 0
//             percentage: acc.percentage + stat.percentage
//         }), {
//             totalRequirements: 0,
//             applicableRequirements: 0,
//             conformity: 0,
//             percentage: 0
//         });
//     }, [chapterStats]);


//     // Updated handleInputChange function
//     const handleInputChange = (index: number, field: keyof NonConformityInput, value: string) => {
//         setConclusionInpectionData(prev => {
//             const prevData = { ...prev } as InspectionConclusionType;
//             const updatedRecom = [...(prevData.nonConformityRecom || [])];

//             // Initialize the item at this index if it doesn't exist
//             if (!updatedRecom[index]) {
//                 updatedRecom[index] = {
//                     req_number: nonConformRequirements[index].req_number, // get non conform requirements numbers.
//                     comment: '',
//                     deadline: ''
//                 };
//             }

//             // Update the specific field
//             updatedRecom[index] = {
//                 ...updatedRecom[index],
//                 [field]: value
//             };

//             return {
//                 ...prevData,
//                 nonConformityRecom: updatedRecom,
//                 metadata: {
//                     ...prevData?.metadata,
//                 }
//             };
//         });
//     };


//     // Handle next year recommendations
//     const handleNextYearRecommendations = (value: string) => {
//         setConclusionInpectionData(prev => ({
//             ...prev,
//             metadata: {
//                 ...prev?.metadata,
//                 nextYearRecom: value
//             },
//             nonConformityRecom: prev?.nonConformityRecom as NonConformityInput[]
//         }));
//     };

//     return (
//         <SafeAreaView>
//             <StyledView className="flex-1 bg-white py-4 px-2 rounded-lg">
//                 {/* Statistics Table */}
//                 <StyledText className="text-xl font-bold text-center text-blue-900 mb-4">
//                     RÉCAPITULATIF DES SCORES PAR CHAPITRE
//                 </StyledText>

//                 <ScrollView horizontal showsHorizontalScrollIndicator={true} className="mb-6">
//                     <StyledView>
//                         <StyledView className="border border-gray-300 rounded-lg">
//                             {/* Table Header */}
//                             <StyledView className="flex-row">
//                                 <StyledView className="w-40 p-2 border-r border-b border-gray-300 bg-gray-50">
//                                     <StyledText className="font-bold">Libellé</StyledText>
//                                 </StyledView>
//                                 {Object.keys(chapterStats).map(chapter => (
//                                     <StyledView key={chapter} className="w-20 p-2 border-r border-b border-gray-300 bg-gray-50">
//                                         <StyledText className="font-bold text-center">Ch{chapter}</StyledText>
//                                     </StyledView>
//                                 ))}
//                                 <StyledView className="w-20 p-2 border-b border-gray-300 bg-gray-50">
//                                     <StyledText className="font-bold text-center">TOTAL</StyledText>
//                                 </StyledView>
//                             </StyledView>

//                             {/* Table Rows */}
//                             {['Nombre d\'exigences', 'Nombre d\'exigences applicables', 'Conformité par Chapitre', '% par Chapitre'].map((label, index) => (
//                                 <StyledView key={label} className="flex-row">
//                                     <StyledView className="w-40 p-2 border-r border-b border-gray-300">
//                                         <StyledText>{label}</StyledText>
//                                     </StyledView>
//                                     {Object.entries(chapterStats).map(([chapter, stats]) => (
//                                         <StyledView key={chapter} className="w-20 p-2 border-r border-b border-gray-300">
//                                             <StyledText className="text-center">
//                                                 {index === 0 ? stats.totalRequirements :
//                                                     index === 1 ? stats.applicableRequirements :
//                                                         index === 2 ? stats.conformity :
//                                                             `${stats.percentage.toFixed(1)}%`}
//                                             </StyledText>
//                                         </StyledView>
//                                     ))}
//                                     <StyledView className="w-20 p-2 border-b border-gray-300">
//                                         <StyledText className="text-center">
//                                             {index === 0 ? totals.totalRequirements :
//                                                 index === 1 ? totals.applicableRequirements :
//                                                     index === 2 ? totals.conformity :
//                                                         `${totals.percentage.toFixed(1)}%`}
//                                         </StyledText>
//                                     </StyledView>
//                                 </StyledView>
//                             ))}
//                         </StyledView>
//                     </StyledView>
//                 </ScrollView>

//                 {/* Non-conformities Section */}
//                 <StyledText className="text-xl font-bold text-center text-blue-900 mb-4">
//                     CONCLUSION DE L'INSPECTION
//                 </StyledText>

//                 <ScrollView horizontal showsHorizontalScrollIndicator={true} className="border border-gray-300 rounded-lg mb-6">
//                     <StyledView style={{ width: Object.values(columnWidths).reduce((a, b) => a + b, 0) }}>
//                         {/* Non-conformity Table Header */}
//                         <StyledView className="flex-row bg-gray-100">
//                             <StyledView style={{ width: columnWidths.nonConformite }} className="p-3 border-r border-gray-300">
//                                 <StyledText className="font-bold">Non-conformité</StyledText>
//                             </StyledView>
//                             <StyledView style={{ width: columnWidths.mesures }} className="p-3 border-r border-gray-300">
//                                 <StyledText className="font-bold">Mesures correctives</StyledText>
//                             </StyledView>
//                             <StyledView style={{ width: columnWidths.delai }} className="p-3">
//                                 <StyledText className="font-bold">DELAI</StyledText>
//                             </StyledView>
//                         </StyledView>


//                         {/* Non-conformity Table Body */}
//                         {nonConformRequirements.map((req, index) => (
//                             <StyledView key={index} className="flex-row border-t border-gray-300">
//                                 <StyledView style={{ width: columnWidths.nonConformite }} className="p-3 border-r border-gray-300">

//                                     <Text className="w-full p-2 border border-gray-200 rounded">{req.req_number}</Text>
//                                 </StyledView>
//                                 <StyledView style={{ width: columnWidths.mesures }}
//                                     className="p-1 border-r border-gray-300 "

//                                 >
//                                     <TextInput
//                                         className=" w-full p-2 border border-gray-200 rounded"
//                                         multiline
//                                         numberOfLines={2}
//                                         value={conclusionInspectionData?.nonConformityRecom[index]?.comment || ''}
//                                         onChangeText={(value) => handleInputChange(index, 'comment', value)}
//                                         placeholder="Enter corrective measures..."
//                                     />
//                                 </StyledView>
//                                 <StyledView style={{ width: columnWidths.delai }} className="p-1">
//                                     <TextInput
//                                         className="w-full p-2 border border-gray-200 rounded"
//                                         value={conclusionInspectionData?.nonConformityRecom[index]?.deadline || ''}
//                                         onChangeText={(value) => handleInputChange(index, 'deadline', value)}
//                                         placeholder="Deadline"
//                                     />
//                                 </StyledView>
//                             </StyledView>
//                         ))}
//                     </StyledView>
//                 </ScrollView>

//                 {/* Next Year Recommendations */}
//                 <StyledView className="mb-6">
//                     <StyledText className="font-bold mb-2">
//                         Recommandations pour la prochaine année
//                     </StyledText>
//                     <StyledView className="border border-gray-300 rounded-lg p-3 min-h-[100px]">
//                         <TextInput
//                             multiline
//                             numberOfLines={4}
//                             className="w-full p-2"
//                             placeholder="Entrez vos recommandations ici..."
//                             onChangeText={handleNextYearRecommendations}
//                             value={conclusionInspectionData?.metadata?.nextYearRecom}
//                         />
//                     </StyledView>
//                 </StyledView>
//                 {/* Declaration Section */}
//                 <StyledView className="mb-6">
//                     <StyledText className="font-bold mb-2">Déclaration</StyledText>
//                     <StyledText className="text-sm">
//                         Le planteur confirme sous ce pli que les informations données dans ce rapport sont correctes et
//                         s'engage à mettre en œuvre les mesures correctives dans les délais convenus
//                     </StyledText>
//                 </StyledView>
//             </StyledView>
//         </SafeAreaView>
//     );
// };

// export default memo(InspectionSummaryWithStats);

import React, { memo, useState, useMemo } from 'react';
import {
    View, Text, ScrollView,
    TextInput, Dimensions, Platform
} from 'react-native';
import { styled } from 'nativewind';
import { NonConformityInput, InspectionConclusionType, ResponseRequirements } from '@/interfaces/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

const StyledView = styled(View);
const StyledText = styled(Text);

// Get screen width
const screenWidth = Dimensions.get('window').width;

interface ChapterStats {
    totalRequirements: number;
    applicableRequirements: number;
    conformity: number;
    percentage: number;
}

interface StatsTableProps {
    currentFarmerReqs: ResponseRequirements;
    nonConformRequirements: NonConformityInput[];
    setConclusionInpectionData: React.Dispatch<React.SetStateAction<InspectionConclusionType>>;
    conclusionInspectionData?: InspectionConclusionType;
}

const InspectionSummaryWithStats = ({
    currentFarmerReqs,
    nonConformRequirements,
    setConclusionInpectionData,
    conclusionInspectionData
}: StatsTableProps) => {
    // State for date picker
    const [showDatePicker, setShowDatePicker] = useState<{ [key: number]: boolean }>({});

    // Column widths for non-conformity table
    const columnWidths = {
        nonConformite: 100,
        mesures: 250,
        delai: 100
    };

    // Calculate stats per chapter
    const chapterStats = useMemo(() => {
        const stats: { [key: string]: ChapterStats } = {};

        currentFarmerReqs?.forEach(req => {
            const chapter = req.req_number.split('.')[0];

            if (!stats[chapter]) {
                stats[chapter] = {
                    totalRequirements: 0,
                    applicableRequirements: 0,
                    conformity: 0,
                    percentage: 0
                };
            }

            stats[chapter].totalRequirements++;
            if (req.status !== 'NA') {
                stats[chapter].applicableRequirements++;
                if (req.status === 'C') {
                    stats[chapter].conformity++;
                }
            }
        });

        // Calculate percentages
        Object.keys(stats).forEach(chapter => {
            const stat = stats[chapter];
            stat.percentage = stat.applicableRequirements > 0
                ? Math.min((stat.conformity / stat.applicableRequirements) * 100, 100)
                : 0;
        });

        return stats;
    }, [currentFarmerReqs]);

    // Calculate totals with percentage capped at 100%
    const totals = useMemo(() => {
        const chapterStatsValues = Object.values(chapterStats);
        const totalPercentage = chapterStatsValues.reduce((acc, stat) => acc + stat.percentage, 0);
        const averagePercentage = chapterStatsValues.length > 0
            ? Math.abs(Math.min(totalPercentage / chapterStatsValues.length, 100.5))
            : 0;

        return {
            totalRequirements: chapterStatsValues.reduce((acc, stat) => acc + stat.totalRequirements, 0),
            applicableRequirements: chapterStatsValues.reduce((acc, stat) => acc + stat.applicableRequirements, 0),
            conformity: chapterStatsValues.reduce((acc, stat) => acc + stat.conformity, 0),
            percentage: averagePercentage
        };
    }, [chapterStats]);

    // Updated handleInputChange function
    const handleInputChange = (index: number, field: keyof NonConformityInput, value: string | Date) => {
        setConclusionInpectionData(prev => {
            const prevData = { ...prev } as InspectionConclusionType;
            const updatedRecom = [...(prevData.nonConformityRecom || [])];

            // Initialize the item at this index if it doesn't exist
            if (!updatedRecom[index]) {
                updatedRecom[index] = {
                    req_number: nonConformRequirements[index].req_number,
                    comment: '',
                    deadline: ''
                };
            }

            // Update the specific field
            updatedRecom[index] = {
                ...updatedRecom[index],
                [field]: field === 'deadline' && value instanceof Date
                    ? value.toISOString().split('T')[0]
                    : value as string
            };

            return {
                ...prevData,
                nonConformityRecom: updatedRecom,
                metadata: {
                    ...prevData?.metadata,
                }
            };
        });
    };

    // Handle date picker
    const handleDateChange = (index: number, event: any, selectedDate?: Date) => {
        const currentMode = showDatePicker[index];
        setShowDatePicker(prev => ({ ...prev, [index]: Platform.OS === 'ios' }));

        if (selectedDate) {
            handleInputChange(index, 'deadline', selectedDate);
        }
    };

    // Handle next year recommendations
    const handleNextYearRecommendations = (value: string) => {
        setConclusionInpectionData(prev => ({
            ...prev,
            metadata: {
                ...prev?.metadata,
                nextYearRecom: value
            },
            nonConformityRecom: prev?.nonConformityRecom as NonConformityInput[]
        }));
    };

    return (
        <SafeAreaView>
            <StyledView className="flex-1 bg-white py-4 px-2 rounded-lg">
                {/* Statistics Table */}
                <StyledText className="text-xl font-bold text-center text-blue-900 mb-4">
                    RÉCAPITULATIF DES SCORES PAR CHAPITRE
                </StyledText>

                <ScrollView horizontal showsHorizontalScrollIndicator={true} className="mb-6">
                    <StyledView>
                        <StyledView className="border border-gray-300 rounded-lg">
                            {/* Table Header */}
                            <StyledView className="flex-row">
                                <StyledView className="w-40 p-2 border-r border-b border-gray-300 bg-gray-50">
                                    <StyledText className="font-bold">Libellé</StyledText>
                                </StyledView>
                                {Object.keys(chapterStats).map(chapter => (
                                    <StyledView key={chapter} className="w-20 p-2 border-r border-b border-gray-300 bg-gray-50">
                                        <StyledText className="font-bold text-center">Ch{chapter}</StyledText>
                                    </StyledView>
                                ))}
                                <StyledView className="w-20 p-2 border-b border-gray-300 bg-gray-50">
                                    <StyledText className="font-bold text-center">TOTAL</StyledText>
                                </StyledView>
                            </StyledView>

                            {/* Table Rows */}
                            {['Nombre d\'exigences', 'Nombre d\'exigences applicables', 'Conformité par Chapitre', '% par Chapitre'].map((label, index) => (
                                <StyledView key={label} className="flex-row">
                                    <StyledView className="w-40 p-2 border-r border-b border-gray-300">
                                        <StyledText>{label}</StyledText>
                                    </StyledView>
                                    {Object.entries(chapterStats).map(([chapter, stats]) => (
                                        <StyledView key={chapter} className="w-20 p-2 border-r border-b border-gray-300">
                                            <StyledText className="text-center">
                                                {index === 0 ? stats.totalRequirements :
                                                    index === 1 ? stats.applicableRequirements :
                                                        index === 2 ? stats.conformity :
                                                            `${Math.min(stats.percentage, 100).toFixed(1)}%`}
                                            </StyledText>
                                        </StyledView>
                                    ))}
                                    <StyledView className="w-20 p-2 border-b border-gray-300">
                                        <StyledText className="text-center">
                                            {index === 0 ? totals.totalRequirements :
                                                index === 1 ? totals.applicableRequirements :
                                                    index === 2 ? totals.conformity :
                                                        `${totals.percentage.toFixed(1)}%`}
                                        </StyledText>
                                    </StyledView>
                                </StyledView>
                            ))}
                        </StyledView>
                    </StyledView>
                </ScrollView>

                {/* Non-conformities Section */}
                <StyledText className="text-xl font-bold text-center text-blue-900 mb-4">
                    CONCLUSION DE L'INSPECTION
                </StyledText>

                <ScrollView horizontal showsHorizontalScrollIndicator={true} className="border border-gray-300 rounded-lg mb-6">
                    <StyledView style={{ width: Object.values(columnWidths).reduce((a, b) => a + b, 0) }}>
                        {/* Non-conformity Table Header */}
                        <StyledView className="flex-row bg-gray-100">
                            <StyledView style={{ width: columnWidths.nonConformite }} className="p-3 border-r border-gray-300">
                                <StyledText className="font-bold">Non-conformité</StyledText>
                            </StyledView>
                            <StyledView style={{ width: columnWidths.mesures }} className="p-3 border-r border-gray-300">
                                <StyledText className="font-bold">Mesures correctives</StyledText>
                            </StyledView>
                            <StyledView style={{ width: columnWidths.delai }} className="p-3">
                                <StyledText className="font-bold">DELAI</StyledText>
                            </StyledView>
                        </StyledView>

                        {/* Non-conformity Table Body */}
                        {nonConformRequirements.map((req, index) => (
                            <StyledView key={index} className="flex-row border-t border-gray-300">
                                <StyledView style={{ width: columnWidths.nonConformite }} className="p-3 border-r border-gray-300">
                                    <Text className="w-full p-2 border border-gray-200 rounded">{req.req_number}</Text>
                                </StyledView>
                                <StyledView style={{ width: columnWidths.mesures }}
                                    className="p-1 border-r border-gray-300 "
                                >
                                    <TextInput
                                        className=" w-full p-2 border border-gray-200 rounded"
                                        multiline
                                        numberOfLines={2}
                                        value={conclusionInspectionData?.nonConformityRecom[index]?.comment || ''}
                                        onChangeText={(value) => handleInputChange(index, 'comment', value)}
                                        placeholder="Enter corrective measures..."
                                    />
                                </StyledView>
                                <StyledView style={{ width: columnWidths.delai }} className="p-1 flex-row items-center">
                                    {/* <TextInput
                                        className="flex-1 p-2 border border-gray-200 rounded mr-1"
                                        value={conclusionInspectionData?.nonConformityRecom[index]?.deadline || ''}
                                        placeholder="Select Date"
                                        editable={false}
                                    /> */}
                                    {
                                        !conclusionInspectionData?.nonConformityRecom[index]?.deadline ?
                                            <>
                                                <StyledView>
                                                    <Text
                                                        className="p-2 bg-blue-500 text-white rounded"
                                                        onPress={() => setShowDatePicker(prev => ({ ...prev, [index]: true }))}
                                                    >
                                                        📅
                                                    </Text>
                                                </StyledView>
                                                {showDatePicker[index] && (
                                                    <DateTimePicker
                                                        testID="dateTimePicker"
                                                        value={conclusionInspectionData?.nonConformityRecom[index]?.deadline
                                                            ? new Date(conclusionInspectionData.nonConformityRecom[index].deadline)
                                                            : new Date()}
                                                        mode="date"
                                                        is24Hour={true}
                                                        display="default"
                                                        onChange={(event, selectedDate) => handleDateChange(index, event, selectedDate)}
                                                    />
                                                )}
                                            </> : <StyledView>
                                                <Text
                                                    className="p-2 bg-blue-500 text-white rounded"
                                                    onPress={() => setShowDatePicker(prev => ({ ...prev, [index]: true }))}
                                                >
                                                    {new Date(conclusionInspectionData?.nonConformityRecom[index]?.deadline).toLocaleDateString()}
                                                </Text>
                                                {showDatePicker[index] && (
                                                    <DateTimePicker
                                                        testID="dateTimePicker"
                                                        value={conclusionInspectionData?.nonConformityRecom[index]?.deadline
                                                            ? new Date(conclusionInspectionData.nonConformityRecom[index].deadline)
                                                            : new Date()}
                                                        mode="date"
                                                        is24Hour={true}
                                                        display="default"
                                                        onChange={(event, selectedDate) => handleDateChange(index, event, selectedDate)}
                                                    />
                                                )}
                                            </StyledView>
                                    }
                                </StyledView>
                            </StyledView>
                        ))}
                    </StyledView>
                </ScrollView>

                {/* Next Year Recommendations */}
                <StyledView className="mb-6">
                    <StyledText className="font-bold mb-2">
                        Recommandations pour la prochaine année
                    </StyledText>
                    <StyledView className="border border-gray-300 rounded-lg p-3 min-h-[100px]">
                        <TextInput
                            multiline
                            numberOfLines={4}
                            className="w-full p-2"
                            placeholder="Entrez vos recommandations ici..."
                            onChangeText={handleNextYearRecommendations}
                            value={conclusionInspectionData?.metadata?.nextYearRecom}
                        />
                    </StyledView>
                </StyledView>
                {/* Declaration Section */}
                <StyledView className="mb-6">
                    <StyledText className="font-bold mb-2">Déclaration</StyledText>
                    <StyledText className="text-sm">
                        Le planteur confirme sous ce pli que les informations données dans ce rapport sont correctes et
                        s'engage à mettre en œuvre les mesures correctives dans les délais convenus
                    </StyledText>
                </StyledView>
            </StyledView>
        </SafeAreaView>
    );
};

export default memo(InspectionSummaryWithStats);