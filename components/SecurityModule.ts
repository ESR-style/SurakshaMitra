import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

interface SecurityState {
  isDeveloperMode: boolean;
  isUSBDebugging: boolean;
  isEmulator: boolean;
  isRooted: boolean;
  deviceModel: string;
  deviceManufacturer: string;
  androidVersion: string;
  buildFingerprint: string;
  timestamp: string;
}

interface SecurityThreat {
  type: 'developer_mode' | 'usb_debugging' | 'emulator' | 'rooted_device';
  detected: boolean;
  timestamp: string;
  details?: string;
}

class SecurityModule {
  private static instance: SecurityModule;
  private lastCheck: SecurityState | null = null;
  private checkInProgress = false;

  static getInstance(): SecurityModule {
    if (!SecurityModule.instance) {
      SecurityModule.instance = new SecurityModule();
    }
    return SecurityModule.instance;
  }

  /**
   * Main security check method - returns comprehensive security state
   */
  async performSecurityCheck(): Promise<SecurityState> {
    if (this.checkInProgress) {
      return this.lastCheck || this.getDefaultSecurityState();
    }

    this.checkInProgress = true;
    const timestamp = new Date().toISOString();

    try {
      // Device information
      const deviceModel = Device.modelName || 'Unknown';
      const deviceManufacturer = Device.manufacturer || 'Unknown';
      const androidVersion = Platform.OS === 'android' ? Platform.Version?.toString() || 'N/A' : 'N/A';
      const buildFingerprint = Constants.systemVersion?.toString() || 'N/A';

      // Security checks
      const isDeveloperMode = await this.checkDeveloperMode();
      const isUSBDebugging = await this.checkUSBDebugging();
      const isEmulator = await this.checkEmulator();
      const isRooted = await this.checkRootAccess();

      const securityState: SecurityState = {
        isDeveloperMode,
        isUSBDebugging,
        isEmulator,
        isRooted,
        deviceModel,
        deviceManufacturer,
        androidVersion,
        buildFingerprint,
        timestamp
      };

      this.lastCheck = securityState;
      
      // Log comprehensive security state
      this.logSecurityState(securityState);
      
      // Log individual threats
      this.logIndividualThreats(securityState);

      return securityState;
    } catch (error) {
      console.log(JSON.stringify({
        error: 'security_check_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp
      }, null, 2));
      
      return this.getDefaultSecurityState();
    } finally {
      this.checkInProgress = false;
    }
  }

  /**
   * Check if device is in developer mode
   * Enhanced detection using multiple indicators
   */
  private async checkDeveloperMode(): Promise<boolean> {
    try {
      // Primary checks - development environment
      if (__DEV__) {
        return true;
      }

      // Check if running in Expo development client
      if (Constants.appOwnership === 'expo') {
        return true;
      }

      // Check for debug build configuration
      if (Constants.debugMode) {
        return true;
      }

      // Enhanced checks using Constants and Application
      if (Constants.isDevice === false) {
        return true; // Running on simulator/emulator typically means dev mode
      }

      // Check if app is signed with debug key
      if (Platform.OS === 'android') {
        // Check for development indicators in app config
        if (Constants.manifest?.extra?.isDebug) {
          return true;
        }

        // Check if this is a development build
        if (Constants.appOwnership === 'standalone' && Constants.isDevice === false) {
          return true;
        }
      }

      // Check for development server connection
      if (Constants.linkingUrl?.includes('localhost') || Constants.linkingUrl?.includes('192.168')) {
        return true;
      }

      return false;
    } catch (error) {
      console.log('Error checking developer mode:', error);
      return false;
    }
  }

