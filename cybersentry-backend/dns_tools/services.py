import time
import dns.exception
import dns.resolver
from .models import DnsServer


class DomainNotFoundError(Exception):
    """Raised when the domain does not exist."""


# Default public resolvers grouped by rough geography.
DEFAULT_RESOLVERS = {
    'na': ['8.8.8.8', '1.1.1.1'],
    'eu': ['8.8.4.4', '9.9.9.9'],
    'apac': ['1.0.0.1'],
    'mea': [ '8.8.8.8']
}


def perform_dns_lookup(domain_name: str, record_types: list[str]) -> dict:
    response = {}

    for r_type in record_types:
        try:
            result = dns.resolver.resolve(domain_name, r_type)
            response[r_type] = [rr.to_text() for rr in result]
        except dns.resolver.NoAnswer:
            response[r_type] = f'No{r_type} record found for {domain_name}'
        except dns.resolver.NXDOMAIN:
            raise DomainNotFoundError()

    return response


def _resolve_with_retries(resolver: dns.resolver.Resolver, domain_name: str, record_type: str, retries: int):
    attempts = 0
    while attempts <= retries:
        start = time.time()
        try:
            answers = resolver.resolve(domain_name, record_type)
            latency_ms = round((time.time() - start) * 1000, 2)
            return {
                'status': 'ok',
                'records': [rr.to_text() for rr in answers],
                'latency_ms': latency_ms,
                'attempts': attempts + 1,
            }
        except dns.resolver.NoAnswer:
            return {
                'status': 'no_answer',
                'records': [],
                'attempts': attempts + 1,
            }
        except dns.resolver.NXDOMAIN:
            raise DomainNotFoundError()
        except dns.resolver.Timeout as exc:
            attempts += 1
            if attempts > retries:
                return {
                    'status': 'timeout',
                    'error': str(exc),
                    'attempts': attempts,
                }
        except dns.exception.DNSException as exc:
            return {
                'status': 'error',
                'error': str(exc),
                'attempts': attempts + 1,
            }


def check_dns_propagation(
    domain_name: str,
    record_types: list[str],
    regions: list[str] | None = None,
    timeout: float = 5.0,
    lifetime: float = 5.0,
    retries: int = 0,
    resolvers_by_region: dict | None = None,
) -> dict:
    MAX_RESOLVERS_PER_REGION = 3

    # Clamp lifetime so it never exceeds timeout-based budget.
    lifetime = min(lifetime, max(timeout, 0.5))

    resolvers_source = resolvers_by_region or DEFAULT_RESOLVERS
    selected_regions = regions or list(resolvers_source.keys())

    unknown_regions = [r for r in selected_regions if r not in resolvers_source]
    if unknown_regions:
        raise ValueError(f"Unknown regions requested: {', '.join(unknown_regions)}")

    propagation: dict = {}

    for region in selected_regions:
        region_entries = resolvers_source.get(region, [])

        # Normalize to a list of IP strings from either model instances or raw IPs.
        resolver_ips: list[str] = []
        for entry in region_entries:
            if isinstance(entry, DnsServer):
                for ip in [entry.ip_address1, entry.ip_address2]:
                    if ip:
                        resolver_ips.append(ip)
            else:
                resolver_ips.append(str(entry))

        # Cap per-region resolver count to avoid long aggregate waits.
        resolver_ips = resolver_ips[:MAX_RESOLVERS_PER_REGION]

        # If no resolver IPs for the region, skip to avoid hanging on empty nameserver sets.
        if not resolver_ips:
            propagation[region] = {}
            continue

        region_results = {}

        for resolver_ip in resolver_ips:
            resolver = dns.resolver.Resolver(configure=False)
            resolver.nameservers = [resolver_ip]
            resolver.lifetime = lifetime
            resolver.timeout = timeout

            resolver_results = {}

            for r_type in record_types:
                resolver_results[r_type] = _resolve_with_retries(
                    resolver=resolver,
                    domain_name=domain_name,
                    record_type=r_type,
                    retries=retries,
                )

            region_results[resolver_ip] = resolver_results

        propagation[region] = region_results

    return propagation

def safe_resolve(domain, record_type):
    try:
        answers = dns.resolver.resolve(domain, record_type)
        return [r.to_text() for r in answers], answers.rrset.ttl
    except Exception:
        return None, None

