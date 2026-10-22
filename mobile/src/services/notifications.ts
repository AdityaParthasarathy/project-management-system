import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { isDueTomorrow } from '@/shared/validation';
import type { Task } from '@/shared/types';

const todayKey = () => {
  const d = new Date();
  return `reminder:${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/**
 * "Tasks due tomorrow" reminder. Looks at the loaded tasks and, at most once per day, posts a
 * local notification listing the tasks that are due tomorrow and not yet completed.
 * (Local notifications: they are scheduled on the phone itself, no push server required.)
 *
 * expo-notifications is loaded lazily inside try/catch because Expo Go on Android does not
 * ship it; in the installed APK it is available and the reminder is shown.
 */
export async function notifyTasksDueTomorrow(tasks: Task[]): Promise<void> {
  try {
    const due = tasks.filter((task) => isDueTomorrow(task));
    if (due.length === 0) return;
    if (await AsyncStorage.getItem(todayKey())) return; // already reminded today

    const Notifications = await import('expo-notifications');

    // Show the notification even while the app is open.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Task reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return;

    const names = due.slice(0, 3).map((t) => t.name).join(', ');
    const more = due.length > 3 ? ` and ${due.length - 3} more` : '';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: due.length === 1 ? '1 task is due tomorrow' : `${due.length} tasks are due tomorrow`,
        body: `${names}${more}`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 },
    });

    await AsyncStorage.setItem(todayKey(), '1');
  } catch {
    // Notifications are optional; never break the app because of them.
  }
}
