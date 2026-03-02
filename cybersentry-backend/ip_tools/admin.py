from django.contrib import admin
from .models import IPReputationScan, DomainTyposquattingScan


@admin.register(IPReputationScan)
class IPReputationScanAdmin(admin.ModelAdmin):
    list_display = ['ip_address', 'user', 'reputation_score', 'risk_level', 'scanned_at']
    list_filter = ['risk_level', 'is_proxy', 'is_hosting', 'is_mobile', 'scanned_at']
    search_fields = ['ip_address', 'user__username']
    readonly_fields = ['scanned_at']
    ordering = ['-scanned_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'ip_address', 'scanned_at')
        }),
        ('Reputation', {
            'fields': ('reputation_score', 'risk_level', 'risk_factors')
        }),
        ('Flags', {
            'fields': ('is_proxy', 'is_hosting', 'is_mobile')
        }),
        ('Location & Network', {
            'fields': ('geolocation', 'network'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DomainTyposquattingScan)
class DomainTyposquattingScanAdmin(admin.ModelAdmin):
    list_display = ['original_domain', 'user', 'threat_count', 'total_variants', 'scanned_at']
    list_filter = ['scanned_at']
    search_fields = ['original_domain', 'user__username']
    readonly_fields = ['scanned_at']
    ordering = ['-scanned_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'original_domain', 'scanned_at')
        }),
        ('Results', {
            'fields': ('threat_count', 'total_variants', 'similar_domains')
        }),
    )
