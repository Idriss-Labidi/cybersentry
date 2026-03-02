import socket
import whois
import requests
from typing import Optional
from django.contrib.auth.models import User
from .models import IPReputationScan, DomainTyposquattingScan


class WhoisLookupError(Exception):
    """Raised when a WHOIS lookup fails."""


class IpLookupError(Exception):
    """Raised when an IP/geolocation lookup fails."""


# ---------------------------------------------------------------------------
#  1. WHOIS Lookup
# ---------------------------------------------------------------------------

def perform_whois_lookup(query: str) -> dict:
    """
    Perform a WHOIS lookup for a domain name or IP address.
    Returns a dict with the parsed WHOIS data.
    """
    try:
        w = whois.whois(query)
    except whois.parser.PywhoisError as exc:
        raise WhoisLookupError(str(exc))
    except Exception as exc:
        raise WhoisLookupError(f"WHOIS lookup failed: {exc}")

    # whois lib returns a WhoisEntry (dict-like). Serialize it.
    raw = dict(w)

    # Normalize certain fields that may be datetime objects or lists
    result = {}
    for key, value in raw.items():
        if value is None:
            result[key] = None
        elif isinstance(value, list):
            result[key] = [_serialize_value(v) for v in value]
        else:
            result[key] = _serialize_value(value)

    return result


def _serialize_value(value):
    """Convert datetime and other non-JSON-serializable types to strings."""
    from datetime import datetime, date
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


# ---------------------------------------------------------------------------
#  2. IP Reputation & Geolocation
# ---------------------------------------------------------------------------

def get_ip_geolocation(ip_address: str) -> dict:
    """
    Fetch geolocation data for an IP using the free ip-api.com service.
    """
    try:
        resp = requests.get(
            f"http://ip-api.com/json/{ip_address}",
            params={"fields": "status,message,continent,country,countryCode,region,regionName,"
                              "city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,"
                              "proxy,hosting,query"},
            timeout=10,
        )
        data = resp.json()
    except requests.RequestException as exc:
        raise IpLookupError(f"Geolocation request failed: {exc}")

    if data.get("status") == "fail":
        raise IpLookupError(data.get("message", "Unknown error"))

    return data


def get_ip_reputation(ip_address: str) -> dict:
    """
    Build a reputation summary for an IP address.
    Uses ip-api.com proxy/hosting flags plus AbuseIPDB-style heuristics.
    """
    geo = get_ip_geolocation(ip_address)

    # Build a simple reputation score (0-100, 100 = clean)
    score = 100
    risk_factors = []

    if geo.get("proxy"):
        score -= 30
        risk_factors.append("IP is identified as a proxy / VPN")

    if geo.get("hosting"):
        score -= 20
        risk_factors.append("IP belongs to a hosting / data-center provider")

    if geo.get("mobile"):
        risk_factors.append("IP is on a mobile network (informational)")

    reputation = {
        "ip": geo.get("query", ip_address),
        "score": max(score, 0),
        "risk_level": _risk_level(score),
        "risk_factors": risk_factors,
        "is_proxy": geo.get("proxy", False),
        "is_hosting": geo.get("hosting", False),
        "is_mobile": geo.get("mobile", False),
    }

    # Merge geo into the result
    geolocation = {
        "continent": geo.get("continent"),
        "country": geo.get("country"),
        "country_code": geo.get("countryCode"),
        "region": geo.get("regionName"),
        "region_code": geo.get("region"),
        "city": geo.get("city"),
        "zip": geo.get("zip"),
        "latitude": geo.get("lat"),
        "longitude": geo.get("lon"),
        "timezone": geo.get("timezone"),
    }

    network = {
        "isp": geo.get("isp"),
        "org": geo.get("org"),
        "as_number": geo.get("as"),
        "as_name": geo.get("asname"),
        "reverse_dns": geo.get("reverse"),
    }

    return {
        **reputation,
        "geolocation": geolocation,
        "network": network,
    }


def _risk_level(score: int) -> str:
    if score >= 80:
        return "low"
    elif score >= 50:
        return "medium"
    return "high"


# ---------------------------------------------------------------------------
#  3. Reverse IP Lookup
# ---------------------------------------------------------------------------

def reverse_ip_lookup(ip_address: str) -> dict:
    """
    Perform a reverse DNS lookup on the given IP address and also
    query the HackerTarget free API for domains hosted on the same IP.
    """
    # PTR record via socket
    try:
        hostname, _, _ = socket.gethostbyaddr(ip_address)
    except (socket.herror, socket.gaierror):
        hostname = None

    # Domains hosted on same IP via HackerTarget free API
    domains = []
    try:
        resp = requests.get(
            f"https://api.hackertarget.com/reverseiplookup/",
            params={"q": ip_address},
            timeout=10,
        )
        if resp.status_code == 200 and "error" not in resp.text.lower() and "API count" not in resp.text:
            raw = resp.text.strip()
            if raw:
                domains = [d.strip() for d in raw.split("\n") if d.strip()]
    except requests.RequestException:
        pass  # non-critical; we already have hostname

    return {
        "ip": ip_address,
        "hostname": hostname,
        "domains_count": len(domains),
        "domains": domains,
    }


# ---------------------------------------------------------------------------
#  4. IP Reputation with History (for authenticated users)
# ---------------------------------------------------------------------------

