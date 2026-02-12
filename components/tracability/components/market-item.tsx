
import React from "react";
import { View, Text } from "react-native";

import { styled } from "nativewind";

import { Market, } from "@/interfaces/types";


const StyledView = styled(View);

const RenderItem = ({ market }: { market: Market }) => (
    <StyledView className="flex-row flex-wrap  justify-between items-center">
        {renderTextField(market?.company_name, "Company name")}
        {renderTextField(market?.market_number, "Market Number")}
        {renderTextField(
            new Date(market?.start_date).toLocaleDateString() || "",
            "Start date"
        )}
        {renderTextField("", "End date")}
        {renderTextField(String(market?.price_of_day), "Price of the day")}
        {renderTextField(market?.status || "CLOSED", "Market Status")}
        {renderTextField(String(market?.type_of_market), "Type of Market")}
        {renderTextField(market?.location || "", "Market Location")}
        {renderTextField(String(market?.provider), "Supplier")}
    </StyledView>
);

const renderTextField = (value: string | undefined, label: string) => (
    <StyledView
        className={`${label.includes("Status") ? "flex-row gap-3 w-fit" : "flex-col items-start gap-1 w-1/2"
            }`}
    >
        <Text className="text-sm font-bold text-gray-900 ">{label}</Text>
        <Text className="text-sm text-gray-400">{value || "N/A"}</Text>
    </StyledView>
);

export default RenderItem;
