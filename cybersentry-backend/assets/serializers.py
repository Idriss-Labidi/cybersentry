from rest_framework import serializers

from .models import Asset, AssetRiskSnapshot, AssetTag


class AssetTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetTag
        fields = ['id', 'name']


class AssetRiskSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetRiskSnapshot
        fields = ['id', 'score', 'source', 'note', 'calculated_at']


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
        value = value.strip()
        if not value:
            raise serializers.ValidationError('This field may not be blank.')
        return value.lower() if self.initial_data.get('asset_type') in {'domain', 'website', 'github_repo'} else value

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

