import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PrivacyPolicyScreen = () => {

    const router = useRouter();
    return (
        <SafeAreaView className="flex-1  p-4 ">
            <ScrollView className="flex-1 ">
                <View className="mb-6">
                    <Text className="text-2xl font-bold text-center mb-2">Senwisetool Privacy Policy</Text>
                    <Text className="text-sm text-gray-600 text-center">Last updated: 01/02/2025</Text>
                </View>

                <Text className="text-base mb-4">
                    Welcome to Senwisetool. Your privacy is our priority. This privacy policy explains how we collect, use, and protect your data when you use our application.
                </Text>

                <View className="mb-6">
                    <Text className="text-lg font-bold mb-2"> Data Collection</Text>
                    <Text className="text-base">
                        Senwisetool only collects device location data in the following cases:
                    </Text>
                    <View className="ml-4 mt-2">
                        <Text className="text-base mb-1">• When recording farmer(s) or plantation(s) position</Text>
                        <Text className="text-base mb-1">• During plantation inspections and mapping</Text>
                        <Text className="text-base mb-1">• When purchasing products from farmers</Text>
                        <Text className="text-base">• During training sessions conducted with farmers by Rainforest Alliance certified companies registered in our platform</Text>
                    </View>
                    <Text className="text-base mt-2">
                        No other personal data (name, phone number, address, etc.) is collected by the application.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-lg font-bold mb-2"> Data Usage</Text>
                    <Text className="text-base">
                        The collected location data is used exclusively for:
                    </Text>
                    <View className="ml-4 mt-2">
                        <Text className="text-base mb-1">• Identifying certified plantation locations: mapping functionality</Text>
                        <Text className="text-base mb-1">• Ensuring inspection: inspection functionality</Text>
                        <Text className="text-base mb-1">• Ensuring traceability process monitoring: traceability functionality</Text>

                        <Text className="text-base">• Generating internal reports for Rainforest Alliance certification</Text>
                    </View>
                    <Text className="text-base mt-2">
                        This data is not shared, sold, or used for any other purposes.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-lg font-bold mb-2"> Data Sharing</Text>
                    <Text className="text-base">
                        Senwisetool does not share any location data with third parties, including other applications, services, or companies. However, in certain legal situations (e.g., legal obligation, authorities' request), we may be required to disclose information if required by law.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-lg font-bold mb-2"> Data Storage and Security</Text>
                    <Text className="text-base">
                        We take strict measures to protect your data against unauthorized access, loss, or modification:
                    </Text>
                    <View className="ml-4 mt-2">
                        <Text className="text-base mb-1">• Secure data on transit and at rest</Text>
                        <Text className="text-base mb-1">• Secure data storage on protected servers</Text>
                        <Text className="text-base">• Restricted data access to authorized personnel only</Text>
                    </View>
                    <Text className="text-base mt-2">
                        Data usage is limited strictly to Rainforest Alliance sustainability and traceability processes. Data is retained only for the duration necessary for its intended use and is deleted after a certain period according to our data retention policy. Please contact   <Text className=" text-blue-500 underline mt-2">
                            senimacompany@gmail.com
                        </Text> for more details.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-lg font-bold mb-2"> User Rights</Text>
                    <Text className="text-base">
                        You have the following rights regarding your data:
                    </Text>
                    <View className="ml-4 mt-2">
                        <Text className="text-base mb-1">• Access: You can request to view collected data</Text>
                        <Text className="text-base mb-1">• Deletion: You can request deletion of your location data</Text>
                        <Text className="text-base">• Consent Withdrawal: You can disable location collection at any time through your device settings</Text>
                    </View>
                    <Text className="text-base mt-2">
                        To exercise these rights, contact us at   <Text className=" text-blue-500 underline mt-2">
                            senimacompany@gmail.com
                        </Text>
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-lg font-bold mb-2"> Cookies and Tracking Technologies</Text>
                    <Text className="text-base">
                        Senwisetool does not use cookies, trackers, or other tracking technologies to collect data about application usage.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-lg font-bold mb-2"> Privacy Policy Updates</Text>
                    <Text className="text-base">
                        We may update this privacy policy at any time. Users will be informed of any significant changes via an in-app notification. We encourage you to check this page regularly to stay informed about our practices.
                    </Text>
                </View>

                <View className="mb-6">
                    <Text className="text-lg font-bold mb-2"> Contact</Text>
                    <Text className="text-base">
                        For any questions or concerns regarding this privacy policy, you can contact us at:
                    </Text>

                    <Text className="text-base  ">
                        Company:
                        <Text className=" text-blue-500 underline mt-2">
                            senimacompany@gmail.com
                        </Text>
                    </Text>
                    <Text className="text-base  ">
                        Developer:
                        <Text className=" text-blue-500 underline mt-2">
                            bricefrkc@gmail.com
                        </Text>
                    </Text>
                </View>

                <Text className="text-base text-center mt-4 ">
                    Thank you for using Senwisetool and trusting us to protect your data!
                </Text>

                <TouchableOpacity onPress={() => router.push('/')}>
                    <Text className="text-blue-500 underline text-center">
                        Get Started
                    </Text>
                </TouchableOpacity>
            </ScrollView>
            <StatusBar animated style="auto" />
        </SafeAreaView>
    );
};

export default PrivacyPolicyScreen;