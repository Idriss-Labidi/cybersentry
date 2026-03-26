from django.contrib import admin

from .models import Asset, AssetRiskSnapshot, AssetTag


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

