from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from accounts.services import ensure_user_organization

from .models import IncidentTicket, IncidentComment
from .serializers import IncidentTicketSerializer

user_model = get_user_model()


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

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to the ticket"""
        ticket = self.get_object()
        content = request.data.get('content', '').strip()
        
        if not content:
            return Response(
                {'content': 'Comment cannot be empty.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        comment = IncidentComment.objects.create(
            ticket=ticket,
            author=request.user,
            content=content,
        )
        
        from .serializers import IncidentCommentSerializer
        serializer = IncidentCommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign ticket to a user"""
        ticket = self.get_object()
        assigned_to_id = request.data.get('assigned_to_id')
        
        if assigned_to_id is None:
            ticket.assigned_to = None
        else:
            try:
                assigned_user = user_model.objects.get(
                    id=assigned_to_id,
                    organization=ticket.organization,
                )
                ticket.assigned_to = assigned_user
            except user_model.DoesNotExist:
                return Response(
                    {'detail': 'User not found in this organization.'},
                    status=status.HTTP_404_NOT_FOUND,
                )
        
        ticket.save(update_fields=['assigned_to'])
        serializer = self.get_serializer(ticket)
        return Response(serializer.data, status=status.HTTP_200_OK)
