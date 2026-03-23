from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import validate_email

class User(AbstractUser):
    class Roles(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        VIEWER = 'viewer', 'Viewer'
        ANALYST = 'analyst', 'Analyst'
    
    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.VIEWER)
    email = models.EmailField(unique=True, validators=[validate_email])
    organization = models.ForeignKey('Organization', on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    password_changed_at = models.DateTimeField(null=True, blank=True)
        

class Organization(models.Model):
    class LicenseTypes(models.TextChoices):
        Tier1 = 'tier1', 'Tier 1'
        Tier2 = 'tier2', 'Tier 2'
        Tier3 = 'tier3', 'Tier 3'
        
    name = models.CharField(max_length=255, unique=True)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    allowed_domains = models.TextField(help_text='Comma-separated list of allowed email domains for user registration')
    license_type = models.CharField(max_length=20, choices=LicenseTypes.choices, default=LicenseTypes.Tier1)
    license_expiry = models.DateField(null=True, blank=True)
    
    REQUIRED_FIELDS = ['name', 'contact_email', 'allowed_domains']
    
    def __str__(self):
        return self.name


class LoginHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=512, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.email} @ {self.timestamp.isoformat()}"
