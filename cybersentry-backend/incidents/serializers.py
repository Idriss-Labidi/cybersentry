from django.utils import timezone
from rest_framework import serializers

from .models import IncidentTicket


class IncidentTicketSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    priority_label = serializers.CharField(source='get_priority_display', read_only=True)
    severity_label = serializers.CharField(source='get_severity_display', read_only=True)
    impact_label = serializers.CharField(source='get_impact_display', read_only=True)
    urgency_label = serializers.CharField(source='get_urgency_display', read_only=True)
    sla_policy_label = serializers.CharField(source='get_sla_policy_display', read_only=True)
    sla_state = serializers.SerializerMethodField()

    class Meta:
        model = IncidentTicket
        fields = [
            'id',
            'source',
            'source_event_id',
            'deduplication_key',
            'title',
            'short_code',
            'description',
            'incident_type',
            'category',
            'subcategory',
            'affected_asset',
            'status',
            'status_label',
            'priority',
            'priority_label',
            'severity',
            'severity_label',
            'impact',
            'impact_label',
            'urgency',
            'urgency_label',
            'sla_policy',
            'sla_policy_label',
            'sla_state',
            'first_response_target_at',
            'first_response_at',
            'resolution_target_at',
            'due_at',
            'reported_at',
            'detected_at',
            'acknowledged_at',
            'resolved_at',
            'closed_at',
            'last_status_change_at',
            'environment',
            'reporter_email',
            'customer_impact',
            'mitigation',
            'root_cause',
            'resolution_summary',
            'tags',
            'metadata',
            'assigned_to',
            'created_by',
            'updated_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'created_by',
            'updated_by',
            'created_at',
            'updated_at',
            'last_status_change_at',
        ]

    def get_sla_state(self, obj: IncidentTicket) -> str:
        return obj.compute_sla_state()

    def validate_title(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('This field may not be blank.')
        return cleaned

    def validate_tags(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Tags must be a list of strings.')

        cleaned = []
        seen = set()
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError('Tags must be a list of strings.')
            tag = item.strip()
            if not tag:
                continue
            normalized = tag.lower()
            if normalized in seen:
                continue
            seen.add(normalized)
            cleaned.append(tag)

        return cleaned

    def validate(self, attrs):
        instance = self.instance
        now = timezone.now()

        status_value = attrs.get('status', getattr(instance, 'status', IncidentTicket.Statuses.NEW))
        due_at = attrs.get('due_at', getattr(instance, 'due_at', None))
        resolved_at = attrs.get('resolved_at', getattr(instance, 'resolved_at', None))
        closed_at = attrs.get('closed_at', getattr(instance, 'closed_at', None))

        if status_value == IncidentTicket.Statuses.RESOLVED and not resolved_at:
            attrs['resolved_at'] = now

        if status_value == IncidentTicket.Statuses.CLOSED:
            attrs['closed_at'] = closed_at or now
            attrs['resolved_at'] = resolved_at or attrs.get('resolved_at') or now

        if status_value in {IncidentTicket.Statuses.NEW, IncidentTicket.Statuses.TRIAGED, IncidentTicket.Statuses.IN_PROGRESS, IncidentTicket.Statuses.ON_HOLD}:
            attrs['closed_at'] = None
            if status_value != IncidentTicket.Statuses.RESOLVED:
                attrs['resolved_at'] = None

        if due_at and attrs.get('reported_at', getattr(instance, 'reported_at', now)) > due_at:
            raise serializers.ValidationError({'due_at': 'Due date must be after reported date.'})

        assigned_to = attrs.get('assigned_to', getattr(instance, 'assigned_to', None))
        organization = attrs.get('organization', getattr(instance, 'organization', None))
        if assigned_to and organization and assigned_to.organization_id != organization.id:
            raise serializers.ValidationError({'assigned_to': 'Assigned user must belong to the same organization.'})

        if instance:
            previous_status = instance.status
            next_status = status_value
            allowed_transitions = {
                IncidentTicket.Statuses.NEW: {
                    IncidentTicket.Statuses.TRIAGED,
                    IncidentTicket.Statuses.IN_PROGRESS,
                    IncidentTicket.Statuses.ON_HOLD,
                    IncidentTicket.Statuses.RESOLVED,
                    IncidentTicket.Statuses.CLOSED,
                },
                IncidentTicket.Statuses.TRIAGED: {
                    IncidentTicket.Statuses.IN_PROGRESS,
                    IncidentTicket.Statuses.ON_HOLD,
                    IncidentTicket.Statuses.RESOLVED,
                    IncidentTicket.Statuses.CLOSED,
                },
                IncidentTicket.Statuses.IN_PROGRESS: {
                    IncidentTicket.Statuses.ON_HOLD,
                    IncidentTicket.Statuses.RESOLVED,
                    IncidentTicket.Statuses.CLOSED,
                },
                IncidentTicket.Statuses.ON_HOLD: {
                    IncidentTicket.Statuses.IN_PROGRESS,
                    IncidentTicket.Statuses.RESOLVED,
                    IncidentTicket.Statuses.CLOSED,
                },
                IncidentTicket.Statuses.RESOLVED: {
                    IncidentTicket.Statuses.IN_PROGRESS,
                    IncidentTicket.Statuses.CLOSED,
                },
                IncidentTicket.Statuses.CLOSED: {
                    IncidentTicket.Statuses.IN_PROGRESS,
                },
            }
            if previous_status != next_status and next_status not in allowed_transitions[previous_status]:
                raise serializers.ValidationError(
                    {'status': f'Invalid transition from {previous_status} to {next_status}.'}
                )

        return attrs

    def create(self, validated_data):
        validated_data.setdefault('source', IncidentTicket.Sources.MANUAL)
        validated_data.setdefault('last_status_change_at', timezone.now())
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'status' in validated_data and validated_data['status'] != instance.status:
            validated_data['last_status_change_at'] = timezone.now()
        return super().update(instance, validated_data)

