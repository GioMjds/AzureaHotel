from django.db import models
from django.contrib.auth.models import AbstractUser
from cloudinary.models import CloudinaryField

PWD_SENIOR_DISCOUNT_PERCENT = 10

# Create your models here.
class CustomUsers(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('guest', 'Guest'),
    ]
    VALID_ID_CHOICES = [
        ('passport', 'Passport'),
        ('driver_license', "Driver's License"),
        ('national_id', 'National ID'),
        ('sss_id', 'SSS ID'),
        ('umid', 'Unified Multi-Purpose ID (UMID)'),
        ('philhealth_id', 'PhilHealth ID'),
        ('prc_id', 'PRC ID'),
        ('student_id', 'Student ID'),
        ('senior_citizen_id', 'Senior Citizen ID'),
        ('other', 'Other Government-Issued ID'),
    ]
    VALID_ID_STATUS = [
        ('unverified', 'Unverified'),
        ('pending', 'Pending'),
        ('rejected', 'Rejected'),
        ('verified', 'Verified')
    ]
    email = models.EmailField(unique=True, max_length=200)
    password = models.CharField(max_length=200)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='guest',
    )
    is_archived = models.BooleanField(default=False)
    profile_image = CloudinaryField('profile_image', null=True, blank=True)
    last_booking_date = models.DateField(null=True, blank=True)
    valid_id_type = models.CharField(max_length=60, null=True, blank=True, choices=VALID_ID_CHOICES)
    valid_id_front = CloudinaryField('valid_id_front', null=True, blank=True)
    valid_id_back = CloudinaryField('valid_id_back', null=True, blank=True)
    is_verified = models.CharField(max_length=60, null=True, blank=True, choices=VALID_ID_STATUS, default='unverified')
    valid_id_rejection_reason = models.TextField(null=True, blank=True)
    is_senior_or_pwd = models.BooleanField(default=False)

    class Meta: 
        db_table = 'users'

class Notification(models.Model):
    TYPE_CHOICES = [
        ('reserved', 'Reserved'),
        ('no_show', 'No Show'),
        ('rejected', 'Rejected'),
        ('checkin_reminder', 'Checkin Reminder'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('cancelled', 'Cancelled'),
    ]
    
    user = models.ForeignKey(CustomUsers, on_delete=models.CASCADE)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    booking = models.ForeignKey('booking.Bookings', on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'

class CraveOnUser(models.Model):
    user_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100)
    email = models.CharField(max_length=100)
    contact = models.CharField(max_length=11)
    address = models.TextField()
    password = models.CharField(max_length=100)
    is_archived = models.BooleanField(default=False)
    status = models.CharField(max_length=20, default='Active')
    user_img = models.TextField(null=True, blank=True)

    class Meta:
        managed = False  # Don't let Django manage this table
        db_table = 'customers'
        app_label = 'craveon'  # Use a separate app label for routing