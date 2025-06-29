import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ProfileScreenProps {
  onBack: () => void;
  onNavigateToDatasets: () => void;
}

export const ProfileScreen = ({ onBack, onNavigateToDatasets }: ProfileScreenProps) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const profileSections = [
    {
      title: 'Account Information',
      items: [
        { icon: 'person', label: 'Personal Details', value: 'Update your information', action: () => {} },
        { icon: 'account-balance', label: 'Account Summary', value: 'View all accounts', action: () => {} },
        { icon: 'history', label: 'Transaction History', value: 'Last 90 days', action: () => {} },
        { icon: 'receipt', label: 'Statements & Documents', value: 'Download statements', action: () => {} },
      ]
    },
    {
      title: 'Security & Privacy',
      items: [
        { icon: 'lock', label: 'Change PIN', value: 'Update your login PIN', action: () => {} },
        { icon: 'password', label: 'Change Password', value: 'Update login password', action: () => {} },
        { icon: 'verified-user', label: 'Two-Factor Authentication', value: '', toggle: twoFactorEnabled, onToggle: setTwoFactorEnabled },
        { icon: 'fingerprint', label: 'Biometric Login', value: '', toggle: biometricEnabled, onToggle: setBiometricEnabled },
        { icon: 'privacy-tip', label: 'Privacy Settings', value: 'Manage data sharing', action: () => {} },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications', label: 'Notifications', value: '', toggle: notificationsEnabled, onToggle: setNotificationsEnabled },
        { icon: 'language', label: 'Language', value: 'English', action: () => {} },
        { icon: 'palette', label: 'App Theme', value: 'Light Mode', action: () => {} },
        { icon: 'currency-rupee', label: 'Currency', value: 'INR (₹)', action: () => {} },
      ]
    },
    {
      title: 'Developer Tools',
      items: [
        { icon: 'dataset', label: 'Datasets', value: 'Manage collected data', action: onNavigateToDatasets },
      ]
    },
    {
      title: 'Support & Help',
      items: [
        { icon: 'help-outline', label: 'Help Center', value: 'Get support', action: () => {} },
        { icon: 'chat', label: 'Live Chat', value: 'Chat with support', action: () => {} },
        { icon: 'phone', label: 'Call Support', value: '1800-XXX-XXXX', action: () => {} },
        { icon: 'feedback', label: 'Send Feedback', value: 'Share your experience', action: () => {} },
        { icon: 'star-rate', label: 'Rate App', value: 'Rate us on Play Store', action: () => {} },
      ]
    }
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View className="bg-white pt-16 pb-6 px-6 shadow-sm">
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onBack} className="mr-4">
              <MaterialIcons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-gray-800 font-bold text-xl">Profile</Text>
          </View>
          <TouchableOpacity>
            <MaterialIcons name="edit" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-blue-600 items-center justify-center mr-4">
              <Text className="text-white font-bold text-xl">DC</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-bold text-lg">Dear Customer</Text>
              <Text className="text-blue-600 font-medium text-sm">customer@suraksha.bank</Text>
              <Text className="text-gray-500 text-sm">Customer ID: SB001234567</Text>
            </View>
            <TouchableOpacity className="bg-blue-600 rounded-full p-2">
              <MaterialIcons name="camera-alt" size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Quick Stats */}
          <View className="flex-row justify-between mt-4 pt-4 border-t border-blue-200">
            <View className="items-center">
              <Text className="text-blue-800 font-bold text-lg">4</Text>
              <Text className="text-blue-600 text-xs">Accounts</Text>
            </View>
            <View className="items-center">
              <Text className="text-blue-800 font-bold text-lg">3</Text>
              <Text className="text-blue-600 text-xs">Cards</Text>
            </View>
            <View className="items-center">
              <Text className="text-blue-800 font-bold text-lg">2</Text>
              <Text className="text-blue-600 text-xs">Loans</Text>
            </View>
            <View className="items-center">
              <Text className="text-blue-800 font-bold text-lg">5</Text>
              <Text className="text-blue-600 text-xs">Years</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} className="px-6 py-4">
            <Text className="text-gray-800 font-bold text-base mb-3">{section.title}</Text>
            <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  onPress={item.action}
                  className={`flex-row items-center p-4 ${
                    itemIndex < section.items.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-4">
                    <MaterialIcons name={item.icon as any} size={20} color="#2563eb" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold text-base">{item.label}</Text>
                    {item.value && (
                      <Text className="text-gray-500 text-sm mt-1">{item.value}</Text>
                    )}
                  </View>
                  {item.toggle !== undefined ? (
                    <Switch
                      value={item.toggle}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#f3f4f6', true: '#2563eb' }}
                      thumbColor={item.toggle ? '#ffffff' : '#ffffff'}
                    />
                  ) : (
                    <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View className="px-6 py-4">
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <View className="items-center">
              <Text className="text-gray-500 text-sm">Suraksha Bank Mobile App</Text>
              <Text className="text-gray-400 text-xs mt-1">Version 2.1.0 • Build 2025.01</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View className="px-6 py-4 pb-8">
          <TouchableOpacity className="bg-red-50 rounded-2xl p-4 border border-red-200">
            <View className="flex-row items-center justify-center">
              <MaterialIcons name="logout" size={24} color="#ef4444" />
              <Text className="text-red-600 font-bold text-base ml-2">Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
