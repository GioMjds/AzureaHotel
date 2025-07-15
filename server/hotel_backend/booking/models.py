from django.db import models
from property.models import Rooms, Areas
from user_roles.models import CustomUsers
from cloudinary.models import CloudinaryField
from django.contrib.auth import get_user_model
from property.models import Rooms, Areas

User = get_user_model()

# Create your models here.
class Bookings(models.Model):
    BOOKING_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reserved', 'Reserved'),
        ('confirmed', 'Confirmed'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('cancelled', 'Cancelled'),
        ('rejected', 'Rejected'),
        ('missed_reservation', 'Missed Reservation'),
    ]
    PAYMENT_METHOD_CHOICES = [
        ('physical', 'Physical Payment'),
        ('gcash', 'GCash'),
    ]
    user = models.ForeignKey(CustomUsers, on_delete=models.CASCADE, related_name='bookings')
    room = models.ForeignKey(Rooms, on_delete=models.CASCADE, related_name='bookings', null=True, blank=True)
    area = models.ForeignKey(Areas, on_delete=models.CASCADE, related_name='area_bookings', null=True, blank=True)
    check_in_date = models.DateField(null=False, blank=False)
    check_out_date = models.DateField(null=False, blank=False)
    status = models.CharField(
        max_length=20,
        choices=BOOKING_STATUS_CHOICES,
        default='pending',
    )
    phone_number = models.CharField(max_length=15, null=False, blank=True, verbose_name="Phone Number")
    special_request = models.TextField(null=True, blank=True)
    cancellation_date = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(null=True, blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    down_payment = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_venue_booking = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    time_of_arrival = models.TimeField(null=True, blank=True, default=None)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    payment_status = models.CharField(max_length=20, default='unpaid')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='gcash')
    payment_proof = CloudinaryField('payment_proof', null=True, blank=True)
    payment_date = models.DateTimeField(null=True, blank=True)
    number_of_guests = models.PositiveIntegerField(default=1)
    is_discounted = models.BooleanField(default=False)
    has_food_order = models.BooleanField(default=False)

    def apply_pwd_senior_discount(self):
        from user_roles.models import PWD_SENIOR_DISCOUNT_PERCENT
        if not self.is_discounted and self.total_price:
            self.total_price = float(self.total_price) * (1 - PWD_SENIOR_DISCOUNT_PERCENT / 100)
            self.is_discounted = True
            self.save()
    
    class Meta:
        db_table = 'bookings'
    
    def __str__(self):
        if self.is_venue_booking and self.area:
            return f"{self.user.email} - {self.area.area_name} - {self.status}"
        elif self.room:
            return f"{self.user.email} - {self.room.room_number} - {self.status}"
        else:
            return f"{self.user.email} - Unknown Property - {self.status}"
    
    def is_editable(self):
        return self.status not in ['reserved', 'checked_in', 'checked_out', 'cancelled', 'rejected']
    
    def is_cancellable(self):
        return self.status in ['pending', 'confirmed', 'reserved']
    
    def is_active(self):
        return self.status in ['confirmed', 'reserved', 'checked_in']
    
    def get_duration_days(self):
        if self.check_in_date and self.check_out_date:
            delta = self.check_out_date - self.check_in_date
            return delta.days
        return 0

class Transactions(models.Model):
    TRANSACTION_TYPE_CHOICES = [
        ('booking', 'Booking'),
        ('reservation', 'Reservation'),
        ('cancellation_refund', 'Cancellation Refund'),
    ]
    TRANSACTION_STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('pending', 'Pending'),
        ('failed', 'Failed'),
    ]
    booking = models.ForeignKey(Bookings, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    user = models.ForeignKey(CustomUsers, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(
        max_length=30,
        choices=TRANSACTION_TYPE_CHOICES,
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_date = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=TRANSACTION_STATUS_CHOICES,
        default='pending',
    )
    
    class Meta:
        db_table = 'transactions'

class Reviews(models.Model):
    RATING_CHOICES = [
        (1, '1'),
        (2, '2'),
        (3, '3'),
        (4, '4'),
        (5, '5'),
    ]
    user = models.ForeignKey(CustomUsers, on_delete=models.CASCADE, related_name='reviews')
    booking = models.ForeignKey(Bookings, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    room = models.ForeignKey(Rooms, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    area = models.ForeignKey(Areas, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    review_text = models.TextField(blank=True) 
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'

# CraveOn Categories model
class CraveOnCategory(models.Model):
    category_id = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=100)
    is_archived = models.BooleanField(default=False)

    class Meta:
        managed = False
        db_table = 'categories'
        app_label = 'craveon'

    def __str__(self):
        return self.category_name

# CraveOn Items model
class CraveOnItem(models.Model):
    item_id = models.AutoField(primary_key=True)
    item_name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.BinaryField()
    category = models.ForeignKey(CraveOnCategory, on_delete=models.CASCADE, db_column='category_id')
    is_archived = models.BooleanField(default=False)

    class Meta:
        managed = False
        db_table = 'items'
        app_label = 'craveon'

    def __str__(self):
        return self.item_name

# CraveOn Orders model
class CraveOnOrder(models.Model):
    ORDER_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
        ('Reviewed', 'Reviewed'),
    ]
    
    order_id = models.AutoField(primary_key=True)
    user_id = models.IntegerField()  # References CraveOn users table
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='Pending')
    payment_ss = models.TextField(null=True, blank=True)
    payment_submitted = models.BooleanField(default=False)
    reviewed = models.BooleanField(default=False)
    cancellation_reason = models.TextField(null=True, blank=True)
    ordered_at = models.DateTimeField(auto_now_add=True)
    booking_id = models.IntegerField(null=True, blank=True)  # References hotel booking
    hotel_room_area = models.CharField(max_length=100, null=True, blank=True)
    guest_email = models.CharField(max_length=100, null=True, blank=True)
    guest_name = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'orders'
        app_label = 'craveon'

    def __str__(self):
        return f"Order {self.order_id} - {self.guest_name} - {self.status}"

# CraveOn Order Items model
class CraveOnOrderItem(models.Model):
    order_item_id = models.AutoField(primary_key=True)
    order_id = models.IntegerField()  # References CraveOn orders table
    item_id = models.IntegerField()   # References CraveOn items table
    quantity = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'order_items'
        app_label = 'craveon'

    def __str__(self):
        return f"Order {self.order_id} - Item {self.item_id} - Qty: {self.quantity}"

# CraveOn Reviews model
class CraveOnReview(models.Model):
    id = models.AutoField(primary_key=True)
    order_id = models.IntegerField()  # References CraveOn orders table
    rating = models.IntegerField()
    comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'reviews'
        app_label = 'craveon'

    def __str__(self):
        return f"Review for Order {self.order_id} - Rating: {self.rating}"
