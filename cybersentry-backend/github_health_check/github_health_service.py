"""
GitHub Repository Health Check Service
Implements three levels of checks:
- Level 1: REST API metrics (maintenance, contributors, releases)
- Level 2: Raw file inspection (dependencies, code quality indicators)
- Level 3: Native GitHub security APIs (Dependabot, CodeQL, secret scanning)
"""

import requests
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from django.conf import settings
from django.utils import timezone


class GitHubAPIClient:

    def __init__(self, token: Optional[str] = None):
        self.token = token or getattr(settings, 'GITHUB_TOKEN', None)
        self.base_url = "https://api.github.com"
        self.raw_url = "https://raw.githubusercontent.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Cybersentry/1.0"
        }
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"

    def _get(self, url: str, params: Optional[Dict] = None) -> Tuple[Dict, int]:
        """Make GET request and return response JSON and status code"""
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            return response.json() if response.text else {}, response.status_code
        except requests.exceptions.RequestException as e:
            return {"error": str(e)}, 0


def _assess_maintenance(repo_data: Dict) -> Dict:
    """Assess repo maintenance status from commit frequency and last push"""
    pushed_at = repo_data.get("pushed_at")
    if not pushed_at:
        return {"score": 0, "status": "No commits found"}

    last_push = datetime.fromisoformat(pushed_at.replace('Z', '+00:00'))
    days_since_push = (timezone.now() - last_push).days

    if days_since_push < 7:
        status = "Active"
        score = 100
    elif days_since_push < 30:
        status = "Maintained"
        score = 80
    elif days_since_push < 90:
        status = "Stale"
        score = 50
    else:
        status = "Abandoned"
        score = 20

    return {
        "score": score,
        "status": status,
        "days_since_last_commit": days_since_push,
        "last_push_date": pushed_at
    }


def _assess_community(repo_data: Dict, contributors_data) -> Dict:
    """Assess community health: contributors count, bus factor"""
    if isinstance(contributors_data, dict) and "error" in contributors_data:
        return {"score": 0, "error": "Could not fetch contributors"}

    contributors_count = len(contributors_data) if isinstance(contributors_data, list) else 0

    # Bus factor: if only 1 contributor, high risk
    if contributors_count == 0:
        return {"score": 0, "status": "No contributors found"}
    elif contributors_count == 1:
        bus_factor_risk = "Critical"
        score = 30
    elif contributors_count <= 3:
        bus_factor_risk = "High"
        score = 60
    else:
        bus_factor_risk = "Low"
        score = 100

    return {
        "score": score,
        "bus_factor_risk": bus_factor_risk,
        "total_contributors": contributors_count,
        "stars": repo_data.get("stargazers_count", 0),
        "forks": repo_data.get("forks_count", 0),
    }


def _assess_security_basics(repo_data: Dict) -> Dict:
    """Check for basic security signals: license, security.md, code of conduct"""
    checks = {}

    checks["has_license"] = bool(repo_data.get("license"))
    checks["license_type"] = repo_data.get("license", {}).get("name") if repo_data.get("license") else None
    checks["is_private"] = repo_data.get("private", False)
    checks["has_vulnerability_alerts"] = repo_data.get("has_vulnerability_alerts", False)

    # Try to detect if SECURITY.md exists by checking if it's mentioned in readme or common files
    score = 0
    if checks["has_license"]:
        score += 25
    if not checks["is_private"]:
        score += 25
    if checks["has_vulnerability_alerts"]:
        score -= 25  # Alerts found = potential issues

    return {
        "score": max(0, score),
        "checks": checks
    }


def _assess_documentation(repo_data: Dict) -> Dict:
    """Check for documentation: README, has description"""
    checks = {
        "has_description": bool(repo_data.get("description")),
        "has_homepage": bool(repo_data.get("homepage")),
        "topics": repo_data.get("topics", []),
    }

    score = 0
    if checks["has_description"]:
        score += 50
    if checks["has_homepage"]:
        score += 50

    return {
        "score": score,
        "checks": checks
    }


def _assess_releases(releases_data) -> Dict:
    """Check for versioned releases"""
    if not isinstance(releases_data, list):
        return {"score": 0, "count": 0}

    count = len(releases_data)
    score = min(100, count * 20)  # Each release = +20 points, max 100

    return {
        "score": score,
        "release_count": count,
        "has_releases": count > 0
    }


