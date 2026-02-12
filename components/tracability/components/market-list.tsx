import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { styled } from 'nativewind';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { Market } from '@/interfaces/types';
import { useAgentProjects } from '@/hooks/use-agent-projects';
import { useMarketStore } from '@/store/current-market-store';
import RenderItem from './market-item';
import { useRouter } from 'expo-router';

const StyledView = styled(View);
const StyledPressable = styled(Pressable);

const MarketsAccordionPage = () => {
    const {
        marketProjects: markets
    } = useAgentProjects();
    const {
        saveMarket
    } = useMarketStore();
    const router = useRouter();

    const [expandedId, setExpandedId] = React.useState<string | null>(null);

    const handleMarketPress = (market: Market) => {
        saveMarket(market);
        router.push('/(traceability)/markets');
    };

    const toggleAccordion = (marketId: string) => {
        setExpandedId(expandedId === marketId ? null : marketId);
    };

    return (
        <StyledView className="flex-1 bg-white p-4">
            <Text className="text-xl font-bold mb-4">Markets</Text>

            {markets?.map((market: Market) => (
                <StyledView
                    key={market.market_number}
                    className="mb-2 border border-gray-200 rounded-lg overflow-hidden"
                >
                    <StyledPressable
                        onPress={() => toggleAccordion(market.market_number)}
                        className="flex-row justify-between items-center p-4 bg-gray-50"
                    >
                        <Text className="font-semibold text-base">
                            {market.company_name || 'Unnamed Market'}
                        </Text>
                        {expandedId === market.market_number ? (
                            <ChevronUp size={20} color="#4B5563" />
                        ) : (
                            <ChevronDown size={20} color="#4B5563" />
                        )}
                    </StyledPressable>

                    {expandedId === market.market_number && (
                        <StyledView className="p-4">
                            <RenderItem market={market} />
                            <StyledPressable
                                onPress={() => handleMarketPress(market)}
                                className="mt-4 bg-blue-500 p-3 rounded-md"
                            >
                                <Text className="text-white text-center font-semibold">
                                    View Market Details
                                </Text>
                            </StyledPressable>
                        </StyledView>
                    )}
                </StyledView>
            ))}
        </StyledView>
    );
};

export default MarketsAccordionPage;