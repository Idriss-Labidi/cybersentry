from __future__ import annotations

import dns.resolver
import dns.rdatatype



def _safe_txt_query(domain: str) -> list[str]:
    """Return all TXT records for *domain*, stripping outer quotes."""
    try:
        answers = dns.resolver.resolve(domain, "TXT")
        records: list[str] = []
        for rdata in answers:
            # Each rdata may consist of multiple strings; join them.
            txt = b"".join(rdata.strings).decode("utf-8", errors="replace")
            records.append(txt)
        return records
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN,
            dns.resolver.NoNameservers, dns.exception.DNSException):
        return []


# Maximum number of DNS-querying mechanisms allowed by RFC 7208 §4.6.4
_SPF_DNS_LOOKUP_LIMIT = 10

# Mechanisms that require a DNS lookup
_SPF_DNS_MECHANISMS = {"include", "a", "mx", "ptr", "exists", "redirect"}


def _count_spf_dns_lookups(mechanisms: list[dict]) -> int:
    """Estimate the number of DNS lookups a SPF record will generate."""
    return sum(1 for m in mechanisms if m["mechanism"] in _SPF_DNS_MECHANISMS)


def _parse_spf_mechanisms(spf_body: str) -> list[dict]:
    """Parse the mechanism/modifier tokens after ``v=spf1``."""
    tokens = spf_body.split()
    mechanisms: list[dict] = []
    for token in tokens:
        if token.lower().startswith("v=spf1"):
            continue

        qualifier = "+"
        if token[0] in "+-~?":
            qualifier = token[0]
            token = token[1:]

        # Split mechanism from optional value  (e.g. include:_spf.google.com)
        if ":" in token:
            mechanism, value = token.split(":", 1)
        elif "=" in token:
            # modifiers like redirect=…
            mechanism, value = token.split("=", 1)
        elif "/" in token:
            mechanism = token.split("/")[0]
            value = token
        else:
            mechanism = token
            value = None

        mechanisms.append({
            "qualifier": qualifier,
            "mechanism": mechanism.lower(),
            "value": value,
        })
    return mechanisms


def analyze_spf(domain: str) -> dict:
    """Analyze SPF configuration for *domain*."""
    txt_records = _safe_txt_query(domain)
    spf_records = [r for r in txt_records if r.lower().startswith("v=spf1")]

    issues: list[str] = []
    recommendations: list[dict] = []
    parsed: dict = {}

    # --- no SPF record ---
    if len(spf_records) == 0:
        issues.append("No SPF record found.")
        recommendations.append({
            "priority": "HIGH",
            "issue": "Missing SPF record",
            "recommendation": (
                "Publish a TXT record with \"v=spf1\" that lists your authorised "
                "mail sources. For example:  v=spf1 include:_spf.google.com ~all"
            ),
        })
        return {
            "record": None,
            "parsed": {},
            "status": "MISSING",
            "issues": issues,
            "recommendations": recommendations,
        }

    # --- multiple SPF records ---
    if len(spf_records) > 1:
        issues.append(
            f"Multiple SPF records found ({len(spf_records)}). "
            "RFC 7208 requires exactly one SPF record per domain."
        )
        recommendations.append({
            "priority": "HIGH",
            "issue": "Multiple SPF records",
            "recommendation": "Merge all SPF records into a single TXT entry.",
        })

    record = spf_records[0]
    mechanisms = _parse_spf_mechanisms(record)
    dns_lookups = _count_spf_dns_lookups(mechanisms)

    parsed = {
        "raw": record,
        "mechanisms": mechanisms,
        "dns_lookup_count": dns_lookups,
    }

    # Check the "all" mechanism
    all_mechs = [m for m in mechanisms if m["mechanism"] == "all"]
    if all_mechs:
        all_qual = all_mechs[-1]["qualifier"]
        parsed["all_qualifier"] = all_qual
        if all_qual == "+":
            issues.append("The SPF record uses \"+all\" which allows ANY server to send mail.")
            recommendations.append({
                "priority": "HIGH",
                "issue": "Permissive +all qualifier",
                "recommendation": "Change \"+all\" to \"~all\" (soft fail) or \"-all\" (hard fail) to restrict unauthorised senders.",
            })
        elif all_qual == "?":
            issues.append("The SPF record uses \"?all\" (neutral) which provides no protection.")
            recommendations.append({
                "priority": "HIGH",
                "issue": "Neutral ?all qualifier",
                "recommendation": "Change \"?all\" to \"~all\" or \"-all\" for meaningful protection.",
            })
        elif all_qual == "~":
            recommendations.append({
                "priority": "LOW",
                "issue": "Soft fail ~all",
                "recommendation": (
                    "Consider upgrading from \"~all\" to \"-all\" once you have confirmed "
                    "all legitimate mail sources are listed."
                ),
            })
    else:
        issues.append("No \"all\" mechanism found — the record has no default policy.")
        recommendations.append({
            "priority": "MEDIUM",
            "issue": "Missing all mechanism",
            "recommendation": "Add \"-all\" or \"~all\" at the end of the SPF record.",
        })

    # DNS lookup limit
    if dns_lookups > _SPF_DNS_LOOKUP_LIMIT:
        issues.append(
            f"SPF record requires ~{dns_lookups} DNS lookups, exceeding the RFC limit of 10."
        )
        recommendations.append({
            "priority": "HIGH",
            "issue": "Too many DNS lookups",
            "recommendation": (
                "Flatten (inline) some 'include' entries or remove unused mechanisms "
                "to stay within the 10-lookup limit."
            ),
        })
    elif dns_lookups > 7:
        recommendations.append({
            "priority": "MEDIUM",
            "issue": f"High DNS lookup count ({dns_lookups}/10)",
            "recommendation": "You are approaching the 10-lookup limit. Monitor and flatten if needed.",
        })

    # ptr mechanism (deprecated)
    if any(m["mechanism"] == "ptr" for m in mechanisms):
        issues.append("The \"ptr\" mechanism is deprecated (RFC 7208 §5.5).")
        recommendations.append({
            "priority": "MEDIUM",
            "issue": "Deprecated ptr mechanism",
            "recommendation": "Replace the \"ptr\" mechanism with explicit \"ip4\" / \"ip6\" entries.",
        })

    status = "OK" if not issues else "WARNING"
    return {
        "record": record,
        "parsed": parsed,
        "status": status,
        "issues": issues,
        "recommendations": recommendations,
    }


