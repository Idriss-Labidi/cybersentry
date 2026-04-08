from django.contrib import admin

from .models import (
    Asset,
    AssetAutomatedScanRun,
    AssetRiskSnapshot,
    AssetTag,
    AssetWebsiteChangeEvent,
    AssetWebsiteSnapshot,
)


@admin.register(AssetTag)
class AssetTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'created_at')
    search_fields = ('name', 'organization__name')


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('name', 'asset_type', 'organization', 'category', 'status', 'risk_score', 'last_scanned_at')
    list_filter = ('asset_type', 'category', 'status', 'organization')
    search_fields = ('name', 'value', 'organization__name')
    filter_horizontal = ('tags',)


@admin.register(AssetRiskSnapshot)
class AssetRiskSnapshotAdmin(admin.ModelAdmin):
    list_display = ('asset', 'score', 'source', 'calculated_at')
    list_filter = ('source', 'calculated_at')
    search_fields = ('asset__name', 'asset__value')


@admin.register(AssetWebsiteSnapshot)
class AssetWebsiteSnapshotAdmin(admin.ModelAdmin):
    list_display = ('asset', 'status', 'response_code', 'content_hash', 'scanned_at')
    list_filter = ('status', 'scanned_at')
    search_fields = ('asset__name', 'asset__value', 'page_title')


@admin.register(AssetWebsiteChangeEvent)
class AssetWebsiteChangeEventAdmin(admin.ModelAdmin):
    list_display = ('asset', 'change_type', 'severity', 'created_at')
    list_filter = ('change_type', 'severity', 'created_at')
    search_fields = ('asset__name', 'asset__value', 'summary')


@admin.register(AssetAutomatedScanRun)
class AssetAutomatedScanRunAdmin(admin.ModelAdmin):
    list_display = ('asset', 'organization', 'scan_type', 'status', 'score', 'scanned_at')
    list_filter = ('scan_type', 'status', 'scanned_at', 'organization')
    search_fields = ('asset__name', 'asset__value', 'detail')


