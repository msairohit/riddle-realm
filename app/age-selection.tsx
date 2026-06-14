import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { playSound, vibrate } from '../utils/soundManager';
import { ageRanges, useTheme } from './ThemeContext';

export default function AgeSelection() {
    const { setAgeRange } = useTheme();
    const router = useRouter();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleConfirm = async () => {
        if (!selectedId) return;

        try {
            playSound('correct');
            vibrate('success');
            // Set age range (which automatically updates theme)
            await setAgeRange(selectedId);
            // Auto accept disclaimer
            await AsyncStorage.setItem('@riddles_app_disclaimer_accepted', '1');
            // Navigate to home screen
            router.replace('/');
        } catch (error) {
            console.error('Error during onboarding flow:', error);
        }
    };

    // Color helpers for the card highlights based on age group
    const getCardColors = (id: string, isSelected: boolean) => {
        const stylesMap: Record<string, { border: string; bg: string; iconBg: string; tint: string }> = {
            kids: {
                border: '#FF9F43',
                bg: '#FFF8F2',
                iconBg: '#FFE0B2',
                tint: '#FF9F43',
            },
            teens: {
                border: '#7C3AED',
                bg: '#F5F3FF',
                iconBg: '#EDE9FE',
                tint: '#7C3AED',
            },
            adults: {
                border: '#0D9488',
                bg: '#EBFBFA',
                iconBg: '#CCFBF1',
                tint: '#0D9488',
            },
            seniors: {
                border: '#1E40AF',
                bg: '#EFF6FF',
                iconBg: '#DBEAFE',
                tint: '#1E40AF',
            },
        };

        const defaults = {
            border: '#E2E8F0',
            bg: '#FFFFFF',
            iconBg: '#F1F5F9',
            tint: '#64748B',
        };

        return isSelected ? stylesMap[id] : defaults;
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#E0F2F1', '#FFF5E6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons name="brain" size={42} color="#00796B" />
                        </View>
                        <Text style={styles.title}>Riddle Realm</Text>
                        <Text style={styles.subtitle}>
                            Welcome! Select your age group to tailor your brain-training journey.
                        </Text>
                    </View>

                    {/* Cards Container */}
                    <View style={styles.cardsGrid}>
                        {ageRanges.map((item) => {
                            const isSelected = selectedId === item.id;
                            const colors = getCardColors(item.id, isSelected);

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    activeOpacity={0.8}
                                    style={[
                                        styles.card,
                                        {
                                            backgroundColor: colors.bg,
                                            borderColor: colors.border,
                                            borderWidth: isSelected ? 2.5 : 1.5,
                                            shadowColor: isSelected ? colors.border : '#000',
                                            shadowOpacity: isSelected ? 0.25 : 0.05,
                                        },
                                    ]}
                                    onPress={() => {
                                        playSound('click');
                                        vibrate('light');
                                        setSelectedId(item.id);
                                    }}
                                >
                                    <View style={styles.cardHeader}>
                                        <View
                                            style={[
                                                styles.iconWrapper,
                                                { backgroundColor: colors.iconBg },
                                            ]}
                                        >
                                            <MaterialCommunityIcons
                                                name={item.icon as any}
                                                size={28}
                                                color={colors.tint}
                                            />
                                        </View>
                                        <View style={styles.titleWrapper}>
                                            <Text
                                                style={[
                                                    styles.cardLabel,
                                                    { color: isSelected ? colors.tint : '#1E293B' },
                                                ]}
                                            >
                                                {item.label}
                                            </Text>
                                            <Text style={styles.cardRange}>{item.range}</Text>
                                        </View>
                                        {isSelected && (
                                            <View
                                                style={[
                                                    styles.checkBadge,
                                                    { backgroundColor: colors.border },
                                                ]}
                                            >
                                                <MaterialCommunityIcons
                                                    name="check"
                                                    size={16}
                                                    color="#FFF"
                                                />
                                            </View>
                                        )}
                                    </View>
                                    <Text
                                        style={[
                                            styles.cardDescription,
                                            { color: isSelected ? colors.tint + 'CC' : '#64748B' },
                                        ]}
                                    >
                                        {item.description}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Disclaimer Card */}
                    <View style={styles.disclaimerCard}>
                        <MaterialCommunityIcons
                            name="information-outline"
                            size={20}
                            color="#475569"
                            style={styles.infoIcon}
                        />
                        <Text style={styles.disclaimerText}>
                            <Text style={styles.disclaimerBold}>Disclaimer: </Text>
                            Riddles in this app are sourced from public online services. The app
                            does not own, endorse, or guarantee the accuracy of the content.
                        </Text>
                    </View>

                    {/* CTA Button */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        disabled={!selectedId}
                        style={styles.buttonWrapper}
                        onPress={handleConfirm}
                    >
                        <LinearGradient
                            colors={
                                selectedId
                                    ? selectedId === 'kids'
                                        ? ['#FF9F43', '#FFBE53']
                                        : selectedId === 'teens'
                                        ? ['#7C3AED', '#A855F7']
                                        : selectedId === 'adults'
                                        ? ['#00B4D8', '#a3e635']
                                        : ['#1E40AF', '#3B82F6']
                                    : ['#CBD5E1', '#E2E8F0']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.button}
                        >
                            <Text
                                style={[
                                    styles.buttonText,
                                    { color: selectedId ? '#FFFFFF' : '#94A3B8' },
                                ]}
                            >
                                Confirm & Get Started
                            </Text>
                            {selectedId && (
                                <MaterialCommunityIcons
                                    name="chevron-right"
                                    size={20}
                                    color="#FFFFFF"
                                    style={styles.arrowIcon}
                                />
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 40,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 36,
        paddingHorizontal: 16,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 22,
        opacity: 0.9,
    },
    cardsGrid: {
        width: '100%',
        gap: 16,
        marginBottom: 24,
    },
    card: {
        width: '100%',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1.5,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconWrapper: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleWrapper: {
        marginLeft: 14,
        flex: 1,
    },
    cardLabel: {
        fontSize: 18,
        fontWeight: '700',
    },
    cardRange: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 1,
    },
    checkBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardDescription: {
        fontSize: 14,
        lineHeight: 18,
    },
    disclaimerCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.8)',
        alignItems: 'flex-start',
        marginBottom: 30,
        width: '100%',
    },
    infoIcon: {
        marginTop: 2,
        marginRight: 10,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 12,
        color: '#475569',
        lineHeight: 16,
    },
    disclaimerBold: {
        fontWeight: '600',
    },
    buttonWrapper: {
        width: '100%',
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    button: {
        width: '100%',
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    arrowIcon: {
        marginLeft: 6,
    },
});
