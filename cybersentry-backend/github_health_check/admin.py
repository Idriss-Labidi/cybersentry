from django.contrib import admin
from .models import GithubRepository, RepositoryCheckResult


@admin.register(GithubRepository)
class GithubRepositoryAdmin(admin.ModelAdmin):
    list_display = ['owner', 'name', 'organization', 'last_check_at', 'created_at']
    list_filter = ['organization', 'created_at', 'last_check_at']
    search_fields = ['owner', 'name', 'url']
    readonly_fields = ['created_at', 'updated_at', 'last_check_at']

    fieldsets = (
        ('Repository Info', {
            'fields': ('owner', 'name', 'url', 'organization')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'last_check_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(RepositoryCheckResult)
class RepositoryCheckResultAdmin(admin.ModelAdmin):
    list_display = ['repository', 'risk_score', 'checked_by', 'check_timestamp']
    list_filter = ['risk_score', 'check_timestamp', 'repository__organization']
    search_fields = ['repository__owner', 'repository__name']
    readonly_fields = ['check_timestamp']

    fieldsets = (
        ('Check Info', {
            'fields': ('repository', 'checked_by', 'check_timestamp', 'risk_score')
        }),
        ('Level 1 Data', {
            'fields': ('level1_data',),
            'classes': ('collapse',)
        }),
        ('Level 2 Data', {
            'fields': ('level2_data',),
            'classes': ('collapse',)
        }),
        ('Level 3 Data', {
            'fields': ('level3_data',),
            'classes': ('collapse',)
        }),
        ('Results', {
            'fields': ('summary', 'warnings', 'recommendations')
        }),
    )

    def has_add_permission(self, request):
        # Check results should only be created via API
        return False

    def has_delete_permission(self, request, obj=None):
        # Only admins can delete check results
        return request.user.is_superuser
