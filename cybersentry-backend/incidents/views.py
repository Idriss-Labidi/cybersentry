from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.services import ensure_user_organization

from .models import IncidentTicket
from .serializers import IncidentTicketSerializer


class IncidentTicketViewSet(viewsets.ModelViewSet):
    serializer_class = IncidentTicketSerializer
    permission_classes = [IsAuthenticated]

    def _get_user_organization(self):
        return ensure_user_organization(self.request.user)

    def get_queryset(self):
        organization = self._get_user_organization()
        queryset = IncidentTicket.objects.filter(organization=organization)

        status_value = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')
        severity = self.request.query_params.get('severity')
        source = self.request.query_params.get('source')
        sla_state = self.request.query_params.get('sla_state')
        search = self.request.query_params.get('search')

        if status_value:
            queryset = queryset.filter(status=status_value)
        if priority:
            queryset = queryset.filter(priority=priority)
        if severity:
            queryset = queryset.filter(severity=severity)
        if source:
            queryset = queryset.filter(source=source)

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(short_code__icontains=search)
                | Q(description__icontains=search)
                | Q(category__icontains=search)
                | Q(subcategory__icontains=search)
                | Q(affected_asset__icontains=search)
            )

        now = timezone.now()
        warning_threshold = now + timezone.timedelta(hours=4)
        terminal_statuses = [IncidentTicket.Statuses.RESOLVED, IncidentTicket.Statuses.CLOSED]

        if sla_state == 'breached':
            queryset = queryset.exclude(status__in=terminal_statuses).filter(due_at__lt=now)
        elif sla_state == 'at_risk':
            queryset = queryset.exclude(status__in=terminal_statuses).filter(due_at__gte=now, due_at__lte=warning_threshold)
        elif sla_state == 'on_track':
            queryset = queryset.exclude(status__in=terminal_statuses).filter(
                Q(due_at__isnull=True) | Q(due_at__gt=warning_threshold)
            )
        elif sla_state == 'not_applicable':
            queryset = queryset.filter(Q(status__in=terminal_statuses) | Q(due_at__isnull=True))

        return queryset

    def perform_create(self, serializer):
        organization = self._get_user_organization()
        serializer.save(
            organization=organization,
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        ticket = self.get_object()
        serializer = self.get_serializer(
            ticket,
            data={'status': IncidentTicket.Statuses.CLOSED},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        ticket = self.get_object()
        serializer = self.get_serializer(
            ticket,
            data={'status': IncidentTicket.Statuses.IN_PROGRESS},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

