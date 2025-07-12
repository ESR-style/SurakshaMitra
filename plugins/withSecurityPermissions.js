const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const withSecurityPermissions = (config) => {
  // Add network security configuration file
  config = withNetworkSecurityConfig(config);
  
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Add necessary permissions including INTERNET
    const permissions = [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.BATTERY_STATS',
      'android.permission.HIGH_SAMPLING_RATE_SENSORS',
      'android.permission.BODY_SENSORS'
    ];

    permissions.forEach(permission => {
      if (!androidManifest.manifest['uses-permission']?.find(p => p.$['android:name'] === permission)) {
        androidManifest.manifest['uses-permission'] = androidManifest.manifest['uses-permission'] || [];
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': permission }
        });
      }
    });

    // Add network security config to application tag
    if (!androidManifest.manifest.application) {
      androidManifest.manifest.application = [{}];
    }
    
    if (!androidManifest.manifest.application[0].$) {
      androidManifest.manifest.application[0].$ = {};
    }
    
    // Add network security config and allow cleartext traffic
    androidManifest.manifest.application[0].$['android:networkSecurityConfig'] = '@xml/network_security_config';
    androidManifest.manifest.application[0].$['android:usesCleartextTraffic'] = 'true';
    
    return config;
  });
};

// Function to create network security configuration file
const withNetworkSecurityConfig = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      const xmlFile = path.join(xmlDir, 'network_security_config.xml');

      // Create xml directory if it doesn't exist
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      // Create network security config XML
      const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">64.227.187.22</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">10.0.3.2</domain>
        <domain includeSubdomains="true">192.168.1.1</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
    </domain-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
</network-security-config>`;

      fs.writeFileSync(xmlFile, networkSecurityConfig);
      
      return config;
    },
  ]);
};

module.exports = withSecurityPermissions;