# Common selectors used by major providers & defaults.
DEFAULT_DKIM_SELECTORS = [
    "default",
    "google",
    "selector1",       # Microsoft 365
    "selector2",       # Microsoft 365
    "dkim",
    "mail",
    "k1",              # Mailchimp
    "s1",
    "s2",
    "mandrill",
    "everlytickey1",
    "everlytickey2",
    "smtp",
    "cm",              # Campaign Monitor
]


def _parse_dkim_record(raw: str) -> dict:
    """Parse a DKIM TXT record into its tag-value pairs."""
    tags: dict[str, str] = {}
    # Tags are separated by ";", each is "key=value"
    for part in raw.split(";"):
        part = part.strip()
        if "=" in part:
            key, _, value = part.partition("=")
            tags[key.strip()] = value.strip()
    return tags


def analyze_dkim(domain: str, selectors: list[str] | None = None) -> dict:
    """
    Analyze DKIM for *domain*.

    Because DKIM records are stored under ``<selector>._domainkey.<domain>``,
    callers can provide explicit *selectors*.  When omitted the function tries
    a list of well-known selectors.
    """
    selectors_to_try = selectors or DEFAULT_DKIM_SELECTORS

    found: list[dict] = []
    issues: list[str] = []
    recommendations: list[dict] = []

    for selector in selectors_to_try:
        qname = f"{selector}._domainkey.{domain}"
        txt_records = _safe_txt_query(qname)
        for txt in txt_records:
            if "v=dkim1" in txt.lower() or "p=" in txt.lower():
                tags = _parse_dkim_record(txt)

                entry: dict = {
                    "selector": selector,
                    "domain": qname,
                    "raw": txt,
                    "tags": tags,
                }

                # Key type
                key_type = tags.get("k", "rsa")
                entry["key_type"] = key_type

                # Check for empty public key (revoked)
                public_key = tags.get("p", "")
                if not public_key:
                    issues.append(
                        f"Selector \"{selector}\" has an empty public key — the key has been revoked."
                    )
                    entry["revoked"] = True
                else:
                    entry["revoked"] = False
                    # Rough RSA key size estimation from base-64 length
                    if key_type == "rsa":
                        estimated_bits = (len(public_key) * 6) // 8 * 8  # approx
                        entry["estimated_key_bits"] = estimated_bits
                        if estimated_bits < 1024:
                            issues.append(
                                f"Selector \"{selector}\" uses a weak RSA key (~{estimated_bits} bits)."
                            )
                            recommendations.append({
                                "priority": "HIGH",
                                "issue": f"Weak DKIM key for selector \"{selector}\"",
                                "recommendation": "Rotate to a 2048-bit (or longer) RSA key.",
                            })
                        elif estimated_bits < 2048:
                            recommendations.append({
                                "priority": "MEDIUM",
                                "issue": f"DKIM key for \"{selector}\" is ~{estimated_bits} bits",
                                "recommendation": "Consider upgrading to a 2048-bit key for stronger security.",
                            })

                found.append(entry)

    if not found:
        issues.append("No DKIM records found for any common selector.")
        recommendations.append({
            "priority": "HIGH",
            "issue": "Missing DKIM records",
            "recommendation": (
                "Configure DKIM signing for your mail server and publish the public key as a "
                "TXT record at <selector>._domainkey." + domain + ". "
                "Most email providers (Google Workspace, Microsoft 365, etc.) provide the record to add."
            ),
        })
        return {
            "records": [],
            "selectors_checked": selectors_to_try,
            "status": "MISSING",
            "issues": issues,
            "recommendations": recommendations,
        }

    status = "OK" if not issues else "WARNING"
    return {
        "records": found,
        "selectors_checked": selectors_to_try,
        "status": status,
        "issues": issues,
        "recommendations": recommendations,
    }


