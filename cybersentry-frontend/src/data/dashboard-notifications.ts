import type { NotificationPreferences } from '../utils/notification-preferences';

export type DashboardNotification = {
  id: string;
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  detail: string;
  timeLabel: string;
  kind: 'highRisk' | 'failedChecks' | 'info';
};

export const dashboardNotifications: DashboardNotification[] = [
  {
    id: 'mail-policy-change',
    title: 'Suspicious mail policy change',
    severity: 'High',
    detail:
      'DMARC policy moved from quarantine to none on a monitored domain.',
    timeLabel: '5 min ago',
    kind: 'highRisk',
  },
  {
    id: 'resolver-divergence',
    title: 'Resolver divergence',
    severity: 'Medium',
    detail:
      'A record mismatch was detected across public resolver groups in two regions.',
    timeLabel: '18 min ago',
    kind: 'failedChecks',
  },
  {
    id: 'repo-hygiene-drift',
    title: 'Repository hygiene drift',
    severity: 'Low',
    detail:
      'Default branch protection is missing after a recent repository configuration update.',
    timeLabel: '42 min ago',
    kind: 'info',
  },
  {
    id: 'scanner-escalation',
    title: 'Advanced scanner escalation',
    severity: 'High',
    detail:
      'A critical finding was escalated for manual review after the last full scan.',
    timeLabel: '1 hr ago',
    kind: 'highRisk',
  },
];

export function getVisibleDashboardNotifications(
  preferences: NotificationPreferences
) {
  return dashboardNotifications.filter((notification) => {
    if (notification.kind === 'info') {
      return true;
    }

    return preferences[notification.kind];
  });
}
