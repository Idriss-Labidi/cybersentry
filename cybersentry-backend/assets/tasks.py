from celery import shared_task
from django.conf import settings
from django.core.management import call_command


@shared_task(bind=True, ignore_result=True)
def run_automated_asset_health_checks_task(self):
    command_args: list[str] = []

    organization_id = getattr(settings, 'AUTOMATED_ASSET_HEALTH_CHECK_ORGANIZATION_ID', None)
    if organization_id is not None:
        command_args.extend(['--organization-id', str(organization_id)])

    if getattr(settings, 'AUTOMATED_ASSET_HEALTH_CHECK_FORCE', False):
        command_args.append('--force')

    call_command('run_automated_asset_health_checks', *command_args)

