import { securityModule, SecurityState, SecurityThreat } from './SecurityModule';

interface SecurityInfo {
  isDeveloperMode: boolean;
  isUSBDebugging: boolean;
  isCharging: boolean;
  isEmulator: boolean;
  isRooted: boolean;
  deviceModel: string;
  deviceManufacturer: string;
  androidVersion: string;
  buildFingerprint: string;
}

class SecurityDetectionService {
  async getSecurityInfo(): Promise<SecurityInfo> {
    try {
      // Use the new SecurityModule for comprehensive security checking
      const securityState = await securityModule.performSecurityCheck();
      
      // Convert SecurityState to SecurityInfo format for backward compatibility
      return {
        isDeveloperMode: securityState.isDeveloperMode,
        isUSBDebugging: securityState.isUSBDebugging,
        isCharging: false, // Not available in current Expo managed workflow
        isEmulator: securityState.isEmulator,
        isRooted: securityState.isRooted,
        deviceModel: securityState.deviceModel,
        deviceManufacturer: securityState.deviceManufacturer,
        androidVersion: securityState.androidVersion,
        buildFingerprint: securityState.buildFingerprint
      };
    } catch (error) {
      console.log('Error in SecurityDetectionService:', error);
      
      // Return safe defaults on error
      return {
        isDeveloperMode: false,
        isUSBDebugging: false,
        isCharging: false,
        isEmulator: false,
        isRooted: false,
        deviceModel: 'Unknown',
        deviceManufacturer: 'Unknown',
        androidVersion: 'N/A',
        buildFingerprint: 'N/A'
      };
    }
  }

  // Legacy method for backward compatibility - now uses SecurityModule
  async getAdvancedSecurityInfo(): Promise<Partial<SecurityInfo>> {
    try {
      const securityState = await securityModule.performSecurityCheck();
      
      return {
        isCharging: false, // Not available in Expo managed workflow
        isDeveloperMode: securityState.isDeveloperMode,
        isUSBDebugging: securityState.isUSBDebugging,
      };
    } catch (error) {
      console.log('Error in advanced security check:', error);
      return {
        isCharging: false,
        isDeveloperMode: false,
        isUSBDebugging: false,
      };
    }
  }

  // Simplified logging method - SecurityModule handles detailed logging
  async logSecurityStates(): Promise<void> {
    try {
      // SecurityModule.performSecurityCheck() already handles comprehensive logging
      // This method is kept for backward compatibility
      await securityModule.performSecurityCheck();
    } catch (error) {
      console.log('Error logging security states:', error);
    }
  }

  // Get cached security state if available
  getCachedSecurityInfo(): SecurityInfo | null {
    const cached = securityModule.getCachedSecurityState();
    if (!cached) return null;

    return {
      isDeveloperMode: cached.isDeveloperMode,
      isUSBDebugging: cached.isUSBDebugging,
      isCharging: false,
      isEmulator: cached.isEmulator,
      isRooted: cached.isRooted,
      deviceModel: cached.deviceModel,
      deviceManufacturer: cached.deviceManufacturer,
      androidVersion: cached.androidVersion,
      buildFingerprint: cached.buildFingerprint
    };
  }

  // Clear security cache
  clearSecurityCache(): void {
    securityModule.clearCache();
  }
}

const SecurityDetection = new SecurityDetectionService();

export { SecurityDetection };
export type { SecurityInfo };
