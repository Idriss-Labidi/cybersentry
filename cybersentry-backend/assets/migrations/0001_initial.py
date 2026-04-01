from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('accounts', '0004_usersettings'),
    ]

    operations = [
        migrations.CreateModel(
            name='AssetTag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('organization', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='asset_tags', to='accounts.organization')),
            ],
            options={
                'ordering': ['name'],
                'unique_together': {('organization', 'name')},
            },
        ),
        migrations.CreateModel(
            name='Asset',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('asset_type', models.CharField(choices=[('domain', 'Domain'), ('ip', 'IP'), ('website', 'Website'), ('github_repo', 'GitHub Repository')], max_length=20)),
                ('value', models.CharField(max_length=255)),
                ('category', models.CharField(choices=[('production', 'Production'), ('development', 'Development'), ('test', 'Test')], default='production', max_length=20)),
                ('status', models.CharField(choices=[('active', 'Active'), ('paused', 'Paused'), ('archived', 'Archived')], default='active', max_length=20)),
                ('description', models.TextField(blank=True)),
                ('risk_score', models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])),
                ('last_scanned_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, related_name='created_assets', to=settings.AUTH_USER_MODEL)),
                ('organization', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='assets', to='accounts.organization')),
                ('tags', models.ManyToManyField(blank=True, related_name='assets', to='assets.assettag')),
            ],
            options={
                'ordering': ['name', 'value'],
                'unique_together': {('organization', 'asset_type', 'value')},
            },
        ),
        migrations.CreateModel(
            name='AssetRiskSnapshot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('score', models.PositiveSmallIntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])),
                ('source', models.CharField(default='manual', max_length=100)),
                ('note', models.CharField(blank=True, max_length=255)),
                ('calculated_at', models.DateTimeField(auto_now_add=True)),
                ('asset', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='risk_snapshots', to='assets.asset')),
            ],
            options={
                'ordering': ['-calculated_at'],
            },
        ),
        migrations.AddIndex(
            model_name='asset',
            index=models.Index(fields=['organization', 'asset_type'], name='assets_asse_organiz_2c4606_idx'),
        ),
        migrations.AddIndex(
            model_name='asset',
            index=models.Index(fields=['organization', 'category'], name='assets_asse_organiz_f76f08_idx'),
        ),
        migrations.AddIndex(
            model_name='asset',
            index=models.Index(fields=['organization', 'status'], name='assets_asse_organiz_ad90f0_idx'),
        ),
        migrations.AddIndex(
            model_name='asset',
            index=models.Index(fields=['organization', 'risk_score'], name='assets_asse_organiz_f5c4c5_idx'),
        ),
        migrations.AddIndex(
            model_name='assetrisksnapshot',
            index=models.Index(fields=['asset', '-calculated_at'], name='assets_asse_asset_i_0134c2_idx'),
        ),
    ]
