from rest_framework import serializers

from .models import LoginHistory, User


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

