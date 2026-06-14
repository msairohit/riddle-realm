import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../app/ThemeContext';

export default function NotificationTimePrompt({ visible, onSave, onSkip }) {
  const { theme } = useTheme();
  const [date, setDate] = useState(new Date(new Date().setHours(10, 0, 0, 0))); // Default to 10:00 AM
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios'); // Show by default on iOS, requires tap on Android

  const onChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSave = () => {
    onSave(date.getHours(), date.getMinutes());
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            Daily Riddle Reminder 🧠
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            What time would you like to be reminded to do your daily riddle?
          </Text>

          {Platform.OS === 'android' && (
            <TouchableOpacity 
              style={[styles.timeButton, { backgroundColor: theme.accent }]}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.timeButtonText}>
                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          )}

          {showPicker && (
            <View style={Platform.OS === 'ios' ? styles.pickerContainerIOS : null}>
              <DateTimePicker
                value={date}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChange}
                textColor={theme.text}
                style={Platform.OS === 'ios' ? styles.pickerIOS : null}
              />
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
              <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>Maybe Later</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.saveButton, { backgroundColor: theme.accent }]}>
              <Text style={styles.saveButtonText}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  timeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
  },
  timeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerContainerIOS: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    marginVertical: 10,
    overflow: 'hidden',
  },
  pickerIOS: {
    width: '100%',
    height: '100%',
  },
});
