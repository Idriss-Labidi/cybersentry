# Notifications App

This app centralizes alerting for low-score asset test operations.

## Trigger rule

A notification event is created only when a test score is `<= 30/100`.

## Channels

- In-app notifications (persisted in `NotificationEvent`)
- Email (optional, per user settings)
- Webhooks Slack/Teams (optional, per user settings)

## API

- `GET /api/notifications/`
- `GET /api/notifications/summary/`
- `POST /api/notifications/{id}/mark_read/`
- `POST /api/notifications/mark_all_read/`

## Settings fields

Stored in `accounts.UserSettings`:

- `notifications_email_enabled`
- `notifications_webhook_enabled`
- `slack_webhook_url`
- `teams_webhook_url`

