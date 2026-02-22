from rest_framework import serializers
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
