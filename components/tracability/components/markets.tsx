
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { FlatList, View, ActivityIndicator, RefreshControl } from "react-native";
import { useNetInfo } from "@react-native-community/netinfo";
import { styled } from "nativewind";
import { useFarmerStore } from "@/store/farmer-person-store";
import { useMarketStore } from "@/store/current-market-store";
import { fetchResourceByItsID, getAllFarmersOfThisLocation, getAssignedMarket } from "../../../lib/api";
import { Market } from "@/interfaces/types";
import { Colors } from "../../../constants";
import { useCompanyStore } from "@/store/current-company-store";
import RenderItem from "./market-item";

const StyledView = styled(View);


type TMarketProp = {
    setMarketProps: React.Dispatch<React.SetStateAction<Partial<Market>>>
    // endMarket: boolean;
}
const Markets = ({ setMarketProps }: TMarketProp) => {

    const [location, setLocation] = useState("");
    const [markets, setMarkets] = useState<Market[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const { type, isConnected } = useNetInfo();


    const [isLoading, setIsLoading] = useState(true);
    const { saveFarmers, clearFarmers } = useFarmerStore();
    const {
        saveMarket,
        getMarket,
    } = useMarketStore();
    const {
        saveCompany
    } = useCompanyStore();


    const loadAndProcessData = useCallback(async () => {
        try {
            // if (!getMarket()) // check if thre is already a maket set from the select-chapter component
            // getAssignedMarket().then(async (market) => {
            const market = getMarket();
            if (market) {
                setMarkets([market]);
                setMarketProps(market as Partial<Market>);
                saveMarket(market);

                const [farmers, company] = await Promise.all([
                    getAllFarmersOfThisLocation(market?.location || location),
                    fetchResourceByItsID('companies', market?.company_id),
                ]);
                console.log("\n\n from market component farmers from this location:", {
                    location: market?.location,
                    farmers,
                });
                // we clear old farmers first before saving new ones.
                clearFarmers();
                console.log("\n\n from market component current company", {
                    company: company?.data
                });
                saveFarmers(farmers.data);
                saveCompany({
                    company_id: company?.data?.id,
                    company_name: company?.data?.name,
                    company_bucket: company?.data.company_bucket,
                    company_logo: company?.data?.logo,
                    status: company?.data?.status
                });
            }

            // }).catch((e) => console.error(e))

        } catch (error) {
            console.error("Error fetching data :", error);
        }
    }, [saveFarmers, saveCompany, clearFarmers, fetchResourceByItsID, getAllFarmersOfThisLocation]);

    const loadOfflineData = useCallback(async () => {
        try {
            const marketFromStore = getMarket();
            console.log("\n restore offline market: ", marketFromStore)
            setMarkets([marketFromStore] as Market[]);
        } catch (error) {
            console.error("Error loading offline data:", error);
        }
    }, [getMarket, setMarkets]);

    useEffect(() => {
        const initializeData = async () => {
            setIsLoading(true);
            try {
                if (isConnected) {
                    await loadAndProcessData();
                } else {
                    await loadOfflineData();
                }
            } catch (error) {
                console.error("\n\n error fetching market data: ", error);
            } finally {
                setIsLoading(false);
            };
            setIsLoading(false);
        };

        initializeData();
    }, [isConnected, loadOfflineData, loadAndProcessData]);

    // Refresh handler
    const onRefresh = useCallback(async () => {
        if (isConnected && !refreshing) {
            setRefreshing(true);
            await loadAndProcessData();
            setRefreshing(false);
        }
    }, [isConnected, refreshing, loadAndProcessData]);

    if (isLoading)
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginBottom: 40 }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );


    // console.log("\n\n market : ", market)
    // console.log("\n\n markets: ", markets)

    return (
        <FlatList
            data={markets}
            keyExtractor={(item) => item?.market_number}
            renderItem={({ item }) => <RenderItem market={item} />}
            refreshing={isLoading}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ padding: 16 }}
        />
    );
};

export default memo(Markets);