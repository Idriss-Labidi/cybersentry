from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.services import ensure_user_organization

from .models import NotificationEvent
from .serializers import NotificationEventSerializer


class NotificationEventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        organization = ensure_user_organization(self.request.user)
        queryset = NotificationEvent.objects.filter(
            organization=organization,
            user=self.request.user,
        ).select_related('asset')

        unread_only = self.request.query_params.get('unread_only') == 'true'
        if unread_only:
            queryset = queryset.filter(is_read=False)

        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        queryset = self.get_queryset()
        unread = queryset.filter(is_read=False).count()

        return Response(
            {
                'total': queryset.count(),
                'unread': unread,
                'critical': queryset.filter(severity=NotificationEvent.Severities.HIGH).count(),
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        queryset = self.get_queryset().filter(is_read=False)
        updated = queryset.update(is_read=True, read_at=timezone.now())
        return Response({'updated': updated}, status=status.HTTP_200_OK)

