import { notifications, type NotificationData } from '@mantine/notifications';
import {
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
} from '@tabler/icons-react';
import { createElement } from 'react';

export function notifySuccess(title: string, message?: string, options: Partial<NotificationData> = {}) {
  notifications.show({
    withBorder: true,
    radius: 'xl',
    autoClose: 3600,
    color: 'green',
    icon: createElement(IconCheck, { size: 16 }),
    title,
    message: message ?? '',
    ...options,
  });
}

export function notifyError(title: string, message?: string, options: Partial<NotificationData> = {}) {
  notifications.show({
    withBorder: true,
    radius: 'xl',
    autoClose: 5000,
    color: 'red',
    icon: createElement(IconAlertTriangle, { size: 16 }),
    title,
    message: message ?? '',
    ...options,
  });
}

export function notifyInfo(title: string, message?: string, options: Partial<NotificationData> = {}) {
  notifications.show({
    withBorder: true,
    radius: 'xl',
    autoClose: 3600,
    color: 'blue',
    icon: createElement(IconInfoCircle, { size: 16 }),
    title,
    message: message ?? '',
    ...options,
  });
}
