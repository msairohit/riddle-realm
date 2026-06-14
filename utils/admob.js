/**
 * utils/admob.js
 * Central AdMob configuration for Riddle Realm.
 * All Ad Unit IDs live here — swap to test IDs anytime by setting USE_TEST_IDS = true.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Ad Unit IDs ─────────────────────────────────────────────────────────────

const TEST_IDS = {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewardedHint: 'ca-app-pub-3940256099942544/5224354917',
    rewardedBookmark: 'ca-app-pub-3940256099942544/5224354917',
};

const PRODUCTION_IDS = {
    banner: 'ca-app-pub-1254844707253302/5942665772',
    interstitial: 'ca-app-pub-1254844707253302/6437489793',
    rewardedHint: 'ca-app-pub-1254844707253302/7263486306',
    rewardedBookmark: 'ca-app-pub-1254844707253302/9721294534',
};

// Set to true during testing to avoid showing real ads.
// Switch to false before publishing to the Play Store / App Store.
const USE_TEST_IDS = true;

export const AD_UNITS = Platform.OS === 'android'
    ? (USE_TEST_IDS ? TEST_IDS : PRODUCTION_IDS)
    : TEST_IDS; // iOS not configured — use test IDs

// ─── Admin flag helpers ───────────────────────────────────────────────────────

const ADMIN_KEYS = {
    SHOW_ADS: '@admin_show_ads',
    EXTRA_BOOKMARK_AD: '@admin_extra_bookmark_ad',
    EXTRA_HINT_AD: '@admin_extra_hint_ad',
};

/**
 * Returns the current ad settings from AsyncStorage.
 * Defaults: showAds=true, extraBookmarkAd=true, extraHintAd=true
 */
export const getAdSettings = async () => {
    try {
        const [ads, ebAd, ehAd] = await Promise.all([
            AsyncStorage.getItem(ADMIN_KEYS.SHOW_ADS),
            AsyncStorage.getItem(ADMIN_KEYS.EXTRA_BOOKMARK_AD),
            AsyncStorage.getItem(ADMIN_KEYS.EXTRA_HINT_AD),
        ]);
        return {
            showAds: ads === null ? true : ads === 'true',
            extraBookmarkAd: ebAd === null ? true : ebAd === 'true',
            extraHintAd: ehAd === null ? true : ehAd === 'true',
        };
    } catch {
        return { showAds: true, extraBookmarkAd: true, extraHintAd: true };
    }
};
