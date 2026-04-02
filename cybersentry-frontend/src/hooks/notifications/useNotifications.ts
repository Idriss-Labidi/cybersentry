import { useCallback, useEffect, useState } from 'react';

import {
  getNotifications,
  getNotificationSummary,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationEvent,
  type NotificationSummary,
} from '../../services/notifications';

const emptySummary: NotificationSummary = {
  total: 0,
  unread: 0,
  critical: 0,
};

function normalizeNotifications(payload: NotificationEvent[] | { results?: NotificationEvent[] } | undefined) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.results)) {
    return payload.results;
  }

  return [] as NotificationEvent[];
}

export function useNotifications(limit = 20) {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [summary, setSummary] = useState<NotificationSummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listResponse, summaryResponse] = await Promise.all([
        getNotifications(),
        getNotificationSummary(),
      ]);
      const normalizedNotifications = normalizeNotifications(listResponse.data);
      setNotifications(normalizedNotifications.slice(0, limit));
      setSummary(summaryResponse.data);
    } catch {
      setNotifications([]);
      setSummary(emptySummary);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const markRead = useCallback(async (id: number) => {
    await markNotificationRead(id);
    await loadNotifications();
  }, [loadNotifications]);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    await loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 30000);

    const handleFocus = () => {
      void loadNotifications();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadNotifications]);

  return {
    notifications,
    summary,
    isLoading,
    loadNotifications,
    markRead,
    markAllRead,
  };
}


