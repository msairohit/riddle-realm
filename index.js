/**
 * index.js
 * Custom entry point to mock native AdMob modules when running in environments where they are not registered (e.g. Expo Go).
 * This runs at the absolute start of the JS bundle before any React Native modules evaluate.
 */

import './utils/admobMock';
import 'expo-router/entry';