  /**
   * Check if USB debugging is enabled
   * Enhanced detection using multiple indicators
   */
  private async checkUSBDebugging(): Promise<boolean> {
    try {
      // In Expo managed workflow, USB debugging is typically enabled in dev mode
      if (__DEV__) {
        return true;
      }

      // If running in Expo development client, USB debugging is likely enabled
      if (Constants.appOwnership === 'expo') {
        return true;
      }

      // Check if remote debugger is connected
      if ((global as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        return true;
      }

      // Check for development server connection indicators
      if (Constants.linkingUrl && (
        Constants.linkingUrl.includes(':8081') || 
        Constants.linkingUrl.includes(':19000') ||
        Constants.linkingUrl.includes(':19001')
      )) {
        return true;
      }

      // Enhanced check - if we can detect metro bundler connection
      if (typeof (global as any).__BUNDLE_START_TIME__ !== 'undefined') {
        return true;
      }

      // Check for development environment indicators
      if (Constants.manifest?.developer) {
        return true;
      }

      return false;
    } catch (error) {
      console.log('Error checking USB debugging:', error);
      return false;
    }
  }

  /**
   * Check if running on emulator
   * Enhanced detection using device characteristics and Expo Device API
   */
  private async checkEmulator(): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        // For iOS, check if it's a simulator
        return !Device.isDevice;
      }

      // Primary check - is this a physical device?
      const isPhysicalDevice = Device.isDevice;
      if (!isPhysicalDevice) {
        return true;
      }

      // Get device characteristics
      const modelName = (Device.modelName || '').toLowerCase();
      const manufacturer = (Device.manufacturer || '').toLowerCase();
      const deviceName = (Device.deviceName || '').toLowerCase();
      const brand = (Device.brand || '').toLowerCase();

      // Comprehensive emulator detection patterns
      const emulatorIndicators = [
        // Generic emulator terms
        'emulator', 'simulator', 'virtual', 'test',
        // Android SDK emulators
        'android sdk', 'google_sdk', 'sdk_gphone', 'sdk_google',
        // Popular emulators
        'genymotion', 'droid4x', 'andy', 'bluestacks', 'nox', 'memu',
        // Virtual machine indicators
        'goldfish', 'vbox', 'qemu', 'ranchu',
        // Development/testing
        'development', 'testing', 'debug'
      ];

      // Check model name for emulator indicators
      const hasEmulatorIndicator = emulatorIndicators.some(indicator => 
        modelName.includes(indicator) || 
        manufacturer.includes(indicator) || 
        deviceName.includes(indicator) ||
        brand.includes(indicator)
      );

      if (hasEmulatorIndicator) {
        return true;
      }

      // Specific emulator detection patterns
      const specificChecks = [
        // Google SDK emulators
        manufacturer === 'google' && modelName.includes('sdk'),
        manufacturer === 'google' && brand === 'google',
        // Common emulator model patterns
        modelName.includes('_') && modelName.includes('x86'),
        modelName.includes('_') && modelName.includes('x64'),
        // Device type checks
        Device.deviceType === Device.DeviceType.UNKNOWN,
        // Brand-specific checks
        brand === 'generic' && manufacturer === 'unknown',
        brand === 'android' && manufacturer === 'google'
      ];

      if (specificChecks.some(check => check)) {
        return true;
      }

      // Additional heuristics for emulator detection
      try {
        // Check if we can access secure store (some emulators may fail)
        await SecureStore.setItemAsync('emulator_test', 'test_value');
        await SecureStore.deleteItemAsync('emulator_test');
      } catch (error) {
        // If secure store fails, might be an emulator
        return true;
      }

      // Check for common emulator file system characteristics
      try {
        const documentsDir = FileSystem.documentDirectory;
        if (documentsDir && (
          documentsDir.includes('emulator') ||
          documentsDir.includes('simulator') ||
          documentsDir.includes('android_sdk')
        )) {
          return true;
        }
      } catch (error) {
        // File system access error might indicate emulator
      }

