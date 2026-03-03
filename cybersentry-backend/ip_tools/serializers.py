from rest_framework import serializers
from .models import IPReputationScan
import re


def _is_valid_ip(value: str) -> bool:
    """Check if value is a valid IPv4 or IPv6 address."""
    import ipaddress
    try:
        ipaddress.ip_address(value)
        return True
    except ValueError:
        return False


def _is_valid_domain(value: str) -> bool:
    domain_regex = r"^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$"
    return bool(re.match(domain_regex, value))


class WhoisLookupSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=255)

    def validate_query(self, value):
        value = value.strip().lower()
        if not _is_valid_domain(value) and not _is_valid_ip(value):
            raise serializers.ValidationError(
                "Invalid input. Please provide a valid domain name or IP address."
            )
        return value


class IpReputationSerializer(serializers.Serializer):
    ip_address = serializers.CharField(max_length=45)

    def validate_ip_address(self, value):
        value = value.strip()
        if not _is_valid_ip(value):
            raise serializers.ValidationError("Invalid IP address format.")
        return value


class ReverseIpSerializer(serializers.Serializer):
    ip_address = serializers.CharField(max_length=45)

    def validate_ip_address(self, value):
        value = value.strip()
        if not _is_valid_ip(value):
            raise serializers.ValidationError("Invalid IP address format.")
        return value


class TyposquattingDetectionSerializer(serializers.Serializer):
    domain = serializers.CharField(max_length=255)

    def validate_domain(self, value):
        value = value.strip().lower()
        # Retirer les protocoles si présents
        if value.startswith('http://') or value.startswith('https://'):
            value = value.split('://', 1)[1]
        # Retirer le chemin si présent
        if '/' in value:
            value = value.split('/')[0]

        if not _is_valid_domain(value):
            raise serializers.ValidationError("Invalid domain name format.")
        return value


class IPReputationScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = IPReputationScan
        fields = [
            'id', 'ip_address', 'reputation_score', 'risk_level',
            'is_proxy', 'is_hosting', 'is_mobile', 'risk_factors',
            'geolocation', 'network', 'scanned_at'
        ]
        read_only_fields = fields


