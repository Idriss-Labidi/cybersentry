from django.contrib import admin
from .models import DnsServer

@admin.register(DnsServer)
class DnsServerAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'type', 'country')
    filter_fields = ( 'name', 'location')