from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0005_usersettings_notification_channels'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='notification_alert_threshold',
            field=models.PositiveSmallIntegerField(
                default=70,
                help_text='Notify when a test score is less than or equal to this threshold.',
                validators=[MinValueValidator(0), MaxValueValidator(100)],
            ),
        ),
    ]