def check_ip_reputation_with_history(ip_address: str, user: Optional[User] = None) -> dict:
    """
    Vérifie la réputation IP et sauvegarde dans l'historique si l'utilisateur est authentifié.
    """
    # Appeler la fonction existante pour obtenir les données de réputation
    reputation_data = get_ip_reputation(ip_address)

    # Sauvegarder dans la base de données si utilisateur authentifié
    if user and user.is_authenticated:
        IPReputationScan.objects.create(
            user=user,
            ip_address=reputation_data['ip'],
            reputation_score=reputation_data['score'],
            risk_level=reputation_data['risk_level'],
            is_proxy=reputation_data['is_proxy'],
            is_hosting=reputation_data['is_hosting'],
            is_mobile=reputation_data['is_mobile'],
            risk_factors=reputation_data['risk_factors'],
            geolocation=reputation_data['geolocation'],
            network=reputation_data['network']
        )

    return reputation_data


# ---------------------------------------------------------------------------
#  5. Typosquatting Detection
# ---------------------------------------------------------------------------

def generate_domain_variants(domain: str) -> list:
    """
    Génère des variantes de domaine susceptibles d'être utilisées pour le typosquatting.
    Version optimisée avec moins de variantes pour éviter les timeouts.
    """
    variants = set()

    # Séparer le domaine de son extension
    if '.' not in domain:
        return []

    parts = domain.rsplit('.', 1)
    name = parts[0]
    tld = parts[1] if len(parts) > 1 else 'com'

    # Limiter aux noms de domaine de longueur raisonnable
    if len(name) < 2 or len(name) > 20:
        return []

    # 1. Suppression de caractères (character omission) - limité
    for i in range(min(len(name), 3)):  # Seulement les 3 premiers caractères
        variant = name[:i] + name[i+1:]
        if len(variant) >= 2:
            variants.add(f"{variant}.{tld}")

    # 2. Transposition de caractères adjacents (adjacent character swap) - limité
    for i in range(min(len(name) - 1, 3)):  # Seulement les 3 premières positions
        variant = name[:i] + name[i+1] + name[i] + name[i+2:]
        variants.add(f"{variant}.{tld}")

    # 3. Variantes d'extensions communes seulement
    common_tlds = ['com', 'net', 'org']
    for t in common_tlds:
        if t != tld:
            variants.add(f"{name}.{t}")

    # Exclure le domaine original
    variants.discard(domain)

    # Limiter à 15 variantes maximum pour éviter les timeouts
    return list(variants)[:15]


def check_domain_exists(domain: str) -> dict:
    """
    Vérifie rapidement si un domaine existe via DNS uniquement.
    Version optimisée sans WHOIS pour éviter les timeouts.
    """
    try:
        # Tenter une résolution DNS avec timeout court
        socket.setdefaulttimeout(1)  # 1 seconde timeout seulement
        ip = socket.gethostbyname(domain)
        socket.setdefaulttimeout(None)

        return {
            'domain': domain,
            'exists': True,
            'ip': ip,
            'is_suspicious': True,
        }
    except socket.gaierror:
        # Le domaine n'existe pas
        socket.setdefaulttimeout(None)
        return {
            'domain': domain,
            'exists': False,
            'is_suspicious': False,
        }
    except socket.timeout:
        # Timeout - considérer comme non existant
        socket.setdefaulttimeout(None)
        return {
            'domain': domain,
            'exists': False,
            'error': 'timeout',
            'is_suspicious': False,
        }
    except Exception as e:
        socket.setdefaulttimeout(None)
        return {
            'domain': domain,
            'exists': False,
            'error': str(e)[:50],
            'is_suspicious': False,
        }


def detect_typosquatting_with_history(domain: str, user: User) -> dict:
    """
    Détecte le typosquatting pour un domaine donné et sauvegarde l'historique.
    Version optimisée pour éviter les timeouts.
    """
    try:
        # Nettoyer le domaine
        domain = domain.strip().lower()
        if domain.startswith('http://') or domain.startswith('https://'):
            domain = domain.split('://', 1)[1]
        if '/' in domain:
            domain = domain.split('/')[0]

        # Générer les variantes (limité à 15 maintenant)
        variants = generate_domain_variants(domain)

        # Vérifier chaque variante avec timeout global
        similar_domains = []
        threat_count = 0

        import time
        start_time = time.time()
        max_execution_time = 20  # Maximum 20 secondes

        for variant in variants:
            # Vérifier si on a dépassé le temps maximum
            if time.time() - start_time > max_execution_time:
                print(f"Timeout reached after checking {len(similar_domains)} variants")
                break

            try:
                result = check_domain_exists(variant)
                if result['exists']:
                    similar_domains.append(result)
                    if result.get('is_suspicious', False):
                        threat_count += 1
            except Exception as e:
                # Continuer même si une variante échoue
                print(f"Error checking {variant}: {str(e)}")
                continue

        # Sauvegarder dans la base de données
        scan = DomainTyposquattingScan.objects.create(
            user=user,
            original_domain=domain,
            similar_domains=similar_domains,
            threat_count=threat_count,
            total_variants=len(variants)
        )

        return {
            'scan_id': scan.id,
            'original_domain': domain,
            'total_variants_generated': len(variants),
            'variants_checked': len(variants),
            'similar_domains': similar_domains,
            'threat_count': threat_count,
            'scanned_at': scan.scanned_at.isoformat(),
        }
    except Exception as e:
        # Log l'erreur et la relancer avec plus de détails
        import traceback
        print(f"Typosquatting error: {str(e)}")
        print(traceback.format_exc())
        raise Exception(f"Typosquatting detection failed: {str(e)}")


def get_user_ip_scan_history(user: User, limit: int = 50):
    """
    Récupère l'historique des scans de réputation IP pour un utilisateur.
    """
    scans = IPReputationScan.objects.filter(user=user)[:limit]
    return list(scans)


def get_user_typosquatting_scan_history(user: User, limit: int = 50):
    """
    Récupère l'historique des scans de typosquatting pour un utilisateur.
    """
    scans = DomainTyposquattingScan.objects.filter(user=user)[:limit]
    return list(scans)


