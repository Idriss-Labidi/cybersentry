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
