import re
from typing import cast

from rest_framework import serializers

from .models import LoginHistory, User, UserSettings


def mask_github_token(token: str | None) -> str:
    if not token:
        return ''
    if len(token) <= 6:
        return '*' * len(token)
    return f"{token[:3]}{'*' * (len(token) - 6)}{token[-3:]}"


class ProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    organization = serializers.CharField(source='organization.name', default=None)
    role = serializers.CharField(source='get_role_display')

    class Meta:
        model = User
        fields = ['full_name', 'email', 'role', 'organization']

    def get_full_name(self, obj: User) -> str:
        full_name = obj.get_full_name().strip()
        return full_name if full_name else obj.username


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)


class LoginHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHistory
        fields = ['timestamp', 'ip_address', 'user_agent']


class UserSettingsUpdateSerializer(serializers.ModelSerializer):
    github_token = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    use_cache = serializers.BooleanField(required=False)
    cache_duration = serializers.IntegerField(required=False, min_value=1, max_value=1440)
    notifications_email_enabled = serializers.BooleanField(required=False)
    notifications_webhook_enabled = serializers.BooleanField(required=False)
    slack_webhook_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    teams_webhook_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    preferred_theme = serializers.ChoiceField(
        choices=list(UserSettings.PreferredThemes.choices),
        required=False,
    )
    notification_alert_threshold = serializers.IntegerField(required=False, min_value=0, max_value=100)

    class Meta:
        model = UserSettings
        fields = [
            'github_token',
            'use_cache',
            'cache_duration',
            'notifications_email_enabled',
            'notifications_webhook_enabled',
            'slack_webhook_url',
            'teams_webhook_url',
            'preferred_theme',
            'notification_alert_threshold',
        ]

    def update(self, instance, validated_data):
        threshold = validated_data.pop('notification_alert_threshold', None)
        instance = super().update(instance, validated_data)

        if threshold is not None and instance.user.organization_id:
            organization = instance.user.organization
            organization.notification_alert_threshold = threshold
            organization.save(update_fields=['notification_alert_threshold'])

        return instance


class OrganizationUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    organization = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, write_only=True, allow_blank=False, trim_whitespace=False)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'role_display',
            'is_active',
            'organization',
            'date_joined',
            'last_login',
            'password',
        ]
        read_only_fields = ['id', 'full_name', 'role_display', 'organization', 'date_joined', 'last_login']

    def get_full_name(self, obj: User) -> str:
        full_name = obj.get_full_name().strip()
        return full_name if full_name else obj.username

    def get_organization(self, obj: User) -> str | None:
        return obj.organization.name if obj.organization else None

    def _build_unique_username(self, email: str) -> str:
        base = re.sub(r'[^a-zA-Z0-9.@+_-]+', '', email.split('@', 1)[0] if '@' in email else email).strip('._+-')
        base = base or 'user'
        max_length = User._meta.get_field('username').max_length
        candidate = base[:max_length]
        suffix = 2

        while User.objects.filter(username=candidate).exists():
            suffix_text = f'-{suffix}'
            candidate = f'{base[: max_length - len(suffix_text)]}{suffix_text}'
            suffix += 1

        return candidate

    def validate(self, attrs):
        request = self.context.get('request')

        if self.instance is None:
            # For new users created by admins, password is optional
            # User will set their own password via activation email
            if not attrs.get('username'):
                attrs['username'] = self._build_unique_username(attrs.get('email', 'user'))

            # Set new users as inactive until they activate their account
            attrs['is_active'] = False

        elif request and request.user == self.instance:
            for field in ('role', 'is_active'):
                if field in attrs and attrs[field] != getattr(self.instance, field):
                    raise serializers.ValidationError({field: 'You cannot change your own access level or status here.'})

        if self.instance and self.instance.organization_id and self.instance.role == User.Roles.ADMIN:
            incoming_role = attrs.get('role', self.instance.role)
            if incoming_role != User.Roles.ADMIN:
                remaining_admins = (
                    User.objects.filter(organization=self.instance.organization, role=User.Roles.ADMIN)
                    .exclude(pk=self.instance.pk)
                    .exists()
                )
                if not remaining_admins:
                    raise serializers.ValidationError({'role': 'Each organization must keep at least one admin.'})

        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)

        # Only set password if provided (for admin user creation, password is optional)
        if password:
            user.set_password(password)

        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            cast(User, instance).set_password(password)

        instance.save()
        return instance


