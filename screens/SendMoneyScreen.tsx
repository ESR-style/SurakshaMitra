import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SendMoneyScreenProps {
  onBack: () => void;
}

export const SendMoneyScreen = ({ onBack }: SendMoneyScreenProps) => {
  const [amount, setAmount] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const recentContacts = [
    { id: '1', name: 'Rajesh Kumar', phone: '+91 98765 43210', avatar: 'RK' },
    { id: '2', name: 'Priya Sharma', phone: '+91 87654 32109', avatar: 'PS' },
    { id: '3', name: 'Amit Singh', phone: '+91 76543 21098', avatar: 'AS' },
    { id: '4', name: 'Neha Gupta', phone: '+91 65432 10987', avatar: 'NG' },
  ];

  const quickAmounts = ['₹100', '₹500', '₹1000', '₹2000', '₹5000'];

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View className="bg-white pt-16 pb-4 px-6 shadow-sm border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={onBack} className="mr-4">
            <MaterialIcons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-gray-800 font-bold text-xl flex-1">Send Money</Text>
          <TouchableOpacity>
            <MaterialIcons name="history" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Amount Input Section */}
        <View className="px-6 py-6 bg-blue-50">
          <Text className="text-blue-800 font-semibold text-base mb-4">Enter Amount</Text>
          <View className="bg-white rounded-xl p-4 border border-blue-200">
            <Text className="text-gray-500 text-sm mb-2">Amount to Send</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="₹ 0"
              keyboardType="numeric"
              className="text-3xl font-bold text-gray-800"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          {/* Quick Amount Buttons */}
          <View className="flex-row flex-wrap mt-4 gap-2">
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                onPress={() => setAmount(quickAmount.replace('₹', ''))}
                className="bg-white rounded-lg px-4 py-2 border border-blue-200"
              >
                <Text className="text-blue-600 font-medium">{quickAmount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Send To Section */}
        <View className="px-6 py-6">
          <Text className="text-gray-800 font-bold text-lg mb-4">Send To</Text>
          
          {/* Send Options */}
          <View className="flex-row justify-between mb-6">
            <TouchableOpacity className="items-center flex-1">
              <View className="w-16 h-16 bg-blue-100 rounded-2xl items-center justify-center mb-2">
                <MaterialIcons name="phone" size={28} color="#2563eb" />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Phone{'\n'}Number</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center flex-1">
              <View className="w-16 h-16 bg-green-100 rounded-2xl items-center justify-center mb-2">
                <MaterialIcons name="qr-code-scanner" size={28} color="#10b981" />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Scan QR{'\n'}Code</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center flex-1">
              <View className="w-16 h-16 bg-purple-100 rounded-2xl items-center justify-center mb-2">
                <MaterialIcons name="account-balance" size={28} color="#8b5cf6" />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Bank{'\n'}Account</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center flex-1">
              <View className="w-16 h-16 bg-orange-100 rounded-2xl items-center justify-center mb-2">
                <MaterialIcons name="contacts" size={28} color="#f97316" />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Phone{'\n'}Contacts</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Contacts */}
          <View className="mb-6">
            <Text className="text-gray-800 font-semibold text-base mb-4">Recent Contacts</Text>
            <View className="space-y-3">
              {recentContacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  onPress={() => setSelectedContact(contact.id)}
                  className={`flex-row items-center p-4 rounded-xl border ${
                    selectedContact === contact.id
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <View className="w-12 h-12 rounded-full bg-blue-600 items-center justify-center mr-4">
                    <Text className="text-white font-bold text-sm">{contact.avatar}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold text-base">{contact.name}</Text>
                    <Text className="text-gray-500 text-sm">{contact.phone}</Text>
                  </View>
                  <MaterialIcons 
                    name={selectedContact === contact.id ? "radio-button-checked" : "radio-button-unchecked"} 
                    size={24} 
                    color={selectedContact === contact.id ? "#2563eb" : "#9CA3AF"} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* UPI ID Input */}
          <View className="mb-6">
            <Text className="text-gray-800 font-semibold text-base mb-3">Or Enter UPI ID</Text>
            <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <TextInput
                placeholder="example@upi"
                className="text-gray-800 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="px-6 py-4 bg-white border-t border-gray-100">
        <View className="flex-row space-x-3">
          <TouchableOpacity className="flex-1 bg-gray-100 rounded-xl py-4 items-center">
            <Text className="text-gray-600 font-semibold text-base">Save as Draft</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className={`flex-1 rounded-xl py-4 items-center ${
              amount && selectedContact 
                ? 'bg-blue-600' 
                : 'bg-gray-300'
            }`}
            disabled={!amount || !selectedContact}
          >
            <Text className={`font-bold text-base ${
              amount && selectedContact 
                ? 'text-white' 
                : 'text-gray-500'
            }`}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Security Info */}
        <View className="items-center pt-3">
          <View className="flex-row items-center">
            <MaterialIcons name="security" size={16} color="#10b981" />
            <Text className="text-green-600 font-medium text-sm ml-2">
              Secured by 256-bit encryption
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