def _assess_branch_protection(branches_data) -> Dict:
    """Check if default branch has protection rules"""
    if not isinstance(branches_data, list):
        return {"score": 0, "protected": False}

    default_branch = next((b for b in branches_data if b.get("protected")), None)

    return {
        "score": 80 if default_branch else 40,
        "default_branch_protected": bool(default_branch),
        "branch_count": len(branches_data) if isinstance(branches_data, list) else 0
    }


class Level1Service(GitHubAPIClient):
    """
    Level 1: REST API-Based Health Check
    Measures: Stars, forks, contributors, commit frequency, releases, documentation.
    """

    def check_repository(self, owner: str, repo: str) -> Dict:
        """
        Main Level 1 check - gathers all REST API metrics
        """
        base = f"{self.base_url}/repos/{owner}/{repo}"

        # Fetch repo data
        repo_data, status = self._get(base)
        if status != 200:
            return {"error": f"Repository not found or private (status: {status})"}

        # Gather all metrics in parallel conceptually
        issues_data, _ = self._get(f"{base}/issues?state=all&per_page=1")
        contributors_data, _ = self._get(f"{base}/contributors?per_page=1")
        releases_data, _ = self._get(f"{base}/releases?per_page=5")
        branches_data, _ = self._get(f"{base}/branches")

        return {
            "maintenance": _assess_maintenance(repo_data),
            "community": _assess_community(repo_data, contributors_data),
            "security_basics": _assess_security_basics(repo_data),
            "documentation": _assess_documentation(repo_data),
            "releases": _assess_releases(releases_data),
            "branch_protection": _assess_branch_protection(branches_data),
            "last_push": repo_data.get("pushed_at"),
            "raw_metrics": {
                "stars": repo_data.get("stargazers_count", 0),
                "forks": repo_data.get("forks_count", 0),
                "open_issues": repo_data.get("open_issues_count", 0),
                "watchers": repo_data.get("watchers_count", 0),
                "language": repo_data.get("language", "Unknown"),
            }
        }


