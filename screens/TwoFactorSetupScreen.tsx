import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface TwoFactorSetupScreenProps {
  onComplete: (choice: number) => void;
}

export const TwoFactorSetupScreen = ({ onComplete }: TwoFactorSetupScreenProps) => {
  const handleChoice = async (choice: number) => {
    console.log(JSON.stringify({ twoFactorChoice: choice }));
    
    // Send to backend for validation
    try {
      const { backendService } = await import('../services/BackendService');
      const response = await backendService.checkTwoFactor(choice);
      
      console.log('✅ Two-Factor Authentication Backend Response:');
      console.log(JSON.stringify(response, null, 2));
      
      // Log specific results
      if (response.authenticated) {
        console.log('🔓 TWO-FACTOR AUTHENTICATION SUCCESSFUL');
        console.log(`📊 Choice: ${response.choice}`);
        console.log(`💬 Message: ${response.message}`);
      } else {
        console.log('🔒 TWO-FACTOR AUTHENTICATION FAILED');
        console.log(`📊 Choice: ${response.choice}`);
        console.log(`💬 Message: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Backend Two-Factor Authentication Error:', error);
      
      // Fallback: still log the raw data format
      console.log('📝 Raw Two-Factor Data (for manual backend testing):');
      console.log(JSON.stringify({ twoFactorChoice: choice }));
    }
    
    onComplete(choice);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View className="bg-white pt-16 pb-8 px-6">
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center mb-4 shadow-lg">
            <MaterialIcons name="security" size={36} color="white" />
          </View>
          <Text className="text-blue-800 font-bold text-2xl mb-1">SURAKSHA BANK</Text>
          <Text className="text-blue-600 font-semibold text-lg">सुरक्षा बैंक</Text>
        </View>
      </View>

      {/* Two Factor Setup Content */}
      <View className="flex-1 px-6 pt-4">
        <View className="items-center mb-8">
          <Text className="text-blue-800 text-2xl font-bold mb-4 text-center">
            Enhanced Security Setup
          </Text>
          <Text className="text-blue-500 text-base text-center leading-6">
            Set up Two-Factor Authentication to add an extra layer of security to your account
          </Text>
        </View>

        {/* Security Benefits */}
        <View className="bg-blue-50 rounded-xl p-6 mb-8 border border-blue-200">
          <View className="flex-row items-center mb-4">
            <MaterialIcons name="verified-user" size={24} color="#2563eb" />
            <Text className="text-blue-800 font-bold text-lg ml-3">Why Enable 2FA?</Text>
          </View>
          
          <View className="space-y-3">
            <View className="flex-row items-start">
              <MaterialIcons name="check-circle" size={20} color="#10b981" />
              <Text className="text-blue-700 ml-3 flex-1">
                Protects your account even if your PIN is compromised
              </Text>
            </View>
            
            <View className="flex-row items-start">
              <MaterialIcons name="check-circle" size={20} color="#10b981" />
              <Text className="text-blue-700 ml-3 flex-1">
                Receive instant alerts for any suspicious activity
              </Text>
            </View>
            
            <View className="flex-row items-start">
              <MaterialIcons name="check-circle" size={20} color="#10b981" />
              <Text className="text-blue-700 ml-3 flex-1">
                Secure your transactions with SMS or app-based verification
              </Text>
            </View>
          </View>
        </View>

        {/* Setup Methods */}
        <View className="mb-8">
          <Text className="text-blue-800 font-bold text-lg mb-4">Available Methods</Text>
          <View className="space-y-3">
            <View className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
              <View className="flex-row items-center">
                <MaterialIcons name="sms" size={20} color="#2563eb" />
                <Text className="text-blue-700 font-medium ml-3">SMS Verification</Text>
              </View>
            </View>
            
            <View className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
              <View className="flex-row items-center">
                <MaterialIcons name="smartphone" size={20} color="#2563eb" />
                <Text className="text-blue-700 font-medium ml-3">Authenticator App</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="px-6 py-6 bg-white border-t border-blue-100">
        {/* Main Yes Button */}
        <TouchableOpacity 
          onPress={() => handleChoice(3)}
          className="bg-blue-600 rounded-xl py-4 px-6 items-center mb-4 shadow-sm"
        >
          <Text className="text-white font-bold text-lg">Yes, Enable 2FA</Text>
        </TouchableOpacity>

        {/* Secondary Options */}
        <View className="space-y-3">
          <TouchableOpacity 
            onPress={() => handleChoice(1)}
            className="bg-blue-50 rounded-xl py-3 px-6 items-center border border-blue-200"
          >
            <Text className="text-blue-600 font-semibold text-base">Do It Later</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => handleChoice(2)}
            className="bg-gray-50 rounded-xl py-3 px-6 items-center border border-gray-200"
          >
            <Text className="text-gray-600 font-semibold text-base">No, Skip This</Text>
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View className="items-center pt-4 border-t border-blue-100 mt-4">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="info" size={16} color="#2563eb" />
            <Text className="text-blue-600 font-medium text-sm ml-2">
              You can enable this later in Settings
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
