from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import LoginHistory, Organization, User, UserSettings


class ProfileApiTests(APITestCase):
	def setUp(self):
		self.organization = Organization.objects.create(
			name='Acme Security',
			contact_email='contact@acme.test',
			allowed_domains='acme.test',
		)
		self.user = User.objects.create_user(
			username='analyst',
			email='analyst@acme.test',
			password='OldPassword123!',
			first_name='Amina',
			last_name='Rahman',
			role=User.Roles.ANALYST,
			organization=self.organization,
		)
		self.client = APIClient()
		self.client.force_authenticate(user=self.user)

	def test_profile_info_returns_identity_fields(self):
		response = self.client.get('/api/profile/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['full_name'], 'Amina Rahman')
		self.assertEqual(response.data['email'], 'analyst@acme.test')
		self.assertEqual(response.data['role'], 'Analyst')
		self.assertEqual(response.data['organization'], 'Acme Security')

	def test_change_password_updates_password_and_timestamp(self):
		response = self.client.post(
			'/api/profile/change-password/',
			{'old_password': 'OldPassword123!', 'new_password': 'NewStrongPass456!'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.user.refresh_from_db()
		self.assertTrue(self.user.check_password('NewStrongPass456!'))
		self.assertIsNotNone(self.user.password_changed_at)

	def test_login_history_endpoint_is_limited_to_five_entries(self):
		for index in range(6):
			LoginHistory.objects.create(
				user=self.user,
				ip_address=f'10.0.0.{index + 1}',
				user_agent='pytest-agent',
			)

		response = self.client.get('/api/profile/login-history/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data['entries']), 5)

	def test_security_status_marks_multiple_recent_ips_as_suspicious(self):
		LoginHistory.objects.create(user=self.user, ip_address='10.0.0.1', user_agent='agent-a')
		LoginHistory.objects.create(user=self.user, ip_address='10.0.0.2', user_agent='agent-b')

		response = self.client.get('/api/profile/security-status/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data['suspicious'])
		self.assertEqual(response.data['message'], 'Multiple IPs detected recently')

	def test_user_settings_endpoint_returns_masked_token(self):
		settings_obj = UserSettings.objects.get(user=self.user)
		settings_obj.github_token = 'ghp_1234567890'
		settings_obj.save(update_fields=['github_token'])

		response = self.client.get('/api/settings/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['github_token'], 'ghp********890')
		self.assertEqual(response.data['notification_alert_threshold'], 30)

	def test_user_settings_put_updates_fields(self):
		response = self.client.put(
			'/api/settings/',
			{
				'github_token': 'ghp_newtoken123',
				'use_cache': False,
				'cache_duration': 15,
				'preferred_theme': 'blue',
				'notification_alert_threshold': 78,
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		settings_obj = UserSettings.objects.get(user=self.user)
		self.assertEqual(settings_obj.github_token, 'ghp_newtoken123')
		self.assertFalse(settings_obj.use_cache)
		self.assertEqual(settings_obj.cache_duration, 15)
		self.assertEqual(settings_obj.preferred_theme, 'blue')
		self.organization.refresh_from_db()
		self.assertEqual(self.organization.notification_alert_threshold, 18)

	def test_user_settings_cache_duration_validation(self):
		response = self.client.put('/api/settings/', {'cache_duration': 0}, format='json')

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('cache_duration', response.data)

	def test_user_settings_notification_threshold_validation(self):
		response = self.client.put('/api/settings/', {'notification_alert_threshold': 101}, format='json')

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('notification_alert_threshold', response.data)


class OrganizationUserManagementApiTests(APITestCase):
	def setUp(self):
		self.organization = Organization.objects.create(
			name='Acme Security',
			contact_email='contact@acme.test',
			allowed_domains='acme.test',
		)
		self.other_organization = Organization.objects.create(
			name='Other Security',
			contact_email='contact@other.test',
			allowed_domains='other.test',
		)
		self.admin = User.objects.create_user(
			username='admin-user',
			email='admin@acme.test',
			password='AdminPass123!',
			role=User.Roles.ADMIN,
			organization=self.organization,
		)
		self.viewer = User.objects.create_user(
			username='viewer-user',
			email='viewer@acme.test',
			password='ViewerPass123!',
			role=User.Roles.VIEWER,
			organization=self.organization,
		)
		self.foreign_user = User.objects.create_user(
			username='foreign-user',
			email='foreign@other.test',
			password='ForeignPass123!',
			role=User.Roles.VIEWER,
			organization=self.other_organization,
		)
		self.client = APIClient()

	def test_admin_can_list_only_organization_users(self):
		self.client.force_authenticate(user=self.admin)

		response = self.client.get('/api/admin/users/')

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		emails = [item['email'] for item in response.data]
		self.assertNotIn(self.admin.email, emails)
		self.assertIn(self.viewer.email, emails)
		self.assertNotIn(self.foreign_user.email, emails)

	def test_admin_can_create_user_in_their_organization(self):
		self.client.force_authenticate(user=self.admin)

		response = self.client.post(
			'/api/admin/users/',
			{
				'email': 'new.member@acme.test',
				'first_name': 'New',
				'last_name': 'Member',
				'role': User.Roles.ANALYST,
				'password': 'NewUserPass123!',
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		created_user = User.objects.get(email='new.member@acme.test')
		self.assertEqual(created_user.organization, self.organization)
		self.assertEqual(created_user.role, User.Roles.ANALYST)
		self.assertTrue(created_user.check_password('NewUserPass123!'))

	def test_admin_can_update_existing_user(self):
		self.client.force_authenticate(user=self.admin)

		response = self.client.patch(
			f'/api/admin/users/{self.viewer.pk}/',
			{
				'first_name': 'Updated',
				'role': User.Roles.ANALYST,
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.viewer.refresh_from_db()
		self.assertEqual(self.viewer.first_name, 'Updated')
		self.assertEqual(self.viewer.role, User.Roles.ANALYST)

	def test_admin_can_delete_user(self):
		self.client.force_authenticate(user=self.admin)

		response = self.client.delete(f'/api/admin/users/{self.viewer.pk}/')

		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertFalse(User.objects.filter(pk=self.viewer.pk).exists())

	def test_admin_cannot_deactivate_the_last_active_admin(self):
		self.client.force_authenticate(user=self.admin)

		response = self.client.patch(
			f'/api/admin/users/{self.admin.pk}/',
			{'is_active': False},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('is_active', response.data)

	def test_non_admin_cannot_access_user_management(self):
		self.client.force_authenticate(user=self.viewer)

		response = self.client.get('/api/admin/users/')

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class LoginHistorySignalTests(TestCase):
	def setUp(self):
		self.organization = Organization.objects.create(
			name='Signal Org',
			contact_email='owner@signal.test',
			allowed_domains='signal.test',
		)
		self.user = User.objects.create_user(
			username='signal-user',
			email='signal@signal.test',
			password='SignalPass123!',
			organization=self.organization,
		)

	def test_client_login_records_login_history(self):
		logged_in = self.client.login(username='signal-user', password='SignalPass123!')

		self.assertTrue(logged_in)
		self.assertEqual(LoginHistory.objects.filter(user=self.user).count(), 1)

	def test_user_creation_auto_creates_settings(self):
		self.assertTrue(UserSettings.objects.filter(user=self.user).exists())

