from rest_framework.permissions import BasePermission

from .models import User


class IsOrganizationAdmin(BasePermission):
    message = 'Only organization administrators can manage users.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                user.is_superuser
                or (user.organization_id and user.role == User.Roles.ADMIN)
            )
        )

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.is_superuser:
            return True

        return bool(
            user.is_authenticated
            and user.organization_id
            and obj.organization_id == user.organization_id
            and user.role == User.Roles.ADMIN
        )

