from unittest.mock import patch

from django.contrib.auth import get_user_model
from oauth2_provider.models import AccessToken, Application
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from datetime import timedelta

from accounts.models import Organization
from dns_tools.models import DNSHealthScan
from github_health_check.models import GithubRepository, RepositoryCheckResult
from ip_tools.models import IPReputationScan
from .models import Asset, AssetAlert, AssetDnsChangeEvent, AssetDnsSnapshot, AssetRiskSnapshot


class AssetApiTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(
            name='CyberSentry',
            contact_email='contact@cybersentry.test',
            allowed_domains='cybersentry.test',
        )
        self.user = get_user_model().objects.create_user(
            username='analyst',
            email='analyst@cybersentry.test',
            password='StrongPassword123!',
            organization=self.organization,
        )
        self.application = Application.objects.create(
            name='Test App',
            client_type=Application.CLIENT_PUBLIC,
            authorization_grant_type=Application.GRANT_PASSWORD,
            user=self.user,
        )
        self.token = AccessToken.objects.create(
            user=self.user,
            scope='read write',
            expires=timezone.now() + timedelta(hours=1),
            token='test-access-token',
            application=self.application,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token.token}')

    def test_create_asset_with_tags(self):
        response = self.client.post(
            '/api/assets/',
            {
                'name': 'Main Website',
                'asset_type': 'website',
                'value': 'https://app.cybersentry.test',
                'category': 'production',
                'status': 'active',
                'description': 'Main customer-facing application',
                'tag_names': ['customer-facing', 'critical'],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Asset.objects.count(), 1)
        self.assertEqual(Asset.objects.first().tags.count(), 2)

    def test_summary_returns_asset_counts(self):
        Asset.objects.create(
            organization=self.organization,
            created_by=self.user,
            name='API Domain',
            asset_type='domain',
            value='api.cybersentry.test',
            category='production',
            risk_score=72,
        )

        response = self.client.get('/api/assets/summary/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_assets'], 1)
        self.assertEqual(response.data['high_risk_assets'], 1)

    def test_create_asset_auto_provisions_personal_workspace(self):
        self.user.organization = None
        self.user.save(update_fields=['organization'])

        response = self.client.post(
            '/api/assets/',
            {
                'name': 'Primary Domain',
                'asset_type': 'domain',
                'value': 'example.test',
                'category': 'production',
                'status': 'active',
                'description': 'Organization-less user bootstrap',
                'tag_names': ['external'],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.organization_id)
        self.assertEqual(Asset.objects.get().organization_id, self.user.organization_id)

    def test_lookup_returns_asset_with_normalized_github_url(self):
        asset = Asset.objects.create(
            organization=self.organization,
            created_by=self.user,
            name='Backend Repo',
            asset_type='github_repo',
            value='https://github.com/octocat/hello-world/',
            category='production',
            risk_score=40,
        )

        response = self.client.get(
            '/api/assets/lookup/',
            {'asset_type': 'github_repo', 'value': 'https://github.com/octocat/hello-world'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['found'])
        self.assertEqual(response.data['asset']['id'], asset.id)
        self.assertEqual(
            response.data['defaults']['value'],
            'https://github.com/octocat/hello-world',
        )

    def test_lookup_uses_requested_risk_score_in_defaults(self):
        response = self.client.get(
            '/api/assets/lookup/',
            {'asset_type': 'ip', 'value': '8.8.8.8', 'risk_score': 67},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['defaults']['risk_score'], 67)

    def test_lookup_is_scoped_to_current_organization(self):
        other_organization = Organization.objects.create(
            name='Other Org',
            contact_email='other@test.com',
            allowed_domains='test.com',
        )
        Asset.objects.create(
            organization=other_organization,
            name='Foreign IP',
            asset_type='ip',
            value='8.8.8.8',
            category='production',
            risk_score=30,
        )

        response = self.client.get(
            '/api/assets/lookup/',
            {'asset_type': 'ip', 'value': '8.8.8.8'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['found'])

    def test_related_context_returns_ip_scan_history(self):
        asset = Asset.objects.create(
            organization=self.organization,
            created_by=self.user,
            name='Gateway IP',
            asset_type='ip',
            value='8.8.8.8',
            category='production',
            risk_score=55,
        )
        scan = IPReputationScan.objects.create(
            user=self.user,
            ip_address='8.8.8.8',
            reputation_score=72,
            risk_level='medium',
            is_proxy=False,
            is_hosting=True,
            is_mobile=False,
            risk_factors=['Hosting provider'],
            geolocation={'country': 'United States'},
            network={'isp': 'Google'},
        )

        response = self.client.get(f'/api/assets/{asset.id}/related_context/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['asset_type'], 'ip')
        self.assertEqual(response.data['ip_reputation']['latest_scan']['id'], scan.id)
        self.assertEqual(len(response.data['ip_reputation']['history']), 1)

    def test_related_context_returns_github_history(self):
        asset = Asset.objects.create(
            organization=self.organization,
            created_by=self.user,
            name='Platform Repo',
            asset_type='github_repo',
            value='https://github.com/octocat/platform',
            category='production',
            risk_score=48,
        )
        repository = GithubRepository.objects.create(
            owner='octocat',
            name='platform',
            url='https://github.com/octocat/platform/',
            organization=self.organization,
        )
        check_result = RepositoryCheckResult.objects.create(
            repository=repository,
            checked_by=self.user,
            risk_score=61,
            summary='Moderate risk',
            warnings=[{'level': 'warning', 'message': 'Review secrets', 'category': 'security'}],
        )

        response = self.client.get(f'/api/assets/{asset.id}/related_context/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['asset_type'], 'github_repo')
        self.assertEqual(response.data['github_health']['repository']['id'], repository.id)
        self.assertEqual(response.data['github_health']['latest_result']['id'], check_result.id)
        self.assertEqual(len(response.data['github_health']['history']), 1)

    @patch('assets.views.dns_health_check')
    @patch('assets.services.perform_dns_lookup')
    def test_run_dns_monitor_creates_baseline_snapshot_for_domain_asset(self, dns_lookup_mock, dns_health_check_mock):
        asset = Asset.objects.create(
            organization=self.organization,
            created_by=self.user,
            name='Primary Domain',
            asset_type='domain',
            value='example.cybersentry.test',
            category='production',
            risk_score=40,
        )
        dns_lookup_mock.return_value = {
            'A': ['1.1.1.1'],
            'AAAA': [],
            'CNAME': [],
            'MX': ['10 mail.cybersentry.test.'],
            'TXT': ['"v=spf1 include:_spf.google.com ~all"'],
            'NS': ['ns1.cybersentry.test.', 'ns2.cybersentry.test.'],
            'SOA': ['ns1.cybersentry.test. hostmaster.cybersentry.test. 1 7200 3600 1209600 3600'],
        }
        dns_health_check_mock.return_value = {
            'domain': asset.value,
            'score': 86,
            'grade': 'B',
            'checks': {'a_record': {'status': 'OK'}},
            'recommendations': [],
        }

        response = self.client.post(f'/api/assets/{asset.id}/run_dns_monitor/', {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['snapshot']['status'], 'success')
        self.assertEqual(response.data['changes'], [])
        self.assertIsNone(response.data['alert'])
        self.assertEqual(response.data['health_check']['score'], 86)
        self.assertEqual(AssetDnsSnapshot.objects.filter(asset=asset).count(), 1)
        self.assertEqual(AssetDnsChangeEvent.objects.filter(asset=asset).count(), 0)
        self.assertEqual(AssetAlert.objects.filter(asset=asset).count(), 0)
        self.assertEqual(DNSHealthScan.objects.filter(user=self.user, domain_name=asset.value).count(), 1)
        asset.refresh_from_db()
        self.assertEqual(asset.risk_score, 86)
        self.assertIsNotNone(asset.last_scanned_at)
        self.assertTrue(
            AssetRiskSnapshot.objects.filter(
                asset=asset,
                score=86,
                source='dns-health',
            ).exists()
        )

    @patch('assets.views.dns_health_check')
    @patch('assets.services.perform_dns_lookup')
    def test_run_dns_monitor_detects_changes_and_creates_alert(self, dns_lookup_mock, dns_health_check_mock):
        asset = Asset.objects.create(
            organization=self.organization,
            created_by=self.user,
            name='Primary Domain',
            asset_type='domain',
            value='example.cybersentry.test',
            category='production',
            risk_score=40,
        )
        dns_lookup_mock.side_effect = [
            {
                'A': ['1.1.1.1'],
                'AAAA': [],
                'CNAME': [],
                'MX': ['10 mail.cybersentry.test.'],
                'TXT': ['"v=spf1 include:_spf.google.com ~all"'],
                'NS': ['ns1.cybersentry.test.', 'ns2.cybersentry.test.'],
                'SOA': ['ns1.cybersentry.test. hostmaster.cybersentry.test. 1 7200 3600 1209600 3600'],
            },
            {
                'A': ['2.2.2.2'],
                'AAAA': [],
                'CNAME': [],
                'MX': ['10 mail.cybersentry.test.'],
                'TXT': ['"v=spf1 include:_spf.google.com -all"'],
                'NS': ['ns1.cybersentry.test.', 'ns2.cybersentry.test.'],
                'SOA': ['ns1.cybersentry.test. hostmaster.cybersentry.test. 1 7200 3600 1209600 3600'],
            },
        ]
        dns_health_check_mock.side_effect = [
            {
                'domain': asset.value,
                'score': 91,
                'grade': 'A',
                'checks': {'a_record': {'status': 'OK'}},
                'recommendations': [],
            },
            {
                'domain': asset.value,
                'score': 63,
                'grade': 'C',
                'checks': {'a_record': {'status': 'OK'}, 'spf': {'status': 'MISSING'}},
                'recommendations': [{'priority': 'HIGH', 'issue': 'Missing SPF', 'recommendation': 'Add SPF'}],
            },
        ]

        first_response = self.client.post(f'/api/assets/{asset.id}/run_dns_monitor/', {}, format='json')
        second_response = self.client.post(f'/api/assets/{asset.id}/run_dns_monitor/', {}, format='json')

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(second_response.data['changes']), 2)
        self.assertIsNotNone(second_response.data['alert'])
        self.assertEqual(second_response.data['alert']['alert_type'], 'dns_change')
        self.assertEqual(second_response.data['health_check']['score'], 63)
        self.assertEqual(AssetDnsSnapshot.objects.filter(asset=asset).count(), 2)
        self.assertEqual(AssetDnsChangeEvent.objects.filter(asset=asset).count(), 2)
        self.assertEqual(DNSHealthScan.objects.filter(user=self.user, domain_name=asset.value).count(), 2)
        self.assertTrue(
            AssetAlert.objects.filter(
                asset=asset,
                alert_type=AssetAlert.AlertTypes.DNS_CHANGE,
            ).exists()
        )

        related_context_response = self.client.get(f'/api/assets/{asset.id}/related_context/')
        self.assertEqual(related_context_response.status_code, status.HTTP_200_OK)
        self.assertEqual(related_context_response.data['asset_type'], 'domain')
        self.assertEqual(related_context_response.data['dns_monitor']['latest_snapshot']['status'], 'success')
        self.assertEqual(len(related_context_response.data['dns_monitor']['recent_changes']), 2)
        self.assertEqual(len(related_context_response.data['dns_monitor']['alerts']), 1)
        self.assertEqual(related_context_response.data['dns_monitor']['latest_health_check']['score'], 63)
        self.assertEqual(len(related_context_response.data['dns_monitor']['health_history']), 2)

        snapshots_response = self.client.get(f'/api/assets/{asset.id}/dns_snapshots/')
        changes_response = self.client.get(f'/api/assets/{asset.id}/dns_changes/')
        self.assertEqual(snapshots_response.status_code, status.HTTP_200_OK)
        self.assertEqual(changes_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(snapshots_response.data['entries']), 2)
        self.assertEqual(len(changes_response.data['entries']), 2)
        asset.refresh_from_db()
        self.assertEqual(asset.risk_score, 63)

    @patch('assets.views.check_ip_reputation_with_history')
    def test_run_ip_reputation_from_ip_asset(self, reputation_mock):
        asset = Asset.objects.create(
            organization=self.organization,
            created_by=self.user,
            name='Gateway IP',
            asset_type='ip',
            value='1.1.1.1',
            category='production',
            risk_score=20,
        )
        reputation_mock.return_value = {
            'ip': '1.1.1.1',
            'score': 15,
            'risk_level': 'low',
            'risk_factors': [],
            'is_proxy': False,
            'is_hosting': False,
            'is_mobile': False,
            'geolocation': {},
            'network': {},
        }

        response = self.client.post(f'/api/assets/{asset.id}/run_ip_reputation/', {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['result']['ip'], '1.1.1.1')
        reputation_mock.assert_called_once_with('1.1.1.1', user=self.user)
        asset.refresh_from_db()
        self.assertEqual(asset.risk_score, 15)
        self.assertIsNotNone(asset.last_scanned_at)
        self.assertTrue(
            AssetRiskSnapshot.objects.filter(
                asset=asset,
                score=15,
                source='ip-reputation',
            ).exists()
        )

    @patch('assets.views.run_repository_health_check')
    def test_run_github_health_from_github_asset(self, github_check_mock):
        asset = Asset.objects.create(
            organization=self.organization,
            created_by=self.user,
            name='Backend Repo',
            asset_type='github_repo',
            value='https://github.com/octocat/backend',
            category='production',
            risk_score=18,
        )
        github_check_mock.return_value = (
            {
                'result': {
                    'id': 7,
                    'risk_score': 33,
                    'summary': 'Low risk',
                }
            },
            status.HTTP_201_CREATED,
        )

        response = self.client.post(f'/api/assets/{asset.id}/run_github_health/', {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        github_check_mock.assert_called_once()
        self.assertEqual(github_check_mock.call_args.kwargs['url'], 'https://github.com/octocat/backend')
        asset.refresh_from_db()
        self.assertEqual(asset.risk_score, 33)
        self.assertIsNotNone(asset.last_scanned_at)
        self.assertTrue(
            AssetRiskSnapshot.objects.filter(
                asset=asset,
                score=33,
                source='github-health',
            ).exists()
        )

    def test_run_actions_reject_incompatible_asset_types(self):
        asset = Asset.objects.create(
            organization=self.organization,
            created_by=self.user,
            name='Main Website',
            asset_type='website',
            value='https://app.cybersentry.test',
            category='production',
            risk_score=25,
        )

        ip_response = self.client.post(f'/api/assets/{asset.id}/run_ip_reputation/', {}, format='json')
        github_response = self.client.post(f'/api/assets/{asset.id}/run_github_health/', {}, format='json')
        dns_response = self.client.post(f'/api/assets/{asset.id}/run_dns_monitor/', {}, format='json')
        dns_snapshots_response = self.client.get(f'/api/assets/{asset.id}/dns_snapshots/')
        dns_changes_response = self.client.get(f'/api/assets/{asset.id}/dns_changes/')

        self.assertEqual(ip_response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(github_response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(dns_response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(dns_snapshots_response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(dns_changes_response.status_code, status.HTTP_409_CONFLICT)
