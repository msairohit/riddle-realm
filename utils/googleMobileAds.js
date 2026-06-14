import Constants from 'expo-constants';
const isExpoGo = Constants.appOwnership === 'expo';

const createNoopAd = () => {
  const listeners = new Map();

  const emit = (eventName) => {
    const callbacks = listeners.get(eventName) || [];
    callbacks.forEach((callback) => callback());
  };

  return {
    addAdEventListener: (eventName, callback) => {
      const callbacks = listeners.get(eventName) || [];
      callbacks.push(callback);
      listeners.set(eventName, callbacks);

      return () => {
        listeners.set(
          eventName,
          (listeners.get(eventName) || []).filter((item) => item !== callback)
        );
      };
    },
    load: () => {
      emit('loaded');
    },
    show: () => {
      emit('earned_reward');
      emit('closed');
      return Promise.resolve();
    },
  };
};

const expoGoAds = {
  AdEventType: {
    CLOSED: 'closed',
    ERROR: 'error',
    LOADED: 'loaded',
  },
  BannerAd: () => null,
  BannerAdSize: {
    ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
    BANNER: 'BANNER',
  },
  InterstitialAd: {
    createForAdRequest: createNoopAd,
  },
  InterstitialAdEventType: {
    LOADED: 'loaded',
  },
  RewardedAd: {
    createForAdRequest: createNoopAd,
  },
  RewardedAdEventType: {
    EARNED_REWARD: 'earned_reward',
    LOADED: 'loaded',
  },
  TestIds: {
    BANNER: 'test-banner',
    INTERSTITIAL: 'test-interstitial',
    REWARDED: 'test-rewarded',
  },
  mobileAds: () => ({
    initialize: () => Promise.resolve({}),
  }),
};

const nativeAds = isExpoGo ? expoGoAds : require('react-native-google-mobile-ads');

export const AdEventType = nativeAds.AdEventType;
export const BannerAd = nativeAds.BannerAd;
export const BannerAdSize = nativeAds.BannerAdSize;
export const InterstitialAd = nativeAds.InterstitialAd;
export const InterstitialAdEventType = nativeAds.InterstitialAdEventType || nativeAds.AdEventType;
export const RewardedAd = nativeAds.RewardedAd;
export const RewardedAdEventType = nativeAds.RewardedAdEventType;
export const TestIds = nativeAds.TestIds;

const mobileAds = isExpoGo
  ? expoGoAds.mobileAds
  : (require('react-native-google-mobile-ads').default || require('react-native-google-mobile-ads'));

export default mobileAds;
