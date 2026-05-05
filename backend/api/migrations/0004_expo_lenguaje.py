# Generated migration for adding language field to Expo after propietari field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_alter_expo_propietari'),
    ]

    operations = [
        migrations.AddField(
            model_name='expo',
            name='lenguaje',
            field=models.CharField(
                choices=[('ES', 'Español'), ('CA', 'Català'), ('EN', 'English'), ('FR', 'Français')],
                default='ES',
                max_length=2
            ),
        ),
    ]
