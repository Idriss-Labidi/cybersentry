from datetime import timedelta
from unittest.mock import patch

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Organization, User, UserSettings
from assets.models import Asset
from .models import GithubRepository, RepositoryCheckResult


class GitHubSettingsIntegrationTests(APITestCase):
	def setUp(self):
		self.organization = Organization.objects.create(
			name='GitHub Org',
			contact_email='org@github.test',
			allowed_domains='github.test',
		)
		self.user = User.objects.create_user(
			username='github-user',
			email='dev@github.test',
			password='SecurePass123!',
			organization=self.organization,
		)
		self.client.force_authenticate(user=self.user)

	@patch('github_health_check.views._run_checks')
	def test_check_repository_uses_user_settings_token_by_default(self, run_checks_mock):
		run_checks_mock.return_value = {'level1': {}, 'level2': {}, 'level3': {}}

		settings_obj = UserSettings.objects.get(user=self.user)
		settings_obj.github_token = 'ghp_savedtoken'
		settings_obj.save(update_fields=['github_token'])

		response = self.client.post(
			'/github-health/check_repository/',
			{'url': 'https://github.com/octocat/Hello-World'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		_, _, _, used_token = run_checks_mock.call_args.args
		self.assertEqual(used_token, 'ghp_savedtoken')

	@patch('github_health_check.views._run_checks')
	def test_request_token_overrides_user_settings_token(self, run_checks_mock):
		run_checks_mock.return_value = {'level1': {}, 'level2': {}, 'level3': {}}

		settings_obj = UserSettings.objects.get(user=self.user)
		settings_obj.github_token = 'ghp_savedtoken'
		settings_obj.save(update_fields=['github_token'])

		response = self.client.post(
			'/github-health/check_repository/',
			{
				'url': 'https://github.com/octocat/Spoon-Knife',
				'github_token': 'ghp_requesttoken',
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		_, _, _, used_token = run_checks_mock.call_args.args
		self.assertEqual(used_token, 'ghp_requesttoken')

	@patch('github_health_check.views._run_checks')
	def test_settings_cache_duration_is_used_for_cache_hits(self, run_checks_mock):
		run_checks_mock.return_value = {'level1': {}, 'level2': {}, 'level3': {}}

		settings_obj = UserSettings.objects.get(user=self.user)
		settings_obj.cache_duration = 120
		settings_obj.use_cache = True
		settings_obj.save(update_fields=['cache_duration', 'use_cache'])

		repository = GithubRepository.objects.create(
			owner='octocat',
			name='Hello-World',
			url='https://github.com/octocat/Hello-World',
			organization=self.organization,
		)
		old_result = RepositoryCheckResult.objects.create(
			repository=repository,
			checked_by=self.user,
			risk_score=42,
			summary='cached',
		)
		RepositoryCheckResult.objects.filter(id=old_result.id).update(
			check_timestamp=timezone.now() - timedelta(minutes=90)
		)

		response = self.client.post(
			'/github-health/check_repository/',
			{'url': 'https://github.com/octocat/Hello-World'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('120 minutes', response.data['message'])
		run_checks_mock.assert_not_called()

	def test_repository_history_returns_empty_list_when_repository_has_no_history(self):
		response = self.client.get(
			'/github-health/repository_history/',
			{'url': 'https://github.com/octocat/No-History'},
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data, [])

	def test_repository_history_returns_all_results_when_url_is_missing(self):
		repository = GithubRepository.objects.create(
			owner='octocat',
			name='History-All',
			url='https://github.com/octocat/History-All',
			organization=self.organization,
		)
		second_repository = GithubRepository.objects.create(
			owner='octocat',
			name='History-All-2',
			url='https://github.com/octocat/History-All-2',
			organization=self.organization,
		)
		first_result = RepositoryCheckResult.objects.create(
			repository=repository,
			checked_by=self.user,
			risk_score=42,
			summary='first',
		)
		second_result = RepositoryCheckResult.objects.create(
			repository=second_repository,
			checked_by=self.user,
			risk_score=18,
			summary='second',
		)

		response = self.client.get('/github-health/repository_history/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual({entry['id'] for entry in response.data}, {first_result.id, second_result.id})

	@patch('github_health_check.views._run_checks')
	def test_check_repository_auto_provisions_personal_workspace(self, run_checks_mock):
		run_checks_mock.return_value = {'level1': {}, 'level2': {}, 'level3': {}}
		self.user.organization = None
		self.user.save(update_fields=['organization'])

		response = self.client.post(
			'/github-health/check_repository/',
			{'url': 'https://github.com/octocat/Bootstrap-Org'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.user.refresh_from_db()
		self.assertIsNotNone(self.user.organization_id)

	def test_delete_check_result_removes_result(self):
		repository = GithubRepository.objects.create(
			owner='octocat',
			name='Delete-Me',
			url='https://github.com/octocat/Delete-Me',
			organization=self.organization,
			last_check_at=timezone.now(),
		)
		check_result = RepositoryCheckResult.objects.create(
			repository=repository,
			checked_by=self.user,
			risk_score=18,
			summary='low risk',
		)

		response = self.client.delete(f'/github-health/check-results/{check_result.id}/')

		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertFalse(RepositoryCheckResult.objects.filter(id=check_result.id).exists())

	@patch('github_health_check.views._run_checks')
	def test_check_repository_syncs_linked_asset_score(self, run_checks_mock):
		run_checks_mock.return_value = {
			'level1': {},
			'level2': {},
			'level3': {},
		}
		Asset.objects.create(
			organization=self.organization,
			created_by=self.user,
			name='Linked Repo',
			asset_type='github_repo',
			value='https://github.com/octocat/hello-world',
			category='production',
			risk_score=12,
		)

		response = self.client.post(
			'/github-health/check_repository/',
			{'url': 'https://github.com/octocat/Hello-World'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		asset = Asset.objects.get(value='https://github.com/octocat/hello-world')
		self.assertEqual(asset.risk_score, response.data['result']['risk_score'])
