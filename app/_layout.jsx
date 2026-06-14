import { AntDesign } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, UIManager } from 'react-native';
import 'react-native-reanimated';
import { ThemeProvider } from './ThemeContext'; // <-- Import ThemeProvider
import mobileAds from '../utils/googleMobileAds';

// Enable LayoutAnimation on Android (only if New Architecture is not active)
if (
    Platform.OS === 'android' &&
    !global.nativeFabricUIManager &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        ...AntDesign.font,
    });

    useEffect(() => {
        if (error) throw error;
    }, [error]);

    useEffect(() => {
        // Initialize Google Mobile Ads SDK on app launch
        mobileAds()
            .initialize()
            .then((status) => console.log('AdMob initialization complete:', status))
            .catch((err) => console.error('AdMob initialization error:', err));
    }, []);

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <ThemeProvider>
            <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
    );
}