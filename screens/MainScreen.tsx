import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface MainScreenProps {
  onLogout: () => void;
}

export const MainScreen = ({ onLogout }: MainScreenProps) => {
  const [showBalance, setShowBalance] = useState(false);

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-white pt-16 pb-6 px-6 shadow-sm">
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
              <TouchableOpacity>
                <MaterialIcons name="search" size={26} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity>
                <MaterialIcons name="notifications-none" size={26} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onLogout} className="bg-red-50 p-2 rounded-full">
                <MaterialIcons name="logout" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Portfolio Card */}
        <View className="px-6 pt-6 mb-8">
          <LinearGradient
            colors={['#1e40af', '#3b82f6', '#60a5fa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-8 shadow-lg"
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-2xl font-bold">My Portfolio</Text>
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3">
                  <Text className="text-white font-bold text-lg">SB</Text>
                </View>
                <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                  <MaterialIcons 
                    name={showBalance ? "visibility" : "visibility-off"} 
                    size={24} 
                    color="#FFF" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="space-y-6">
              <View className="flex-row justify-between">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons name="account-balance-wallet" size={18} color="#FFF" />
                    <Text className="text-white/80 text-sm ml-2 font-medium">Account Balance</Text>
                  </View>
                  <Text className="text-white text-3xl font-bold">
                    {showBalance ? '₹ 2,50,000' : '₹ ••••••'}
                  </Text>
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons name="trending-up" size={18} color="#FFF" />
                    <Text className="text-white/80 text-sm ml-2 font-medium">Total Invested</Text>
                  </View>
                  <Text className="text-white text-xl font-semibold">
                    {showBalance ? '₹ 1,85,000' : '₹ ••••••'}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between">
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons name="savings" size={18} color="#FFF" />
                    <Text className="text-white/80 text-sm ml-2 font-medium">Current Value</Text>
                  </View>
                  <Text className="text-white text-xl font-semibold">
                    {showBalance ? '₹ 2,12,000' : '₹ ••••••'}
                  </Text>
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons name="show-chart" size={18} color="#FFF" />
                    <Text className="text-white/80 text-sm ml-2 font-medium">P&L</Text>
                  </View>
                  <Text className="text-green-300 text-xl font-bold">
                    {showBalance ? '+₹ 27,000' : '+₹ ••••••'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity className="bg-white/20 rounded-2xl py-4 px-6 mt-6 self-start">
              <Text className="text-white font-semibold text-lg">View Details</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Pay & Transfer Section */}
        <View className="px-6 mb-8">
          <Text className="text-black font-bold text-2xl mb-6">Pay & Transfer</Text>
          
          <View className="flex-row justify-between mb-6">
            <TouchableOpacity className="items-center">
              <View className="w-20 h-20 bg-blue-100 rounded-3xl items-center justify-center mb-3 shadow-sm">
                <MaterialIcons name="send" size={32} color="#3B82F6" />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Send{"\n"}Money</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
              <View className="w-20 h-20 bg-green-100 rounded-3xl items-center justify-center mb-3 shadow-sm">
                <MaterialIcons name="qr-code-scanner" size={32} color="#10B981" />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Scan{"\n"}Pay</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
              <View className="w-20 h-20 bg-purple-100 rounded-3xl items-center justify-center mb-3 shadow-sm">
                <MaterialIcons name="people" size={32} color="#8B5CF6" />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">My{"\n"}Beneficiary</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
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

          <TouchableOpacity className="items-center py-2 px-4">
            <MaterialIcons name="credit-card" size={28} color="#666" />
            <Text className="text-gray-600 text-sm font-medium mt-1">Cards</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center py-2 px-4">
            <MaterialIcons name="person" size={28} color="#666" />
            <Text className="text-gray-600 text-sm font-medium mt-1">Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