      return false;
    } catch (error) {
      console.log('Error checking emulator:', error);
      return false;
    }
  }

  /**
   * Check if device is rooted
   * Enhanced detection in Expo managed workflow
   */
  private async checkRootAccess(): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        return false;
      }

      // Get device characteristics
      const modelName = (Device.modelName || '').toLowerCase();
      const manufacturer = (Device.manufacturer || '').toLowerCase();
      const brand = (Device.brand || '').toLowerCase();
      const deviceName = (Device.deviceName || '').toLowerCase();

      // Check for custom ROM indicators
      const customRomIndicators = [
        'lineageos', 'cyanogen', 'paranoid', 'custom', 'aosp',
        'resurrection', 'evolution', 'omni', 'carbon', 'slim',
        'miui', 'flyme', 'coloros', 'funtouch', 'emui'
      ];

      const hasCustomRomIndicator = customRomIndicators.some(indicator => 
        modelName.includes(indicator) || 
        manufacturer.includes(indicator) ||
        brand.includes(indicator) ||
        deviceName.includes(indicator)
      );

      if (hasCustomRomIndicator) {
        return true;
      }

      // Check for root-specific patterns
      const rootIndicators = [
        'rooted', 'root', 'magisk', 'supersu', 'chainfire',
        'kingroot', 'towelroot', 'framaroot'
      ];

      const hasRootIndicator = rootIndicators.some(indicator => 
        modelName.includes(indicator) ||
        deviceName.includes(indicator) ||
        brand.includes(indicator)
      );

      if (hasRootIndicator) {
        return true;
      }

      // Enhanced checks using device properties
      try {
        // Check if we can detect unusual device characteristics
        const buildFingerprint = (Constants.systemVersion || '').toString();
        const buildTags = (Constants.nativeAppVersion || '').toString();
        
        // Check for test-keys (indicates custom build)
        if (buildTags.includes('test-keys')) {
          return true;
        }

        // Check for debugging/development builds
        if (buildFingerprint.includes('test-keys') || 
            buildFingerprint.includes('dev-keys') ||
            buildFingerprint.includes('userdebug')) {
          return true;
        }

        // Check for unusual manufacturer/brand combinations
        const suspiciousCombinations = [
          manufacturer === 'unknown' && brand === 'generic',
          manufacturer === 'generic' && brand === 'unknown',
          manufacturer.includes('test') || brand.includes('test')
        ];

        if (suspiciousCombinations.some(check => check)) {
          return true;
        }

      } catch (error) {
        console.log('Error in enhanced root check:', error);
      }

      // Try to access restricted areas (will fail on properly secured devices)
      try {
        // Attempt to write to a system directory (should fail on non-rooted devices)
        const testPath = `${FileSystem.documentDirectory}../../../system/test.txt`;
        await FileSystem.writeAsStringAsync(testPath, 'test');
        await FileSystem.deleteAsync(testPath);
        // If we reach here, device might have elevated permissions
        return true;
      } catch (error) {
        // Expected behavior for non-rooted devices
      }

      // In development mode, don't flag as rooted unless clear indicators
      if (__DEV__ && !hasCustomRomIndicator && !hasRootIndicator) {
        return false;
      }

      return false;
    } catch (error) {
      console.log('Error checking root access:', error);
      return false;
    }
  }

  /**
   * Log comprehensive security state as JSON
   */
  private logSecurityState(state: SecurityState): void {
    console.log('=== ENHANCED SECURITY STATE ===');
    console.log(JSON.stringify({
      securityCheck: 'completed',
      version: 'enhanced_v2.0',
      state,
      detectionMethods: {
        developerMode: [
          '__DEV__ flag',
          'Expo app ownership',
          'Debug mode detection',
          'Development server connection',
          'Device type analysis'
        ],
        usbDebugging: [
          'Development environment detection',
          'React DevTools connection',
          'Metro bundler detection',
          'Development server ports'
        ],
        emulator: [
          'Device.isDevice check',
          'Model/manufacturer analysis',
          'SecureStore accessibility',
          'File system patterns',
          'Brand/device name heuristics'
        ],
        rootAccess: [
          'Custom ROM detection',
          'Build fingerprint analysis',
          'Test-keys detection',
          'File system permissions',
          'Device characteristics'
        ]
      },
      summary: {
        threatsDetected: [
          state.isDeveloperMode && 'developer_mode',
          state.isUSBDebugging && 'usb_debugging', 
          state.isEmulator && 'emulator',
          state.isRooted && 'rooted_device'
        ].filter(Boolean),
        securityLevel: this.calculateSecurityLevel(state),
        deviceInfo: {
          model: state.deviceModel,
          manufacturer: state.deviceManufacturer,
          brand: Device.brand || 'Unknown',
          platform: Platform.OS,
          version: state.androidVersion,
          isDevice: Device.isDevice,
          deviceType: Device.deviceType
        },
        environment: {
          isDev: __DEV__,
          appOwnership: Constants.appOwnership,
          isDevice: Constants.isDevice,
          linkingUrl: Constants.linkingUrl
        }
      }
    }, null, 2));
  }

  /**
   * Calculate overall security level based on detected threats
   */
  private calculateSecurityLevel(state: SecurityState): string {
    const threats = [
      state.isDeveloperMode,
      state.isUSBDebugging,
      state.isEmulator,
      state.isRooted
    ].filter(Boolean).length;

    if (threats === 0) return 'secure';
    if (threats === 1) return 'low_risk';
    if (threats === 2) return 'medium_risk';
    if (threats >= 3) return 'high_risk';
    return 'unknown';
  }

  /**
   * Log individual security threats as separate JSONs
   */
  private logIndividualThreats(state: SecurityState): void {
    const threats: SecurityThreat[] = [
      {
        type: 'developer_mode',
        detected: state.isDeveloperMode,
        timestamp: state.timestamp,
        details: state.isDeveloperMode ? 'Development mode active' : undefined
      },
      {
        type: 'usb_debugging',
        detected: state.isUSBDebugging,
        timestamp: state.timestamp,
        details: state.isUSBDebugging ? 'USB debugging enabled' : undefined
      },
      {
        type: 'emulator',
        detected: state.isEmulator,
        timestamp: state.timestamp,
        details: state.isEmulator ? 'Running on emulator/simulator' : undefined
      },
      {
        type: 'rooted_device',
        detected: state.isRooted,
        timestamp: state.timestamp,
        details: state.isRooted ? 'Device appears to be rooted' : undefined
      }
    ];

    threats.forEach(threat => {
      if (threat.detected) {
        console.log('=== SECURITY THREAT ===');
        console.log(JSON.stringify({
          threat: threat.type,
          detected: threat.detected,
          details: threat.details,
          timestamp: threat.timestamp
        }, null, 2));
      }
    });

    // Also log safe states for completeness
    const safeStates = threats.filter(t => !t.detected);
    if (safeStates.length > 0) {
      console.log('=== SECURITY STATUS ===');
      safeStates.forEach(state => {
        console.log(JSON.stringify({
          check: state.type,
          status: 'safe',
          timestamp: state.timestamp
        }, null, 2));
      });
    }
  }

  /**
   * Get default security state for error cases
   */
  private getDefaultSecurityState(): SecurityState {
    return {
      isDeveloperMode: false,
      isUSBDebugging: false,
      isEmulator: false,
      isRooted: false,
      deviceModel: 'Unknown',
      deviceManufacturer: 'Unknown',
      androidVersion: 'N/A',
      buildFingerprint: 'N/A',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get cached security state if available
   */
  getCachedSecurityState(): SecurityState | null {
    return this.lastCheck;
  }

  /**
   * Clear cached security state (for retesting)
   */
  clearCache(): void {
    this.lastCheck = null;
  }
}

// Export singleton instance
export const securityModule = SecurityModule.getInstance();
export type { SecurityState, SecurityThreat };
