import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

class NotificationService {
  isNative = Capacitor.isNativePlatform();

  async requestPermission() {
    if (this.isNative) {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    }
    if ('Notification' in window) {
      const status = await Notification.requestPermission();
      return status === 'granted';
    }
    return false;
  }

  async scheduleDailyVerse(hour: number = 8, minute: number = 0) {
    if (!this.isNative) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          title: "The Empire's Daily Word",
          body: "Your daily spiritual nourishment is ready. Access the truth now.",
          id: 1,
          schedule: {
             on: {
                hour,
                minute
             },
             repeats: true
          },
          sound: undefined,
          attachments: [],
          actionTypeId: "",
          extra: null
        }
      ]
    });
  }

  async cancelAll() {
    if (this.isNative) {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }
    }
  }
}

export const notificationService = new NotificationService();
