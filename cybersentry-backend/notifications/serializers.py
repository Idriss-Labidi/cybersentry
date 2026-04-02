from rest_framework import serializers

from .models import NotificationEvent


class NotificationEventSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    asset_value = serializers.CharField(source='asset.value', read_only=True)
    test_type_label = serializers.CharField(source='get_test_type_display', read_only=True)

    class Meta:
        model = NotificationEvent
        fields = [
            'id',
            'test_type',
            'test_type_label',
            'severity',
            'score',
            'threshold',
            'title',
            'detail',
            'metadata',
            'asset',
            'asset_name',
            'asset_value',
            'is_read',
            'read_at',
            'email_status',
            'webhook_status',
            'created_at',
        ]
        read_only_fields = fields