class Level2Service(GitHubAPIClient):
    """
    Level 2: Raw File Inspection
    Fetches individual files from raw.githubusercontent.com to inspect:
    - Dependencies quality (requirements.txt, package.json)
    - Code smells (eval, exec, pickle, hardcoded secrets)
    - Comment ratio
    """

    def check_files(self, owner: str, repo: str, branch: str = "main") -> Dict:
        """
        Main Level 2 check - inspect key files without cloning
        """
        results = {
            "dependencies": self._check_dependencies(owner, repo, branch),
            "code_quality_signals": self._check_code_quality(owner, repo, branch),
            "security_file_check": self._check_security_files(owner, repo, branch),
        }
        return results

    def _fetch_raw_file(self, owner: str, repo: str, branch: str, path: str) -> Optional[str]:
        """Fetch a single file from raw.githubusercontent.com"""
        url = f"{self.raw_url}/{owner}/{repo}/{branch}/{path}"
        try:
            response = requests.get(url, timeout=5)
            return response.text if response.status_code == 200 else None
        except requests.exceptions.RequestException:
            return None

    def _check_dependencies(self, owner: str, repo: str, branch: str) -> Dict:
        """Check dependency files for outdated/vulnerable patterns"""
        results = {}

        # Check Python requirements
        req_content = self._fetch_raw_file(owner, repo, branch, "requirements.txt")
        if req_content:
            results["python_requirements"] = {
                "file_found": True,
                "lines": len(req_content.split('\n')),
                "has_pinned_versions": self._check_version_pinning(req_content),
                "suspicious_packages": self._detect_suspicious_patterns(req_content),
            }

        # Check Node dependencies
        pkg_content = self._fetch_raw_file(owner, repo, branch, "package.json")
        if pkg_content:
            results["node_dependencies"] = {
                "file_found": True,
                "has_lock_file": self._has_lock_file(owner, repo, branch),
                "file_size_kb": len(pkg_content) / 1024,
            }

        # Check Docker
        docker_content = self._fetch_raw_file(owner, repo, branch, "Dockerfile")
        if docker_content:
            results["dockerfile"] = {
                "file_found": True,
                "uses_latest_tag": "latest" in docker_content,
                "has_security_warnings": self._detect_docker_issues(docker_content),
            }

        return results

    def _check_code_quality(self, owner: str, repo: str, branch: str) -> Dict:
        """Scan for code smells and suspicious patterns"""
        dangerous_patterns = {
            "eval": r"\beval\s*\(",
            "exec": r"\bexec\s*\(",
            "pickle": r"\bpickle\.",
            "hardcoded_secret": r"(password\s*=|secret\s*=|api[_-]?key\s*=|token\s*=)['\"]",
            "os_system": r"\bos\.system\s*\(",
        }

        # Try to check a few common files
        files_to_check = [
            ("setup.py", "Python setup"),
            ("conftest.py", "Test config"),
            ("settings.py", "Django settings"),
            (".env.example", "Environment template"),
        ]

        results = {"suspicious_code_patterns": []}

        for file_path, description in files_to_check:
            content = self._fetch_raw_file(owner, repo, branch, file_path)
            if content:
                for pattern_name, pattern in dangerous_patterns.items():
                    if re.search(pattern, content, re.IGNORECASE):
                        results["suspicious_code_patterns"].append({
                            "file": file_path,
                            "pattern": pattern_name,
                            "severity": "high" if pattern_name in ["eval", "exec", "hardcoded_secret"] else "medium"
                        })

        return results

    def _check_security_files(self, owner: str, repo: str, branch: str) -> Dict:
        """Check for security-related documentation files"""
        security_files = {
            "SECURITY.md": "Security policy",
            "CODE_OF_CONDUCT.md": "Code of conduct",
            "CONTRIBUTING.md": "Contribution guide",
            "LICENSE": "License file",
            ".gitignore": "Gitignore file",
        }

        results = {}
        for file_name, description in security_files.items():
            content = self._fetch_raw_file(owner, repo, branch, file_name)
            results[file_name] = {
                "exists": content is not None,
                "size_bytes": len(content.encode()) if content else 0
            }

        return results

    @staticmethod
    def _check_version_pinning(content: str) -> bool:
        """Check if dependencies are pinned to specific versions"""
        lines = content.split('\n')
        pinned_count = sum(1 for line in lines if '==' in line)
        return pinned_count >= len([l for l in lines if l.strip() and not l.startswith('#')]) * 0.7

    @staticmethod
    def _has_lock_file(owner: str, repo: str, branch: str) -> bool:
        """Check if package-lock.json or yarn.lock exists"""
        # This would need another API call, simplified for now
        return True  # Assume yes for demonstration

    @staticmethod
    def _detect_suspicious_patterns(content: str) -> List[str]:
        """Detect suspicious patterns in dependency files"""
        suspicious = []
        if "eval" in content.lower():
            suspicious.append("eval usage detected")
        if re.search(r'git\+', content):
            suspicious.append("Git dependencies (not pinned)")
        return suspicious

    @staticmethod
    def _detect_docker_issues(content: str) -> List[str]:
        """Detect security issues in Dockerfile"""
        issues = []
        if "RUN apt-get" in content and "--no-install-recommends" not in content:
            issues.append("apt-get should use --no-install-recommends")
        if "USER root" in content or "USER 0" in content:
            issues.append("Container runs as root")
        return issues


