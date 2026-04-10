import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "./ThemeContext";

export default function Index() {
  const { theme, themeName, setTheme, themes } = useTheme();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [disclaimerVisible, setDisclaimerVisible] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [solvedWithHintCount, setSolvedWithHintCount] = useState(0);

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

  useEffect(() => {
    (async () => {
      try {
        const accepted = await AsyncStorage.getItem('@riddles_app_disclaimer_accepted');
        if (!accepted) setDisclaimerVisible(true);

        loadStats();
      } catch (e) {
        setDisclaimerVisible(true);
      }
    })();
  }, [loadStats]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  // helper: map theme name to a representative color swatch
  const themesMapColor = (name: string) => {
    const map: Record<string, string> = {
      Light: '#ffffff',
      Dark: '#333333',
      Blue: '#1976d2',
      Green: '#388e3c',
      Red: '#d32f2f',
      Purple: '#8e24aa',
      Orange: '#fb8c00',
      Pink: '#d81b60',
      Gray: '#757575',
      Teal: '#00796b',
    };
    return map[name] || '#999';
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.background, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View style={[styles.headerSection, { backgroundColor: theme.button }]}>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons name="brain" size={48} color={theme.buttonText} />
              <Text style={[styles.headerTitle, { color: theme.buttonText }]}>Riddle Realm</Text>
              <Text style={[styles.headerSubtitle, { color: theme.buttonText }]}>Challenge Your Mind</Text>
            </View>
          </View>

          {/* Top Spacer */}
          <View style={{ flex: 1 }} />

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: theme.container, shadowColor: theme.text }]}>
              <MaterialCommunityIcons name="check-circle" size={32} color={theme.button} />
              <Text style={[styles.statNumber, { color: theme.button }]}>{solvedCount}</Text>
              <Text style={[styles.statLabel, { color: theme.text }]}>Riddles Solved</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.container, shadowColor: theme.text }]}>
              <MaterialCommunityIcons name="lightbulb" size={32} color={theme.button} />
              <Text style={[styles.statNumber, { color: theme.button }]}>{solvedWithHintCount}</Text>
              <Text style={[styles.statLabel, { color: theme.text }]}>Solved with Hint</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.button }]}
              onPress={() => router.push("/riddle")}
            >
              <MaterialCommunityIcons name="lightbulb-on" size={24} color={theme.buttonText} />
              <Text style={[styles.actionButtonText, { color: theme.buttonText }]}>Get Riddles</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.button }]}
              onPress={() => router.push("/bookmarks")}
            >
              <MaterialCommunityIcons name="bookmark" size={24} color={theme.buttonText} />
              <Text style={[styles.actionButtonText, { color: theme.buttonText }]}>My Bookmarks</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Spacer */}
          <View style={{ flex: 1 }} />

          {/* Theme & Settings Section */}
          <View style={styles.settingsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Customize</Text>
            <TouchableOpacity
              style={[styles.settingsButton, { backgroundColor: theme.container, borderColor: theme.button }]}
              onPress={() => setDropdownVisible(true)}
            >
              <MaterialCommunityIcons name="palette" size={20} color={theme.button} />
              <Text style={[styles.settingsButtonText, { color: theme.text }]}>Current Theme: {themeName}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.button} />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            {/* Theme Switcher Modal */}
            <Modal
              visible={dropdownVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setDropdownVisible(false)}
            >
              <View style={styles.modalBackdrop}>
                <View style={[styles.modalCard, { backgroundColor: theme.container }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Select Theme</Text>
                    <TouchableOpacity onPress={() => setDropdownVisible(false)} style={styles.closeButton}>
                      <Text style={{ color: theme.text, fontSize: 18 }}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.themeGrid}>
                    {themes.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.themeOption, { borderColor: themeName === t ? theme.button : 'transparent' }]}
                        onPress={() => {
                          setTheme(t);
                          setDropdownVisible(false);
                        }}
                      >
                        <View style={[styles.swatch, { backgroundColor: themesMapColor(t) }]} />
                        <Text style={[styles.optionLabel, { color: theme.text }]}>{t}</Text>
                        {themeName === t && <Text style={[styles.check, { color: theme.button }]}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity style={[styles.footerButton, { backgroundColor: theme.button }]} onPress={() => setDropdownVisible(false)}>
                      <Text style={[styles.buttonText, { color: theme.buttonText }]}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
            <Modal
              visible={disclaimerVisible}
              transparent
              animationType="fade"
              onRequestClose={() => {
                /* prevent closing */
                Alert.alert('Please accept to continue', 'You must accept the disclaimer to use the app.');
              }}
            >
              <View style={styles.modalBackdrop}>
                <View style={[styles.modalCard, { backgroundColor: theme.container }]}>
                  <Text style={[styles.modalTitle, { color: theme.text, textAlign: 'center' }]}>Disclaimer</Text>
                  <Text style={{ color: theme.text, marginTop: 8, marginBottom: 12, textAlign: 'center' }}>
                    Riddles in this app are sourced from public online services. The app does not own, endorse, or guarantee the accuracy of the content. By continuing you agree that you understand and accept this.
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                    <TouchableOpacity
                      style={[styles.footerButton, { backgroundColor: '#ddd' }]}
                      onPress={() => Alert.alert('Acceptance required', 'You must accept the disclaimer to use the app.')}
                    >
                      <Text style={{ color: '#333' }}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.footerButton, { backgroundColor: theme.button }]}
                      onPress={async () => {
                        try {
                          await AsyncStorage.setItem('@riddles_app_disclaimer_accepted', '1');
                        } catch (e) {
                          console.error('Could not persist disclaimer acceptance', e);
                        }
                        setDisclaimerVisible(false);
                      }}
                    >
                      <Text style={[styles.buttonText, { color: theme.buttonText }]}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    paddingTop: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerSection: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    marginHorizontal: 20,
  },
  statCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  actionContainer: {
    gap: 16,
    marginBottom: 0,
    marginHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  settingsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  settingsButton: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    marginBottom: 24,
  },
  settingsButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
  container: {
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonContainer: {
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  dropdownContent: {
    flexGrow: 1,
  },
  dropdownContainer: {
    maxHeight: 220,
    // minWidth: 180,
    width: 220,
    borderRadius: 8,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 999,
  },
  dropdownItem: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%", // Ensures item fills the dropdown width
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  modalCard: {
    width: 340,
    borderRadius: 14,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    right: 6,
    top: -2,
    padding: 6,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  themeOption: {
    width: '48%',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  check: {
    position: 'absolute',
    right: 8,
    top: 8,
    fontSize: 16,
    fontWeight: '700'
  },
  modalFooter: {
    marginTop: 8,
    alignItems: 'center'
  },
  footerButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 120,
    alignItems: 'center'
  },
});
