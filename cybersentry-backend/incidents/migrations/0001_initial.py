from django.conf import settings
from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('accounts', '0002_organization_license_expiry_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='IncidentTicket',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source', models.CharField(choices=[('manual', 'Manual'), ('automated', 'Automated'), ('external_integration', 'External integration')], default='manual', max_length=32)),
                ('source_event_id', models.CharField(blank=True, max_length=128)),
                ('deduplication_key', models.CharField(blank=True, max_length=128)),
                ('title', models.CharField(max_length=255)),
                ('short_code', models.CharField(blank=True, max_length=32)),
                ('description', models.TextField(blank=True)),
                ('incident_type', models.CharField(blank=True, max_length=80)),
                ('category', models.CharField(blank=True, max_length=80)),
                ('subcategory', models.CharField(blank=True, max_length=80)),
                ('affected_asset', models.CharField(blank=True, max_length=255)),
                ('status', models.CharField(choices=[('new', 'New'), ('triaged', 'Triaged'), ('in_progress', 'In progress'), ('on_hold', 'On hold'), ('resolved', 'Resolved'), ('closed', 'Closed')], default='new', max_length=24)),
                ('priority', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')], default='medium', max_length=16)),
                ('severity', models.CharField(choices=[('informational', 'Informational'), ('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')], default='medium', max_length=16)),
                ('impact', models.CharField(choices=[('none', 'None'), ('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('widespread', 'Widespread')], default='low', max_length=16)),
                ('urgency', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('immediate', 'Immediate')], default='medium', max_length=16)),
                ('sla_policy', models.CharField(choices=[('none', 'No SLA'), ('bronze', 'Bronze'), ('silver', 'Silver'), ('gold', 'Gold'), ('platinum', 'Platinum'), ('custom', 'Custom')], default='none', max_length=16)),
                ('first_response_target_at', models.DateTimeField(blank=True, null=True)),
                ('first_response_at', models.DateTimeField(blank=True, null=True)),
                ('resolution_target_at', models.DateTimeField(blank=True, null=True)),
                ('due_at', models.DateTimeField(blank=True, null=True)),
                ('reported_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('detected_at', models.DateTimeField(blank=True, null=True)),
                ('acknowledged_at', models.DateTimeField(blank=True, null=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('closed_at', models.DateTimeField(blank=True, null=True)),
                ('last_status_change_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('environment', models.CharField(blank=True, max_length=50)),
                ('reporter_email', models.EmailField(blank=True, max_length=254)),
                ('customer_impact', models.TextField(blank=True)),
                ('mitigation', models.TextField(blank=True)),
                ('root_cause', models.TextField(blank=True)),
                ('resolution_summary', models.TextField(blank=True)),
                ('tags', models.JSONField(blank=True, default=list)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('assigned_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_incident_tickets', to=settings.AUTH_USER_MODEL)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_incident_tickets', to=settings.AUTH_USER_MODEL)),
                ('organization', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='incident_tickets', to='accounts.organization')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='updated_incident_tickets', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
                'indexes': [models.Index(fields=['organization', 'status'], name='incidents_i_organiz_d8fbc3_idx'), models.Index(fields=['organization', 'priority'], name='incidents_i_organiz_3a1eb4_idx'), models.Index(fields=['organization', 'severity'], name='incidents_i_organiz_5837b0_idx'), models.Index(fields=['organization', 'sla_policy'], name='incidents_i_organiz_4eb6f9_idx'), models.Index(fields=['organization', '-due_at'], name='incidents_i_organiz_683494_idx'), models.Index(fields=['organization', '-created_at'], name='incidents_i_organiz_11de2f_idx'), models.Index(fields=['source', 'source_event_id'], name='incidents_i_source_8803b6_idx')],
            },
        ),
    ]

