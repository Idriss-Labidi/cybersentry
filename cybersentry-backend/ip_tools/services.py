import socket
import whois
import requests


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
