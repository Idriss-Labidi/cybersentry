from rest_framework import serializers
import re

class DNSLookupSerializer(serializers.Serializer):
    domain_name = serializers.CharField(max_length=255)
    record_types = serializers.ListField(
        child=serializers.ChoiceField(
            choices=['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA']
        ),
        allow_empty=False
    )

    def validate_domain_name(self, value):
        # Basic domain validation
        domain_regex = r"^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$"
        if not re.match(domain_regex, value):
            raise serializers.ValidationError("Invalid domain name format.")
        return value.lower()


class DNSPropagationSerializer(DNSLookupSerializer):
    regions = serializers.ListField(
        child=serializers.CharField(max_length=32),
        required=False,
        allow_empty=True
    )
    timeout = serializers.FloatField(required=False, min_value=0.5, max_value=15)
    lifetime = serializers.FloatField(required=False, min_value=0.5, max_value=30)
    retries = serializers.IntegerField(required=False, min_value=0, max_value=3)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        timeout = attrs.get('timeout')
        lifetime = attrs.get('lifetime')
        if timeout and lifetime and timeout > lifetime:
            raise serializers.ValidationError("timeout cannot exceed lifetime")
        return attrs
