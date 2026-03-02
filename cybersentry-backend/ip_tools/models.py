from django.db import models
from django.conf import settings


class IPReputationScan(models.Model):
    """Historique des vérifications de réputation IP"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ip_reputation_scans')
    ip_address = models.GenericIPAddressField()
    reputation_score = models.IntegerField()
    risk_level = models.CharField(max_length=50)
    is_proxy = models.BooleanField(default=False)
    is_hosting = models.BooleanField(default=False)
    is_mobile = models.BooleanField(default=False)
    risk_factors = models.JSONField(default=list)
    geolocation = models.JSONField(default=dict)
    network = models.JSONField(default=dict)
    scanned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scanned_at']
        indexes = [
            models.Index(fields=['user', '-scanned_at']),
            models.Index(fields=['ip_address']),
        ]

    def __str__(self):
        return f"{self.ip_address} - {self.risk_level} ({self.scanned_at})"


class DomainTyposquattingScan(models.Model):
    """Historique des détections de typosquatting"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='typosquatting_scans')
    original_domain = models.CharField(max_length=255)
    similar_domains = models.JSONField(default=list)  # Liste des domaines détectés
    threat_count = models.IntegerField(default=0)  # Nombre de domaines malveillants détectés
    total_variants = models.IntegerField(default=0)  # Nombre total de variantes générées
    scanned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-scanned_at']
        indexes = [
            models.Index(fields=['user', '-scanned_at']),
            models.Index(fields=['original_domain']),
        ]

    def __str__(self):
        return f"{self.original_domain} - {self.threat_count} threats ({self.scanned_at})"


