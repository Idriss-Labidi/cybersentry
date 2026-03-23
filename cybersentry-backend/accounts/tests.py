from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import LoginHistory, Organization, User


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
