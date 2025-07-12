import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, ScrollView, TextInput, Modal, Dimensions, Platform, PixelRatio } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CaptchaScreen } from './CaptchaScreen';
import { SecurityQuestion } from '../components/SecurityQuestion';
import { SecurityVerificationService } from '../services/SecurityVerificationService';

// Global type declaration
declare global {
  var addPinData: ((data: any) => Promise<void>) | undefined;
}

const { width, height } = Dimensions.get('window');

interface SendMoneyScreenProps {
  onBack: () => void;
}

type TransferMethod = 'phone' | 'upi' | 'bank' | 'qr';
type TransferStep = 'method' | 'details' | 'captcha' | 'pin' | 'security' | 'success' | 'blocked';

export const SendMoneyScreen = ({ onBack }: SendMoneyScreenProps) => {
  const [amount, setAmount] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [transferMethod, setTransferMethod] = useState<TransferMethod>('phone');
  const [currentStep, setCurrentStep] = useState<TransferStep>('method');
  const [upiId, setUpiId] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSecurityQuestion, setShowSecurityQuestion] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Security verification service
  const securityService = SecurityVerificationService.getInstance();
  
  // Bank account details
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  
  // Phone number for phone transfer
  const [phoneNumber, setPhoneNumber] = useState('');

  // PIN biometric tracking state - same as PinScreen
  const [pinMetrics, setPinMetrics] = useState({
    startTime: null as number | null,
    keyTimings: [] as any[],
    backspaceCount: 0,
    touchEvents: [] as any[],
    currentSession: [] as any[],
    keyPressEvents: [] as any[],
    lastKeyReleaseTime: null as number | null,
    errorRecoveryEvents: [] as any[],
    sessionEntropy: 0,
  });

  const inputRef = useRef<TextInput>(null);

  const resetPinMetrics = () => {
    setPinMetrics({
      startTime: null,
      keyTimings: [],
      backspaceCount: 0,
      touchEvents: [],
      currentSession: [],
      keyPressEvents: [],
      lastKeyReleaseTime: null,
      errorRecoveryEvents: [],
      sessionEntropy: 0,
    });
  };

  const handleTouchStart = (event: any) => {
    const { locationX, locationY, force, identifier, touches, pageX, pageY } = event.nativeEvent;
    const currentTime = Date.now();
    
    // Get touch properties with better fallbacks
    const touch = touches && touches[0] ? touches[0] : event.nativeEvent;
    const touchForce = force || touch.force || (Math.random() * 0.4 + 0.3);
    const majorAxis = touch.majorAxisRadius || (Math.random() * 8 + 12);
    const minorAxis = touch.minorAxisRadius || (Math.random() * 6 + 8);
    const touchArea = Math.PI * majorAxis * minorAxis;
    
    const touchData = {
      type: 'start',
      x: locationX || pageX || (Math.random() * (width * 0.6) + width * 0.2),
      y: locationY || pageY || (Math.random() * 50 + 250),
      pressure: touchForce,
      timestamp: currentTime,
      identifier: identifier || 0,
      touchArea: touchArea,
      majorAxisRadius: majorAxis,
      minorAxisRadius: minorAxis,
    };

    setPinMetrics(prev => ({
      ...prev,
      touchEvents: [...prev.touchEvents, touchData],
      keyPressEvents: [...prev.keyPressEvents, { timestamp: currentTime, type: 'press', touchData }],
    }));
  };

  const handleTouchEnd = (event: any) => {
    const { locationX, locationY, force, identifier, touches, pageX, pageY } = event.nativeEvent;
    const currentTime = Date.now();
    
    // Calculate dwell time
    const lastPress = pinMetrics.keyPressEvents[pinMetrics.keyPressEvents.length - 1];
    const dwellTime = lastPress ? currentTime - lastPress.timestamp : 0;
    
    const touch = touches && touches[0] ? touches[0] : event.nativeEvent;
    const touchForce = force || touch.force || Math.random() * 0.4 + 0.2;
    const majorAxis = touch.majorAxisRadius || Math.random() * 12 + 8;
    const minorAxis = touch.minorAxisRadius || Math.random() * 10 + 6;
    const touchArea = Math.PI * majorAxis * minorAxis;
    
    const touchData = {
      type: 'end',
      x: locationX || pageX || Math.random() * width,
      y: locationY || pageY || Math.random() * 100 + 200,
      pressure: touchForce,
      timestamp: currentTime,
      identifier: identifier || 0,
      touchArea: touchArea,
      majorAxisRadius: majorAxis,
      minorAxisRadius: minorAxis,
      dwellTime: dwellTime,
    };

    setPinMetrics(prev => ({
      ...prev,
      touchEvents: [...prev.touchEvents, touchData],
    }));
  };

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
      const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ''));
      if (numericAmount > 10000) {
        setCurrentStep('captcha');
      } else {
        setCurrentStep('pin');
      }
    }
  };

  const handleCaptchaComplete = () => {
    setCurrentStep('pin');
  };

  const handleCaptchaBack = () => {
    setCurrentStep(transferMethod === 'bank' ? 'details' : 'method');
  };

  const handlePinComplete = () => {
    setIsLoading(true);
    
    // Check if security verification is needed
    setTimeout(() => {
      const needsVerification = securityService.needsSecurityVerification();
      
      if (needsVerification) {
        console.log('🚨 Security verification required before processing transfer');
        setIsLoading(false);
        setShowSecurityQuestion(true);
      } else {
        console.log('✅ Security verification passed, processing transfer');
        setIsLoading(false);
        setCurrentStep('success');
      }
    }, 2000);
  };

  const handleSecurityQuestionSuccess = () => {
    console.log('✅ Security question answered correctly, processing transfer');
    setShowSecurityQuestion(false);
    setCurrentStep('success');
  };

  const handleSecurityQuestionFailure = () => {
    console.log('❌ Security question failed - marking as intruder');
    setShowSecurityQuestion(false);
    setIsBlocked(true);
    setCurrentStep('blocked');
  };

  const handlePinChange = (text: string) => {
    if (text.length <= 6 && /^\d*$/.test(text)) {
      const currentTime = Date.now();
      
      // Start recording metrics when first digit is entered
      if (!pinMetrics.startTime && text.length === 1) {
        setPinMetrics(prev => ({
          ...prev,
          startTime: currentTime,
        }));
      }

      // Detect backspace and error recovery
      const isBackspace = text.length < pin.length;
      if (isBackspace) {
        const errorRecoveryEvent = {
          timestamp: currentTime,
          deletedChar: pin.charAt(text.length),
          position: text.length,
          recoveryTime: currentTime - (pinMetrics.lastKeyReleaseTime || currentTime),
        };

        setPinMetrics(prev => ({
          ...prev,
          backspaceCount: prev.backspaceCount + 1,
          errorRecoveryEvents: [...prev.errorRecoveryEvents, errorRecoveryEvent],
        }));
      }

      // Record key timing
      const newKeyTiming = {
        timestamp: currentTime,
        character: text.charAt(text.length - 1),
        position: text.length - 1,
        inputLength: text.length,
        isBackspace: isBackspace,
        interKeyPause: pinMetrics.lastKeyReleaseTime ? currentTime - pinMetrics.lastKeyReleaseTime : 0,
      };

      setPinMetrics(prev => ({
        ...prev,
        keyTimings: [...prev.keyTimings, newKeyTiming],
        lastKeyReleaseTime: currentTime,
      }));

      setPin(text);
      if (text.length === 6) {
        setIsLoading(true);
        setTimeout(async () => {
          await logPinDataCSV();
          setIsLoading(false);
          handlePinComplete();
        }, 800);
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
    setIsLoading(false);
    resetPinMetrics(); // Reset biometric data for new transfer
  };

  const getSelectedContactInfo = () => {
    return recentContacts.find(contact => contact.id === selectedContact);
  };

  const getRecipientInfo = () => {
    if (transferMethod === 'phone' && selectedContact) {
      const contact = getSelectedContactInfo();
      return contact ? `${contact.name} (${contact.phone})` : 'Selected Contact';
    } else if (transferMethod === 'phone' && phoneNumber) {
      return phoneNumber;
    } else if (transferMethod === 'upi') {
      return upiId;
    } else if (transferMethod === 'bank') {
      return `${accountHolderName} (${bankName})`;
    } else {
      return 'QR Code Recipient';
    }
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

  const renderCaptchaScreen = () => (
    <CaptchaScreen 
      key={`captcha-${amount}-${getRecipientInfo()}-${Date.now()}`}
      onComplete={handleCaptchaComplete}
      onBack={handleCaptchaBack}
      amount={amount}
      recipientInfo={getRecipientInfo()}
    />
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
            ref={inputRef}
            value={pin}
            onChangeText={handlePinChange}
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry={false}
            className="opacity-0 absolute w-full h-16 text-center"
            autoFocus={true}
            caretHidden={true}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
          
          <TouchableOpacity 
            className="bg-blue-50 rounded-xl py-4 px-6 items-center border border-blue-200"
            onPressIn={handleTouchStart}
            onPressOut={handleTouchEnd}
            onPress={() => {
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
          >
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

  const renderBlockedScreen = () => (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView className="flex-1" contentContainerStyle={{ justifyContent: 'center', paddingHorizontal: 24 }}>
        {/* Blocked Animation */}
        <View className="items-center mb-8">
          <View className="w-32 h-32 rounded-full bg-red-100 items-center justify-center mb-6">
            <MaterialIcons name="block" size={64} color="#ef4444" />
          </View>
          
          <Text className="text-red-600 font-bold text-2xl mb-2">Access Denied</Text>
          <Text className="text-gray-600 text-base text-center mb-8">
            Suspicious activity detected. Transaction has been blocked for security reasons.
          </Text>
          
          {/* Security Alert Details */}
          <View className="bg-red-50 rounded-xl p-6 w-full border border-red-200">
            <Text className="text-red-800 font-bold text-lg mb-4 text-center">Security Alert</Text>
            
            <View className="space-y-4">
              <View className="flex-row items-start">
                <MaterialIcons name="warning" size={20} color="#ef4444" />
                <Text className="text-red-700 ml-3 flex-1 text-sm">
                  Your account has been temporarily restricted due to failed security verification.
                </Text>
              </View>
              
              <View className="flex-row items-start">
                <MaterialIcons name="info" size={20} color="#ef4444" />
                <Text className="text-red-700 ml-3 flex-1 text-sm">
                  Please contact customer support if you believe this is an error.
                </Text>
              </View>
              
              <View className="flex-row items-start">
                <MaterialIcons name="phone" size={20} color="#ef4444" />
                <Text className="text-red-700 ml-3 flex-1 text-sm">
                  Customer Support: 1800-XXX-XXXX
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="px-6 py-4 bg-white border-t border-gray-100">
        <TouchableOpacity 
          className="bg-red-600 rounded-xl py-4 items-center mb-3"
          onPress={onBack}
        >
          <Text className="text-white font-bold text-base">Return to Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="bg-gray-100 rounded-xl py-3 items-center"
          onPress={() => {
            // Reset security checks and go back to start
            securityService.resetSecurityChecks();
            setIsBlocked(false);
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
          }}
        >
          <Text className="text-gray-600 font-semibold text-base">Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const calculatePinMetrics = () => {
    const { startTime, keyTimings, backspaceCount, touchEvents, errorRecoveryEvents } = pinMetrics;
    const endTime = Date.now();
    const totalTime = startTime ? (endTime - startTime) / 1000 : 0;
    
    // Calculate WPM (Words Per Minute) - using PIN digits as "words"
    const digitsTyped = pin.length / 5; // Treat 5 digits as 1 "word"
    const wpm = totalTime > 0 ? (digitsTyped / totalTime) * 60 : 0;

    // Calculate flight times
    const flightTimes = [];
    for (let i = 1; i < keyTimings.length; i++) {
      flightTimes.push(keyTimings[i].timestamp - keyTimings[i-1].timestamp);
    }

    // Calculate dwell times
    const dwellTimes = [];
    const touchStarts = touchEvents.filter(e => e.type === 'start');
    const touchEnds = touchEvents.filter(e => e.type === 'end');
    
    for (let i = 0; i < Math.min(touchStarts.length, touchEnds.length); i++) {
      if (touchStarts[i] && touchEnds[i]) {
        dwellTimes.push(touchEnds[i].timestamp - touchStarts[i].timestamp);
      }
    }

    // Calculate inter-key pauses
    const interKeyPauses = [];
    for (let i = 1; i < touchStarts.length; i++) {
      if (touchEnds[i-1] && touchStarts[i]) {
        interKeyPauses.push(touchStarts[i].timestamp - touchEnds[i-1].timestamp);
      }
    }

    // Calculate entropy
    const calculateEntropy = (times: number[]) => {
      if (times.length === 0) return 0;
      const mean = times.reduce((a, b) => a + b, 0) / times.length;
      const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length;
      return Math.sqrt(variance);
    };

    const sessionEntropy = calculateEntropy(flightTimes);
    const typingPatternVector = flightTimes.length > 0 ? [...flightTimes] : [];

    // Enhanced calculations
    const validTouchEvents = touchEvents.filter(te => te.touchArea && te.touchArea > 0);
    const avgTouchArea = validTouchEvents.length > 0 ? 
      validTouchEvents.reduce((sum, te) => sum + te.touchArea, 0) / validTouchEvents.length : 
      Math.PI * 12 * 10;

    const validPressureEvents = touchEvents.filter(te => te.pressure && te.pressure > 0);
    const avgPressure = validPressureEvents.length > 0 ? 
      validPressureEvents.reduce((sum, te) => sum + te.pressure, 0) / validPressureEvents.length :
      0.4;

    const validXCoords = touchEvents.filter(te => te.x && te.x > 0).map(te => te.x);
    const validYCoords = touchEvents.filter(te => te.y && te.y > 0).map(te => te.y);
    const avgX = validXCoords.length > 0 ? validXCoords.reduce((a, b) => a + b, 0) / validXCoords.length : width / 2;
    const avgY = validYCoords.length > 0 ? validYCoords.reduce((a, b) => a + b, 0) / validYCoords.length : 300;

    const avgErrorRecoveryTime = errorRecoveryEvents.length > 0 ? 
      errorRecoveryEvents.reduce((sum, evt) => sum + evt.recoveryTime, 0) / errorRecoveryEvents.length : 0;

    const deviceMetrics = {
      screenWidth: width,
      screenHeight: height,
      platform: Platform.OS,
      pixelRatio: PixelRatio.get(),
    };

    const keyDwellVariance = calculateEntropy(dwellTimes);
    const interKeyVariance = calculateEntropy(interKeyPauses);
    const pressureVariance = calculateEntropy(validPressureEvents.map(te => te.pressure));
    const touchAreaVariance = calculateEntropy(validTouchEvents.map(te => te.touchArea));

    return {
      username: 'PinUser', // Change to match PinScreen exactly
      captcha: '******', // PIN is masked for security
      userInput: '*'.repeat(pin.length), // PIN is masked for security
      isCorrect: pin.length === 6, // Assuming 6-digit PIN is correct
      timestamp: new Date().toISOString(),
      totalTime: totalTime,
      wpm: wpm,
      backspaceCount: backspaceCount,
      flightTimes: flightTimes,
      avgFlightTime: flightTimes.length > 0 ? flightTimes.reduce((a, b) => a + b, 0) / flightTimes.length : 0,
      dwellTimes: dwellTimes,
      avgDwellTime: dwellTimes.length > 0 ? dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length : 0,
      interKeyPauses: interKeyPauses,
      avgInterKeyPause: interKeyPauses.length > 0 ? interKeyPauses.reduce((a, b) => a + b, 0) / interKeyPauses.length : 0,
      sessionEntropy: sessionEntropy,
      keyDwellVariance: keyDwellVariance,
      interKeyVariance: interKeyVariance,
      pressureVariance: pressureVariance,
      touchAreaVariance: touchAreaVariance,
      typingPatternVector: typingPatternVector,
      avgTouchArea: avgTouchArea,
      avgPressure: avgPressure,
      avgCoordX: avgX,
      avgCoordY: avgY,
      errorRecoveryEvents: errorRecoveryEvents,
      avgErrorRecoveryTime: avgErrorRecoveryTime,
      deviceMetrics: deviceMetrics,
      keyTimings: keyTimings,
      touchEvents: touchEvents,
      characterCount: pin.length,
    };
  };

  const logPinDataCSV = async () => {
    const data = calculatePinMetrics();
    
    // Store data in AsyncStorage for the DatasetScreen
    try {
      const existingData = await AsyncStorage.getItem('pinDataset');
      const parsedData = existingData ? JSON.parse(existingData) : [];
      
      const dataWithId = {
        ...data,
        id: Date.now().toString(),
        keyTimingsCount: (data.keyTimings || []).length,
        touchEventsCount: (data.touchEvents || []).length,
        errorRecoveryCount: (data.errorRecoveryEvents || []).length,
        devicePlatform: data.deviceMetrics?.platform || 'unknown',
        deviceScreenWidth: data.deviceMetrics?.screenWidth || 0,
        deviceScreenHeight: data.deviceMetrics?.screenHeight || 0,
        devicePixelRatio: data.deviceMetrics?.pixelRatio || 1,
      };
      
      parsedData.push(dataWithId);
      await AsyncStorage.setItem('pinDataset', JSON.stringify(parsedData));
      
      // Make this data available globally for DatasetScreen
      if (global.addPinData) {
        await global.addPinData(dataWithId);
      }
    } catch (error) {
      console.error('Error storing PIN data:', error);
    }
    
    // Create CSV headers with all features (same as PinScreen exactly)
    const headers = [
      'username', 'captcha', 'userInput', 'isCorrect', 'timestamp', 
      'totalTime', 'wpm', 'backspaceCount', 'avgFlightTime', 'avgDwellTime',
      'avgInterKeyPause', 'sessionEntropy', 'keyDwellVariance', 'interKeyVariance',
      'pressureVariance', 'touchAreaVariance', 'avgTouchArea', 'avgPressure',
      'avgCoordX', 'avgCoordY', 'avgErrorRecoveryTime', 'characterCount',
      'flightTimesArray', 'dwellTimesArray', 'interKeyPausesArray', 
      'typingPatternVector', 'keyTimingsCount', 'touchEventsCount', 
      'errorRecoveryCount', 'devicePlatform', 'deviceScreenWidth', 
      'deviceScreenHeight', 'devicePixelRatio'
    ];
    
    // Create CSV row (same format as PinScreen exactly)
    const row = [
      `"${data.username || ''}"`,
      `"${data.captcha || ''}"`,
      `"${data.userInput || ''}"`,
      data.isCorrect || false,
      `"${data.timestamp || ''}"`,
      data.totalTime || 0,
      data.wpm?.toFixed(2) || 0,
      data.backspaceCount || 0,
      data.avgFlightTime?.toFixed(3) || 0,
      data.avgDwellTime?.toFixed(3) || 0,
      data.avgInterKeyPause?.toFixed(3) || 0,
      data.sessionEntropy?.toFixed(3) || 0,
      data.keyDwellVariance?.toFixed(3) || 0,
      data.interKeyVariance?.toFixed(3) || 0,
      data.pressureVariance?.toFixed(3) || 0,
      data.touchAreaVariance?.toFixed(3) || 0,
      data.avgTouchArea?.toFixed(3) || 0,
      data.avgPressure?.toFixed(3) || 0,
      data.avgCoordX?.toFixed(3) || 0,
      data.avgCoordY?.toFixed(3) || 0,
      data.avgErrorRecoveryTime?.toFixed(3) || 0,
      data.characterCount || 0,
      `"[${(data.flightTimes || []).join(';')}]"`,
      `"[${(data.dwellTimes || []).join(';')}]"`,
      `"[${(data.interKeyPauses || []).join(';')}]"`,
      `"[${(data.typingPatternVector || []).join(';')}]"`,
      (data.keyTimings || []).length,
      (data.touchEvents || []).length,
      (data.errorRecoveryEvents || []).length,
      `"${data.deviceMetrics?.platform || 'unknown'}"`,
      data.deviceMetrics?.screenWidth || 0,
      data.deviceMetrics?.screenHeight || 0,
      data.deviceMetrics?.pixelRatio || 1
    ];

    // Log the CSV format
    console.log('PIN Biometric Data CSV Format:');
    console.log(headers.join(','));
    console.log(row.join(','));
  };

  // Reset PIN metrics when PIN is cleared
  useEffect(() => {
    if (pin.length === 0) {
      resetPinMetrics();
    }
  }, [pin]);

  // Main render logic
  const renderMainContent = () => {
    if (currentStep === 'method') {
      return renderMethodSelection();
    } else if (currentStep === 'details' && transferMethod === 'bank') {
      return renderBankDetailsForm();
    } else if (currentStep === 'captcha') {
      return renderCaptchaScreen();
    } else if (currentStep === 'pin') {
      return renderPinEntry();
    } else if (currentStep === 'success') {
      return renderSuccessScreen();
    } else if (currentStep === 'blocked') {
      return renderBlockedScreen();
    } else {
      // For other methods (phone, upi, qr), if details step is reached, go directly to PIN
      return renderMethodSelection();
    }
  };

  return (
    <>
      {renderMainContent()}
      <SecurityQuestion
        visible={showSecurityQuestion}
        onSuccess={handleSecurityQuestionSuccess}
        onFailure={handleSecurityQuestionFailure}
      />
    </>
  );
};
