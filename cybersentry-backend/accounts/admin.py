from django.contrib import admin
from .models import Organization, User
from .forms import OrganizationForm
from .services import create_organization_admins_and_notify



@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    form = OrganizationForm
    list_display = ('name', 'contact_email', 'license_type', 'license_expiry')
    search_fields = ('name', 'contact_email')
    
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        admin_emails_field = form.cleaned_data.get('admin_emails')
        
        if admin_emails_field:
            admin_emails = [email.strip() for email in admin_emails_field.split(',')]
            
            create_organization_admins_and_notify(obj, admin_emails, request)
            
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'organization')
    search_fields = ('username', 'email')
    list_filter = ('role', 'organization')
            

            
        