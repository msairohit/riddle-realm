import { Ionicons } from '@expo/vector-icons'; // Import icons
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import riddlesData from '../../assets/data/riddles';
import { checkAnswer } from '../../utils/answerChecker';
import { useTheme } from '../ThemeContext';

const App = () => {
    const { theme } = useTheme();
    const router = useRouter();
    const [riddle, setRiddle] = useState('Loading...');
    const [author, setAuthor] = useState('');
    const [answer, setAnswer] = useState('');
    const [bookmarkedRiddles, setBookmarkedRiddles] = useState([]);
    const [cache, setCache] = useState([]); // stored riddles collection
    const [cacheIndex, setCacheIndex] = useState(-1);
    const [showToast, setShowToast] = useState(false);
    const [toastText, setToastText] = useState('');
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [shareHint, setShareHint] = useState(false);
    const [userGuess, setUserGuess] = useState('');
    const [checkResult, setCheckResult] = useState(null);

    // Check user's answer
    const handleCheckAnswer = () => {
        if (!userGuess.trim()) {
            showTransientToast('Please enter an answer');
            return;
        }
        const result = checkAnswer(userGuess, answer, 0.75); // Change 0.75 for more/less strict
        setCheckResult(result);

        if (result.isCorrect) {
            // Track solved riddle
            trackSolvedRiddle();
        }
    };

    const trackSolvedRiddle = async () => {
        try {
            const solvedKey = '@riddles_solved';
            const existing = await AsyncStorage.getItem(solvedKey);
            const solved = existing ? JSON.parse(existing) : [];
            const riddle_id = `${riddle}_${answer}`;
            if (!solved.includes(riddle_id)) {
                solved.push(riddle_id);
                await AsyncStorage.setItem(solvedKey, JSON.stringify(solved));
            }
        } catch (error) {
            console.error('Error tracking solved riddle:', error);
        }
    };

    const clearGuess = () => {
        setUserGuess('');
        setCheckResult(null);
    };

    // Bookmark the current riddle
    const toggleBookmark = async () => {
        try {
            const existing = await AsyncStorage.getItem('bookmarkedRiddles');
            const bookmarks = existing ? JSON.parse(existing) : [];
            const matchIndex = bookmarks.findIndex(b => b.riddle === riddle && b.answer === answer);
            let message = '';
            if (matchIndex >= 0) {
                bookmarks.splice(matchIndex, 1);
                message = 'Removed from bookmarks';
            } else {
                bookmarks.push({ riddle, answer, hint: author });
                message = 'Bookmarked';
            }
            await AsyncStorage.setItem('bookmarkedRiddles', JSON.stringify(bookmarks));
            setBookmarkedRiddles(bookmarks);
            showTransientToast(message);
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
        } catch (error) {
            showTransientToast('Could not share the riddle');
        }
    };
    // Fetch bookmarked riddles
    const fetchBookmarkedRiddles = async () => {
        try {
            const existingBookmarks = await AsyncStorage.getItem('bookmarkedRiddles');
            const bookmarks = existingBookmarks ? JSON.parse(existingBookmarks) : [];
            setBookmarkedRiddles(bookmarks);
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
        }
    };

    const loadRiddles = async () => {
        try {
            const nextCache = riddlesData.map(r => ({
                riddle: r.riddle || r.Riddle || '',
                hint: r.hint || r.Hint || '',
                answer: r.answer || r.Answer || ''
            }));
            if (nextCache.length > 0) {
                setCache(nextCache);
                // Try to restore saved index
                const savedIndex = await AsyncStorage.getItem('currentRiddleIndex');
                const indexToUse = savedIndex ? Math.min(parseInt(savedIndex), nextCache.length - 1) : 0;
                setCacheIndex(indexToUse);
                loadRiddleAtIndex(nextCache, indexToUse);
            }
        } catch (error) {
            console.error('Error loading riddles:', error);
        }
    };

    const loadRiddleAtIndex = (cacheArray, index) => {
        const riddleObj = cacheArray[index];
        setRiddle(riddleObj.riddle);
        setAuthor(riddleObj.hint);
        setAnswer(riddleObj.answer);
        setShowHint(false);
        setShowAnswer(false);
        clearGuess();
    };



    const handleNext = async () => {
        if (cacheIndex < cache.length - 1) {
            const nextIndex = cacheIndex + 1;
            setCacheIndex(nextIndex);
            loadRiddleAtIndex(cache, nextIndex);
            await AsyncStorage.setItem('currentRiddleIndex', nextIndex.toString());
        } else {
            showTransientToast('Already at last riddle');
        }
    };

    const handlePrev = async () => {
        if (cacheIndex > 0) {
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
    }, []);

    // Save current riddle index whenever it changes
    useEffect(() => {
        if (cacheIndex >= 0) {
            AsyncStorage.setItem('currentRiddleIndex', cacheIndex.toString());
        }
    }, [cacheIndex]);

    // Refresh bookmarks whenever the riddle changes
    useEffect(() => {
        fetchBookmarkedRiddles();
    }, [riddle, answer]);
    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View>
                <Text style={[styles.title, { color: theme.text }]}>Riddles</Text>
            </View>
            <View style={[styles.riddleBox, { backgroundColor: theme.container }]}>
                <Text style={[styles.riddle, { color: theme.text }]}>{riddle ? `"${riddle}"` : '"Loading..."'}</Text>
                {riddle && riddle.startsWith('Error:') && (
                    <Text style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>{riddle}</Text>
                )}
                {showHint && author && (
                    <Text style={[styles.revelation, { color: theme.text }]}>💡 Hint: {author}</Text>
                )}
                {showAnswer && answer && (
                    <Text style={[styles.revelation, { color: theme.text }]}>✓ Answer: {answer}</Text>
                )}
            </View>

            {/* Answer Input Section */}
            <View style={[styles.answerInputContainer, { backgroundColor: theme.container, borderColor: theme.tint }]}>
                <Text style={[styles.answerInputLabel, { color: theme.text }]}>Try to answer:</Text>
                <TextInput
                    style={[styles.answerInput, { color: theme.text, borderColor: checkResult?.isCorrect ? '#4caf50' : theme.tint, backgroundColor: theme.background }]}
                    placeholder="Type your answer..."
                    placeholderTextColor={theme.text + '80'}
                    value={userGuess}
                    onChangeText={setUserGuess}
                    editable={!checkResult?.isCorrect}
                />
                {checkResult && (
                    <View style={[styles.checkResultBox, { backgroundColor: checkResult.isCorrect ? '#c8e6c9' : '#fff3cd', borderColor: checkResult.isCorrect ? '#4caf50' : '#ffc107' }]}>
                        <Text style={[styles.checkResultText, { color: checkResult.isCorrect ? '#2e7d32' : '#856404' }]}>
                            {checkResult.isCorrect ? '✓ Correct!' : `${checkResult.similarity}% match`}
                        </Text>
                    </View>
                )}
                <View style={styles.answerButtonsRow}>
                    <TouchableOpacity
                        style={[styles.answerButton, { backgroundColor: checkResult?.isCorrect ? '#4caf50' : theme.button }]}
                        onPress={handleCheckAnswer}
                        disabled={!userGuess.trim()}
                    >
                        <Text style={[styles.answerButtonText, { color: theme.buttonText }]}>
                            {checkResult?.isCorrect ? 'Correct! 🎉' : 'Check Answer'}
                        </Text>
                    </TouchableOpacity>
                    {checkResult && (
                        <TouchableOpacity
                            style={[styles.answerButton, { backgroundColor: theme.button }]}
                            onPress={clearGuess}
                        >
                            <Text style={[styles.answerButtonText, { color: theme.buttonText }]}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.revealButtonsRow}>
                <TouchableOpacity style={[styles.revealButton, { backgroundColor: theme.button }]} onPress={() => setShowHint(!showHint)}>
                    <Text style={[styles.revealButtonText, { color: theme.buttonText }]}>{showHint ? 'Hide Hint' : 'Show Hint'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.revealButton, { backgroundColor: theme.button }]} onPress={async () => {
                    if (!showAnswer) {
                        // User is revealing the answer - track it as solved
                        try {
                            // Track solved riddles
                            const solvedKey = '@riddles_solved';
                            const existing = await AsyncStorage.getItem(solvedKey);
                            const solved = existing ? JSON.parse(existing) : [];
                            const riddle_id = `${riddle}_${answer}`;
                            if (!solved.includes(riddle_id)) {
                                solved.push(riddle_id);
                                await AsyncStorage.setItem(solvedKey, JSON.stringify(solved));
                            }

                            // Track if solved with hint
                            if (showHint) {
                                const solvedWithHintKey = '@riddles_solved_with_hint';
                                const existingHint = await AsyncStorage.getItem(solvedWithHintKey);
                                const solvedWithHint = existingHint ? JSON.parse(existingHint) : [];
                                if (!solvedWithHint.includes(riddle_id)) {
                                    solvedWithHint.push(riddle_id);
                                    await AsyncStorage.setItem(solvedWithHintKey, JSON.stringify(solvedWithHint));
                                }
                            }
                        } catch (error) {
                            console.error('Error tracking solved riddle:', error);
                        }
                    }
                    setShowAnswer(!showAnswer);
                }}>
                    <Text style={[styles.revealButtonText, { color: theme.buttonText }]}>{showAnswer ? 'Hide Answer' : 'Show Answer'}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.controlsRow}>
                <TouchableOpacity style={styles.iconButton} onPress={handlePrev}>
                    <Ionicons name="chevron-back-circle-outline" size={48} color={theme.tint} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={toggleBookmark}>
                    <Ionicons name={bookmarkedRiddles.find(b => b.riddle === riddle && b.answer === answer) ? 'bookmark' : 'bookmark-outline'} size={40} color={theme.tint} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={() => setShowShareOptions(true)}>
                    <Ionicons name="share-social-outline" size={40} color={theme.tint} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={handleNext}>
                    <Ionicons name="chevron-forward-circle-outline" size={48} color={theme.tint} />
                </TouchableOpacity>
            </View>
            {cache.length > 0 && (
                <Text style={[styles.indexCounter, { color: theme.text }]}>{cacheIndex + 1}</Text>
            )}

            <Modal transparent visible={showShareOptions} animationType="fade" onRequestClose={() => setShowShareOptions(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.container }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Share Riddle</Text>
                        <View style={styles.checkboxRow}>
                            <TouchableOpacity style={styles.checkbox} onPress={() => setShareHint(!shareHint)}>
                                <Ionicons name={shareHint ? 'checkbox' : 'checkbox-outline'} size={24} color={theme.tint} />
                            </TouchableOpacity>
                            <Text style={[styles.checkboxLabel, { color: theme.text }]}>Include hint</Text>
                        </View>
                        <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.button }]} onPress={() => { setShowShareOptions(false); shareRiddle(); setShareHint(false); }}>
                            <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowShareOptions(false); setShareHint(false); }}>
                            <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {showToast && (
                <View style={[styles.toast, { backgroundColor: theme.button }]}>
                    <Text style={[styles.toastText, { color: theme.buttonText }]}>{toastText}</Text>
                </View>
            )}
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e8f5e9', // Light green background
        padding: 20,
    },
    riddleBox: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: 20,
    },
    riddle: {
        fontSize: 24,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    author: {
        fontSize: 18,
        textAlign: 'right',
        marginTop: 10,
    },

    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    iconButton: {
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 5,
    },
    bookmarkedTitle: {
        fontSize: 20,
    },
    title: {
        // paddingTop: 60,
        paddingBottom: 20,
        marginTop: 20,
        paddingHorizontal: 16,
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        // color: '#3498db',
    },
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '60%',
        marginBottom: 12,
        alignItems: 'center',
    },
    prevNextButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 18,
        alignItems: 'center',
    },
    revealButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 12,
        gap: 10,
        paddingHorizontal: 16,
    },
    revealButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    revealButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    revelation: {
        marginTop: 12,
        fontSize: 16,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    indexCounter: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
        textAlign: 'center',
    },
    customizeButton: {
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignSelf: 'center',
        elevation: 2,
    },
    customizeText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    toast: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 20,
        elevation: 6,
    },
    toastText: {
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        borderRadius: 14,
        padding: 18,
        alignItems: 'center',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    modalButton: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginVertical: 6,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalCancel: {
        marginTop: 6,
        paddingVertical: 8,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
        justifyContent: 'center',
    },
    checkbox: {
        marginRight: 8,
        padding: 4,
    },
    checkboxLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    answerInputContainer: {
        width: '90%',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1.5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    answerInputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    answerInput: {
        borderWidth: 1.5,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        marginBottom: 10,
    },
    checkResultBox: {
        borderWidth: 1.5,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 10,
        alignItems: 'center',
    },
    checkResultText: {
        fontSize: 15,
        fontWeight: '600',
    },
    answerButtonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    answerButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    answerButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },

});
export default App;