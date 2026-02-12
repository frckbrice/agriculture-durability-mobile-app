


import React, { memo, useState, useMemo } from 'react';
import {
    View, Text, ScrollView,
    TextInput, Dimensions,
} from 'react-native';
import { styled } from 'nativewind';
import { NonConformityInput, InspectionConclusionType, ResponseRequirements } from '@/interfaces/types';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const EditInspectionSummaryWithStats = ({
    currentFarmerReqs,
    nonConformRequirements,
    setConclusionInpectionData,
    conclusionInspectionData
}: StatsTableProps) => {
    // Column widths for non-conformity table
    const columnWidths = {
        nonConformite: 100,
        mesures: 250,
        delai: 100
    };

    // Calculate stats per chapter
    const chapterStats = useMemo(() => {
        const stats: { [key: string]: ChapterStats } = {};

        currentFarmerReqs.forEach(req => {
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
                ? (stat.conformity / stat.applicableRequirements) * 100
                : 0;
        });

        return stats;
    }, [currentFarmerReqs]);

    // Calculate totals
    const totals = useMemo(() => {
        return Object.values(chapterStats).reduce((acc, stat) => ({
            totalRequirements: acc.totalRequirements + stat.totalRequirements,
            applicableRequirements: acc.applicableRequirements + stat.applicableRequirements,
            conformity: acc.conformity + stat.conformity,
            // percentage: acc.applicableRequirements > 0
            //     ? (acc.conformity / acc.applicableRequirements) * 100
            //     : 0
            percentage: acc.percentage + stat.percentage
        }), {
            totalRequirements: 0,
            applicableRequirements: 0,
            conformity: 0,
            percentage: 0
        });
    }, [chapterStats]);

    // // Handle input changes for non-conformity recommendations
    // const handleInputChange = (index: number, field: keyof NonConformityInput, value: string) => {
    //     setConclusionInpectionData(prev => ({
    //         ...prev as InspectionConclusionType,
    //         nonConformityRecom: [{
    //             ...prev?.nonConformityRecom[index],
    //             [field]: value
    //         }],
    //         metadata: {
    //             ...prev?.metadata,
    //         }
    //     }));
    // };

    // Updated handleInputChange function
    const handleInputChange = (index: number, field: keyof NonConformityInput, value: string) => {
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
                [field]: value
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
        <SafeAreaView className=''>
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
                                                            `${stats.percentage.toFixed(1)}%`}
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
                        {conclusionInspectionData?.nonConformityRecom.map((req, index) => (
                            <StyledView key={index} className="flex-row border-t border-gray-300">
                                <StyledView style={{ width: columnWidths.nonConformite }} className="p-3 border-r border-gray-300">
                                    {/* <TextInput
                                        className="w-full p-2 border border-gray-200 rounded"
                                        value={req.req_number}
                                        onChangeText={(value) => handleInputChange(index, 'req_number', value)}
                                        placeholder="Requirement number"
                                    /> */}
                                    <Text className="w-full p-2 border border-gray-200 rounded">{req.req_number}</Text>
                                </StyledView>
                                <StyledView style={{ width: columnWidths.mesures }}
                                    className="p-1 border-r border-gray-300 "

                                >
                                    <TextInput
                                        className=" w-full p-2 border border-gray-200 rounded"
                                        multiline
                                        numberOfLines={2}
                                        value={req?.comment || ''}
                                        onChangeText={(value) => handleInputChange(index, 'comment', value)}
                                        placeholder="Enter corrective measures..."
                                    />
                                </StyledView>
                                <StyledView style={{ width: columnWidths.delai }} className="p-1">
                                    <TextInput
                                        className="w-full p-2 border border-gray-200 rounded"
                                        value={req?.deadline || ''}
                                        onChangeText={(value) => handleInputChange(index, 'deadline', value)}
                                        placeholder="Deadline"
                                    />
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

export default memo(EditInspectionSummaryWithStats);