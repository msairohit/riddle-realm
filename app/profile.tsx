import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NotificationTimePrompt from '../components/NotificationTimePrompt';
import { useDailyNotifications } from '../hooks/useDailyNotifications';
import { useSoundSettings } from '../hooks/useSoundSettings';
import { playSound, vibrate } from '../utils/soundManager';
import { ageRanges, useTheme } from './ThemeContext';

export default function Profile() {
  const { theme, ageRange, setAgeRange } = useTheme();
  const insets = useSafeAreaInsets();
  const { soundEnabled, musicEnabled, vibrationEnabled, toggleSound, toggleMusic, toggleVibration } = useSoundSettings();
  const { hasPrompted, notificationTime, saveNotificationTime, skipNotificationTime } = useDailyNotifications();
  const [showTimePrompt, setShowTimePrompt] = useState(false);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {showTimePrompt && (
        <NotificationTimePrompt
          visible={showTimePrompt}
          onSave={(h, m) => {
            saveNotificationTime(h, m);
            setShowTimePrompt(false);
          }}
          onSkip={() => {
            setShowTimePrompt(false);
          }}
        />
      )}
      <View style={styles.background}>
        <LinearGradient
          colors={theme.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Custom Header */}
        <View style={[styles.header, { paddingTop: Math.max(16, insets.top) }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.cardBackground }]}
            onPress={() => {
              playSound('click');
              vibrate('light');
              router.back();
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings & Profile</Text>
          {/* Spacer to center the title */}
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(24, insets.bottom + 20) }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Themes / Age Range Selection */}
          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Theme & Style</Text>
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
            <Text style={[styles.cardDescription, { color: theme.textSecondary }]}>
              Choose a theme matching your preference. Each theme has different interface aesthetics.
            </Text>
            <View style={styles.themeSwatchRow}>
              {ageRanges.map((r) => {
                const swatchColors: Record<string, { dot: string; bg: string; label: string }> = {
                  kids: { dot: '#FF9F43', bg: '#FFF5E6', label: 'Sunny' },
                  teens: { dot: '#7C3AED', bg: '#EDE9FE', label: 'Violet' },
                  adults: { dot: '#0D9488', bg: '#E0F2F1', label: 'Mint' },
                  seniors: { dot: '#1E40AF', bg: '#EFF6FF', label: 'Ocean' },
                };
                const swatch = swatchColors[r.id];
                const isActive = ageRange === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      playSound('click');
                      vibrate('light');
                      setAgeRange(r.id);
                    }}
                    style={[
                      styles.swatchItem,
                      isActive && { borderColor: swatch.dot, borderWidth: 2.5 },
                      !isActive && { borderColor: 'transparent', borderWidth: 2.5 },
                    ]}
                  >
                    <View style={[styles.swatchDot, { backgroundColor: swatch.dot }]}>
                      {isActive && (
                        <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={[styles.swatchLabel, { color: isActive ? swatch.dot : theme.textSecondary, fontWeight: isActive ? '700' : '500' }]}>
                      {swatch.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sound & Feel settings */}
          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Sound & Feel</Text>
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
            {/* Sound Effects */}
            <View style={styles.settingRow}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                  <MaterialCommunityIcons name="volume-high" size={18} color="#2E7D32" />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Sound Effects</Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>Taps, swipes & results</Text>
                </View>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={toggleSound}
                trackColor={{ false: '#CBD5E1', true: theme.accent + '80' }}
                thumbColor={soundEnabled ? theme.accent : '#94A3B8'}
              />
            </View>

            {/* Background Music */}
            <View style={styles.settingRow}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#EDE9FE' }]}>
                  <MaterialCommunityIcons name="music-note" size={18} color="#7C3AED" />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Background Music</Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>Soothing ambient music</Text>
                </View>
              </View>
              <Switch
                value={musicEnabled}
                onValueChange={toggleMusic}
                trackColor={{ false: '#CBD5E1', true: '#7C3AED80' }}
                thumbColor={musicEnabled ? '#7C3AED' : '#94A3B8'}
              />
            </View>

            {/* Vibrations */}
            <View style={[styles.settingRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                  <MaterialCommunityIcons name="vibrate" size={18} color="#EF6C00" />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Vibrations</Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>Gentle haptic feedback</Text>
                </View>
              </View>
              <Switch
                value={vibrationEnabled}
                onValueChange={toggleVibration}
                trackColor={{ false: '#CBD5E1', true: '#EF6C0080' }}
                thumbColor={vibrationEnabled ? '#EF6C00' : '#94A3B8'}
              />
            </View>
          </View>

          {/* Daily Reminder Settings */}
          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Reminders</Text>
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
            <View style={[styles.settingRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#E0F2F1' }]}>
                  <MaterialCommunityIcons name="bell" size={18} color="#0D9488" />
                </View>
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Daily Reminder</Text>
                  <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                    {notificationTime
                      ? `Remind daily at ${String(notificationTime.hour).padStart(2, '0')}:${String(notificationTime.minute).padStart(2, '0')}`
                      : 'Disabled'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  playSound('click');
                  vibrate('light');
                  setShowTimePrompt(true);
                }}
                style={[styles.changeTimeButton, { borderColor: theme.accent }]}
              >
                <Text style={[styles.changeTimeButtonText, { color: theme.accent }]}>
                  {notificationTime ? 'Change' : 'Set'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 10,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  themeSwatchRow: {
    flexDirection: 'column',
    gap: 12,
  },
  swatchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2.5,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  swatchDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  swatchLabel: {
    fontSize: 15,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  changeTimeButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeTimeButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
});
