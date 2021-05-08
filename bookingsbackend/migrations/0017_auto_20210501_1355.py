# Generated by Django 3.1.7 on 2021-05-01 13:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookingsbackend', '0016_auto_20210501_1353'),
    ]

    operations = [
        migrations.AlterField(
            model_name='booking',
            name='eta',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='payment',
            name='method',
            field=models.CharField(choices=[('Card', 'Card'), ('Cash', 'Cash'), ('BACS', 'BACS')], max_length=20),
        ),
    ]
