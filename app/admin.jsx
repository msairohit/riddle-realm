import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';

const ADMIN_KEYS = {
  BOOKMARK_LIMIT: '@admin_bookmark_limit',
  HINT_LIMIT: '@admin_hint_limit',
  SHOW_ADS: '@admin_show_ads',
  EXTRA_BOOKMARK_AD: '@admin_extra_bookmark_ad',
  EXTRA_HINT_AD: '@admin_extra_hint_ad',
};

const DEFAULT_BOOKMARK_LIMIT = 5;
const DEFAULT_HINT_LIMIT = 3;

export default function AdminScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [bookmarkLimit, setBookmarkLimit] = useState(DEFAULT_BOOKMARK_LIMIT);
  const [hintLimit, setHintLimit] = useState(DEFAULT_HINT_LIMIT);
  const [showAds, setShowAds] = useState(true);
  const [extraBookmarkRequiresAd, setExtraBookmarkRequiresAd] = useState(true);
  const [extraHintRequiresAd, setExtraHintRequiresAd] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [bl, hl, ads, ebAd, ehAd] = await Promise.all([
        AsyncStorage.getItem(ADMIN_KEYS.BOOKMARK_LIMIT),
        AsyncStorage.getItem(ADMIN_KEYS.HINT_LIMIT),
        AsyncStorage.getItem(ADMIN_KEYS.SHOW_ADS),
        AsyncStorage.getItem(ADMIN_KEYS.EXTRA_BOOKMARK_AD),
        AsyncStorage.getItem(ADMIN_KEYS.EXTRA_HINT_AD),
      ]);
      if (bl !== null) setBookmarkLimit(parseInt(bl, 10));
      if (hl !== null) setHintLimit(parseInt(hl, 10));
      if (ads !== null) setShowAds(ads === 'true');
      if (ebAd !== null) setExtraBookmarkRequiresAd(ebAd === 'true');
      if (ehAd !== null) setExtraHintRequiresAd(ehAd === 'true');
    } catch (e) {
      console.error('Admin: Error loading settings', e);
    }
  };

  const saveSettings = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(ADMIN_KEYS.BOOKMARK_LIMIT, String(bookmarkLimit)),
        AsyncStorage.setItem(ADMIN_KEYS.HINT_LIMIT, String(hintLimit)),
        AsyncStorage.setItem(ADMIN_KEYS.SHOW_ADS, String(showAds)),
        AsyncStorage.setItem(ADMIN_KEYS.EXTRA_BOOKMARK_AD, String(extraBookmarkRequiresAd)),
        AsyncStorage.setItem(ADMIN_KEYS.EXTRA_HINT_AD, String(extraHintRequiresAd)),
      ]);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will restore all admin settings to their default values.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setBookmarkLimit(DEFAULT_BOOKMARK_LIMIT);
            setHintLimit(DEFAULT_HINT_LIMIT);
            setShowAds(true);
            setExtraBookmarkRequiresAd(true);
            setExtraHintRequiresAd(true);
          },
        },
      ]
    );
  };

  const adjustValue = (current, setter, delta, min = 0, max = 50) => {
    const next = Math.min(max, Math.max(min, current + delta));
    setter(next);
  };

  const renderStepperRow = (label, icon, iconColor, iconBg, value, setter, min = 0, max = 50) => (
    <View style={styles.stepperRow}>
      <View style={styles.stepperLeft}>
        <View style={[styles.stepperIconBg, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={[styles.stepperLabel, { color: theme.text }]}>{label}</Text>
      </View>
      <View style={styles.stepperControls}>
        <TouchableOpacity
          style={[styles.stepBtn, { borderColor: theme.borderColor }]}
          onPress={() => adjustValue(value, setter, -1, min, max)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="minus" size={18} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.stepValue, { backgroundColor: theme.accent + '15' }]}>
          <Text style={[styles.stepValueText, { color: theme.accent }]}>{value}</Text>
        </View>
        <TouchableOpacity
          style={[styles.stepBtn, { borderColor: theme.borderColor }]}
          onPress={() => adjustValue(value, setter, 1, min, max)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="plus" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderToggleRow = (label, subtitle, icon, iconColor, iconBg, value, setter) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        <View style={[styles.stepperIconBg, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.toggleTexts}>
          <Text style={[styles.stepperLabel, { color: theme.text }]}>{label}</Text>
          {subtitle ? (
            <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={setter}
        trackColor={{ false: '#D1D5DB', true: theme.accent + '80' }}
        thumbColor={value ? theme.accent : '#9CA3AF'}
        ios_backgroundColor="#D1D5DB"
      />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.background}>
        <LinearGradient
          colors={['#0F0C29', '#302B63', '#24243E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(20, insets.top + 8) }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MaterialCommunityIcons name="shield-crown" size={22} color="#F59E0B" />
            <Text style={styles.headerTitle}>Admin Panel</Text>
          </View>
          <TouchableOpacity onPress={resetToDefaults} style={styles.resetBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="restore" size={20} color="#F87171" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(24, insets.bottom + 20) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Warning Badge */}
          <View style={styles.warningBadge}>
            <MaterialCommunityIcons name="alert-decagram" size={16} color="#F59E0B" />
            <Text style={styles.warningText}>
              Developer-only panel. Settings affect all users.
            </Text>
          </View>

          {/* ── LIMITS SECTION ── */}
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="tune-variant" size={16} color="#A78BFA" />
            <Text style={styles.sectionTitle}>Limits Configuration</Text>
          </View>
          <View style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.07)' }]}>
            {renderStepperRow(
              'Bookmark Limit',
              'bookmark-multiple',
              '#F59E0B',
              'rgba(245,158,11,0.15)',
              bookmarkLimit,
              setBookmarkLimit,
              1,
              50
            )}
            <View style={styles.cardDivider} />
            {renderStepperRow(
              'Hint Limit',
              'lightbulb-on',
              '#34D399',
              'rgba(52,211,153,0.15)',
              hintLimit,
              setHintLimit,
              1,
              50
            )}
          </View>

          {/* ── EARN EXTRA (AD GATES) ── */}
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="video-plus" size={16} color="#A78BFA" />
            <Text style={styles.sectionTitle}>Earn Extra via Ads</Text>
          </View>
          <View style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.07)' }]}>
            {renderToggleRow(
              'Watch Ad for Extra Bookmark',
              'Users watch a rewarded ad to add 1 more bookmark',
              'bookmark-plus',
              '#F59E0B',
              'rgba(245,158,11,0.15)',
              extraBookmarkRequiresAd,
              setExtraBookmarkRequiresAd
            )}
            <View style={styles.cardDivider} />
            {renderToggleRow(
              'Watch Ad for Extra Hint',
              'Users watch a rewarded ad to unlock 1 more hint',
              'lightbulb-on-outline',
              '#34D399',
              'rgba(52,211,153,0.15)',
              extraHintRequiresAd,
              setExtraHintRequiresAd
            )}
          </View>

          {/* ── ADS FEATURE FLAG ── */}
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="flag-variant" size={16} color="#A78BFA" />
            <Text style={styles.sectionTitle}>Ads Feature Flag</Text>
          </View>
          <View style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.07)' }]}>
            {renderToggleRow(
              'Show Ads',
              'Master switch — disabling hides all ad units globally',
              'advertisements',
              '#60A5FA',
              'rgba(96,165,250,0.15)',
              showAds,
              setShowAds
            )}
          </View>

          {/* ── CURRENT VALUES SUMMARY ── */}
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#A78BFA" />
            <Text style={styles.sectionTitle}>Current Configuration</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(167,139,250,0.3)' }]}>
            <SummaryRow label="Bookmark Limit" value={`${bookmarkLimit} bookmarks`} color="#F59E0B" />
            <SummaryRow label="Hint Limit" value={`${hintLimit} hints`} color="#34D399" />
            <SummaryRow label="Extra Bookmark (Ad)" value={extraBookmarkRequiresAd ? 'Enabled' : 'Disabled'} color="#F59E0B" />
            <SummaryRow label="Extra Hint (Ad)" value={extraHintRequiresAd ? 'Enabled' : 'Disabled'} color="#34D399" />
            <SummaryRow label="Ads Shown" value={showAds ? 'Yes' : 'No'} color="#60A5FA" />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={saveSettings}
            activeOpacity={0.85}
            style={styles.saveButtonWrapper}
          >
            <LinearGradient
              colors={isSaved ? ['#059669', '#10B981'] : ['#7C3AED', '#A78BFA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <MaterialCommunityIcons
                name={isSaved ? 'check-circle' : 'content-save'}
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.saveButtonText}>
                {isSaved ? 'Saved!' : 'Save Settings'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

function SummaryRow({ label, value, color }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(248,113,113,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 0,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  warningText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#A78BFA',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  stepperLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stepperIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  stepValue: {
    minWidth: 44,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stepValueText: {
    fontSize: 18,
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  toggleTexts: { flex: 1 },
  toggleSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveButtonWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
