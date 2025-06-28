import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface CardsScreenProps {
  onBack: () => void;
}

export const CardsScreen = ({ onBack }: CardsScreenProps) => {
  const [showCardDetails, setShowCardDetails] = useState<{ [key: string]: boolean }>({});

  const toggleCardDetails = (cardId: string) => {
    setShowCardDetails(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const cards = [
    {
      id: '1',
      type: 'Credit Card',
      name: 'Suraksha Platinum',
      number: '4532 **** **** 8765',
      fullNumber: '4532 1234 5678 8765',
      expiry: '12/28',
      cvv: '123',
      limit: '₹5,00,000',
      available: '₹4,55,000',
      gradient: ['#1e40af', '#3b82f6', '#60a5fa'],
      status: 'Active'
    },
    {
      id: '2',
      type: 'Debit Card',
      name: 'Suraksha Classic',
      number: '5678 **** **** 4321',
      fullNumber: '5678 9012 3456 4321',
      expiry: '09/27',
      cvv: '456',
      limit: '₹2,00,000',
      available: '₹1,85,000',
      gradient: ['#059669', '#10b981', '#34d399'],
      status: 'Active'
    },
    {
      id: '3',
      type: 'Credit Card',
      name: 'Suraksha Gold',
      number: '9876 **** **** 1234',
      fullNumber: '9876 5432 1098 1234',
      expiry: '06/26',
      cvv: '789',
      limit: '₹3,00,000',
      available: '₹2,75,000',
      gradient: ['#d97706', '#f59e0b', '#fbbf24'],
      status: 'Blocked'
    }
  ];

  const cardServices = [
    { icon: 'block', name: 'Block Card', color: '#ef4444' },
    { icon: 'pin', name: 'Change PIN', color: '#2563eb' },
    { icon: 'credit-card', name: 'Card Limit', color: '#8b5cf6' },
    { icon: 'receipt', name: 'Statements', color: '#10b981' },
    { icon: 'settings', name: 'Card Settings', color: '#f59e0b' },
    { icon: 'support-agent', name: 'Support', color: '#6b7280' }
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View className="bg-white pt-16 pb-4 px-6 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onBack} className="mr-4">
              <MaterialIcons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-gray-800 font-bold text-xl">My Cards</Text>
          </View>
          <TouchableOpacity>
            <MaterialIcons name="add" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Cards Section */}
        <View className="px-6 py-6">
          <View className="space-y-6">
            {cards.map((card) => (
              <View key={card.id} className="rounded-2xl overflow-hidden shadow-lg">
                <LinearGradient
                  colors={card.gradient as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-6"
                >
                  {/* Card Header */}
                  <View className="flex-row items-center justify-between mb-6">
                    <View>
                      <Text className="text-white/80 text-sm font-medium">{card.type}</Text>
                      <Text className="text-white text-lg font-bold">{card.name}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className={`px-3 py-1 rounded-full ${
                        card.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        <Text className="text-white text-xs font-medium">{card.status}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => toggleCardDetails(card.id)}
                        className="ml-3"
                      >
                        <MaterialIcons 
                          name={showCardDetails[card.id] ? "visibility-off" : "visibility"} 
                          size={24} 
                          color="white" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Card Number */}
                  <View className="mb-6">
                    <Text className="text-white text-xl font-mono tracking-wider">
                      {showCardDetails[card.id] ? card.fullNumber : card.number}
                    </Text>
                  </View>

                  {/* Card Details */}
                  <View className="flex-row justify-between items-end">
                    <View>
                      <Text className="text-white/70 text-xs mb-1">VALID THRU</Text>
                      <Text className="text-white text-base font-semibold">
                        {showCardDetails[card.id] ? card.expiry : '**/**'}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-white/70 text-xs mb-1">CVV</Text>
                      <Text className="text-white text-base font-semibold">
                        {showCardDetails[card.id] ? card.cvv : '***'}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-white/70 text-xs mb-1">LIMIT</Text>
                      <Text className="text-white text-base font-semibold">{card.limit}</Text>
                    </View>
                  </View>
                </LinearGradient>

                {/* Card Info */}
                <View className="bg-white p-4">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-gray-500 text-sm">Available Limit</Text>
                      <Text className="text-gray-800 text-lg font-bold">{card.available}</Text>
                    </View>
                    <TouchableOpacity className="bg-blue-50 px-4 py-2 rounded-lg">
                      <Text className="text-blue-600 font-semibold">View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Card Services */}
        <View className="px-6 pb-6">
          <Text className="text-gray-800 font-bold text-lg mb-4">Card Services</Text>
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row flex-wrap">
              {cardServices.map((service, index) => (
                <TouchableOpacity
                  key={index}
                  className="w-1/3 items-center py-4"
                >
                  <View 
                    className="w-12 h-12 rounded-xl items-center justify-center mb-2"
                    style={{ backgroundColor: `${service.color}20` }}
                  >
                    <MaterialIcons name={service.icon as any} size={24} color={service.color} />
                  </View>
                  <Text className="text-gray-700 text-xs font-medium text-center">
                    {service.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Apply for New Card */}
        <View className="px-6 pb-8">
          <TouchableOpacity className="bg-blue-600 rounded-2xl p-6 shadow-lg">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white font-bold text-lg mb-1">Apply for New Card</Text>
                <Text className="text-blue-100 text-sm">Get instant approval in 2 minutes</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
