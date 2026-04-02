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
        choices=UserSettings.PreferredThemes.choices,
        required=False,
    )

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
        ]


