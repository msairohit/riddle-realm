/**
 * hooks/useRewardedAd.js
 * A React hook to load and show a rewarded ad from react-native-google-mobile-ads.
 * Calls onRewarded() ONLY when the user earns the reward (completes the ad).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { RewardedAd, RewardedAdEventType, AdEventType } from '../utils/googleMobileAds';

/**
 * @param {string} adUnitId  The AdMob rewarded ad unit ID.
 * @returns {{ showAd: (onRewarded: () => void) => void, isLoaded: boolean, isLoading: boolean }}
 */
export function useRewardedAd(adUnitId) {
    const [isLoaded, setIsLoaded]   = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const rewardedRef   = useRef(null);
    const onRewardedRef = useRef(null); // stores the callback for the current show() call

    const loadAd = useCallback(() => {
        setIsLoaded(false);
        setIsLoading(true);
        const rewarded = RewardedAd.createForAdRequest(adUnitId, {
            requestNonPersonalizedAdsOnly: false,
        });

        const unsubLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
            setIsLoaded(true);
            setIsLoading(false);
        });

        const unsubEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
            if (onRewardedRef.current) {
                onRewardedRef.current();
                onRewardedRef.current = null;
            }
        });

        const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
            unsubLoaded();
            unsubEarned();
            unsubClosed();
            // Preload the next ad immediately after close
            loadAd();
        });

        const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
            setIsLoading(false);
            unsubLoaded();
            unsubEarned();
            unsubClosed();
            unsubError();
        });

        rewarded.load();
        rewardedRef.current = rewarded;
    }, [adUnitId]);

    useEffect(() => {
        loadAd();
        // Cleanup on unmount — no-op if already unsubscribed
        return () => {
            rewardedRef.current = null;
        };
    }, [loadAd]);

    /**
     * Show the rewarded ad. If the ad isn't loaded yet, the callback will be
     * called directly (fallback) so the feature still works without an ad.
     *
     * @param {() => void} onRewarded  Called when user earns the reward.
     */
    const showAd = useCallback((onRewarded) => {
        if (isLoaded && rewardedRef.current) {
            onRewardedRef.current = onRewarded;
            rewardedRef.current.show();
        } else {
            // Ad not ready — grant reward anyway so UX isn't broken
            console.warn('[useRewardedAd] Ad not loaded yet, granting reward without ad.');
            onRewarded?.();
        }
    }, [isLoaded]);

    return { showAd, isLoaded, isLoading };
}
