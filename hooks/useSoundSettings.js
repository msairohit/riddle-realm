import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEYS = {
    sound: '@sound_enabled',
    music: '@music_enabled',
    vibration: '@vibration_enabled',
};

/**
 * Persists and exposes sound/music/vibration preference toggles.
 * Defaults: all ON.
 */
export function useSoundSettings() {
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [musicEnabled, setMusicEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);

    // Load saved prefs once on mount
    useEffect(() => {
        const load = async () => {
            try {
                const [s, m, v] = await Promise.all([
                    AsyncStorage.getItem(KEYS.sound),
                    AsyncStorage.getItem(KEYS.music),
                    AsyncStorage.getItem(KEYS.vibration),
                ]);
                if (s !== null) setSoundEnabled(s === '1');
                if (m !== null) setMusicEnabled(m === '1');
                if (v !== null) setVibrationEnabled(v === '1');
            } catch (e) {
                console.warn('useSoundSettings: load error', e);
            }
        };
        load();
    }, []);

    const toggleSound = useCallback(async () => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        await AsyncStorage.setItem(KEYS.sound, next ? '1' : '0');
    }, [soundEnabled]);

    const toggleMusic = useCallback(async () => {
        const next = !musicEnabled;
        setMusicEnabled(next);
        await AsyncStorage.setItem(KEYS.music, next ? '1' : '0');
    }, [musicEnabled]);

    const toggleVibration = useCallback(async () => {
        const next = !vibrationEnabled;
        setVibrationEnabled(next);
        await AsyncStorage.setItem(KEYS.vibration, next ? '1' : '0');
    }, [vibrationEnabled]);

    // Static read helpers (for use outside React — e.g. inside soundManager)
    const getSettings = useCallback(async () => {
        try {
            const [s, m, v] = await Promise.all([
                AsyncStorage.getItem(KEYS.sound),
                AsyncStorage.getItem(KEYS.music),
                AsyncStorage.getItem(KEYS.vibration),
            ]);
            return {
                soundEnabled: s === null ? false : s === '1',
                musicEnabled: m === null ? true : m === '1',
                vibrationEnabled: v === null ? true : v === '1',
            };
        } catch {
            return { soundEnabled: false, musicEnabled: true, vibrationEnabled: true };
        }
    }, []);

    return {
        soundEnabled,
        musicEnabled,
        vibrationEnabled,
        toggleSound,
        toggleMusic,
        toggleVibration,
        getSettings,
    };
}