#TODO:bug fix; cuurently this function return a score of 45 for any domain that doesn't exist
def dns_health_check(domain: str):

    score = 100
    checks = {}
    recommendations = []

    # -------------------
    # A RECORD CHECK
    # -------------------
    a_records, ttl = safe_resolve(domain, "A")

    if not a_records:
        score -= 20
        checks["a_record"] = {
            "status": "FAIL",
            "severity": "CRITICAL",
            "impact": "Domain does not resolve to an IPv4 address."
        }
        recommendations.append({
            "priority": "HIGH",
            "issue": "Missing A record",
            "recommendation": "Add a valid A record pointing to your web server IP."
        })
    else:
        checks["a_record"] = {
            "status": "OK",
            "ttl": ttl
        }

        if ttl and ttl < 60:
            score -= 5
            recommendations.append({
                "priority": "MEDIUM",
                "issue": "TTL too low",
                "recommendation": "Increase TTL to at least 300 seconds to improve caching and reduce DNS load."
            })

        if ttl and ttl > 86400:
            score -= 5
            recommendations.append({
                "priority": "LOW",
                "issue": "TTL too high",
                "recommendation": "Reduce TTL below 86400 seconds (24h) for better flexibility during DNS changes."
            })

    # -------------------
    # NS RECORD CHECK
    # -------------------
    ns_records, _ = safe_resolve(domain, "NS")

    if not ns_records:
        score -= 15
        checks["nameservers"] = {
            "status": "FAIL",
            "severity": "CRITICAL",
            "impact": "No authoritative nameservers found."
        }
        recommendations.append({
            "priority": "HIGH",
            "issue": "Missing NS records",
            "recommendation": "Configure at least two authoritative nameservers."
        })
    else:
        checks["nameservers"] = {
            "status": "OK",
            "count": len(ns_records)
        }

        if len(ns_records) < 2:
            score -= 5
            recommendations.append({
                "priority": "MEDIUM",
                "issue": "Single nameserver",
                "recommendation": "Use at least two nameservers for redundancy."
            })

    # -------------------
    # MX CHECK
    # -------------------
    mx_records, _ = safe_resolve(domain, "MX")

    if mx_records:
        checks["mx"] = {
            "status": "OK",
            "records": mx_records
        }
    else:
        checks["mx"] = {
            "status": "NOT_FOUND",
            "severity": "WARNING",
            "impact": "Domain cannot receive emails."
        }
        recommendations.append({
            "priority": "LOW",
            "issue": "Missing MX record",
            "recommendation": "Add MX records if the domain is intended to receive email."
        })

    # -------------------
    # SPF CHECK
    # -------------------
    txt_records, _ = safe_resolve(domain, "TXT")
    spf_records = []

    if txt_records:
        for record in txt_records:
            if record.startswith('"v=spf1'):
                spf_records.append(record)

    if len(spf_records) == 0:
        score -= 10
        checks["spf"] = {
            "status": "MISSING",
            "severity": "HIGH",
            "impact": "Domain is vulnerable to email spoofing."
        }
        recommendations.append({
            "priority": "HIGH",
            "issue": "Missing SPF record",
            "recommendation": "Add an SPF record (v=spf1 ...) to prevent email spoofing."
        })
    elif len(spf_records) > 1:
        score -= 10
        checks["spf"] = {
            "status": "MULTIPLE",
            "severity": "HIGH",
            "impact": "Multiple SPF records cause SPF validation failure."
        }
        recommendations.append({
            "priority": "HIGH",
            "issue": "Multiple SPF records",
            "recommendation": "Merge SPF records into a single valid SPF entry."
        })
    else:
        checks["spf"] = {
            "status": "OK"
        }

    # -------------------
    # DMARC CHECK
    # -------------------
    dmarc_domain = f"_dmarc.{domain}"
    dmarc_records, _ = safe_resolve(dmarc_domain, "TXT")

    if not dmarc_records:
        score -= 10
        checks["dmarc"] = {
            "status": "MISSING",
            "severity": "HIGH",
            "impact": "No DMARC protection against spoofed emails."
        }
        recommendations.append({
            "priority": "HIGH",
            "issue": "Missing DMARC record",
            "recommendation": "Add a DMARC record with policy 'p=reject' or 'p=quarantine'."
        })
    else:
        dmarc_policy = None
        for record in dmarc_records:
            if "p=" in record:
                dmarc_policy = record

        if dmarc_policy and "p=none" in dmarc_policy:
            score -= 5
            recommendations.append({
                "priority": "MEDIUM",
                "issue": "Weak DMARC policy",
                "recommendation": "Change DMARC policy from p=none to p=quarantine or p=reject."
            })

        checks["dmarc"] = {
            "status": "OK",
            "policy": dmarc_policy
        }

    return {
        "domain": domain,
        "score": max(score, 0),
        "grade": calculate_grade(score),
        "checks": checks,
        "recommendations": sorted(
            recommendations,
            key=lambda x: {"HIGH": 1, "MEDIUM": 2, "LOW": 3}[x["priority"]]
        )
    }


def calculate_grade(score):
    if score >= 90:
        return "A"
    elif score >= 75:
        return "B"
    elif score >= 60:
        return "C"
    elif score >= 40:
        return "D"
    return "F"