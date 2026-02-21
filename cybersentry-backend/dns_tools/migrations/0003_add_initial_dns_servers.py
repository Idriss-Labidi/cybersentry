from django.db import migrations

def create_dns_servers(apps, schema_editor):
    DnsServer = apps.get_model('dns_tools', 'DnsServer')

    servers = [
        # Google
        {"name": "Google Public DNS", "ip_address1": "8.8.8.8", "ip_address2": "8.8.4.4",
         "location": "Mountain View, California, US", "type": "IPV4", "country": "US", "region": "na"},
        {"name": "Google Public DNS IPv6", "ip_address1": "2001:4860:4860::8888",
         "ip_address2": "2001:4860:4860::8844", "location": "Mountain View, California, US",
         "type": "IPV6", "country": "US", "region": "na"},

        # Cloudflare
        {"name": "Cloudflare DNS", "ip_address1": "1.1.1.1", "ip_address2": "1.0.0.1",
         "location": "San Francisco, California, US", "type": "IPV4", "country": "US", "region": "na"},
        {"name": "Cloudflare DNS IPv6", "ip_address1": "2606:4700:4700::1111",
         "ip_address2": "2606:4700:4700::1001", "location": "San Francisco, California, US",
         "type": "IPV6", "country": "US", "region": "na"},

        # Quad9
        {"name": "Quad9 DNS", "ip_address1": "9.9.9.9", "ip_address2": "149.112.112.112",
         "location": "Zurich, Zurich, CH", "type": "IPV4", "country": "CH", "region": "eu"},
        {"name": "Quad9 DNS IPv6", "ip_address1": "2620:fe::fe", "ip_address2": "2620:fe::10",
         "location": "Zurich, Zurich, CH", "type": "IPV6", "country": "CH", "region": "eu"},

        # G-Core
        {"name": "G-Core DNS", "ip_address1": "95.85.95.85", "ip_address2": "2.56.220.2",
         "location": "Luxembourg City, Luxembourg, LU", "type": "IPV4", "country": "RU", "region": "eu"},
        {"name": "G-Core DNS IPv6", "ip_address1": "2a03:90c0:999d::1", "ip_address2": "2a03:90c0:9992::1",
         "location": "Luxembourg City, Luxembourg, LU", "type": "IPV6", "country": "RU", "region": "eu"},

        # Yandex
        {"name": "Yandex.DNS", "ip_address1": "77.88.8.8", "ip_address2": "77.88.8.1",
         "location": "Moscow, Moscow, RU", "type": "IPV4", "country": "RU", "region": "eu"},
        {"name": "Yandex DNS IPv6", "ip_address1": "2a02:6b8::feed:0ff", "ip_address2": "2a02:6b8:0:1::feed:0ff",
         "location": "Moscow, Moscow, RU", "type": "IPV6", "country": "RU", "region": "eu"},

        # MSK-IX
        {"name": "MSK-IX DNS", "ip_address1": "62.76.76.62", "ip_address2": "62.76.62.76",
         "location": "Moscow, Moscow, RU", "type": "IPV4", "country": "RU", "region": "eu"},
        {"name": "MSK-IX DNS IPv6", "ip_address1": "2001:6d0:6d0::2001", "ip_address2": "2001:6d0:d6::2001",
         "location": "Moscow, Moscow, RU", "type": "IPV6", "country": "RU", "region": "eu"},

        # OpenDNS (Cisco)
        {"name": "OpenDNS", "ip_address1": "208.67.222.222", "ip_address2": "208.67.220.220",
         "location": "San Jose, California, US", "type": "IPV4", "country": "US", "region": "na"},
        {"name": "OpenDNS IPv6", "ip_address1": "2620:119:35::35", "ip_address2": "2620:119:53::53",
         "location": "San Jose, California, US", "type": "IPV6", "country": "US", "region": "na"},

        # Verisign
        {"name": "Verisign Public DNS", "ip_address1": "64.6.64.6", "ip_address2": "64.6.65.6",
         "location": "Reston, Virginia, US", "type": "IPV4", "country": "US", "region": "na"},
        {"name": "Verisign Public DNS IPv6", "ip_address1": "2620:74:1b::1:1",
         "ip_address2": "2620:74:1c::2:2", "location": "Reston, Virginia, US",
         "type": "IPV6", "country": "US", "region": "na"},
    ]

    for s in servers:
        DnsServer.objects.update_or_create(name=s["name"], defaults=s)


def reverse_dns_servers(apps, schema_editor):
    DnsServer = apps.get_model('dns_tools', 'DnsServer')
    names = [
        "Google Public DNS", "Google Public DNS IPv6",
        "Cloudflare DNS", "Cloudflare DNS IPv6",
        "Quad9 DNS", "Quad9 DNS IPv6",
        "G-Core DNS", "G-Core DNS IPv6",
        "Yandex.DNS", "Yandex DNS IPv6",
        "MSK-IX DNS", "MSK-IX DNS IPv6",
        "OpenDNS", "OpenDNS IPv6",
        "Verisign Public DNS", "Verisign Public DNS IPv6",
    ]
    DnsServer.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('dns_tools', '0002_dnsserver_region'),
    ]

    operations = [
        migrations.RunPython(create_dns_servers, reverse_dns_servers),
    ]
