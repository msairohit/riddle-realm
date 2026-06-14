import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { BannerAd, BannerAdSize } from '../utils/googleMobileAds';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedProfileIcon from "../components/AnimatedProfileIcon";
import { useSoundSettings } from '../hooks/useSoundSettings';
import { AD_UNITS, getAdSettings } from '../utils/admob';
import { playSound, vibrate } from '../utils/soundManager';
import { useTheme } from "./ThemeContext";
import { useDailyNotifications } from '../hooks/useDailyNotifications';
import NotificationTimePrompt from '../components/NotificationTimePrompt';

export default function Index() {
  const { theme, ageRange, ageRanges, setAgeRange } = useTheme();
  const insets = useSafeAreaInsets();
  const { soundEnabled, musicEnabled, vibrationEnabled, toggleSound, toggleMusic, toggleVibration } = useSoundSettings();
  const { hasPrompted, loadingSettings, notificationTime, saveNotificationTime, skipNotificationTime } = useDailyNotifications();
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [solvedWithHintCount, setSolvedWithHintCount] = useState(0);
  const [showAds, setShowAds] = useState(true);

  // Redirect to age-selection onboarding screen if ageRange is not set
  useEffect(() => {
    if (ageRange === null) {
      router.replace('/age-selection');
    }
  }, [ageRange]);

  const loadStats = useCallback(async () => {
    try {
      // Load bookmark count
      const bookmarks = await AsyncStorage.getItem('bookmarkedRiddles');
      if (bookmarks) {
        setBookmarkCount(JSON.parse(bookmarks).length);
      }

      // Load solved riddles count
      const solved = await AsyncStorage.getItem('@riddles_solved');
      if (solved) {
        setSolvedCount(JSON.parse(solved).length);
      }

      // Load solved with hint count
      const solvedWithHint = await AsyncStorage.getItem('@riddles_solved_with_hint');
      if (solvedWithHint) {
        setSolvedWithHintCount(JSON.parse(solvedWithHint).length);
      }
    } catch (e) {
      console.error('Error loading stats:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
      // Refresh ad visibility flag every time the screen comes into focus
      getAdSettings().then(s => setShowAds(s.showAds));
    }, [loadStats])
  );



  // Helper metadata based on age ranges
  const getHeaderMeta = () => {
    const defaultMeta = {
      title: "Riddle Realm",
      subtitle: "Think. Solve. Smile.",
      icon: "brain",
    };
    if (!ageRange) return defaultMeta;

    const metaMap: Record<string, { title: string; subtitle: string; icon: string }> = {
      kids: {
        title: "Playful Riddles",
        subtitle: "Play. Learn. Giggle.",
        icon: "balloon",
      },
      teens: {
        title: "Mind Hacks",
        subtitle: "Hack. Crack. Flex.",
        icon: "gamepad-variant",
      },
      adults: {
        title: "Riddle Realm",
        subtitle: "Think. Solve. Smile.",
        icon: "brain",
      },
      seniors: {
        title: "Mind Gym",
        subtitle: "Read. Reflect. Remember.",
        icon: "glasses",
      },
    };

    return metaMap[ageRange] || defaultMeta;
  };



  const headerMeta = getHeaderMeta();

  if (ageRange === null) {
    return null; // Don't render home screen components while redirecting
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {!loadingSettings && !hasPrompted && (
        <NotificationTimePrompt
          visible={!hasPrompted}
          onSave={saveNotificationTime}
          onSkip={skipNotificationTime}
        />
      )}
      <View style={styles.background}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            playSound('click');
            vibrate('light');
            router.push('/profile');
          }}
          style={[styles.settingsFloatingButton, { top: Math.max(16, insets.top), backgroundColor: theme.cardBackground }]}
        >
          <MaterialCommunityIcons name="cog" size={24} color={theme.text} />
        </TouchableOpacity>
        <LinearGradient
          colors={theme.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(24, insets.top + 12),
              paddingBottom: Math.max(24, insets.bottom + 20),
              justifyContent: 'center'
            }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.headerTop}>
              <View style={[styles.animatedIconWrapper, { shadowColor: theme.accent }]}>
                <AnimatedProfileIcon profile={ageRange || 'adults'} size={90} />
              </View>
              <View style={styles.headerTextWrapper}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{headerMeta.title}</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>{headerMeta.subtitle}</Text>
              </View>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={[styles.statsContainer, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#2E7D32" />
              </View>
              <Text style={styles.statNumber}>{solvedCount}</Text>
              <Text style={styles.statLabel}>Solved Riddles</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="lightbulb" size={24} color="#EF6C00" />
              </View>
              <Text style={styles.statNumber}>{solvedWithHintCount}</Text>
              <Text style={styles.statLabel}>Solved with Hint</Text>
            </View>
          </View>

          {/* Primary Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.actionButtonWrapper}
              onPress={() => {
                playSound('click');
                vibrate('light');
                router.push('/riddle');
              }}
            >
              <LinearGradient
                colors={theme.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButton}
              >
                <View style={styles.actionLeft}>
                  <View style={styles.actionIconCircle}>
                    <MaterialCommunityIcons name="play-circle-outline" size={26} color="#FFFFFF" />
                  </View>
                  <Text style={styles.actionButtonText}>Get Riddles</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.bookmarkButton}
              onPress={() => {
                playSound('click');
                vibrate('light');
                router.push('/bookmarks');
              }}
            >
              <View style={styles.bookmarkContent}>
                <View style={[styles.bookmarkIconCircle, { backgroundColor: theme.accent + '20' }]}>
                  <MaterialCommunityIcons name="bookmark" size={24} color={theme.accent} />
                </View>
                <View style={styles.bookmarkTexts}>
                  <Text style={[styles.bookmarkTitle, { color: theme.text }]}>My Bookmarks</Text>
                  <Text style={styles.bookmarkSubtitle}>{bookmarkCount} riddles saved</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.accent} />
            </TouchableOpacity>
          </View>



          {/* ── Banner Ad ── */}
          {showAds && (
            <View style={styles.bannerAdContainer}>
              <BannerAd
                unitId={AD_UNITS.banner}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{ requestNonPersonalizedAdsOnly: false }}
              />
            </View>
          )}

          {/* ── TEMP: Admin Button ── */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/admin')}
            style={styles.adminButton}
          >
            <MaterialCommunityIcons name="shield-crown" size={16} color="#A78BFA" />
            <Text style={styles.adminButtonText}>Admin Panel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  headerSection: {
    marginBottom: 28,
  },
  headerTop: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  animatedIconWrapper: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  headerTextWrapper: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: '#E2E8F0',
  },
  actionContainer: {
    gap: 16,
    marginBottom: 24,
  },
  actionButtonWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bookmarkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  bookmarkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bookmarkIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkTexts: {
    justifyContent: 'center',
  },
  bookmarkTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  bookmarkSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  themeSwitcherContainer: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  soundSettingsContainer: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  soundRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  soundIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundRowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  soundRowSubtitle: {
    fontSize: 12,
    marginTop: 1,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  themeSwatchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  swatchItem: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 6,
  },
  swatchDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  bannerAdContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.4)',
    backgroundColor: 'rgba(167,139,250,0.08)',
  },
  adminButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A78BFA',
    letterSpacing: 0.3,
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
  settingsFloatingButton: {
    position: 'absolute',
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
