from django.core.management.base import BaseCommand

from assets.services import run_all_organizations_automated_health_checks


class Command(BaseCommand):
    help = 'Run automated security health checks for organization assets (intended for a 24h scheduler).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--organization-id',
            type=int,
            default=None,
            help='Optional organization ID to scope execution to one organization.',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force scanning even if an asset was scanned in the last 24 hours.',
        )

    def handle(self, *args, **options):
        report = run_all_organizations_automated_health_checks(
            organization_id=options['organization_id'],
            force=options['force'],
        )

        total_scanned = sum(item.get('scanned', 0) for item in report)
        total_skipped = sum(item.get('skipped', 0) for item in report)
        total_failed = sum(item.get('failed', 0) for item in report)

        for item in report:
            self.stdout.write(
                f"Org {item.get('organization_id')}: scanned={item.get('scanned', 0)} "
                f"skipped={item.get('skipped', 0)} failed={item.get('failed', 0)}"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Automated scans complete. scanned={total_scanned} skipped={total_skipped} failed={total_failed}'
            )
        )

