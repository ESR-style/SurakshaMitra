import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

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
   * Uses Expo APIs to detect development environment
   */
  private async checkDeveloperMode(): Promise<boolean> {
    try {
      // Check if running in development mode
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

      // Check if app is signed with debug key (in development)
      if (Platform.OS === 'android' && Constants.manifest?.extra?.isDebug) {
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
   * In Expo managed workflow, correlates with development mode
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

      // Check if debugger is attached (indicates debugging session)
      if (__DEV__) {
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
   * Uses device characteristics and Expo Device API
   */
  private async checkEmulator(): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        return false;
      }

      // Check if it's a physical device
      const isPhysicalDevice = Device.isDevice;
      if (!isPhysicalDevice) {
        return true;
      }

      // Check device model and manufacturer for emulator indicators
      const modelName = (Device.modelName || '').toLowerCase();
      const manufacturer = (Device.manufacturer || '').toLowerCase();
      const deviceName = (Device.deviceName || '').toLowerCase();

      const emulatorIndicators = [
        'emulator',
        'simulator',
        'android sdk',
        'genymotion',
        'google_sdk',
        'droid4x',
        'andy',
        'bluestacks',
        'goldfish',
        'vbox',
        'virtual',
        'sdk',
        'test'
      ];

      const hasEmulatorIndicator = emulatorIndicators.some(indicator => 
        modelName.includes(indicator) || 
        manufacturer.includes(indicator) || 
        deviceName.includes(indicator)
      );

      if (hasEmulatorIndicator) {
        return true;
      }

      // Check for common emulator characteristics
      if (manufacturer === 'google' && modelName.includes('sdk')) {
        return true;
      }

      // Check device type
      if (Device.deviceType === Device.DeviceType.UNKNOWN) {
        return true; // Unknown device type might indicate emulator
      }

      return false;
    } catch (error) {
      console.log('Error checking emulator:', error);
      return false;
    }
  }

  /**
   * Check if device is rooted
   * Limited detection in Expo managed workflow
   */
  private async checkRootAccess(): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        return false;
      }

      // Check device model for custom ROM indicators
      const modelName = (Device.modelName || '').toLowerCase();
      const manufacturer = (Device.manufacturer || '').toLowerCase();

      const customRomIndicators = [
        'lineageos',
        'cyanogen',
        'paranoid',
        'custom',
        'aosp',
        'resurrection',
        'evolution'
      ];

      const hasCustomRomIndicator = customRomIndicators.some(indicator => 
        modelName.includes(indicator) || manufacturer.includes(indicator)
      );

      if (hasCustomRomIndicator) {
        return true;
      }

      // In development mode, don't flag as rooted unless clear indicators
      if (__DEV__) {
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
    console.log('=== SECURITY STATE ===');
    console.log(JSON.stringify({
      securityCheck: 'completed',
      state,
      summary: {
        threatsDetected: [
          state.isDeveloperMode && 'developer_mode',
          state.isUSBDebugging && 'usb_debugging', 
          state.isEmulator && 'emulator',
          state.isRooted && 'rooted_device'
        ].filter(Boolean),
        deviceInfo: {
          model: state.deviceModel,
          manufacturer: state.deviceManufacturer,
          platform: Platform.OS,
          version: state.androidVersion
        }
      }
    }, null, 2));
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
