# Generated by Django 5.2.3 on 2025-07-12 01:31

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0004_craveoncategory_craveonitem_craveonuser_and_more'),
    ]

    operations = [
        migrations.DeleteModel(
            name='CraveOnCategory',
        ),
        migrations.DeleteModel(
            name='CraveOnItem',
        ),
        migrations.DeleteModel(
            name='CraveOnUser',
        ),
    ]
