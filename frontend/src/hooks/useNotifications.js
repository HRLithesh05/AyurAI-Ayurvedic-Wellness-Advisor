import { useState, useEffect, useCallback } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, [isSupported]);

  const showNotification = useCallback((title, options = {}) => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Notifications not supported or not permitted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/faviconleaf.png',
        badge: '/faviconleaf.png',
        vibrate: [200, 100, 200],
        ...options
      });

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  const scheduleNotification = useCallback((reminders) => {
    if (!isSupported || permission !== 'granted') {
      return null;
    }

    // Check every minute for reminders
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDay = now.getDay();

      reminders.forEach(reminder => {
        if (
          reminder.isActive &&
          reminder.time === currentTime &&
          reminder.daysOfWeek.includes(currentDay)
        ) {
          showNotification(reminder.title, {
            body: reminder.message,
            tag: reminder._id,
            requireInteraction: false
          });
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isSupported, permission, showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    scheduleNotification
  };
};

export default useNotifications;