_DMARC_TAG_DESCRIPTIONS: dict[str, str] = {
    "v": "Protocol version",
    "p": "Policy for the domain",
    "sp": "Policy for subdomains",
    "pct": "Percentage of messages subject to policy",
    "rua": "Aggregate report URI(s)",
    "ruf": "Forensic report URI(s)",
    "adkim": "DKIM alignment mode",
    "aspf": "SPF alignment mode",
    "fo": "Forensic reporting options",
    "rf": "Forensic report format",
    "ri": "Aggregate report interval (seconds)",
}


def _parse_dmarc_tags(raw: str) -> dict[str, str]:
    tags: dict[str, str] = {}
    for part in raw.split(";"):
        part = part.strip()
        if "=" in part:
            key, _, value = part.partition("=")
            tags[key.strip().lower()] = value.strip()
    return tags


def analyze_dmarc(domain: str) -> dict:
    """Analyze DMARC configuration for *domain*."""
    qname = f"_dmarc.{domain}"
    txt_records = _safe_txt_query(qname)
    dmarc_records = [r for r in txt_records if r.lower().startswith("v=dmarc1")]

    issues: list[str] = []
    recommendations: list[dict] = []
    parsed: dict = {}

    # --- missing ---
    if not dmarc_records:
        issues.append("No DMARC record found.")
        recommendations.append({
            "priority": "HIGH",
            "issue": "Missing DMARC record",
            "recommendation": (
                "Publish a TXT record at _dmarc." + domain + " with at least: "
                "\"v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@" + domain + "\""
            ),
        })
        return {
            "record": None,
            "parsed": {},
            "status": "MISSING",
            "issues": issues,
            "recommendations": recommendations,
        }

    # --- multiple ---
    if len(dmarc_records) > 1:
        issues.append(f"Multiple DMARC records found ({len(dmarc_records)}). Only one is allowed.")
        recommendations.append({
            "priority": "HIGH",
            "issue": "Multiple DMARC records",
            "recommendation": "Remove duplicate DMARC records so only one remains.",
        })

    raw = dmarc_records[0]
    tags = _parse_dmarc_tags(raw)

    parsed = {
        "raw": raw,
        "tags": tags,
        "tag_descriptions": {
            k: _DMARC_TAG_DESCRIPTIONS.get(k, "Unknown tag")
            for k in tags
        },
    }

    # Policy check
    policy = tags.get("p", "").lower()
    parsed["policy"] = policy
    if policy == "none":
        issues.append("DMARC policy is set to \"none\" — no enforcement.")
        recommendations.append({
            "priority": "HIGH",
            "issue": "DMARC policy is p=none",
            "recommendation": (
                "Upgrade the policy to \"p=quarantine\" or \"p=reject\" after reviewing "
                "aggregate reports to ensure legitimate mail is not affected."
            ),
        })
    elif policy == "quarantine":
        recommendations.append({
            "priority": "LOW",
            "issue": "DMARC policy is p=quarantine",
            "recommendation": (
                "Consider moving to \"p=reject\" for maximum protection once you are "
                "confident all legitimate mail sources pass SPF/DKIM."
            ),
        })
    elif policy == "reject":
        pass  # ideal
    elif not policy:
        issues.append("DMARC record is missing the required \"p\" tag.")
        recommendations.append({
            "priority": "HIGH",
            "issue": "Missing policy tag",
            "recommendation": "Add a \"p=quarantine\" or \"p=reject\" tag to the DMARC record.",
        })

    # Subdomain policy
    sp = tags.get("sp", "").lower()
    if sp:
        parsed["subdomain_policy"] = sp
        if sp == "none" and policy in ("quarantine", "reject"):
            issues.append("Subdomain policy (sp=none) is weaker than the domain policy.")
            recommendations.append({
                "priority": "MEDIUM",
                "issue": "Weak subdomain policy",
                "recommendation": "Set \"sp\" to at least \"quarantine\" to protect subdomains as well.",
            })

    # Percentage
    pct = tags.get("pct")
    if pct is not None:
        try:
            pct_val = int(pct)
            parsed["percentage"] = pct_val
            if pct_val < 100:
                issues.append(f"DMARC policy only applies to {pct_val}% of messages.")
                recommendations.append({
                    "priority": "MEDIUM",
                    "issue": f"DMARC percentage is {pct_val}%",
                    "recommendation": "Increase \"pct\" to 100 for full coverage once confident.",
                })
        except ValueError:
            issues.append(f"Invalid pct value: \"{pct}\".")

    # Aggregate reporting
    rua = tags.get("rua")
    parsed["has_aggregate_reporting"] = bool(rua)
    if not rua:
        recommendations.append({
            "priority": "MEDIUM",
            "issue": "No aggregate reporting (rua)",
            "recommendation": (
                "Add a \"rua=mailto:dmarc-reports@" + domain + "\" tag to receive "
                "aggregate reports and gain visibility into authentication results."
            ),
        })

    # Forensic reporting
    ruf = tags.get("ruf")
    parsed["has_forensic_reporting"] = bool(ruf)

    # Alignment modes
    adkim = tags.get("adkim", "r")
    aspf = tags.get("aspf", "r")
    parsed["dkim_alignment"] = "strict" if adkim == "s" else "relaxed"
    parsed["spf_alignment"] = "strict" if aspf == "s" else "relaxed"

    if adkim == "r" and aspf == "r":
        recommendations.append({
            "priority": "LOW",
            "issue": "Relaxed alignment for both DKIM and SPF",
            "recommendation": (
                "Consider switching to strict alignment (adkim=s; aspf=s) for tighter control, "
                "especially if you don't use subdomains for sending mail."
            ),
        })

    status = "OK" if not issues else "WARNING"
    return {
        "record": raw,
        "parsed": parsed,
        "status": status,
        "issues": issues,
        "recommendations": recommendations,
    }


