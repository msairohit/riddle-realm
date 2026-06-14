import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Set how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NOTIFICATION_TIME_KEY = '@notification_time';
const HAS_PROMPTED_TIME_KEY = '@has_prompted_notification_time';

const STATEMENTS = [
  "A riddle a day keeps the boredom away!",
  "Sharpen your mind with a quick riddle today.",
  "Ready for a challenge? Your daily riddle awaits!",
  "Wake up your brain! It's riddle time.",
  "Can you solve today's brain teaser?",
  "Unleash your inner detective with a new riddle.",
  "Give your brain a workout today!",
  "Time to put your thinking cap on!",
  "Discover something new with a fun riddle.",
  "A quick mental stretch: try a riddle now.",
  "Challenge yourself: what's the answer to today's riddle?",
  "Feed your curiosity with a fresh riddle.",
  "Keep your wits sharp! Solve a riddle today.",
  "Take a quick break and challenge your mind.",
  "Dive into the Riddle Realm today!",
  "Unravel the mystery in today's riddle.",
  "Ready to get stumped? Try today's riddle!",
  "Ignite your imagination with a riddle.",
  "A few minutes of puzzling fun awaits.",
  "Let's see how clever you are today!",
  "Give your neurons a boost!",
  "Test your logic with a daily brain teaser.",
  "The answers are within reach. Can you find them?",
  "Step into the world of riddles today.",
  "Your daily dose of brain power is ready.",
  "Flex those mental muscles!",
  "Who doesn't love a good mystery?",
  "Solve today's riddle and earn some bragging rights.",
  "Keep the gears turning!",
  "Don't let your brain rust, try a riddle!"
];

export const useDailyNotifications = () => {
  const [hasPrompted, setHasPrompted] = useState(false);
  const [notificationTime, setNotificationTime] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    checkInitialState();
  }, []);

  const checkInitialState = async () => {
    try {
      const promptedStr = await AsyncStorage.getItem(HAS_PROMPTED_TIME_KEY);
      const timeStr = await AsyncStorage.getItem(NOTIFICATION_TIME_KEY);
      
      setHasPrompted(promptedStr === 'true');
      
      if (timeStr) {
        setNotificationTime(JSON.parse(timeStr));
      }
    } catch (e) {
      console.error('Failed to load notification settings', e);
    } finally {
      setLoadingSettings(false);
    }
  };

  const requestPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  };

  const scheduleNotifications = async (time) => {
    // Cancel existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    if (!time) return;

    // Schedule notifications for the next 30 days
    for (let i = 1; i <= 30; i++) {
      const randomStatement = STATEMENTS[Math.floor(Math.random() * STATEMENTS.length)];
      
      // Calculate target date
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      targetDate.setHours(time.hour, time.minute, 0, 0);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Daily Riddle Time! 🧩",
          body: randomStatement,
        },
        trigger: {
          type: 'date',
          date: targetDate,
        },
      });
    }
  };

  const saveNotificationTime = async (hour, minute) => {
    const timeObj = { hour, minute };
    try {
      await AsyncStorage.setItem(NOTIFICATION_TIME_KEY, JSON.stringify(timeObj));
      await AsyncStorage.setItem(HAS_PROMPTED_TIME_KEY, 'true');
      setNotificationTime(timeObj);
      setHasPrompted(true);

      const hasPermission = await requestPermissions();
      if (hasPermission) {
        await scheduleNotifications(timeObj);
      }
    } catch (e) {
      console.error('Failed to save notification time', e);
    }
  };

  const skipNotificationTime = async () => {
    try {
      await AsyncStorage.setItem(HAS_PROMPTED_TIME_KEY, 'true');
      setHasPrompted(true);
    } catch (e) {
      console.error('Failed to skip notification time', e);
    }
  };

  // Re-schedule when app is opened if we have a time set, to keep the 30-day buffer full
  useEffect(() => {
    if (notificationTime && hasPrompted) {
      // Re-scheduling happens in the background
      requestPermissions().then((granted) => {
        if (granted) {
          scheduleNotifications(notificationTime);
        }
      });
    }
  }, [notificationTime, hasPrompted]);

  return {
    hasPrompted,
    loadingSettings,
    notificationTime,
    saveNotificationTime,
    skipNotificationTime,
  };
};
