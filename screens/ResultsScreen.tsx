import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthResultsLogger, type AuthResult } from '../services/AuthResultsLogger';

interface ResultsScreenProps {
  onBack: () => void;
}

export const ResultsScreen = ({ onBack }: ResultsScreenProps) => {
  const [authResults, setAuthResults] = useState<AuthResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const authLogger = AuthResultsLogger.getInstance();

  useEffect(() => {
    loadAuthResults();
    
    // Set up an interval to refresh results every 5 seconds to catch new data
    const interval = setInterval(() => {
      loadAuthResults();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadAuthResults = async () => {
    try {
      setIsLoading(true);
      const results = await authLogger.getAuthResults();
      setAuthResults(results);
    } catch (error) {
      console.error('Error loading auth results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadAuthResults();
  };

  const clearAllResults = () => {
    Alert.alert(
      'Clear All Results',
      'Are you sure you want to delete all authentication results? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await authLogger.clearAllResults();
              setAuthResults([]);
              Alert.alert('Success', 'All authentication results have been cleared.');
            } catch (error) {
              console.error('Error clearing results:', error);
              Alert.alert('Error', 'Failed to clear results. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getResultIcon = (type: string) => {
    return type === 'PIN_SUCCESS' ? 'check-circle' : 'error';
  };

  const getResultColor = (type: string) => {
    return type === 'PIN_SUCCESS' ? '#10b981' : '#ef4444';
  };

  const getResultBgColor = (type: string) => {
    return type === 'PIN_SUCCESS' ? '#ecfdf5' : '#fef2f2';
  };

  const getResultBorderColor = (type: string) => {
    return type === 'PIN_SUCCESS' ? '#d1fae5' : '#fecaca';
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View className="bg-white pt-16 pb-6 px-6 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onBack} className="mr-4">
              <MaterialIcons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-gray-800 font-bold text-xl">Authentication Results</Text>
          </View>
          
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={handleRefresh}
              className="bg-blue-50 rounded-full p-2 border border-blue-200 mr-2"
            >
              <MaterialIcons name="refresh" size={24} color="#3b82f6" />
            </TouchableOpacity>
            
            {authResults.length > 0 && (
              <TouchableOpacity 
                onPress={clearAllResults}
                className="bg-red-50 rounded-full p-2 border border-red-200"
              >
                <MaterialIcons name="delete-sweep" size={24} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats */}
        <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-blue-800 font-bold text-lg">
                {authResults.filter(r => r.type === 'PIN_SUCCESS').length}
              </Text>
              <Text className="text-blue-600 text-xs">Successful</Text>
            </View>
            <View className="items-center">
              <Text className="text-blue-800 font-bold text-lg">
                {authResults.filter(r => r.type === 'PIN_FAILED').length}
              </Text>
              <Text className="text-blue-600 text-xs">Failed</Text>
            </View>
            <View className="items-center">
              <Text className="text-blue-800 font-bold text-lg">{authResults.length}</Text>
              <Text className="text-blue-600 text-xs">Total</Text>
            </View>
            <View className="items-center">
              <Text className="text-blue-800 font-bold text-lg">
                {authResults.length > 0 
                  ? Math.round((authResults.filter(r => r.type === 'PIN_SUCCESS').length / authResults.length) * 100)
                  : 0}%
              </Text>
              <Text className="text-blue-600 text-xs">Success Rate</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Results List */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500 text-base">Loading results...</Text>
          </View>
        ) : authResults.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <MaterialIcons name="assessment" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg font-medium mt-4">No Results Yet</Text>
            <Text className="text-gray-400 text-sm text-center mt-2 px-8">
              PIN authentication results will appear here once you start using the app
            </Text>
          </View>
        ) : (
          <View className="py-4">
            {authResults.map((result, index) => (
              <View
                key={result.id}
                className="mb-3 bg-white rounded-2xl shadow-sm overflow-hidden"
                style={{
                  backgroundColor: getResultBgColor(result.type),
                  borderWidth: 1,
                  borderColor: getResultBorderColor(result.type),
                }}
              >
                <View className="p-4">
                  <View className="flex-row items-start">
                    <View className="mr-3 mt-1">
                      <MaterialIcons 
                        name={getResultIcon(result.type) as any} 
                        size={24} 
                        color={getResultColor(result.type)} 
                      />
                    </View>
                    <View className="flex-1">
                      <Text 
                        className="font-semibold text-base mb-1"
                        style={{ color: getResultColor(result.type) }}
                      >
                        {result.type === 'PIN_SUCCESS' ? 'Authentication Successful' : 'Authentication Failed'}
                      </Text>
                      <Text className="text-gray-600 text-sm mb-2">
                        {result.message}
                      </Text>
                      <View className="flex-row items-center">
                        <MaterialIcons name="schedule" size={16} color="#6B7280" />
                        <Text className="text-gray-500 text-xs ml-1">
                          {formatTimestamp(result.timestamp)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
