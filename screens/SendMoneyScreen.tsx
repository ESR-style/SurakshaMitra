import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView, TextInput, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SendMoneyScreenProps {
  onBack: () => void;
}

type TransferMethod = 'phone' | 'upi' | 'bank' | 'qr';
type TransferStep = 'method' | 'details' | 'pin' | 'success';

export const SendMoneyScreen = ({ onBack }: SendMoneyScreenProps) => {
  const [amount, setAmount] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [transferMethod, setTransferMethod] = useState<TransferMethod>('phone');
  const [currentStep, setCurrentStep] = useState<TransferStep>('method');
  const [upiId, setUpiId] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Bank account details
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  
  // Phone number for phone transfer
  const [phoneNumber, setPhoneNumber] = useState('');

  const recentContacts = [
    { id: '1', name: 'Rajesh Kumar', phone: '+91 98765 43210', avatar: 'RK' },
    { id: '2', name: 'Priya Sharma', phone: '+91 87654 32109', avatar: 'PS' },
    { id: '3', name: 'Amit Singh', phone: '+91 76543 21098', avatar: 'AS' },
    { id: '4', name: 'Neha Gupta', phone: '+91 65432 10987', avatar: 'NG' },
  ];

  const quickAmounts = ['₹100', '₹500', '₹1000', '₹2000', '₹5000'];

  const handleMethodSelect = (method: TransferMethod) => {
    setTransferMethod(method);
    if (method === 'bank') {
      // Bank transfers need details form first
      setCurrentStep('details');
    } else if (method === 'phone' || method === 'upi') {
      // Phone and UPI can go to method selection with inputs
      setCurrentStep('method');
    } else if (method === 'qr') {
      // QR code can go directly to PIN (simulated scan)
      setCurrentStep('method');
    }
  };

  const handleContinueToPin = () => {
    if (amount && (selectedContact || upiId || (accountNumber && ifscCode) || phoneNumber)) {
      setCurrentStep('pin');
    }
  };

  const handlePinComplete = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep('success');
    }, 2000);
  };

  const handlePinChange = (text: string) => {
    if (text.length <= 6 && /^\d*$/.test(text)) {
      setPin(text);
      if (text.length === 6) {
        handlePinComplete();
      }
    }
  };

  const handleNewTransfer = () => {
    setCurrentStep('method');
    setAmount('');
    setSelectedContact(null);
    setUpiId('');
    setPin('');
    setAccountNumber('');
    setIfscCode('');
    setAccountHolderName('');
    setBankName('');
    setPhoneNumber('');
    setTransferMethod('phone');
  };

  const getSelectedContactInfo = () => {
    return recentContacts.find(contact => contact.id === selectedContact);
  };

  const renderMethodSelection = () => (
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
            <TouchableOpacity 
              className="items-center flex-1"
              onPress={() => handleMethodSelect('phone')}
            >
              <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 ${
                transferMethod === 'phone' ? 'bg-blue-600' : 'bg-blue-100'
              }`}>
                <MaterialIcons 
                  name="phone" 
                  size={28} 
                  color={transferMethod === 'phone' ? '#ffffff' : '#2563eb'} 
                />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Phone{'\n'}Number</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="items-center flex-1"
              onPress={() => handleMethodSelect('qr')}
            >
              <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 ${
                transferMethod === 'qr' ? 'bg-green-600' : 'bg-green-100'
              }`}>
                <MaterialIcons 
                  name="qr-code-scanner" 
                  size={28} 
                  color={transferMethod === 'qr' ? '#ffffff' : '#10b981'} 
                />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Scan QR{'\n'}Code</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="items-center flex-1"
              onPress={() => handleMethodSelect('bank')}
            >
              <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 ${
                transferMethod === 'bank' ? 'bg-purple-600' : 'bg-purple-100'
              }`}>
                <MaterialIcons 
                  name="account-balance" 
                  size={28} 
                  color={transferMethod === 'bank' ? '#ffffff' : '#8b5cf6'} 
                />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">Bank{'\n'}Account</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="items-center flex-1"
              onPress={() => handleMethodSelect('upi')}
            >
              <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 ${
                transferMethod === 'upi' ? 'bg-orange-600' : 'bg-orange-100'
              }`}>
                <MaterialIcons 
                  name="account-balance-wallet" 
                  size={28} 
                  color={transferMethod === 'upi' ? '#ffffff' : '#f97316'} 
                />
              </View>
              <Text className="text-gray-700 text-sm font-medium text-center">UPI{'\n'}ID</Text>
            </TouchableOpacity>
          </View>

          {/* Conditional Content Based on Method */}
          {transferMethod === 'phone' && (
            <>
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

              {/* Or Enter Phone Number */}
              <View className="mb-6">
                <Text className="text-gray-800 font-semibold text-base mb-3">Or Enter Phone Number</Text>
                <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <TextInput
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="+91 XXXXX XXXXX"
                    keyboardType="phone-pad"
                    className="text-gray-800 text-base"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </>
          )}

          {transferMethod === 'upi' && (
            <View className="mb-6">
              <Text className="text-gray-800 font-semibold text-base mb-3">Enter UPI ID</Text>
              <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <TextInput
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="example@upi"
                  className="text-gray-800 text-base"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          )}

          {transferMethod === 'qr' && (
            <View className="mb-6 items-center py-8">
              <View className="w-32 h-32 bg-gray-100 rounded-2xl items-center justify-center mb-4">
                <MaterialIcons name="qr-code-scanner" size={64} color="#6b7280" />
              </View>
              <Text className="text-gray-800 font-semibold text-base mb-2">Scan QR Code</Text>
              <Text className="text-gray-500 text-sm text-center">
                Point your camera at the QR code to scan
              </Text>
              <TouchableOpacity className="bg-blue-600 rounded-xl py-3 px-6 mt-4">
                <Text className="text-white font-semibold">Open Camera</Text>
              </TouchableOpacity>
            </View>
          )}
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
              amount && (selectedContact || upiId || phoneNumber || transferMethod === 'qr')
                ? 'bg-blue-600' 
                : 'bg-gray-300'
            }`}
            disabled={!amount || (!selectedContact && !upiId && !phoneNumber && transferMethod !== 'qr')}
            onPress={handleContinueToPin}
          >
            <Text className={`font-bold text-base ${
              amount && (selectedContact || upiId || phoneNumber || transferMethod === 'qr')
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

  const renderBankDetailsForm = () => (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View className="bg-white pt-16 pb-4 px-6 shadow-sm border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => setCurrentStep('method')} className="mr-4">
            <MaterialIcons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-gray-800 font-bold text-xl flex-1">Bank Account Details</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
        {/* Amount Display */}
        <View className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
          <Text className="text-blue-600 text-sm mb-1">Transfer Amount</Text>
          <Text className="text-blue-800 font-bold text-2xl">₹{amount}</Text>
        </View>

        {/* Bank Details Form */}
        <View className="space-y-4">
          <View>
            <Text className="text-gray-800 font-semibold text-base mb-2">Account Holder Name</Text>
            <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <TextInput
                value={accountHolderName}
                onChangeText={setAccountHolderName}
                placeholder="Enter full name as per bank records"
                className="text-gray-800 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View>
            <Text className="text-gray-800 font-semibold text-base mb-2">Account Number</Text>
            <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <TextInput
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Enter account number"
                keyboardType="numeric"
                className="text-gray-800 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View>
            <Text className="text-gray-800 font-semibold text-base mb-2">IFSC Code</Text>
            <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <TextInput
                value={ifscCode}
                onChangeText={setIfscCode}
                placeholder="Enter IFSC code (e.g., SBIN0001234)"
                autoCapitalize="characters"
                className="text-gray-800 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View>
            <Text className="text-gray-800 font-semibold text-base mb-2">Bank Name</Text>
            <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <TextInput
                value={bankName}
                onChangeText={setBankName}
                placeholder="Enter bank name"
                className="text-gray-800 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </View>

        {/* Security Note */}
        <View className="bg-yellow-50 rounded-xl p-4 mt-6 border border-yellow-200">
          <View className="flex-row items-start">
            <MaterialIcons name="info" size={20} color="#f59e0b" />
            <View className="ml-3 flex-1">
              <Text className="text-yellow-800 font-semibold text-sm mb-1">Important</Text>
              <Text className="text-yellow-700 text-sm">
                Please double-check all bank details. Incorrect information may result in failed transactions or money being sent to wrong account.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="px-6 py-4 bg-white border-t border-gray-100">
        <TouchableOpacity 
          className={`rounded-xl py-4 items-center ${
            accountHolderName && accountNumber && ifscCode && bankName
              ? 'bg-blue-600' 
              : 'bg-gray-300'
          }`}
          disabled={!accountHolderName || !accountNumber || !ifscCode || !bankName}
          onPress={handleContinueToPin}
        >
          <Text className={`font-bold text-base ${
            accountHolderName && accountNumber && ifscCode && bankName
              ? 'text-white' 
              : 'text-gray-500'
          }`}>
            Continue to PIN
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPinEntry = () => (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header with Logo - Similar to PinScreen */}
      <View className="bg-white pt-16 pb-8 px-6">
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-blue-600 items-center justify-center mb-4 shadow-lg">
            <MaterialIcons name="security" size={36} color="white" />
          </View>
          <Text className="text-blue-800 font-bold text-2xl mb-1">Confirm Transfer</Text>
          <Text className="text-blue-600 font-semibold text-lg">Enter your PIN to proceed</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Transfer Summary - Compact */}
        <View className="bg-blue-50 rounded-xl p-4 mb-8 border border-blue-200">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-blue-600 text-sm">Sending</Text>
              <Text className="text-blue-800 font-bold text-xl">₹{amount}</Text>
            </View>
            <View className="items-end">
              <Text className="text-blue-600 text-sm">To</Text>
              <Text className="text-blue-800 font-semibold text-base">
                {transferMethod === 'phone' && selectedContact ? getSelectedContactInfo()?.name :
                 transferMethod === 'phone' && phoneNumber ? phoneNumber :
                 transferMethod === 'upi' ? upiId :
                 transferMethod === 'bank' ? accountHolderName :
                 'QR Code Recipient'}
              </Text>
            </View>
          </View>
        </View>

        {/* PIN Section - Same style as PinScreen */}
        <View className="items-center mb-8">
          <Text className="text-blue-800 text-2xl font-bold mb-2">Enter PIN</Text>
          <Text className="text-blue-500 text-base text-center mb-8">Enter your 6-digit PIN to confirm transfer</Text>
        </View>

        {/* PIN Input Circles - Same as PinScreen */}
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

        {/* Loading State */}
        {isLoading && (
          <View className="items-center py-8">
            <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4">
              <MaterialIcons name="hourglass-empty" size={32} color="#2563eb" />
            </View>
            <Text className="text-blue-600 font-semibold text-base">Processing Transfer...</Text>
            <Text className="text-blue-500 text-sm mt-2">Please wait while we process your transaction</Text>
          </View>
        )}

        {/* Security Note */}
        <View className="items-center pt-4">
          <View className="flex-row items-center">
            <MaterialIcons name="security" size={16} color="#2563eb" />
            <Text className="text-blue-600 font-medium text-sm ml-2">Secured by 256-bit encryption</Text>
          </View>
        </View>
      </ScrollView>

      {/* Back Button */}
      <View className="px-6 py-4 bg-white border-t border-blue-100">
        <TouchableOpacity 
          onPress={() => setCurrentStep(transferMethod === 'bank' ? 'details' : 'method')}
          className="bg-gray-100 rounded-xl py-4 items-center"
          disabled={isLoading}
        >
          <Text className="text-gray-600 font-semibold text-base">
            {isLoading ? 'Processing...' : 'Back'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSuccessScreen = () => (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView className="flex-1" contentContainerStyle={{ justifyContent: 'center', paddingHorizontal: 24 }}>
        {/* Success Animation */}
        <View className="items-center mb-8">
          <View className="w-32 h-32 rounded-full bg-green-100 items-center justify-center mb-6">
            <MaterialIcons name="check-circle" size={64} color="#10b981" />
          </View>
          
          <Text className="text-green-800 font-bold text-2xl mb-2">Transfer Successful!</Text>
          <Text className="text-gray-600 text-base text-center mb-8">
            Your money has been sent successfully
          </Text>
          
          {/* Transaction Details */}
          <View className="bg-gray-50 rounded-xl p-6 w-full border border-gray-200">
            <Text className="text-gray-800 font-bold text-lg mb-4 text-center">Transaction Details</Text>
            
            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600 text-base">Amount Sent</Text>
                <Text className="text-gray-800 font-bold text-base">₹{amount}</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600 text-base">To</Text>
                <Text className="text-gray-800 font-semibold text-base">
                  {transferMethod === 'phone' && selectedContact ? getSelectedContactInfo()?.name :
                   transferMethod === 'phone' && phoneNumber ? phoneNumber :
                   transferMethod === 'upi' ? upiId :
                   transferMethod === 'bank' ? accountHolderName :
                   'QR Code Recipient'}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600 text-base">Transaction ID</Text>
                <Text className="text-gray-800 font-semibold text-base">TXN{Date.now().toString().slice(-8)}</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600 text-base">Date & Time</Text>
                <Text className="text-gray-800 font-semibold text-base">
                  {new Date().toLocaleString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600 text-base">Status</Text>
                <View className="flex-row items-center">
                  <MaterialIcons name="check-circle" size={16} color="#10b981" />
                  <Text className="text-green-600 font-semibold text-base ml-1">Completed</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="px-6 py-4 bg-white border-t border-gray-100">
        <View className="space-y-3">
          <TouchableOpacity 
            className="bg-blue-600 rounded-xl py-4 items-center"
            onPress={handleNewTransfer}
          >
            <Text className="text-white font-bold text-base">Send More Money</Text>
          </TouchableOpacity>
          
          <View className="flex-row space-x-3">
            <TouchableOpacity className="flex-1 bg-gray-100 rounded-xl py-3 items-center">
              <Text className="text-gray-600 font-semibold text-base">Share Receipt</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-1 bg-gray-100 rounded-xl py-3 items-center">
              <Text className="text-gray-600 font-semibold text-base">Download PDF</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            className="bg-gray-50 rounded-xl py-3 items-center"
            onPress={onBack}
          >
            <Text className="text-gray-600 font-semibold text-base">Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Main render logic
  if (currentStep === 'method') {
    return renderMethodSelection();
  } else if (currentStep === 'details' && transferMethod === 'bank') {
    return renderBankDetailsForm();
  } else if (currentStep === 'pin') {
    return renderPinEntry();
  } else if (currentStep === 'success') {
    return renderSuccessScreen();
  } else {
    // For other methods (phone, upi, qr), if details step is reached, go directly to PIN
    return renderMethodSelection();
  }
};
