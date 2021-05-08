# Generated by Django 3.1.7 on 2021-05-01 15:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookingsbackend', '0019_auto_20210501_1526'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='balance',
            field=models.FloatField(default=0),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='payment',
            name='method',
            field=models.CharField(choices=[('Card', 'Card'), ('Cash', 'Cash'), ('BACS', 'BACS')], max_length=20),
        ),
    ]
