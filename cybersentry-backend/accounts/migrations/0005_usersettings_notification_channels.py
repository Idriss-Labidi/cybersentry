from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0004_usersettings'),
    ]

    operations = [
        migrations.AddField(
            model_name='usersettings',
            name='notifications_email_enabled',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='usersettings',
            name='notifications_webhook_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='usersettings',
            name='slack_webhook_url',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='usersettings',
            name='teams_webhook_url',
            field=models.URLField(blank=True),
        ),
    ]

