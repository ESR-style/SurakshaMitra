import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface MainScreenProps {
  onLogout: () => void;
  onNavigateToSendMoney: () => void;
  onNavigateToCards: () => void;
  onNavigateToProfile: () => void;
  enableFirstActionTracking?: boolean; // Whether first action tracking is enabled
  onFirstActionCompleted?: () => void; // Callback when first action is completed
}

export const MainScreen = ({ onLogout, onNavigateToSendMoney, onNavigateToCards, onNavigateToProfile, enableFirstActionTracking = false, onFirstActionCompleted }: MainScreenProps) => {
  const [showBalance, setShowBalance] = useState(false);

  const handleBalanceToggle = () => {
    // Only log if first action tracking is enabled
    if (enableFirstActionTracking) {
      console.log(JSON.stringify({ firstAction: 'showBalance', pressed: !showBalance }));
      onFirstActionCompleted?.(); // Notify parent component
    }
    setShowBalance(!showBalance);
  };

  const handleFirstActionAndNavigate = (actionName: string, navigationFunction: () => void) => {
    // Log first action if tracking is enabled
    if (enableFirstActionTracking) {
      console.log(JSON.stringify({ firstAction: actionName }));
      onFirstActionCompleted?.(); // Notify parent component
    }
    navigationFunction();
  };

  const handleOtherInteraction = (actionName?: string) => {
    // Log first action if tracking is enabled and action name is provided
    if (enableFirstActionTracking && actionName) {
      console.log(JSON.stringify({ firstAction: actionName }));
      onFirstActionCompleted?.(); // Notify parent component
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-white pt-8 pb-3 px-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-blue-600 items-center justify-center mr-4 shadow-lg">
                <Text className="text-white font-bold text-lg">SB</Text>
              </View>
              <View>
                <Text className="text-gray-400 text-sm">Welcome back</Text>
                <Text className="text-black font-bold text-lg">DEAR CUSTOMER</Text>
              </View>
            </View>
            <View className="flex-row items-center space-x-6">
              <TouchableOpacity onPress={() => handleOtherInteraction('search')}>
                <MaterialIcons name="search" size={26} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleOtherInteraction('notifications')}>
                <MaterialIcons name="notifications-none" size={26} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleFirstActionAndNavigate('logout', onLogout)} className="bg-red-50 p-2 rounded-full">
                <MaterialIcons name="logout" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Portfolio Card */}
        <View className="px-6 pt-3 mb-8">
          <LinearGradient
            colors={['#1e40af', '#3b82f6', '#60a5fa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-8 shadow-lg"
          >
            <View className="flex-row items-center justify-between mb-3 m">
              <Text className="text-white text-2xl font-bold">My Portfolio</Text>
              <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                <Text className="text-white font-bold text-lg">SB</Text>
              </View>
            </View>

            <View className="space-y-6 ">
              {/* 2x2 Grid Layout with proper spacing */}
              <View className="space-y-2 mb-5 mt-3">
                {/* Top Row */}
                <View className="flex-row space-x-4">
                  <View className="flex-1 bg-white/10 rounded-1xl p-3 mx-3">
                    <View className="flex-row items-center mb-3">
                      <MaterialIcons name="account-balance-wallet" size={18} color="#FFF" />
                      <Text className="text-white/80 text-sm ml-2 font-medium">Balance(A/C)</Text>
                    </View>
                    <Text className="text-white text-xl font-bold">
                      {showBalance ? '₹ 2,50,000' : '₹ ••••••'}
                    </Text>
                  </View>

                  <View className="flex-1 bg-white/10 rounded-1xl p-4 ">
                    <View className="flex-row items-center mb-1">
                      <MaterialIcons name="credit-card" size={18} color="#FFF" />
                      <Text className="text-white/80 text-sm ml-1 font-medium">OD Account(A/C)</Text>
                    </View>
                    <Text className="text-white text-xl font-bold">
                      {showBalance ? '₹ 45,000' : '₹ ••••••'}
                    </Text>
                  </View>
                </View>

                {/* Bottom Row */}
                <View className="flex-row space-x-4 mt-3">
                  <View className="flex-1 bg-white/10 rounded-1xl p-3 mx-3">
                    <View className="flex-row items-center mb-2">
                      <MaterialIcons name="home" size={18} color="#FFF" />
                      <Text className="text-white/80 text-sm ml-2 font-medium">Loans ( A/C )</Text>
                    </View>
                    <Text className="text-white text-xl font-bold">
                      {showBalance ? '₹ 14,60,000' : '₹ ••••••••'}
                    </Text>
                  </View>

                  <View className="flex-1 bg-white/10 rounded-1xl p-3">
                    <View className="flex-row items-center mb-2">
                      <MaterialIcons name="savings" size={18} color="#FFF" />
                      <Text className="text-white/80 text-sm ml-2 font-medium">Deposits(A/C)</Text>
                    </View>
                    <Text className="text-white text-xl font-bold">
                      {showBalance ? '₹ 5,75,000' : '₹ ••••••••'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Toggle Switch Style Eye Button */}
              <View className="items-center">
                <TouchableOpacity 
                  onPress={handleBalanceToggle}
                  className={`flex-row items-center p-1 rounded-full border-2 w-16 h-8 ${
                    showBalance 
                      ? 'bg-white/30 border-white/50 justify-end' 
                      : 'bg-white/10 border-white/30 justify-start'
                  }`}
                >
                  <View className={`w-6 h-6 rounded-full items-center justify-center ${
                    showBalance ? 'bg-white' : 'bg-white/50'
                  }`}>
                    <MaterialIcons 
                      name={showBalance ? "visibility" : "visibility-off"} 
                      size={14} 
                      color={showBalance ? "#2563eb" : "#FFF"} 
                    />
                  </View>
                </TouchableOpacity>
                <Text className="text-white/70 text-xs mt-2">
                  {showBalance ? 'Hide Balance' : 'Show Balance'}
                </Text>
              </View>
            </View>

          </LinearGradient>
        </View>

        {/* Pay & Transfer Section */}
        <View className="px-6 mb-8">
          <Text className="text-black font-bold text-2xl mb-6">Pay & Transfer</Text>
          
          <View className="flex-row justify-between mb-6">
            <TouchableOpacity className="items-center" onPress={() => handleFirstActionAndNavigate('sendMoney', onNavigateToSendMoney)}>
              <View className="w-20 h-20 bg-blue-100 rounded-3xl items-center justify-center mb-3 shadow-sm">
                <MaterialIcons name="send" size={32} color="#3B82F6" />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Send{"\n"}Money</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center" onPress={() => handleOtherInteraction('scanPay')}>
              <View className="w-20 h-20 bg-green-100 rounded-3xl items-center justify-center mb-3 shadow-sm">
                <MaterialIcons name="qr-code-scanner" size={32} color="#10B981" />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Scan{"\n"}Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center" onPress={() => handleOtherInteraction('myBeneficiary')}>
              <View className="w-20 h-20 bg-purple-100 rounded-3xl items-center justify-center mb-3 shadow-sm">
                <MaterialIcons name="people" size={32} color="#8B5CF6" />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">My{"\n"}Beneficiary</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center" onPress={() => handleOtherInteraction('passbook')}>
              <View className="w-20 h-20 bg-orange-100 rounded-3xl items-center justify-center mb-3 shadow-sm">
                <MaterialIcons name="book" size={32} color="#F97316" />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Pass{"\n"}book</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between">
            <TouchableOpacity className="items-center">
              <View className="w-20 h-20 bg-yellow-100 rounded-3xl items-center justify-center mb-3 shadow-sm">
                <MaterialIcons name="credit-card" size={32} color="#F59E0B" />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Card{"\n"}Services</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
              <View className="w-20 h-20 bg-cyan-100 rounded-3xl items-center justify-center mb-3 shadow-sm">
                <MaterialIcons name="qr-code" size={32} color="#06B6D4" />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Generate{"\n"}QR</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
              <View className="w-20 h-20 bg-pink-100 rounded-3xl items-center justify-center mb-3 shadow-sm">
                <MaterialIcons name="history" size={32} color="#EC4899" />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Transaction{"\n"}History</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
              <View className="w-20 h-20 bg-gray-100 rounded-3xl items-center justify-center mb-3 shadow-sm">
                <MaterialIcons name="settings" size={32} color="#6B7280" />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Manage{"\n"}Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* UPI Section */}
        <View className="px-6 mb-8">
          <View className="bg-blue-50 rounded-2xl p-6 flex-row items-center shadow-sm">
            <View className="flex-1">
              <Text className="text-blue-800 font-bold text-lg mb-1">UPI Services</Text>
              <Text className="text-blue-600 font-medium">UPI ID: customer@suraksha</Text>
            </View>
            <TouchableOpacity className="bg-blue-600 rounded-xl px-6 py-3">
              <Text className="text-white font-semibold text-lg">More</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="h-32" />
      </ScrollView>

      {/* Bottom Navigation - Larger and Better Aligned */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl">
        <View className="flex-row justify-around items-center py-4 px-2">
          <TouchableOpacity className="items-center py-2 px-4">
            <MaterialIcons name="home" size={28} color="#3B82F6" />
            <Text className="text-blue-600 text-sm font-medium mt-1">Home</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center py-2 px-4">
            <MaterialIcons name="apps" size={28} color="#666" />
            <Text className="text-gray-600 text-sm font-medium mt-1">Services</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center bg-blue-600 rounded-full p-4 -mt-8 shadow-lg">
            <MaterialIcons name="qr-code-scanner" size={32} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity className="items-center py-2 px-4" onPress={() => handleFirstActionAndNavigate('cards', onNavigateToCards)}>
            <MaterialIcons name="credit-card" size={28} color="#666" />
            <Text className="text-gray-600 text-sm font-medium mt-1">Cards</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center py-2 px-4" onPress={() => handleFirstActionAndNavigate('profile', onNavigateToProfile)}>
            <MaterialIcons name="person" size={28} color="#666" />
            <Text className="text-gray-600 text-sm font-medium mt-1">Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
