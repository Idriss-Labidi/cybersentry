from django.contrib import admin

from .models import NotificationEvent


@admin.register(NotificationEvent)
class NotificationEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'asset', 'test_type', 'score', 'severity', 'is_read', 'created_at')
    list_filter = ('test_type', 'severity', 'is_read', 'email_status', 'webhook_status')
    search_fields = ('title', 'detail', 'user__email', 'asset__name', 'asset__value')

