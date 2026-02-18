import time
import dns.exception
import dns.resolver


class DomainNotFoundError(Exception):
    """Raised when the domain does not exist."""


# Default public resolvers grouped by rough geography.
DEFAULT_RESOLVERS = {
    'na': ['8.8.8.8', '1.1.1.1'],
    'eu': ['8.8.4.4', '9.9.9.9'],
    'apac': ['1.0.0.1'],
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
    resolvers_source = resolvers_by_region or DEFAULT_RESOLVERS
    selected_regions = regions or list(resolvers_source.keys())

    unknown_regions = [r for r in selected_regions if r not in resolvers_source]
    if unknown_regions:
        raise ValueError(f"Unknown regions requested: {', '.join(unknown_regions)}")

    propagation: dict = {}

    for region in selected_regions:
        resolver_ips = resolvers_source.get(region, [])
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