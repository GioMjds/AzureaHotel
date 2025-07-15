from django.db import models
from property.models import Rooms, Areas

# Create your models here.
class ArchivedUser(models.Model):
    user_id = models.IntegerField()
    email = models.EmailField()
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=50)
    archived_at = models.DateTimeField(auto_now_add=True)
    archived_by = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'archived_users'

class Commissions(models.Model):
    # Core order information from CraveOn
    craveon_order_id = models.IntegerField()  # References orders.order_id from CraveOn DB
    
    # Hotel booking information
    booking_id = models.IntegerField(null=True, blank=True)  # References hotel booking
    room = models.ForeignKey(Rooms, on_delete=models.SET_NULL, null=True, blank=True, related_name='commissions')
    area = models.ForeignKey(Areas, on_delete=models.SET_NULL, null=True, blank=True, related_name='commissions')
    guest_name = models.CharField(max_length=200, null=True, blank=True)
    guest_email = models.EmailField(null=True, blank=True)
    
    # Financial data
    total_order_value = models.DecimalField(max_digits=10, decimal_places=2)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)  # Percentage
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Order status tracking
    order_status = models.CharField(max_length=20, choices=[
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
        ('Reviewed', 'Reviewed')
    ], default='Pending')
    
    # Timestamps
    ordered_at = models.DateTimeField()  # From CraveOn order
    commission_recorded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional tracking
    is_paid = models.BooleanField(default=False)  # Track if commission has been processed
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'commissions'
        ordering = ['-ordered_at']
        
    def __str__(self):
        return f"Commission #{self.id} - Order #{self.craveon_order_id} - {self.commission_amount}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate commission amount if not set
        if not self.commission_amount:
            self.commission_amount = (self.total_order_value * self.commission_rate) / 100
        super().save(*args, **kwargs)
