import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import AnimatedProfileIcon from '../../components/AnimatedProfileIcon';
import {
    Animated,
    Dimensions,
    FlatList,
    LayoutAnimation,
    Modal,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ThemeContext';

const { height: screenHeight } = Dimensions.get('window');

const Bookmarks = () => {
    const { theme, ageRange } = useTheme();
    const [bookmarkedRiddles, setBookmarkedRiddles] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRiddle, setSelectedRiddle] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [shareHint, setShareHint] = useState(false);
    const [shareAnswer, setShareAnswer] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const scaleAnim = useRef(new Animated.Value(1)).current;


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

    const fetchBookmarkedRiddles = async () => {
        try {
            const existingBookmarks = await AsyncStorage.getItem('bookmarkedRiddles');
            const bookmarks = existingBookmarks ? JSON.parse(existingBookmarks) : [];
            setBookmarkedRiddles(bookmarks);
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
        }
    };

    useEffect(() => {
        fetchBookmarkedRiddles();
    }, []);

    const openModal = (item) => {
        setSelectedRiddle(item);
        setShowDeleteConfirm(false);
        setShowHint(false);
        setShowAnswer(false);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedRiddle(null);
        setShowHint(false);
        setShowAnswer(false);
    };

    const animateButton = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.85,
            speed: 20,
            bounciness: 10,
            useNativeDriver: true,
        }).start(() => {
            Animated.spring(scaleAnim, {
                toValue: 1,
                speed: 20,
                bounciness: 10,
                useNativeDriver: true,
            }).start();
        });
    };

    const deleteBookmark = async (riddleToDelete) => {
        try {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            const indexToDelete = bookmarkedRiddles.findIndex(
                bookmark => bookmark.riddle === riddleToDelete.riddle && bookmark.answer === riddleToDelete.answer
            );

            if (indexToDelete > -1) {
                const updatedBookmarks = [...bookmarkedRiddles];
                updatedBookmarks.splice(indexToDelete, 1);
                setBookmarkedRiddles(updatedBookmarks);
                await AsyncStorage.setItem('bookmarkedRiddles', JSON.stringify(updatedBookmarks));
            }
            setShowDeleteConfirm(false);
            closeModal();
        } catch (error) {
            console.error('Error deleting bookmark:', error);
        }
    };

    const shareRiddle = async () => {
        try {
            let message = `"${selectedRiddle.riddle}"`;
            if (shareHint && (selectedRiddle.hint || selectedRiddle.author)) {
                const hint = selectedRiddle.hint || selectedRiddle.author || '';
                if (hint) message += `\n\n💡 Hint: ${hint}`;
            }
            if (shareAnswer && selectedRiddle.answer) {
                message += `\n\n✓ Answer: ${selectedRiddle.answer}`;
            }
            await Share.share({
                message: message,
            });
        } catch (error) {
            console.error('Error sharing riddle:', error);
        }
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
                {/* Header bar */}
                <View style={{ paddingTop: insets.top, height: 60 + insets.top, width: '100%' }}>
                    <View style={styles.headerInner}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.backButtonCircle}
                            onPress={() => router.back()}
                        >
                            <Ionicons name="chevron-back" size={24} color={theme.text} />
                        </TouchableOpacity>

                        <View style={styles.headerTitleContainer}>
                            <Text style={[styles.headerTitle, { color: theme.text }]}>My Bookmarks</Text>
                            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Saved Secrets ({bookmarkedRiddles.length})</Text>
                        </View>

                        {/* Top Right Illustration Badge */}
                        <View style={styles.headerIllustrationContainer}>
                            <AnimatedProfileIcon profile={ageRange || 'adults'} size={80} />
                        </View>
                    </View>
                </View>

                {/* FlatList of Bookmarks */}
                <FlatList
                    data={bookmarkedRiddles}
                    keyExtractor={(item, index) => `${item.riddle}-${index}`}
                    contentContainerStyle={[
                        styles.listContentContainer,
                        { paddingBottom: Math.max(24, insets.bottom + 16) }
                    ]}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => openModal(item)}
                            style={[styles.bookmarkItem, { backgroundColor: theme.cardBackground }]}
                        >
                            <View style={styles.bookmarkContent}>
                                <View style={[styles.bookmarkBadge, { backgroundColor: theme.accent + '12' }]}>
                                    <Text style={[styles.bookmarkBadgeText, { color: theme.accent }]}>#{index + 1}</Text>
                                </View>
                                <Text style={[styles.bookmarkRiddle, { color: theme.text }]} numberOfLines={2}>
                                    {"\""}{item.riddle}{"\""}
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIconCircle, { backgroundColor: theme.accent + '12' }]}>
                                <MaterialCommunityIcons name="bookmark-outline" size={42} color={theme.accent} />
                            </View>
                            <Text style={[styles.emptyText, { color: theme.text }]}>No Saved Puzzles</Text>
                            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                                Bookmark interesting riddles to keep them here for later!
                            </Text>
                        </View>
                    )}
                />

                {/* Detail View Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={closeModal}
                >
                    <View style={styles.centeredView}>
                        <View style={[styles.modalView, { backgroundColor: theme.cardBackground }]}>
                            {selectedRiddle && (
                                <>
                                    <View style={styles.modalHeaderRow}>
                                        <View style={[styles.modalBadge, { backgroundColor: theme.accent + '15' }]}>
                                            <Text style={[styles.modalBadgeText, { color: theme.accent }]}>Saved Riddle</Text>
                                        </View>
                                        <TouchableOpacity activeOpacity={0.8} onPress={closeModal} style={styles.modalCloseButton}>
                                            <Ionicons name="close" size={24} color={theme.text} />
                                        </TouchableOpacity>
                                    </View>

                                    <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                                        <Text style={[styles.modalRiddle, { color: theme.text }]}>
                                            {"\""}{selectedRiddle.riddle}{"\""}
                                        </Text>

                                        {/* Hint & Answer Reveal Row */}
                                        <View style={styles.revealButtonsRow}>
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                style={[styles.revealButton, { backgroundColor: theme.hintButton.backgroundColor }]}
                                                onPress={() => setShowHint(!showHint)}
                                            >
                                                <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={theme.hintButton.color} />
                                                <Text style={[styles.revealButtonText, { color: theme.hintButton.color }]}>
                                                    {showHint ? 'Hide Hint' : 'Show Hint'}
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                style={[styles.revealButton, { backgroundColor: theme.answerButton.backgroundColor }]}
                                                onPress={() => setShowAnswer(!showAnswer)}
                                            >
                                                <MaterialCommunityIcons name="eye-outline" size={20} color={theme.answerButton.color} />
                                                <Text style={[styles.revealButtonText, { color: theme.answerButton.color }]}>
                                                    {showAnswer ? 'Hide Answer' : 'Show Answer'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* revealed cards */}
                                        {showHint && (
                                            <View style={[styles.revealedCard, { backgroundColor: theme.hintButton.backgroundColor + '50', borderColor: theme.hintButton.color + '30' }]}>
                                                <Text style={[styles.revealedLabel, { color: theme.hintButton.color }]}>💡 Hint</Text>
                                                <Text style={[styles.revealedText, { color: theme.text }]}>{selectedRiddle.hint || 'No hint available'}</Text>
                                            </View>
                                        )}
                                        {showAnswer && (
                                            <View style={[styles.revealedCard, { backgroundColor: theme.answerButton.backgroundColor + '50', borderColor: theme.answerButton.color + '30' }]}>
                                                <Text style={[styles.revealedLabel, { color: theme.answerButton.color }]}>✓ Answer</Text>
                                                <Text style={[styles.revealedText, { color: theme.text, fontWeight: '700' }]}>{selectedRiddle.answer || 'No answer available'}</Text>
                                            </View>
                                        )}
                                    </ScrollView>

                                    {/* Action Row */}
                                    <View style={styles.modalButtonContainer}>
                                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                style={[styles.actionIconButton, { backgroundColor: "#FFEEEF" }]}
                                                onPress={() => setShowDeleteConfirm(true)}
                                                onPressIn={animateButton}
                                            >
                                                <AntDesign name="delete" size={20} color="#E53935" />
                                            </TouchableOpacity>
                                        </Animated.View>

                                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                            <TouchableOpacity
                                                activeOpacity={0.8}
                                                style={[styles.actionIconButton, { backgroundColor: theme.accent + '15' }]}
                                                onPress={() => setShowShareOptions(true)}
                                                onPressIn={animateButton}
                                            >
                                                <Ionicons name="share-social-outline" size={20} color={theme.accent} />
                                            </TouchableOpacity>
                                        </Animated.View>
                                    </View>

                                    {/* Delete Confirmation Box */}
                                    {showDeleteConfirm && (
                                        <View style={[styles.deleteConfirmRow, { backgroundColor: theme.background, borderColor: theme.borderColor }]}>
                                            <Text style={[styles.deleteConfirmText, { color: theme.text }]}>Remove this bookmark?</Text>
                                            <View style={styles.deleteConfirmButtons}>
                                                <TouchableOpacity activeOpacity={0.8} style={[styles.cancelBtn, { borderColor: theme.textSecondary }]} onPress={() => setShowDeleteConfirm(false)}>
                                                    <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity activeOpacity={0.8} style={[styles.confirmDeleteBtn, { backgroundColor: '#E53935' }]} onPress={() => deleteBookmark(selectedRiddle)}>
                                                    <Text style={{ color: '#FFF', fontWeight: '600' }}>Remove</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    </View>
                </Modal>

                {/* Share Option Modal */}
                <Modal transparent visible={showShareOptions} animationType="fade" onRequestClose={() => setShowShareOptions(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Share Riddle</Text>
                            <View style={styles.checkboxRow}>
                                <TouchableOpacity style={styles.checkbox} onPress={() => setShareHint(!shareHint)}>
                                    <Ionicons name={shareHint ? 'checkbox' : 'checkbox-outline'} size={24} color={theme.accent} />
                                </TouchableOpacity>
                                <Text style={[styles.checkboxLabel, { color: theme.text }]}>Include hint</Text>
                            </View>
                            <View style={styles.checkboxRow}>
                                <TouchableOpacity style={styles.checkbox} onPress={() => setShareAnswer(!shareAnswer)}>
                                    <Ionicons name={shareAnswer ? 'checkbox' : 'checkbox-outline'} size={24} color={theme.accent} />
                                </TouchableOpacity>
                                <Text style={[styles.checkboxLabel, { color: theme.text }]}>Include answer</Text>
                            </View>
                            <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.accent }]} onPress={() => { setShowShareOptions(false); shareRiddle(); setShareHint(false); setShareAnswer(false); }}>
                                <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>Share Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowShareOptions(false); setShareHint(false); setShareAnswer(false); }}>
                                <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
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
    bgDecoration: {
        position: 'absolute',
        zIndex: 0,
    },
    listContentContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 30,
    },
    bookmarkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
    },
    bookmarkContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    bookmarkBadge: {
        borderRadius: 10,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginRight: 12,
        minWidth: 32,
        alignItems: 'center',
    },
    bookmarkBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    bookmarkRiddle: {
        fontSize: 16,
        fontWeight: '600',
        fontStyle: 'italic',
        flex: 1,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginTop: 100,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 24,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalView: {
        width: '85%',
        maxHeight: '80%',
        borderRadius: 28,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 14,
        elevation: 10,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    modalBadge: {
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 12,
    },
    modalBadgeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalScroll: {
        flexGrow: 0,
        marginBottom: 16,
    },
    modalRiddle: {
        fontSize: 18,
        fontWeight: '600',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 26,
        marginBottom: 20,
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
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    revealButtonText: {
        fontSize: 13,
        fontWeight: '700',
    },
    revealedCard: {
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        marginBottom: 12,
    },
    revealedLabel: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    revealedText: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '500',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 10,
        width: '100%',
    },
    actionIconButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    deleteConfirmRow: {
        marginTop: 16,
        width: '100%',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    deleteConfirmText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    deleteConfirmButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1.5,
        alignItems: 'center',
    },
    confirmDeleteBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 10,
        alignItems: 'center',
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
        marginVertical: 12,
        justifyContent: 'center',
    },
    checkbox: {
        marginRight: 10,
    },
    checkboxLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default Bookmarks;