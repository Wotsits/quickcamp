# Generated by Django 3.1.7 on 2021-05-02 18:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookingsbackend', '0021_auto_20210502_1622'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='locked',
            field=models.BooleanField(default=False),
        ),
    ]
