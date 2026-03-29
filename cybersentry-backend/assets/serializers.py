from rest_framework import serializers

from .models import Asset, AssetAlert, AssetDnsChangeEvent, AssetDnsSnapshot, AssetRiskSnapshot, AssetTag


def normalize_asset_value(asset_type: str, value: str) -> str:
    cleaned_value = value.strip()

    if asset_type == Asset.AssetTypes.GITHUB_REPOSITORY:
        return cleaned_value.lower().rstrip('/')

    if asset_type in {Asset.AssetTypes.DOMAIN, Asset.AssetTypes.WEBSITE}:
        return cleaned_value.lower()

    return cleaned_value


class AssetTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetTag
        fields = ['id', 'name']


class AssetRiskSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetRiskSnapshot
        fields = ['id', 'score', 'source', 'note', 'calculated_at']


class AssetDnsSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetDnsSnapshot
        fields = ['id', 'status', 'record_types', 'records', 'error_message', 'scanned_at']


class AssetDnsChangeEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetDnsChangeEvent
        fields = [
            'id',
            'record_type',
            'change_type',
            'severity',
            'summary',
            'previous_value',
            'current_value',
            'created_at',
        ]


class AssetAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetAlert
        fields = ['id', 'alert_type', 'severity', 'title', 'detail', 'metadata', 'is_read', 'created_at']


class AssetSerializer(serializers.ModelSerializer):
    tags = AssetTagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False,
    )
    asset_type_label = serializers.CharField(source='get_asset_type_display', read_only=True)
    category_label = serializers.CharField(source='get_category_display', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Asset
        fields = [
            'id',
            'name',
            'asset_type',
            'asset_type_label',
            'value',
            'category',
            'category_label',
            'status',
            'status_label',
            'description',
            'risk_score',
            'last_scanned_at',
            'tags',
            'tag_names',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('This field may not be blank.')
        return value

    def validate_value(self, value):
        asset_type = self.initial_data.get('asset_type') or getattr(self.instance, 'asset_type', None)
        value = normalize_asset_value(asset_type, value) if asset_type else value.strip()
        if not value:
            raise serializers.ValidationError('This field may not be blank.')
        return value

    def validate_tag_names(self, value):
        cleaned_names = []
        seen = set()

        for raw_name in value:
            name = raw_name.strip()
            if not name:
                continue

            normalized = name.lower()
            if normalized in seen:
                continue

            seen.add(normalized)
            cleaned_names.append(name)

        return cleaned_names

    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        asset = super().create(validated_data)
        self._sync_tags(asset, tag_names)
        return asset

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tag_names', None)
        asset = super().update(instance, validated_data)
        if tag_names is not None:
            self._sync_tags(asset, tag_names)
        return asset

    def _sync_tags(self, asset, tag_names):
        tags = [
            AssetTag.objects.get_or_create(organization=asset.organization, name=name)[0]
            for name in tag_names
        ]
        asset.tags.set(tags)


class AssetLookupSerializer(serializers.Serializer):
    asset_type = serializers.ChoiceField(choices=Asset.AssetTypes.choices)
    value = serializers.CharField(max_length=255)
    risk_score = serializers.IntegerField(min_value=0, max_value=100, required=False)

    def validate(self, attrs):
        attrs['value'] = normalize_asset_value(attrs['asset_type'], attrs['value'])
        return attrs
