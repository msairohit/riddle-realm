/**
 * soundManager.js
 *
 * Central audio & vibration utility for Riddle Realm.
 * Uses expo-av for sound and expo-haptics for vibrations.
 *
 * Sound effects are loaded from royalty-free CDN URLs.
 * Background music loops gently while the riddle screen is active.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// ─── Settings keys ────────────────────────────────────────────────────────────
const KEYS = {
    sound: '@sound_enabled',
    music: '@music_enabled',
    vibration: '@vibration_enabled',
};

// ─── Free, royalty-free sound URLs ────────────────────────────────────────────
// These are short, lightweight clips from Pixabay (royalty-free, no attribution required).
const SOUND_ASSETS = {
    click: require('../assets/sounds/click_sound.mp3'),
    swipe: require('../assets/sounds/next_or_prev.mp3'),
    correct: require('../assets/sounds/correct.mp3'),
    wrong: require('../assets/sounds/wrong.wav'),
    near: require('../assets/sounds/near.wav'),
    bookmark: require('../assets/sounds/bookmark.wav'),
    hint: require('../assets/sounds/hint.wav'),
};

// Soothing ambient background music (gentle piano/nature loop)
const BG_MUSIC_ASSET = require('../assets/sounds/nastelbom-ambient-495893.mp3');

// ─── In-memory sound cache ─────────────────────────────────────────────────
/** @type {Record<string, Audio.Sound>} */
const _soundCache = {};

/** @type {Audio.Sound | null} */
let _bgMusic = null;
let _bgMusicLoading = false;

// ─── Settings helper ──────────────────────────────────────────────────────────
async function getSettings() {
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
}

// ─── Audio mode setup ────────────────────────────────────────────────────────
let _audioModeSet = false;
async function ensureAudioMode() {
    if (_audioModeSet) return;
    try {
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: false,   // respect silent switch on iOS
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
        });
        _audioModeSet = true;
    } catch (e) {
        console.warn('soundManager: setAudioMode error', e);
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Play a short sound effect by name.
 * @param {'click'|'swipe'|'correct'|'wrong'|'near'|'bookmark'|'hint'} name
 */
export async function playSound(name) {
    try {
        const { soundEnabled } = await getSettings();
        if (!soundEnabled) return;

        const asset = SOUND_ASSETS[name];
        if (!asset) return;

        await ensureAudioMode();

        // Reuse cached sound object where possible
        if (_soundCache[name]) {
            const status = await _soundCache[name].getStatusAsync();
            if (status.isLoaded) {
                await _soundCache[name].replayAsync();
                return;
            }
            // stale — unload and reload
            await _soundCache[name].unloadAsync();
            delete _soundCache[name];
        }

        const { sound } = await Audio.Sound.createAsync(
            asset,
            { shouldPlay: true, volume: 0.7 }
        );
        _soundCache[name] = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
                // Don't unload — keep cached for replay
            }
        });
    } catch (e) {
        // Silently fail — sounds are non-critical
        console.warn(`soundManager: playSound(${name}) error`, e);
    }
}

/**
 * Start the background ambient music loop.
 * Safe to call multiple times — only loads once.
 */
export async function startBgMusic() {
    try {
        const { musicEnabled } = await getSettings();
        if (!musicEnabled) return;
        if (_bgMusic || _bgMusicLoading) return;

        _bgMusicLoading = true;
        await ensureAudioMode();

        const { sound } = await Audio.Sound.createAsync(
            BG_MUSIC_ASSET,
            { shouldPlay: true, isLooping: true, volume: 0.18 }
        );
        _bgMusic = sound;
        _bgMusicLoading = false;
    } catch (e) {
        _bgMusicLoading = false;
        console.warn('soundManager: startBgMusic error', e);
    }
}

/**
 * Stop and unload the background music.
 */
export async function stopBgMusic() {
    try {
        if (!_bgMusic) return;
        const sound = _bgMusic;
        _bgMusic = null;
        await sound.stopAsync();
        await sound.unloadAsync();
    } catch (e) {
        console.warn('soundManager: stopBgMusic error', e);
    }
}

/**
 * Pause music (for temporary suppression, e.g. during rewarded ads).
 */
export async function pauseBgMusic() {
    try {
        if (!_bgMusic) return;
        await _bgMusic.pauseAsync();
    } catch (e) {
        console.warn('soundManager: pauseBgMusic error', e);
    }
}

/**
 * Resume previously paused music.
 */
export async function resumeBgMusic() {
    try {
        const { musicEnabled } = await getSettings();
        if (!musicEnabled || !_bgMusic) return;
        await _bgMusic.playAsync();
    } catch (e) {
        console.warn('soundManager: resumeBgMusic error', e);
    }
}

/**
 * Unload all cached sound effects (call on app unmount / cleanup).
 */
export async function unloadAllSounds() {
    try {
        await stopBgMusic();
        await Promise.all(
            Object.values(_soundCache).map(s => s.unloadAsync().catch(() => { }))
        );
        Object.keys(_soundCache).forEach(k => delete _soundCache[k]);
    } catch (e) {
        console.warn('soundManager: unloadAllSounds error', e);
    }
}

// ─── Vibration ────────────────────────────────────────────────────────────────

/**
 * Trigger haptic feedback.
 * @param {'light'|'medium'|'heavy'|'success'|'warning'|'error'} style
 */
export async function vibrate(style = 'light') {
    try {
        const { vibrationEnabled } = await getSettings();
        if (!vibrationEnabled) return;

        switch (style) {
            case 'light':
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                break;
            case 'medium':
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                break;
            case 'heavy':
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                break;
            case 'success':
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                break;
            case 'warning':
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                break;
            case 'error':
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                break;
            default:
                await Haptics.selectionAsync();
        }
    } catch (e) {
        // Haptics might not be available on all devices — silently fail
    }
}