# Combined analyser

def analyze_email_security(domain: str, dkim_selectors: list[str] | None = None) -> dict:
    """
    Run SPF, DKIM and DMARC analysis for *domain* and return a combined
    report with an overall score and grade.
    """
    spf = analyze_spf(domain)
    dkim = analyze_dkim(domain, selectors=dkim_selectors)
    dmarc = analyze_dmarc(domain)

    # --- scoring ---
    score = 100

    # SPF scoring
    if spf["status"] == "MISSING":
        score -= 30
    elif spf["status"] == "WARNING":
        score -= 5 * len(spf["issues"])

    # DKIM scoring
    if dkim["status"] == "MISSING":
        score -= 30
    elif dkim["status"] == "WARNING":
        score -= 5 * len(dkim["issues"])

    # DMARC scoring
    if dmarc["status"] == "MISSING":
        score -= 30
    elif dmarc["status"] == "WARNING":
        score -= 5 * len(dmarc["issues"])

    score = max(score, 0)

    def _grade(s: int) -> str:
        if s >= 90:
            return "A"
        if s >= 75:
            return "B"
        if s >= 60:
            return "C"
        if s >= 40:
            return "D"
        return "F"

    # Collect all recommendations, sorted by priority
    all_recommendations: list[dict] = (
        spf["recommendations"] + dkim["recommendations"] + dmarc["recommendations"]
    )
    priority_order = {"HIGH": 1, "MEDIUM": 2, "LOW": 3}
    all_recommendations.sort(key=lambda r: priority_order.get(r["priority"], 9))

    return {
        "domain": domain,
        "score": score,
        "grade": _grade(score),
        "spf": spf,
        "dkim": dkim,
        "dmarc": dmarc,
        "recommendations": all_recommendations,
    }
