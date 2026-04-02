from django.contrib import admin

from .models import IncidentTicket


@admin.register(IncidentTicket)
class IncidentTicketAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'organization',
        'status',
        'priority',
        'severity',
        'source',
        'assigned_to',
        'due_at',
        'created_at',
    )
    list_filter = ('organization', 'status', 'priority', 'severity', 'source', 'sla_policy')
    search_fields = ('title', 'short_code', 'description', 'affected_asset', 'deduplication_key')

