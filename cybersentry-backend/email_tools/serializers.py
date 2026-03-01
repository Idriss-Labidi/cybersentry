from rest_framework import serializers
import re


_DOMAIN_RE = re.compile(r"^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$")


class EmailSecurityAnalysisSerializer(serializers.Serializer):
    """Validate input for the combined SPF / DKIM / DMARC analysis."""

    domain_name = serializers.CharField(max_length=255)
    dkim_selectors = serializers.ListField(
        child=serializers.CharField(max_length=63),
        required=False,
        allow_empty=True,
        help_text="Optional list of DKIM selectors to check. If omitted, common selectors are tried.",
    )

    def validate_domain_name(self, value: str) -> str:
        if not _DOMAIN_RE.match(value):
            raise serializers.ValidationError("Invalid domain name format.")
        return value.lower()


class SPFAnalysisSerializer(serializers.Serializer):
    domain_name = serializers.CharField(max_length=255)

    def validate_domain_name(self, value: str) -> str:
        if not _DOMAIN_RE.match(value):
            raise serializers.ValidationError("Invalid domain name format.")
        return value.lower()


class DKIMAnalysisSerializer(serializers.Serializer):
    domain_name = serializers.CharField(max_length=255)
    selectors = serializers.ListField(
        child=serializers.CharField(max_length=63),
        required=False,
        allow_empty=True,
    )

    def validate_domain_name(self, value: str) -> str:
        if not _DOMAIN_RE.match(value):
            raise serializers.ValidationError("Invalid domain name format.")
        return value.lower()


class DMARCAnalysisSerializer(serializers.Serializer):
    domain_name = serializers.CharField(max_length=255)

    def validate_domain_name(self, value: str) -> str:
        if not _DOMAIN_RE.match(value):
            raise serializers.ValidationError("Invalid domain name format.")
        return value.lower()
