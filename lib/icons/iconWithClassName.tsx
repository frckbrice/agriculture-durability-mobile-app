import * as  React from 'react';
import { StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { styled } from 'nativewind';

interface StyledIconProps {
    icon: LucideIcon;
    className?: string;
    size?: number;
    color?: string;
}

const StyledView = styled(View);

export const StyledIcon: React.FC<StyledIconProps> = ({ icon: Icon, className, size, color, ...props }) => {
    return (
        <StyledView className={className} >
            <Icon size={size} color={color} {...props} />
        </StyledView>
    );
};

export function iconWithClassName(icon: LucideIcon) {
    return (props: Omit<StyledIconProps, 'icon'>) => <StyledIcon icon={icon} {...props} />;
}
