# Generated by Django 5.2.3 on 2025-06-21 01:07

import cloudinary.models
import django.contrib.auth.models
import django.contrib.auth.validators
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('booking', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CustomUsers',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('email', models.EmailField(max_length=200, unique=True)),
                ('password', models.CharField(max_length=200)),
                ('role', models.CharField(choices=[('admin', 'Admin'), ('guest', 'Guest')], default='guest', max_length=20)),
                ('is_archived', models.BooleanField(default=False)),
                ('profile_image', cloudinary.models.CloudinaryField(blank=True, max_length=255, null=True, verbose_name='profile_image')),
                ('last_booking_date', models.DateField(blank=True, null=True)),
                ('valid_id_type', models.CharField(blank=True, choices=[('passport', 'Passport'), ('driver_license', "Driver's License"), ('national_id', 'National ID'), ('sss_id', 'SSS ID'), ('umid', 'Unified Multi-Purpose ID (UMID)'), ('philhealth_id', 'PhilHealth ID'), ('prc_id', 'PRC ID'), ('student_id', 'Student ID'), ('other', 'Other Government-Issued ID')], max_length=60, null=True)),
                ('valid_id_front', cloudinary.models.CloudinaryField(blank=True, max_length=255, null=True, verbose_name='valid_id_front')),
                ('valid_id_back', cloudinary.models.CloudinaryField(blank=True, max_length=255, null=True, verbose_name='valid_id_back')),
                ('is_verified', models.CharField(blank=True, choices=[('unverified', 'Unverified'), ('pending', 'Pending'), ('rejected', 'Rejected'), ('verified', 'Verified')], default='unverified', max_length=60, null=True)),
                ('valid_id_rejection_reason', models.TextField(blank=True, null=True)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'db_table': 'users',
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message', models.TextField()),
                ('notification_type', models.CharField(choices=[('reserved', 'Reserved'), ('no_show', 'No Show'), ('rejected', 'Rejected'), ('checkin_reminder', 'Checkin Reminder'), ('checked_in', 'Checked In'), ('checked_out', 'Checked Out'), ('cancelled', 'Cancelled')], max_length=20)),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('booking', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='booking.bookings')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'notifications',
            },
        ),
    ]