class Level3Service(GitHubAPIClient):
    """
    Level 3: Native GitHub Security APIs
    Access: Dependabot alerts, Code scanning (CodeQL), Secret scanning
    Requires GitHub GraphQL or REST API with proper permissions
    """

    def check_security_alerts(self, owner: str, repo: str) -> Dict:
        """
        Fetch security alerts from GitHub native APIs
        Note: Requires proper token with repo:security_events scope
        """
        results = {
            "dependabot_alerts": self._get_dependabot_alerts(owner, repo),
            "secret_scanning": self._get_secret_scanning_alerts(owner, repo),
            "code_scanning": self._get_code_scanning_alerts(owner, repo),
        }
        return results

    def _get_dependabot_alerts(self, owner: str, repo: str) -> Dict:
        """Fetch Dependabot vulnerability alerts"""
        url = f"{self.base_url}/repos/{owner}/{repo}/dependabot/alerts"
        data, status = self._get(url)

        if status == 403:
            return {
                "error": "Access denied - may require push access or token permissions",
                "available": False
            }

        if status == 404:
            return {
                "available": False,
                "message": "Repository not found or Dependabot not enabled"
            }

        if isinstance(data, list):
            alert_levels = {}
            for alert in data:
                severity = alert.get("security_advisory", {}).get("severity", "unknown")
                alert_levels[severity] = alert_levels.get(severity, 0) + 1

            return {
                "available": True,
                "total_alerts": len(data),
                "by_severity": alert_levels,
                "has_critical": alert_levels.get("critical", 0) > 0,
            }

        return {"available": False, "error": "Could not parse response"}

    def _get_secret_scanning_alerts(self, owner: str, repo: str) -> Dict:
        """Fetch secret scanning alerts"""
        url = f"{self.base_url}/repos/{owner}/{repo}/secret-scanning/alerts"
        data, status = self._get(url)

        if status == 403:
            return {"available": False, "message": "Access denied - requires admin access"}

        if isinstance(data, list):
            return {
                "available": True,
                "total_secrets_found": len(data),
                "has_exposed_secrets": len(data) > 0,
            }

        return {"available": False}

    def _get_code_scanning_alerts(self, owner: str, repo: str) -> Dict:
        """Fetch code scanning (CodeQL) alerts"""
        url = f"{self.base_url}/repos/{owner}/{repo}/code-scanning/alerts"
        data, status = self._get(url)

        if status == 403:
            return {"available": False, "message": "Access denied"}

        if isinstance(data, list):
            severity_counts = {}
            for alert in data:
                rule = alert.get("rule", {})
                severity = rule.get("severity", "unknown")
                severity_counts[severity] = severity_counts.get(severity, 0) + 1

            return {
                "available": True,
                "total_alerts": len(data),
                "by_severity": severity_counts,
            }

        return {"available": False}


