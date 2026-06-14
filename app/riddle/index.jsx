import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import AnimatedProfileIcon from '../../components/AnimatedProfileIcon';
import {
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { AdEventType, BannerAd, BannerAdSize, InterstitialAd, InterstitialAdEventType } from '../../utils/googleMobileAds';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import riddlesData from '../../assets/data/riddles';
import { useRewardedAd } from '../../hooks/useRewardedAd';
import { AD_UNITS, getAdSettings } from '../../utils/admob';
import { checkAnswer } from '../../utils/answerChecker';
import { playSound, startBgMusic, stopBgMusic, vibrate } from '../../utils/soundManager';
import { useTheme } from '../ThemeContext';

const { height: screenHeight } = Dimensions.get('window');

const App = () => {
    const { theme, ageRange } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [riddle, setRiddle] = useState('Loading...');
    const [author, setAuthor] = useState('');
    const [answer, setAnswer] = useState('');
    const [bookmarkedRiddles, setBookmarkedRiddles] = useState([]);
    const [cache, setCache] = useState([]);
    const [cacheIndex, setCacheIndex] = useState(-1);
    const [showToast, setShowToast] = useState(false);
    const [toastText, setToastText] = useState('');
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [shareHint, setShareHint] = useState(false);
    const [userGuess, setUserGuess] = useState('');
    const [checkResult, setCheckResult] = useState(null);
    // Tracks whether the hint was ever viewed for the current riddle.
    // Stays true even if the user hides the hint before answering.
    const [hintViewed, setHintViewed] = useState(false);

    // ── Ad state ──────────────────────────────────────────────────────────────
    const [adSettings, setAdSettings] = useState({ showAds: true, extraHintAd: true, extraBookmarkAd: true });
    // Counter tracking how many riddles the user has navigated through this session.
    // An interstitial fires at every 5th riddle.
    const riddlesViewedRef = useRef(0);
    // Interstitial ad instance — created once and reloaded after each show.
    const interstitialRef = useRef(null);
    const { showAd: showRewardedHintAd } = useRewardedAd(AD_UNITS.rewardedHint);
    const { showAd: showRewardedBookmarkAd } = useRewardedAd(AD_UNITS.rewardedBookmark);
    // Track how many hints have been used this session (admin hint limit)
    const [hintsUsed, setHintsUsed] = useState(0);
    const [hintLimit, setHintLimit] = useState(3); // default; updated from AsyncStorage
    const [bookmarkLimit, setBookmarkLimit] = useState(5); // default; updated from AsyncStorage



    const renderBackgroundDecorations = () => {
        if (ageRange === 'kids') {
            return (
                <>
                    {/* Top Side Decorations */}
                    <MaterialCommunityIcons name="balloon" size={130} color={theme.accent} style={[styles.bgDecoration, { left: -15, top: 130, opacity: 0.3, transform: [{ rotate: '15deg' }] }]} />
                    <MaterialCommunityIcons name="star" size={80} color={theme.accent} style={[styles.bgDecoration, { right: -10, top: 140, opacity: 0.35, transform: [{ rotate: '45deg' }] }]} />
                    {/* Bottom Side Decorations */}
                    <MaterialCommunityIcons name="star" size={80} color={theme.accent} style={[styles.bgDecoration, { left: -10, top: screenHeight - 220, opacity: 0.35, transform: [{ rotate: '-35deg' }] }]} />
                    <MaterialCommunityIcons name="balloon" size={100} color={theme.accent} style={[styles.bgDecoration, { right: -15, top: screenHeight - 230, opacity: 0.3, transform: [{ rotate: '-20deg' }] }]} />
                </>
            );
        }
        if (ageRange === 'teens') {
            return (
                <>
                    {/* Top Side Decorations */}
                    <MaterialCommunityIcons name="gamepad-variant" size={130} color={theme.accent} style={[styles.bgDecoration, { left: -15, top: 130, opacity: 0.3, transform: [{ rotate: '25deg' }] }]} />
                    <MaterialCommunityIcons name="rocket-launch" size={90} color={theme.tint} style={[styles.bgDecoration, { right: -10, top: 140, opacity: 0.3, transform: [{ rotate: '-45deg' }] }]} />
                    {/* Bottom Side Decorations */}
                    <MaterialCommunityIcons name="code-tags" size={110} color={theme.accent} style={[styles.bgDecoration, { left: -10, top: screenHeight - 220, opacity: 0.3 }]} />
                    <MaterialCommunityIcons name="alien-outline" size={100} color={theme.tint} style={[styles.bgDecoration, { right: -15, top: screenHeight - 230, opacity: 0.3 }]} />
                </>
            );
        }
        if (ageRange === 'seniors') {
            return (
                <>
                    {/* Top Side Decorations */}
                    <MaterialCommunityIcons name="book-open-variant" size={110} color={theme.accent} style={[styles.bgDecoration, { left: -15, top: 140, opacity: 0.3, transform: [{ rotate: '-15deg' }] }]} />
                    <MaterialCommunityIcons name="clock-outline" size={85} color={theme.accent} style={[styles.bgDecoration, { right: -10, top: 140, opacity: 0.3 }]} />
                    {/* Bottom Side Decorations */}
                    <MaterialCommunityIcons name="school" size={110} color={theme.accent} style={[styles.bgDecoration, { left: -10, top: screenHeight - 220, opacity: 0.28 }]} />
                    <MaterialCommunityIcons name="coffee" size={100} color={theme.accent} style={[styles.bgDecoration, { right: -10, top: screenHeight - 230, opacity: 0.3 }]} />
                </>
            );
        }
        // Adults / default (leaves & clouds like the mockup!)
        return (
            <>
                {/* Top Side Decorations */}
                <Ionicons name="leaf" size={130} color="#81C784" style={[styles.bgDecoration, { left: -15, top: 130, opacity: 0.35, transform: [{ rotate: '45deg' }] }]} />
                <MaterialCommunityIcons name="cloud" size={140} color="#FFF" style={[styles.bgDecoration, { right: -15, top: 140, opacity: 0.35 }]} />
                {/* Bottom Side Decorations */}
                <MaterialCommunityIcons name="cloud" size={110} color="#FFF" style={[styles.bgDecoration, { left: -15, top: screenHeight - 220, opacity: 0.35 }]} />
                <Ionicons name="leaf" size={150} color="#81C784" style={[styles.bgDecoration, { right: -15, top: screenHeight - 230, opacity: 0.3, transform: [{ rotate: '-35deg' }, { scaleX: -1 }] }]} />
            </>
        );
    };

    // Check user's answer
    const handleCheckAnswer = () => {
        if (!userGuess.trim()) {
            showTransientToast('Please enter an answer');
            return;
        }
        const result = checkAnswer(userGuess, answer, 0.75);
        setCheckResult(result);

        if (result.isCorrect) {
            playSound('correct');
            vibrate('success');
            trackSolvedRiddle(hintViewed);
        } else if (result.similarity >= 65) {
            playSound('near');
            vibrate('light');
        } else {
            playSound('wrong');
            vibrate('error');
        }
    };

    // usedHint = true when the hint was ever viewed before submitting the correct answer.
    const trackSolvedRiddle = async (usedHint = false) => {
        try {
            const riddle_id = `${riddle}_${answer}`;

            // Track as solved (correct answer by user input)
            const solvedKey = '@riddles_solved';
            const existing = await AsyncStorage.getItem(solvedKey);
            const solved = existing ? JSON.parse(existing) : [];
            if (!solved.includes(riddle_id)) {
                solved.push(riddle_id);
                await AsyncStorage.setItem(solvedKey, JSON.stringify(solved));
            }

            // Track hint-assisted solves in a separate key
            if (usedHint) {
                const hintKey = '@riddles_solved_with_hint';
                const existingHint = await AsyncStorage.getItem(hintKey);
                const solvedWithHint = existingHint ? JSON.parse(existingHint) : [];
                if (!solvedWithHint.includes(riddle_id)) {
                    solvedWithHint.push(riddle_id);
                    await AsyncStorage.setItem(hintKey, JSON.stringify(solvedWithHint));
                }
            }
        } catch (error) {
            console.error('Error tracking solved riddle:', error);
        }
    };

    const clearGuess = () => {
        setUserGuess('');
        setCheckResult(null);
    };

    // Bookmark the current riddle (gated by bookmark limit + rewarded ad)
    const toggleBookmark = async () => {
        try {
            const existing = await AsyncStorage.getItem('bookmarkedRiddles');
            const bookmarks = existing ? JSON.parse(existing) : [];
            const matchIndex = bookmarks.findIndex(b => b.riddle === riddle && b.answer === answer);
            let message = '';
            if (matchIndex >= 0) {
                // Always allow removal
                bookmarks.splice(matchIndex, 1);
                message = 'Removed from bookmarks';
                await AsyncStorage.setItem('bookmarkedRiddles', JSON.stringify(bookmarks));
                setBookmarkedRiddles(bookmarks);
                showTransientToast(message);
            } else {
                // Check bookmark limit
                const overLimit = adSettings.extraBookmarkAd && bookmarks.length >= bookmarkLimit;
                if (overLimit) {
                    showRewardedBookmarkAd(async () => {
                        const fresh = await AsyncStorage.getItem('bookmarkedRiddles');
                        const freshBookmarks = fresh ? JSON.parse(fresh) : [];
                        freshBookmarks.push({ riddle, answer, hint: author });
                        await AsyncStorage.setItem('bookmarkedRiddles', JSON.stringify(freshBookmarks));
                        setBookmarkedRiddles(freshBookmarks);
                        showTransientToast('Bookmark unlocked! 🎉');
                    });
                } else {
                    bookmarks.push({ riddle, answer, hint: author });
                    await AsyncStorage.setItem('bookmarkedRiddles', JSON.stringify(bookmarks));
                    setBookmarkedRiddles(bookmarks);
                    showTransientToast('Bookmarked');
                }
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    };

    // Share the current riddle
    const shareRiddle = async () => {
        try {
            let message = `"${riddle}"`;
            if (shareHint && author) {
                message += `\n\n💡 Hint: ${author}`;
            }
            await Share.share({
                message: message,
            });
        } catch {
            showTransientToast('Could not share the riddle');
        }
    };

    // Fetch bookmarked riddles
    const fetchBookmarkedRiddles = useCallback(async () => {
        try {
            const existingBookmarks = await AsyncStorage.getItem('bookmarkedRiddles');
            const bookmarks = existingBookmarks ? JSON.parse(existingBookmarks) : [];
            setBookmarkedRiddles(bookmarks);
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
        }
    }, []);

    const loadRiddleAtIndex = useCallback((cacheArray, index) => {
        const riddleObj = cacheArray[index];
        setRiddle(riddleObj.riddle);
        setAuthor(riddleObj.hint);
        setAnswer(riddleObj.answer);
        setShowHint(false);
        setShowAnswer(false);
        setHintViewed(false); // reset per-riddle hint flag
        clearGuess();
    }, []);

    const loadRiddles = useCallback(async () => {
        try {
            const nextCache = riddlesData.map(r => ({
                riddle: r.riddle || r.Riddle || '',
                hint: r.hint || r.Hint || '',
                answer: r.answer || r.Answer || ''
            }));
            if (nextCache.length > 0) {
                setCache(nextCache);
                const savedIndex = await AsyncStorage.getItem('currentRiddleIndex');
                const indexToUse = savedIndex ? Math.min(parseInt(savedIndex), nextCache.length - 1) : 0;
                setCacheIndex(indexToUse);
                loadRiddleAtIndex(nextCache, indexToUse);
            }
        } catch (error) {
            console.error('Error loading riddles:', error);
        }
    }, [loadRiddleAtIndex]);

    const handleNext = async () => {
        if (cacheIndex < cache.length - 1) {
            playSound('swipe');
            vibrate('light');
            const nextIndex = cacheIndex + 1;
            setCacheIndex(nextIndex);
            loadRiddleAtIndex(cache, nextIndex);
            await AsyncStorage.setItem('currentRiddleIndex', nextIndex.toString());

            // ── Interstitial every 5 riddles ─────────────────────────────────
            riddlesViewedRef.current += 1;
            if (
                adSettings.showAds &&
                riddlesViewedRef.current % 5 === 0 &&
                interstitialRef.current
            ) {
                try {
                    await interstitialRef.current.show();
                } catch {
                    // Ad not loaded yet — silently skip
                }
            }
        } else {
            showTransientToast('Already at last riddle');
        }
    };

    const handlePrev = async () => {
        if (cacheIndex > 0) {
            playSound('swipe');
            vibrate('light');
            const prevIndex = cacheIndex - 1;
            setCacheIndex(prevIndex);
            loadRiddleAtIndex(cache, prevIndex);
            await AsyncStorage.setItem('currentRiddleIndex', prevIndex.toString());
        } else {
            showTransientToast('Already at first riddle');
        }
    };

    const showTransientToast = (text) => {
        setToastText(text);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 1600);
    };

    useEffect(() => {
        loadRiddles();
        fetchBookmarkedRiddles();

        // ── Load admin settings ─────────────────────────────────────────────
        const loadAdminAndAdSettings = async () => {
            try {
                const settings = await getAdSettings();
                setAdSettings(settings);
                const hl = await AsyncStorage.getItem('@admin_hint_limit');
                if (hl !== null) setHintLimit(parseInt(hl, 10));
                const bl = await AsyncStorage.getItem('@admin_bookmark_limit');
                if (bl !== null) setBookmarkLimit(parseInt(bl, 10));
            } catch (e) {
                console.error('Error loading admin/ad settings:', e);
            }
        };
        loadAdminAndAdSettings();

        // ── Interstitial ad setup ────────────────────────────────────────────
        const setupInterstitial = () => {
            const interstitial = InterstitialAd.createForAdRequest(AD_UNITS.interstitial, {
                requestNonPersonalizedAdsOnly: false,
            });
            const unsubLoaded = interstitial.addAdEventListener(InterstitialAdEventType.LOADED, () => {
                // Ad is ready, no action needed
            });
            const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
                unsubLoaded();
                unsubClosed();
                // Reload immediately after close so next interval is ready
                setupInterstitial();
            });
            interstitial.load();
            interstitialRef.current = interstitial;
        };
        setupInterstitial();

        return () => {
            interstitialRef.current = null;
        };
    }, [loadRiddles, fetchBookmarkedRiddles]);

    // ── Reload admin settings whenever screen comes into focus ─────────────────────
    // This means Admin Panel changes take effect immediately on return.
    // Also manages background music lifecycle.
    useFocusEffect(
        useCallback(() => {
            // Start soothing background music when riddle screen is focused
            startBgMusic();

            const reloadSettings = async () => {
                try {
                    const settings = await getAdSettings();
                    setAdSettings(settings);
                    const hl = await AsyncStorage.getItem('@admin_hint_limit');
                    if (hl !== null) setHintLimit(parseInt(hl, 10));
                    const bl = await AsyncStorage.getItem('@admin_bookmark_limit');
                    if (bl !== null) setBookmarkLimit(parseInt(bl, 10));
                } catch (e) {
                    console.error('Riddle: error reloading admin settings on focus', e);
                }
            };
            reloadSettings();

            // Stop music when navigating away from riddle screen
            return () => {
                stopBgMusic();
            };
        }, [])
    );

    useEffect(() => {
        if (cacheIndex >= 0) {
            AsyncStorage.setItem('currentRiddleIndex', cacheIndex.toString());
        }
    }, [cacheIndex]);

    useEffect(() => {
        fetchBookmarkedRiddles();
    }, [riddle, answer, fetchBookmarkedRiddles]);

    const isBookmarked = bookmarkedRiddles.some(b => b.riddle === riddle && b.answer === answer);

    // Get page headers dynamically
    const getPageTitle = () => {
        if (ageRange === 'kids') return 'Playful Riddles';
        if (ageRange === 'teens') return 'Mind Hacks';
        if (ageRange === 'seniors') return 'Mind Gym';
        return 'Riddles';
    };

    const getPageSubtitle = () => {
        if (ageRange === 'kids') return 'Play. Learn. Giggle.';
        if (ageRange === 'teens') return 'Hack. Crack. Flex.';
        if (ageRange === 'seniors') return 'Read. Reflect. Remember.';
        return 'Think. Solve. Smile.';
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={theme.gradientBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Background Decorations */}
            {renderBackgroundDecorations()}
            <View style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    {/* Header bar */}
                    <View style={{ paddingTop: insets.top, height: 60 + insets.top, width: '100%' }}>
                        <View style={styles.headerInner}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.backButtonCircle}
                                onPress={() => {
                                    playSound('click');
                                    vibrate('light');
                                    router.back();
                                }}
                            >
                                <Ionicons name="chevron-back" size={24} color={theme.text} />
                            </TouchableOpacity>
                            
                            <View style={styles.headerTitleContainer}>
                                <Text style={[styles.headerTitle, { color: theme.text }]}>{getPageTitle()}</Text>
                                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>{getPageSubtitle()}</Text>
                            </View>

                            {/* Top Right Illustration Badge */}
                            <View style={styles.headerIllustrationContainer}>
                                <AnimatedProfileIcon profile={ageRange || 'adults'} size={80} />
                            </View>
                        </View>
                    </View>

                    <ScrollView
                        contentContainerStyle={[
                            styles.scrollContent,
                            { paddingBottom: 110 + Math.max(16, insets.bottom) }
                        ]}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Riddle Card */}
                        <View style={[styles.riddleCard, { backgroundColor: theme.cardBackground }]}>
                            <View style={styles.riddleCardHeader}>
                                
                                <TouchableOpacity activeOpacity={0.8} onPress={() => {
                                    playSound('bookmark');
                                    vibrate('medium');
                                    toggleBookmark();
                                }} style={styles.heartButton}>
                                    <MaterialCommunityIcons 
                                        name={isBookmarked ? 'heart' : 'heart-outline'} 
                                        size={28} 
                                        color={isBookmarked ? theme.heartColor : '#94A3B8'} 
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.riddleText, { color: theme.text }]}>
                                {riddle ? `"${riddle}"` : '"Loading..."'}
                            </Text>

                            {riddle && riddle.startsWith('Error:') && (
                                <Text style={styles.errorText}>{riddle}</Text>
                            )}

                            <Text style={[styles.whatAmIText, { color: theme.text }]}>What am I?</Text>
                        </View>

                        {/* Your Answer Section */}
                        <View style={[styles.answerInputContainer, { borderColor: theme.borderColor, backgroundColor: theme.cardBackground }]}>
                            <View style={styles.answerHeaderRow}>
                                <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.accent} />
                                <Text style={[styles.answerInputLabel, { color: theme.text }]}>Your Answer</Text>
                            </View>

                            <TextInput
                                style={[styles.answerTextInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.borderColor }]}
                                placeholder="Type your answer..."
                                placeholderTextColor={theme.text + '80'}
                                value={userGuess}
                                onChangeText={setUserGuess}
                                editable={!checkResult?.isCorrect}
                            />

                            {checkResult && (() => {
                                // Colour-grade the result box based on closeness
                                const pct = checkResult.similarity;
                                let bgColor, borderColor, textColor;
                                if (checkResult.isCorrect) {
                                    bgColor = '#E8F5E9'; borderColor = '#2E7D32'; textColor = '#2E7D32';
                                } else if (pct >= 65) {
                                    bgColor = '#FFF8E1'; borderColor = '#F9A825'; textColor = '#F57F17';
                                } else if (pct >= 45) {
                                    bgColor = '#FFF3E0'; borderColor = '#EF6C00'; textColor = '#E65100';
                                } else {
                                    bgColor = '#FBE9E7'; borderColor = '#BF360C'; textColor = '#BF360C';
                                }
                                return (
                                    <View style={[styles.checkResultBox, { backgroundColor: bgColor, borderColor }]}>
                                        <Text style={[styles.checkResultText, { color: textColor }]}>
                                            {checkResult.isCorrect ? '✓ Correct! 🎉' : checkResult.message}
                                        </Text>
                                    </View>
                                );
                            })()}

                            <TouchableOpacity
                                activeOpacity={0.8}
                                disabled={!userGuess.trim()}
                                onPress={handleCheckAnswer}
                                style={styles.checkButtonWrapper}
                            >
                                <LinearGradient
                                    colors={checkResult?.isCorrect ? ['#2E7D32', '#4CAF50'] : theme.buttonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.checkAnswerButton}
                                >
                                    <Text style={styles.checkButtonText}>
                                        {checkResult?.isCorrect ? 'Correct! 🎉' : 'Check Answer'}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={18} color="#FFFFFF" style={styles.chevronIcon} />
                                </LinearGradient>
                            </TouchableOpacity>

                            {checkResult && (
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={styles.clearButton}
                                    onPress={clearGuess}
                                >
                                    <Text style={[styles.clearButtonText, { color: theme.textSecondary }]}>Clear answer</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Hint & Answer Side-by-Side Buttons */}
                        <View style={styles.revealButtonsRow}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={[styles.revealButton, { backgroundColor: theme.hintButton.backgroundColor }]}
                                onPress={() => {
                                    if (showHint) {
                                        // Just toggling off — no limit consumed
                                        setShowHint(false);
                                        return;
                                    }
                                    if (hintViewed) {
                                        // Already used the hint for this riddle — just re-show freely,
                                        // no need to charge against the quota again.
                                        setShowHint(true);
                                        return;
                                    }
                                    // First reveal of hint for this riddle — check limit
                                    const overLimit = adSettings.extraHintAd && hintsUsed >= hintLimit;
                                    if (overLimit) {
                                        showRewardedHintAd(() => {
                                            setHintsUsed(h => h + 1);
                                            setHintViewed(true);
                                            setShowHint(true);
                                            showTransientToast('Hint unlocked! 🎉');
                                            playSound('hint');
                                            vibrate('light');
                                        });
                                    } else {
                                        setHintsUsed(h => h + 1);
                                        setHintViewed(true);
                                        setShowHint(true);
                                        playSound('hint');
                                        vibrate('light');
                                    }
                                }}
                            >
                                <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={theme.hintButton.color} />
                                <Text style={[styles.revealButtonText, { color: theme.hintButton.color }]}>
                                    {showHint
                                        ? 'Hide Hint'
                                        : (adSettings.extraHintAd && !hintViewed && hintsUsed >= hintLimit
                                            ? '🎬 Watch for Hint'
                                            : 'Show Hint')
                                    }
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                activeOpacity={0.8} 
                                style={[styles.revealButton, { backgroundColor: theme.answerButton.backgroundColor }]} 
                                onPress={() => {
                                    playSound('click');
                                    vibrate('light');
                                    setShowAnswer(!showAnswer);
                                }}
                            >
                                <MaterialCommunityIcons name="eye-outline" size={20} color={theme.answerButton.color} />
                                <Text style={[styles.revealButtonText, { color: theme.answerButton.color }]}>
                                    {showAnswer ? 'Hide Answer' : 'Show Answer'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Revealed Content Cards */}
                        {showHint && author && (
                            <View style={[styles.revealedCard, { backgroundColor: theme.hintButton.backgroundColor + '60', borderColor: theme.hintButton.color + '40' }]}>
                                <Text style={[styles.revealedLabel, { color: theme.hintButton.color }]}>💡 Hint</Text>
                                <Text style={[styles.revealedText, { color: theme.text }]}>{author}</Text>
                            </View>
                        )}

                        {showAnswer && answer && (
                            <View style={[styles.revealedCard, { backgroundColor: theme.answerButton.backgroundColor + '60', borderColor: theme.answerButton.color + '40' }]}>
                                <Text style={[styles.revealedLabel, { color: theme.answerButton.color }]}>✓ Answer</Text>
                                <Text style={[styles.revealedText, { color: theme.text, fontWeight: '700' }]}>{answer}</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Bottom Pill Floating Toolbar */}
                    <View style={styles.footerAdAndToolbarContainer}>
                        {/* Banner Ad above toolbar */}
                        {adSettings.showAds && (
                            <View style={styles.riddleBannerAdContainer}>
                                <BannerAd
                                    unitId={AD_UNITS.banner}
                                    size={BannerAdSize.BANNER}
                                    requestOptions={{ requestNonPersonalizedAdsOnly: false }}
                                />
                            </View>
                        )}
                        <View style={styles.footerToolbarContainer}>
                            <View style={styles.footerToolbar}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={[styles.toolbarCircleButton, { borderColor: theme.borderColor }]}
                                    onPress={handlePrev}
                                >
                                    <Ionicons name="chevron-back" size={20} color={theme.text} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={styles.toolbarButton}
                                    onPress={() => {
                                        playSound('bookmark');
                                        vibrate('medium');
                                        toggleBookmark();
                                    }}
                                >
                                    <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={24} color={theme.textSecondary} />
                                </TouchableOpacity>

                                {/* Central Riddle Number Badge */}
                                <View style={[styles.centralBadgeContainer, { borderColor: theme.accent }]}>
                                    <MaterialCommunityIcons name="pound" size={16} color={theme.accent} style={styles.badgeStar} />
                                    <Text style={[styles.badgeIndexText, { color: theme.accent }]}>{cacheIndex + 1}</Text>
                                </View>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={styles.toolbarButton}
                                    onPress={() => setShowShareOptions(true)}
                                >
                                    <Ionicons name="share-social-outline" size={24} color={theme.textSecondary} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    style={[styles.toolbarCircleButton, { borderColor: theme.borderColor }]}
                                    onPress={handleNext}
                                >
                                    <Ionicons name="chevron-forward" size={20} color={theme.text} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>

            {/* Share Modal */}
            <Modal transparent visible={showShareOptions} animationType="fade" onRequestClose={() => setShowShareOptions(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Share Riddle</Text>
                        <View style={styles.checkboxRow}>
                            <TouchableOpacity style={styles.checkbox} onPress={() => setShareHint(!shareHint)}>
                                <Ionicons name={shareHint ? 'checkbox' : 'checkbox-outline'} size={24} color={theme.accent} />
                            </TouchableOpacity>
                            <Text style={[styles.checkboxLabel, { color: theme.text }]}>Include hint in message</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: theme.accent }]}
                            onPress={() => {
                                // Capture share options BEFORE clearing state
                                const hintFlag = shareHint;
                                setShowShareOptions(false);
                                setShareHint(false);

                                // Build share message with captured options
                                const doShare = async () => {
                                    try {
                                        let message = `"${riddle}"`;
                                        if (hintFlag && author) {
                                            message += `\n\n💡 Hint: ${author}`;
                                        }
                                        await Share.share({ message });
                                    } catch {
                                        showTransientToast('Could not share the riddle');
                                    }
                                };

                                if (adSettings.showAds && interstitialRef.current) {
                                    // Add a one-time listener: share after the ad closes
                                    let unsub;
                                    unsub = interstitialRef.current.addAdEventListener(
                                        AdEventType.CLOSED,
                                        () => {
                                            if (unsub) unsub();
                                            doShare();
                                        }
                                    );
                                    try {
                                        interstitialRef.current.show();
                                    } catch {
                                        // Ad not ready — share immediately
                                        if (unsub) unsub();
                                        doShare();
                                    }
                                } else {
                                    doShare();
                                }
                            }}
                        >
                            <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>Share Now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowShareOptions(false); setShareHint(false); }}>
                            <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Floating Toast notification */}
            {showToast && (
                <View style={[styles.toast, { backgroundColor: theme.accent }]}>
                    <Text style={styles.toastText}>{toastText}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        position: 'relative',
        width: '100%',
    },
    headerInner: {
        height: 60,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        position: 'relative',
    },
    backButtonCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        position: 'absolute',
        left: 24,
        top: 8, // (60 - 44) / 2 = 8
        zIndex: 10,
    },
    headerTitleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 1,
        textAlign: 'center',
    },
    headerIllustrationContainer: {
        position: 'absolute',
        right: 12,
        top: -10, // (60 - 80) / 2 = -10
        zIndex: 10,
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerBrainImage: {
        width: 80,
        height: 80,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 110, // space for the floating bottom toolbar
        flexGrow: 1,
        justifyContent: 'center',
    },
    bgDecoration: {
        position: 'absolute',
        zIndex: 0,
    },
    riddleCard: {
        borderRadius: 28,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 20,
    },
    riddleCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        position: 'relative',
        width: '100%',
    },
    heartButton: {
        position: 'absolute',
        right: 0,
        alignSelf: 'center',
    },
    riddleBadge: {
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 16,
    },
    riddleBadgeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    riddleText: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 28,
        marginVertical: 10,
    },
    whatAmIText: {
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        marginTop: 20,
        letterSpacing: -0.2,
    },
    errorText: {
        color: '#D32F2F',
        marginTop: 12,
        textAlign: 'center',
        fontSize: 14,
    },
    answerInputContainer: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    answerHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    answerInputLabel: {
        fontSize: 15,
        fontWeight: '700',
    },
    answerTextInput: {
        borderWidth: 1.5,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 12,
    },
    checkResultBox: {
        borderWidth: 1.5,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkResultText: {
        fontSize: 15,
        fontWeight: '700',
    },
    checkButtonWrapper: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    checkAnswerButton: {
        flexDirection: 'row',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    chevronIcon: {
        marginLeft: 6,
    },
    clearButton: {
        alignSelf: 'center',
        marginTop: 12,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    clearButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    revealButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    revealButton: {
        flex: 1,
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    revealButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
    revealedCard: {
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    revealedLabel: {
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    revealedText: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '500',
    },
    footerAdAndToolbarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingBottom: 16,
    },
    riddleBannerAdContainer: {
        alignItems: 'center',
        marginBottom: 6,
    },
    footerToolbarContainer: {
        paddingHorizontal: 24,
        width: '100%',
    },
    footerToolbar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 36,
        paddingVertical: 10,
        paddingHorizontal: 16,
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 6,
    },
    toolbarCircleButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toolbarButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centralBadgeContainer: {
        width: 58,
        height: 58,
        borderRadius: 29,
        borderWidth: 1.5,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -16, // lift it up slightly
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    badgeStar: {
        marginBottom: -2,
    },
    badgeIndexText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#475569',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    modalButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        marginVertical: 6,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalCancel: {
        marginTop: 10,
        paddingVertical: 8,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        justifyContent: 'center',
    },
    checkbox: {
        marginRight: 10,
    },
    checkboxLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    toast: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6,
    },
    toastText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default App;
