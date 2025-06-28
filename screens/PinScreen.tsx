import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, TextInput, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface PinScreenProps {
  onPinComplete: () => void;
}

export const PinScreen = ({ onPinComplete }: PinScreenProps) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinChange = (text: string) => {
    if (text.length <= 6 && /^\d*$/.test(text)) {
      setPin(text);
      
      if (text.length === 6) {
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          onPinComplete();
        }, 800);
      }
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header with Logo */}
      <View className="bg-white pt-16 pb-8 px-6">
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center mb-4 shadow-lg">
            <MaterialIcons name="account-balance" size={36} color="white" />
          </View>
          <Text className="text-blue-800 font-bold text-2xl mb-1">SURAKSHA BANK</Text>
          <Text className="text-blue-600 font-semibold text-lg">सुरक्षा बैंक</Text>
        </View>
      </View>

      {/* PIN Section */}
      <View className="flex-1 px-6 pt-4">
        <View className="items-center mb-8">
          <Text className="text-blue-800 text-2xl font-bold mb-2">Enter PIN</Text>
          <Text className="text-blue-500 text-base text-center">Enter your 6-digit PIN to access your account</Text>
        </View>

        {/* PIN Input Circles with more spacing */}
        <View className="mb-8">
          <View className="flex-row justify-center items-center space-x-6 mb-6">
            {[...Array(6)].map((_, index) => (
              <View
                key={index}
                className={`w-14 h-14 rounded-full border-2 items-center justify-center ${
                  index < pin.length 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'bg-white border-blue-300'
                }`}
              >
                {index < pin.length && (
                  <View className="w-3 h-3 rounded-full bg-white" />
                )}
              </View>
            ))}
          </View>
          
          {/* Hidden TextInput */}
          <TextInput
            value={pin}
            onChangeText={handlePinChange}
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry={false}
            className="opacity-0 absolute w-full h-16 text-center"
            autoFocus={true}
            caretHidden={true}
          />
          
          <TouchableOpacity className="bg-blue-50 rounded-xl py-4 px-6 items-center border border-blue-200">
            <Text className="text-blue-600 font-medium text-base">Tap to enter PIN</Text>
          </TouchableOpacity>
        </View>

        {/* Forgot PIN */}
        <TouchableOpacity className="items-center mb-8">
          <Text className="text-blue-600 font-semibold text-base">Forgot PIN?</Text>
        </TouchableOpacity>

        {/* Quick Services - White and Blue Theme */}
        <View className="mb-8">
          <Text className="text-blue-800 font-bold text-lg mb-4">Quick Services</Text>
          <View className="flex-row justify-between">
            <TouchableOpacity className="items-center flex-1">
              <View className="w-14 h-14 bg-blue-50 rounded-xl items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="account-balance-wallet" size={26} color="#2563eb" />
              </View>
              <Text className="text-blue-700 font-medium text-xs text-center">Send Money</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center flex-1">
              <View className="w-14 h-14 bg-blue-50 rounded-xl items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="qr-code-scanner" size={26} color="#2563eb" />
              </View>
              <Text className="text-blue-700 font-medium text-xs text-center">Scan & Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center flex-1">
              <View className="w-14 h-14 bg-blue-50 rounded-xl items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="account-balance" size={26} color="#2563eb" />
              </View>
              <Text className="text-blue-700 font-medium text-xs text-center">Balance</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center flex-1">
              <View className="w-14 h-14 bg-blue-50 rounded-xl items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="support-agent" size={26} color="#2563eb" />
              </View>
              <Text className="text-blue-700 font-medium text-xs text-center">Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Services Row */}
        <View className="mb-8">
          <View className="flex-row justify-around">
            <TouchableOpacity className="items-center">
              <View className="w-12 h-12 bg-blue-50 rounded-lg items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="receipt" size={22} color="#2563eb" />
              </View>
              <Text className="text-blue-600 text-xs">Bill Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
              <View className="w-12 h-12 bg-blue-50 rounded-lg items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="currency-rupee" size={22} color="#2563eb" />
              </View>
              <Text className="text-blue-600 text-xs">Recharge</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
              <View className="w-12 h-12 bg-blue-50 rounded-lg items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="help-outline" size={22} color="#2563eb" />
              </View>
              <Text className="text-blue-600 text-xs">Help</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
              <View className="w-12 h-12 bg-blue-50 rounded-lg items-center justify-center mb-2 border border-blue-100">
                <MaterialIcons name="more-horiz" size={22} color="#2563eb" />
              </View>
              <Text className="text-blue-600 text-xs">More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bottom Promotional Area - White and Blue Theme */}
      <View className="bg-white px-6 py-6 border-t border-blue-100">
        <View className="bg-blue-600 rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white font-bold text-base">✨ Digital Banking Experience</Text>
              <Text className="text-blue-100 text-sm">Smart, Secure, Simple</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={20} color="white" />
          </View>
        </View>

        <View className="flex-row space-x-3 mb-4">
          <View className="flex-1 bg-blue-50 rounded-lg p-3 border border-blue-200">
            <Text className="text-blue-800 font-semibold text-sm">🎯 Instant Loans</Text>
            <Text className="text-blue-600 text-xs">Pre-approved offers</Text>
          </View>
          
          <View className="flex-1 bg-blue-50 rounded-lg p-3 border border-blue-200">
            <Text className="text-blue-800 font-semibold text-sm">💳 Zero Fee Cards</Text>
            <Text className="text-blue-600 text-xs">Lifetime free</Text>
          </View>
        </View>

        {/* Security Footer */}
        <View className="items-center pt-4 border-t border-blue-100">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="security" size={16} color="#2563eb" />
            <Text className="text-blue-600 font-medium text-sm ml-2">Secured by 256-bit encryption</Text>
          </View>
          <Text className="text-blue-500 text-xs text-center">
            Your data is protected with bank-grade security
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};
 
