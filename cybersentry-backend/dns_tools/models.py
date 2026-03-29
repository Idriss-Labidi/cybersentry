from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django_countries.fields import CountryField

class DnsServer(models.Model):
    class Types(models.TextChoices):
        IPV4 = 'IPV4', 'ipv4'
        IPV6 = 'IPV6', 'ipv6'
        
    class Region(models.TextChoices):
        EU = 'eu', 'EU'
        MEA = 'mea', 'MEA'
        NA = 'na', 'NA'
        APAC = 'apac', 'APAC'
        LATAM = 'latam', 'LATAM'
        
    
    name = models.CharField(unique=True, max_length=255)
    ip_address1= models.CharField(max_length=61)
    ip_address2= models.CharField(max_length=61)
    location = models.CharField(max_length=255)
    type = models.CharField(max_length=10,choices=Types.choices, default=Types.IPV4)
    country = CountryField()
    region = models.CharField(max_length= 5, choices=Region.choices, default=Region.NA)
    
    def __str__(self):
        return f"name= { self.name }, location= { self.location }, region= { self.region }"


class DNSHealthScan(models.Model):
    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='dns_health_scans',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dns_health_scans',
    )
    domain_name = models.CharField(max_length=255)
    score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    grade = models.CharField(max_length=8)
    checks = models.JSONField(default=dict)
    recommendations = models.JSONField(default=list)
    scanned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scanned_at']
        indexes = [
            models.Index(fields=['user', '-scanned_at']),
            models.Index(fields=['organization', '-scanned_at']),
            models.Index(fields=['organization', 'domain_name']),
        ]

    def __str__(self):
        return f'{self.domain_name} - {self.score}/100'

