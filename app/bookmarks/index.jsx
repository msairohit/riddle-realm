import { AntDesign, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList, LayoutAnimation,
    Modal,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../ThemeContext'; // <-- Add this import

const Bookmarks = () => {
    const { theme } = useTheme(); // <-- Use theme
    const [bookmarkedRiddles, setBookmarkedRiddles] = useState([]);

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

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRiddle, setSelectedRiddle] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showShareOptions, setShowShareOptions] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [shareHint, setShareHint] = useState(false);
    const [shareAnswer, setShareAnswer] = useState(false);
    const router = useRouter();

    const scaleAnim = useRef(new Animated.Value(1)).current;

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
            toValue: 0.8,
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
            const indexToDelete = bookmarkedRiddles.findIndex( // To handle potential duplicates, we find the index of the first matching riddle to delete.

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
            Alert.alert('Error', 'Could not delete bookmark.');
        }
    };

    const confirmDelete = (riddle) => {
        setShowDeleteConfirm(true);
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
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.header, { backgroundColor: theme.background }]}>
                <Text style={[styles.title, { color: theme.text }]}>Bookmarked Riddles</Text>
            </View>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.centeredView}>
                    <View style={[styles.modalView, { backgroundColor: theme.container }]}>
                        {selectedRiddle && (
                            <>
                                <Text style={[styles.modalRiddle, { color: theme.text }]}>
                                    "{selectedRiddle.riddle}"
                                </Text>
                                {showHint && (
                                    <Text style={[styles.revelation, { color: theme.text }]}>💡 Hint: {selectedRiddle.hint || 'No hint available'}</Text>
                                )}
                                {showAnswer && (
                                    <Text style={[styles.revelation, { color: theme.text }]}>✓ Answer: {selectedRiddle.answer || 'No answer available'}</Text>
                                )}
                                <View style={styles.revealButtonsRow}>
                                    <TouchableOpacity style={[styles.revealButton, { backgroundColor: theme.button }]} onPress={() => setShowHint(!showHint)}>
                                        <Text style={[styles.revealButtonText, { color: theme.buttonText }]}>{showHint ? 'Hide Hint' : 'Show Hint'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.revealButton, { backgroundColor: theme.button }]} onPress={() => setShowAnswer(!showAnswer)}>
                                        <Text style={[styles.revealButtonText, { color: theme.buttonText }]}>{showAnswer ? 'Hide Answer' : 'Show Answer'}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.modalButtonContainer}>
                                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                        <TouchableOpacity
                                            style={[styles.deleteButton, { backgroundColor: "#e74c3c" }]}
                                            onPress={() => confirmDelete(selectedRiddle)}
                                            onPressIn={animateButton}
                                        >
                                            <AntDesign name="delete" size={24} color="white" />
                                        </TouchableOpacity>
                                    </Animated.View>
                                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                        <TouchableOpacity
                                            style={[styles.shareButton, { backgroundColor: theme.button }]}
                                            onPress={() => setShowShareOptions(true)}
                                            onPressIn={animateButton}
                                        >
                                            <Ionicons name="share-social-outline" size={22} color={theme.buttonText} />
                                        </TouchableOpacity>
                                    </Animated.View>
                                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                        <TouchableOpacity
                                            style={[styles.closeButton, { backgroundColor: theme.button }]}
                                            onPress={closeModal}
                                            onPressIn={animateButton}
                                        >
                                            <AntDesign name="close" size={24} color={theme.buttonText} />
                                        </TouchableOpacity>
                                    </Animated.View>
                                </View>
                                {showDeleteConfirm && (
                                    <View style={styles.deleteConfirmRow}>
                                        <Text style={[styles.deleteConfirmText, { color: theme.text }]}>Remove this bookmark?</Text>
                                        <View style={styles.deleteConfirmButtons}>
                                            <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.text }]} onPress={() => setShowDeleteConfirm(false)}>
                                                <Text style={{ color: theme.text }}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.confirmDeleteBtn, { backgroundColor: '#e74c3c' }]} onPress={() => deleteBookmark(selectedRiddle)}>
                                                <Text style={{ color: '#fff' }}>Delete</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </Modal>
            <FlatList
                data={bookmarkedRiddles}
                keyExtractor={(item, index) => `${item.riddle}-${index}`}
                contentContainerStyle={styles.listContentContainer}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => openModal(item)}
                    >
                        <View style={[styles.bookmarkItem, { backgroundColor: theme.container }]}>
                            <Text style={[styles.bookmarkRiddle, { color: theme.text }]} numberOfLines={3}>
                                "{item.riddle}"
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <AntDesign name="book" size={48} color="#ced4da" />
                        <Text style={[styles.emptyText, { color: theme.text }]}>No Bookmarks Yet</Text>
                        <Text style={[styles.emptySubtext, { color: theme.text }]}>
                            Your favorite riddles will appear here.
                        </Text>
                    </View>
                )}
            />
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
                        <View style={styles.checkboxRow}>
                            <TouchableOpacity style={styles.checkbox} onPress={() => setShareAnswer(!shareAnswer)}>
                                <Ionicons name={shareAnswer ? 'checkbox' : 'checkbox-outline'} size={24} color={theme.tint} />
                            </TouchableOpacity>
                            <Text style={[styles.checkboxLabel, { color: theme.text }]}>Include answer</Text>
                        </View>
                        <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.button }]} onPress={() => { setShowShareOptions(false); shareRiddle(); setShareHint(false); setShareAnswer(false); }}>
                            <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowShareOptions(false); setShareHint(false); setShareAnswer(false); }}>
                            <Text style={[styles.modalButtonText, { color: theme.text }]}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 16,
        backgroundColor: '#f8f9fa',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#3498db',
    },
    listContentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    bookmarkItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
    },
    bookmarkRiddle: {
        fontSize: 18,
        fontStyle: 'italic',
        marginBottom: 10,
    },
    revealButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginVertical: 12,
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
        marginVertical: 12,
        fontSize: 16,
        fontStyle: 'italic',
        textAlign: 'center',
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
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalRiddle: {
        fontSize: 22,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: 15,
    },
    modalAuthor: {
        fontSize: 18,
        textAlign: 'right',
        alignSelf: 'stretch',
        marginBottom: 20,
    },
    modalButtonContainer: { // Container to hold delete and close buttons horizontally
        flexDirection: 'row',  // Arrange buttons horizontally
        justifyContent: 'space-around',  // Distribute space around items
        marginTop: 20,  // Add some space above buttons
        width: '100%',
    },
    deleteButton: {
        backgroundColor: '#e74c3c',  // Red background for delete
        padding: 12,
        borderRadius: 50,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        alignItems: 'center',  // Center content horizontally
        justifyContent: 'center',  // Center content vertically
    },
    shareButton: {
        backgroundColor: '#2ecc71',
        padding: 12,
        borderRadius: 50,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 8,
    },
    closeButton: {
        backgroundColor: '#3498db',
        padding: 12,
        borderRadius: 50,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 80,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#495057',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 16,
        color: '#6c757d',
        marginTop: 8,
        textAlign: 'center',
    },
    deleteConfirmRow: {
        marginTop: 16,
        width: '100%',
        alignItems: 'center',
    },
    deleteConfirmText: {
        fontSize: 16,
        marginBottom: 8,
    },
    deleteConfirmButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '60%',
    },
    cancelBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
    },
    confirmDeleteBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    modalAction: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginVertical: 6,
    },
    modalCancel: {
        marginTop: 8,
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
});

export default Bookmarks;