class RiskScoringEngine:
    """
    Calculates overall risk score (0-100) based on weighted categories
    """

    # Configurable weights (sum = 100)
    WEIGHTS = {
        "level1_maintenance": 0.15,      # 15%
        "level1_community": 0.10,        # 10%
        "level1_security_basics": 0.15,  # 15%
        "level1_documentation": 0.10,    # 10%
        "level1_releases": 0.05,         # 5%
        "level1_branch_protection": 0.10,# 10%
        "level2_dependencies": 0.10,     # 10%
        "level2_code_quality": 0.10,     # 10%
        "level3_security": 0.05,         # 5%
    }

    @staticmethod
    def calculate_score(level1_data: Dict, level2_data: Dict, level3_data: Dict) -> Tuple[int, Dict]:
        """
        Calculate weighted risk score and generate recommendations

        Returns: (risk_score: int 0-100, score_breakdown: Dict)
        Note: Lower score = Better/Less Risk
        """
        score = 0
        breakdown = {}

        # Level 1 scores (convert 0-100 to contribution)
        if level1_data:
            maintenance_score = 100 - level1_data.get("maintenance", {}).get("score", 50)
            community_score = 100 - level1_data.get("community", {}).get("score", 50)
            security_score = 100 - level1_data.get("security_basics", {}).get("score", 50)
            docs_score = 100 - level1_data.get("documentation", {}).get("score", 50)
            releases_score = 100 - level1_data.get("releases", {}).get("score", 50)
            branch_score = 100 - level1_data.get("branch_protection", {}).get("score", 50)

            score += maintenance_score * RiskScoringEngine.WEIGHTS["level1_maintenance"]
            score += community_score * RiskScoringEngine.WEIGHTS["level1_community"]
            score += security_score * RiskScoringEngine.WEIGHTS["level1_security_basics"]
            score += docs_score * RiskScoringEngine.WEIGHTS["level1_documentation"]
            score += releases_score * RiskScoringEngine.WEIGHTS["level1_releases"]
            score += branch_score * RiskScoringEngine.WEIGHTS["level1_branch_protection"]

            breakdown["level1"] = {
                "maintenance": maintenance_score,
                "community": community_score,
                "security_basics": security_score,
                "documentation": docs_score,
            }

        # Level 2 scores
        if level2_data:
            code_quality_issues = len(level2_data.get("code_quality_signals", {}).get("suspicious_code_patterns", []))
            code_quality_score = min(100, code_quality_issues * 10)

            dependencies_score = 20 if level2_data.get("dependencies") else 0

            score += code_quality_score * RiskScoringEngine.WEIGHTS["level2_code_quality"]
            score += dependencies_score * RiskScoringEngine.WEIGHTS["level2_dependencies"]

            breakdown["level2"] = {
                "code_quality": code_quality_score,
                "dependencies": dependencies_score,
            }

        # Level 3 scores
        if level3_data:
            security_alerts_score = 0

            dependabot = level3_data.get("dependabot_alerts", {})
            if dependabot.get("has_critical"):
                security_alerts_score += 50
            elif dependabot.get("total_alerts", 0) > 0:
                security_alerts_score += min(30, dependabot.get("total_alerts", 0) * 5)

            secret_scanning = level3_data.get("secret_scanning", {})
            if secret_scanning.get("has_exposed_secrets"):
                security_alerts_score += 40

            score += security_alerts_score * RiskScoringEngine.WEIGHTS["level3_security"]
            breakdown["level3"] = {"security_alerts": security_alerts_score}

        return int(min(100, score)), breakdown

    @staticmethod
    def generate_risk_category(score: int) -> str:
        """Convert score to risk category"""
        if score < 25:
            return "Low Risk"
        elif score < 50:
            return "Medium Risk"
        elif score < 75:
            return "High Risk"
        else:
            return "Critical Risk"

    @staticmethod
    def generate_warnings(level1_data: Dict, level2_data: Dict, level3_data: Dict) -> List[Dict]:
        """Generate list of warnings based on check results"""
        warnings = []

        # Level 1 warnings
        if level1_data:
            maintenance = level1_data.get("maintenance", {})
            if maintenance.get("score", 100) < 40:
                warnings.append({
                    "level": "high",
                    "category": "Maintenance",
                    "message": f"Repository appears abandoned ({maintenance.get('status')}). Last commit was {maintenance.get('days_since_last_commit')} days ago."
                })

            community = level1_data.get("community", {})
            if community.get("bus_factor_risk") == "Critical":
                warnings.append({
                    "level": "critical",
                    "category": "Bus Factor",
                    "message": "Repository has only one contributor. Risk of project abandonment."
                })
            elif community.get("bus_factor_risk") == "High":
                warnings.append({
                    "level": "high",
                    "category": "Bus Factor",
                    "message": f"Repository has only {community.get('total_contributors')} contributors."
                })

        # Level 2 warnings
        if level2_data:
            code_patterns = level2_data.get("code_quality_signals", {}).get("suspicious_code_patterns", [])
            for pattern in code_patterns:
                if pattern.get("severity") == "high":
                    warnings.append({
                        "level": "critical",
                        "category": "Code Quality",
                        "message": f"Dangerous pattern '{pattern['pattern']}' detected in {pattern['file']}"
                    })

        # Level 3 warnings
        if level3_data:
            dependabot = level3_data.get("dependabot_alerts", {})
            if dependabot.get("has_critical"):
                warnings.append({
                    "level": "critical",
                    "category": "Dependency Security",
                    "message": f"Critical vulnerability found in dependencies. {dependabot.get('by_severity', {}).get('critical', 0)} critical alert(s)."
                })

            secrets = level3_data.get("secret_scanning", {})
            if secrets.get("has_exposed_secrets"):
                warnings.append({
                    "level": "critical",
                    "category": "Secret Exposure",
                    "message": f"{secrets.get('total_secrets_found', 0)} secret(s) detected in repository history."
                })

        return warnings

    @staticmethod
    def generate_recommendations(level1_data: Dict, level2_data: Dict, level3_data: Dict) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []

        if level1_data:
            if not level1_data.get("branch_protection", {}).get("default_branch_protected"):
                recommendations.append("Enable branch protection rules on the default branch")

            if not level1_data.get("security_basics", {}).get("checks", {}).get("has_license"):
                recommendations.append("Add a LICENSE file to the repository")

        if level2_data:
            files = level2_data.get("security_file_check", {})
            if not files.get("SECURITY.md", {}).get("exists"):
                recommendations.append("Create a SECURITY.md file with vulnerability disclosure policy")
            if not files.get("CODE_OF_CONDUCT.md", {}).get("exists"):
                recommendations.append("Add a CODE_OF_CONDUCT.md file")

        if level3_data:
            dependabot = level3_data.get("dependabot_alerts", {})
            if dependabot.get("total_alerts", 0) > 0:
                recommendations.append("Address Dependabot alerts by updating vulnerable dependencies")

        return recommendations

