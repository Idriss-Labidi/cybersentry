export type NotificationPreferences = {
  highRisk: boolean;
  failedChecks: boolean;
};

const STORAGE_KEY = 'cybersentry-notification-preferences';
export const NOTIFICATION_PREFERENCES_EVENT =
  'cybersentry:notification-preferences-updated';

const defaultNotificationPreferences: NotificationPreferences = {
  highRisk: true,
  failedChecks: true,
};

export function readNotificationPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') {
    return defaultNotificationPreferences;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultNotificationPreferences;
    }

    const parsed = JSON.parse(stored) as Partial<NotificationPreferences>;
    return {
      highRisk: parsed.highRisk ?? defaultNotificationPreferences.highRisk,
      failedChecks: parsed.failedChecks ?? defaultNotificationPreferences.failedChecks,
    };
  } catch {
    return defaultNotificationPreferences;
  }
}

export function persistNotificationPreferences(
  preferences: NotificationPreferences
) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_PREFERENCES_EVENT, {
      detail: preferences,
    })
  );
}
