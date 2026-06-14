/**
 * utils/admobMock.js
 * Runtime mock for react-native-google-mobile-ads native modules.
 * This runs in environments without the native binaries (like Expo Go or Web) to prevent crashes.
 */


const adModuleNames = [
  'RNGoogleMobileAdsModule',
  'RNGoogleMobileAdsRewardedModule',
  'RNGoogleMobileAdsRewardedInterstitialModule',
  'RNGoogleMobileAdsInterstitialModule',
  'RNGoogleMobileAdsNativeModule',
  'RNGoogleMobileAdsConsentModule',
  'RNGoogleMobileAdsAppOpenModule',
  'RNAppModule',
];

const makeMock = (name) => {
  console.log(`[AdMob Mock] Initialized fallback mock for: ${name}`);
  return new Proxy({}, {
    get(target, prop) {
      if (prop === 'then') return undefined;
      
      // If it's a function, return a function that resolves to mimic native APIs
      return (...args) => {
        console.warn(`[AdMob Mock] Stubbed native call: ${name}.${String(prop)}()`);
        if (prop === 'initialize') {
          return Promise.resolve([]);
        }
        return Promise.resolve();
      };
    }
  });
};

// 1. Intercept TurboModuleRegistry lookup
const originalTurboModuleProxy = global.__turboModuleProxy;
global.__turboModuleProxy = function (name) {
  if (adModuleNames.includes(name)) {
    return makeMock(name);
  }
  if (originalTurboModuleProxy) {
    try {
      return originalTurboModuleProxy(name);
    } catch (e) {
      if (adModuleNames.includes(name)) {
        return makeMock(name);
      }
      throw e;
    }
  }
  return null;
};

// 2. Proxy NativeModules as fallback for legacy lookups
const rn = require('react-native');
const { UIManager, View } = rn;
const originalNativeModules = rn.NativeModules;

if (originalNativeModules) {
  const adNativeModulesMock = {};
  adModuleNames.forEach((name) => {
    adNativeModulesMock[name] = makeMock(name);
  });

  const nativeModulesProxy = new Proxy(originalNativeModules, {
    get(target, prop) {
      if (adModuleNames.includes(prop)) {
        return adNativeModulesMock[prop];
      }
      return target[prop];
    }
  });

  try {
    Object.defineProperty(rn, 'NativeModules', {
      value: nativeModulesProxy,
      configurable: true,
      enumerable: true,
      writable: true,
    });
  } catch (e) {
    console.warn('[AdMob Mock] Failed to define NativeModules proxy:', e);
  }
}

// 3. Patch UIManager for view managers configurations lookups
if (UIManager) {
  const originalGetViewManagerConfig = UIManager.getViewManagerConfig;
  UIManager.getViewManagerConfig = function (name) {
    if (name === 'RNGoogleMobileAdsBannerView' || name.includes('GoogleMobileAds')) {
      return {};
    }
    return originalGetViewManagerConfig ? originalGetViewManagerConfig(name) : undefined;
  };
}

// 4. Patch requireNativeComponent to return a dummy View component when requested
try {
  const rn = require('react-native');
  const originalRequireNativeComponent = rn.requireNativeComponent;
  const patchedRequireNativeComponent = function (name) {
    try {
      return originalRequireNativeComponent(name);
    } catch (e) {
      if (name === 'RNGoogleMobileAdsBannerView' || name.includes('GoogleMobileAds')) {
        console.warn(`[AdMob Mock] requireNativeComponent failed for "${name}". Returning fallback View.`);
        return View;
      }
      throw e;
    }
  };
  Object.defineProperty(rn, 'requireNativeComponent', {
    value: patchedRequireNativeComponent,
    configurable: true,
    enumerable: true,
    writable: true,
  });
} catch (err) {
  console.warn('[AdMob Mock] Failed to patch requireNativeComponent:', err);
}
