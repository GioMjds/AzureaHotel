from rest_framework import serializers
from .models import Bookings, Transactions, Reviews, CraveOnCategory, CraveOnItem, CraveOnOrder, CraveOnOrderItem, CraveOnReview
from user_roles.models import CustomUsers
from user_roles.serializers import CustomUserSerializer
from property.models import Rooms, Areas
from property.serializers import AreaSerializer, RoomSerializer
from .validations.booking import validate_booking_request
from django.utils import timezone
from datetime import datetime
from django.db.models import Sum
from django.core.files.uploadedfile import InMemoryUploadedFile, UploadedFile
import cloudinary.uploader
import cloudinary
import uuid
import base64

PWD_SENIOR_DISCOUNT_PERCENT = 20

# CraveOn Serializers
class CraveOnCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CraveOnCategory
        fields = ['category_id', 'category_name', 'is_archived']

class CraveOnItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.category_name', read_only=True)
    image_data = serializers.SerializerMethodField()
    
    class Meta:
        model = CraveOnItem
        fields = [
            'item_id', 'item_name', 'price', 'category_id', 
            'category_name', 'is_archived', 'image_data'
        ]
    
    def get_image_data(self, obj):
        if obj.image:
            try:
                return base64.b64encode(obj.image).decode('utf-8')
            except:
                return None
        return None

class BookingSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer()
    room_details = RoomSerializer(source='room', read_only=True)
    area_details = AreaSerializer(source='area', read_only=True)
    payment_proof = serializers.SerializerMethodField()
    payment_method = serializers.CharField(source='get_payment_method_display')
    total_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = Bookings
        fields = [
            'id',
            'user',
            'room',
            'room_details',
            'area',
            'area_details',
            'check_in_date',
            'check_out_date',
            'status',
            'special_request',
            'cancellation_date',
            'cancellation_reason',
            'time_of_arrival',
            'is_venue_booking',
            'total_price',
            'number_of_guests',
            'created_at',
            'updated_at',
            'payment_method',
            'payment_proof',
            'payment_date',
            'down_payment',
            'phone_number',
            'total_amount',
        ]
        
    def get_payment_proof(self, obj):
        if obj.payment_proof:
            if isinstance(obj.payment_proof, str):
                return obj.payment_proof
            return obj.payment_proof.url
        return None
    
    def get_total_amount(self, obj):
        return Transactions.objects.filter(
            booking=obj,
            status='completed'
        ).aggregate(Sum('amount'))['amount__sum'] or 0.00
    
    def get_user(self, obj):
        if obj.user:
            return {
                'id': obj.user.id,
                'first_name': obj.user.first_name,
                'last_name': obj.user.last_name,
                'email': obj.user.email,
                'profile_image': obj.user.profile_image.url if obj.user.profile_image else None,
            }
        return None
        
    def get_valid_id(self, obj):
        if obj.valid_id:
            if hasattr(obj.valid_id, 'url'):
                return obj.valid_id.url
            else:
                return obj.valid_id
        return None
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        user = instance.user if hasattr(instance, 'user') else None
        discount_percent = 0
        
        
        # Apply PWD/Senior Discount if user is eligible
        if user and getattr(user, 'is_senior_or_pwd', False):
            discount_percent = PWD_SENIOR_DISCOUNT_PERCENT
        
        nights = (instance.check_out_date - instance.check_in_date).days if instance.check_in_date and instance.check_out_date else 1
        
        if instance.room:
            try:
                price_per_night = float(getattr(instance.room, 'price_per_night', None) or instance.room.room_price)
                original_total = price_per_night * nights
                
                # Apply long stay discount if not PWD/Senior
                if discount_percent == 0:
                    if nights >= 7:
                        discount_percent = 10
                    elif nights >= 3:
                        discount_percent = 5

                discounted_price = original_total * (1 - discount_percent / 100)
                representation['original_price'] = original_total
                representation['discount_percent'] = discount_percent
                representation['discounted_price'] = round(discounted_price, 2)
                representation['total_price'] = float(instance.total_price)
                
                
                if hasattr(instance, 'down_payment') and instance.down_payment is not None:
                    representation['down_payment'] = float(instance.down_payment)
            except Exception as e:
                representation['original_price'] = None
                representation['discount_percent'] = 0
                representation['discounted_price'] = None
        elif instance.area:
            try:
                original_total = float(instance.total_price)
                
                discounted_price = original_total * (1 - discount_percent / 100)
                representation['original_price'] = original_total
                representation['discount_percent'] = discount_percent
                representation['discounted_price'] = round(discounted_price, 2)
                representation['total_price'] = float(instance.total_price)
                
            except Exception as e:
                representation['original_price'] = None
                representation['discount_percent'] = 0
                representation['discounted_price'] = None
        else:
            representation['original_price'] = None
            representation['discount_percent'] = 0
            representation['discounted_price'] = None        
        return representation

class BookingRequestSerializer(serializers.Serializer):
    firstName = serializers.CharField(max_length=100)
    lastName = serializers.CharField(max_length=100)
    phoneNumber = serializers.CharField(max_length=20, required=False)
    specialRequests = serializers.CharField(required=False, allow_blank=True)
    roomId = serializers.CharField()
    checkIn = serializers.DateField()
    checkOut = serializers.DateField()
    status = serializers.CharField(default='pending')
    isVenueBooking = serializers.BooleanField(required=False, default=False)
    totalPrice = serializers.DecimalField(required=False, max_digits=10, decimal_places=2)
    arrivalTime = serializers.CharField(required=False, allow_blank=True)
    numberOfGuests = serializers.IntegerField(required=False, default=1)
    paymentMethod = serializers.ChoiceField(choices=Bookings.PAYMENT_METHOD_CHOICES, default='physical')
    paymentProof = serializers.FileField(required=False, allow_null=True, write_only=True)

    def validate(self, data):
        errors = {}
        room = None
        
        payment_method = data.get('payment_method')
        payment_proof = data.get('payment_proof')
        
        if payment_method == 'gcash':
            if not payment_proof:
                raise serializers.ValidationError({{
                    'payment_proof': "Payment proof is required for GCash payments."
                }})
            if not isinstance(payment_proof, (InMemoryUploadedFile, UploadedFile)) and not isinstance(payment_proof, str):
                raise serializers.ValidationError({
                    'payment_proof': "Please upload a valid file."
                })
        
        try:
            if not data.get('isVenueBooking', False):
                room = Rooms.objects.get(id=data.get('roomId'))
        except Rooms.DoesNotExist:
            errors['roomId'] = "Room not found"
            raise serializers.ValidationError(errors)
        
        validation_errors = validate_booking_request(data, room)
        if validation_errors:
            raise serializers.ValidationError(validation_errors)
        
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        payment_proof_file = request.FILES.get('paymentProof')
        payment_method = validated_data.get('paymentMethod', 'physical')
        payment_proof_url = None

        if payment_method == 'gcash':
            try:
                upload_result = cloudinary.uploader.upload(payment_proof_file)
                payment_proof_url = upload_result['secure_url']
            except Exception as e:
                raise serializers.ValidationError(f"Error uploading payment proof: {str(e)}")

        if request and hasattr(request, 'user') and request.user.is_authenticated:
            user = request.user
            if user.first_name != validated_data['firstName'] or user.last_name != validated_data['lastName']:
                user.first_name = validated_data['firstName']
                user.last_name = validated_data['lastName']
                user.phone_number = validated_data['phoneNumber']
                user.save()
        else:
            if not 'emailAddress' in validated_data:
                if hasattr(request, 'user') and request.user.is_authenticated:
                    user = request.user
                else:
                    unique_id = str(uuid.uuid4())[:8]
                    username = f"guest_{unique_id}"
                    user = CustomUsers.objects.create(
                        username=username,
                        first_name=validated_data['firstName'],
                        last_name=validated_data['lastName'],
                        role='guest'
                    )
                    if hasattr(user, 'phone_number'):
                        user.phone_number = validated_data['phoneNumber']
                        user.save()
            else:
                try:
                    user = CustomUsers.objects.get(email=validated_data['emailAddress'])
                    if user.first_name != validated_data['firstName'] or user.last_name != validated_data['lastName']:
                        user.first_name = validated_data['firstName']
                        user.last_name = validated_data['lastName']
                        user.phone_number = validated_data['phoneNumber']
                        user.save()
                except CustomUsers.DoesNotExist:
                    user = CustomUsers.objects.create(
                        username=validated_data['emailAddress'],
                        email=validated_data['emailAddress'],
                        first_name=validated_data['firstName'],
                        last_name=validated_data['lastName'],
                        role='guest'
                    )
                    if hasattr(user, 'phone_number'):
                        user.phone_number = validated_data['phoneNumber']
                        user.save()

        is_venue_booking = validated_data.get('isVenueBooking', False)

        check_in = validated_data.get('checkIn')
        check_out = validated_data.get('checkOut')
        nights = (check_out - check_in).days if check_in and check_out else 1
        total_price = 0

        # --- PWD/Senior Discount Logic ---
        discount_percent = 0
        if hasattr(user, 'is_senior_or_pwd') and user.is_senior_or_pwd:
            discount_percent = PWD_SENIOR_DISCOUNT_PERCENT

        if is_venue_booking:
            try:
                area_id = validated_data['roomId']
                area = Areas.objects.get(id=area_id)
                
                start_time = None
                end_time = None
                if 'startTime' in validated_data and validated_data['startTime']:
                    start_time = datetime.strptime(validated_data['startTime'], "%H:%M").time()
                if 'endTime' in validated_data and validated_data['endTime']:
                    end_time = datetime.strptime(validated_data['endTime'], "%H:%M").time()
                
                # For venue bookings, fallback to frontend value or 0
                original_price = float(validated_data.get('totalPrice', 0))
                
                # For venue bookings, the frontend already sends the final discounted price
                # Don't apply additional discount, just use the provided price
                total_price = original_price

                booking = Bookings.objects.create(
                    user=user,
                    area=area,
                    room=None,
                    check_in_date=validated_data['checkIn'],
                    check_out_date=validated_data['checkOut'],
                    status=validated_data.get('status', 'pending'),
                    total_price=total_price,
                    is_venue_booking=True,
                    phone_number=validated_data.get('phoneNumber', ''),
                    time_of_arrival=validated_data.get('arrivalTime'),
                    start_time=start_time,
                    end_time=end_time,
                    number_of_guests=validated_data.get('numberOfGuests', 1),
                    payment_method=payment_method,
                    payment_proof=payment_proof_url,
                    payment_date=timezone.now() if payment_method == 'gcash' else None,
                    is_discounted=discount_percent > 0,  # Track if discount was applied
                )
                
                if user.is_verified != 'verified':
                    user.last_booking_date = timezone.now().date()
                    user.save()
                return booking
            except Exception as e:
                raise serializers.ValidationError(str(e))
        else:
            try:
                room = Rooms.objects.get(id=validated_data['roomId'])
                
                price_per_night = float(room.room_price)
                
                if discount_percent == 0:
                    if nights >= 7:
                        discount_percent = 10
                    elif nights >= 3:
                        discount_percent = 5
                
                discounted_price = price_per_night * (1 - discount_percent / 100)
                total_price = discounted_price * nights
                
                
                booking = Bookings.objects.create(
                    user=user,
                    room=room,
                    area=None,
                    check_in_date=validated_data['checkIn'],
                    check_out_date=validated_data['checkOut'],
                    status=validated_data.get('status', 'pending'),
                    special_request=validated_data.get('specialRequests', ''),
                    is_venue_booking=False,
                    phone_number=validated_data.get('phoneNumber', ''),
                    total_price=total_price,
                    time_of_arrival=validated_data.get('arrivalTime'),
                    number_of_guests=validated_data.get('numberOfGuests', 1),
                    payment_method=payment_method,
                    payment_proof=payment_proof_url,
                    payment_date=timezone.now() if payment_method == 'gcash' else None,
                )
                
                
                if user.is_verified != 'verified':
                    user.last_booking_date = timezone.now().date()
                    user.save()
                return booking
            except Rooms.DoesNotExist:
                raise serializers.ValidationError("Room not found")
            except Exception as e:
                raise serializers.ValidationError(str(e))

class TransactionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Transactions
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    booking_details = serializers.SerializerMethodField()
    user_profile_image = serializers.SerializerMethodField()
    formatted_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Reviews
        fields = ['id', 'rating', 'user', 'booking', 'review_text', 'created_at', 'room', 'area', 'user_profile_image', 'formatted_date', 'user_name', 'booking_details']
        read_only_fields = ['user', 'room', 'area', 'booking']
    
    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return "Anonymous"
    
    def get_user_profile_image(self, obj):
        if obj.user and obj.user.profile_image:
            request = self.context.get('request')
            if request and hasattr(obj.user.profile_image, 'url'):
                return request.build_absolute_uri(obj.user.profile_image.url)
            return obj.user.profile_image.url if hasattr(obj.user.profile_image, 'url') else None
        return None
    
    def get_formatted_date(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%B %d, %Y')
        return None
    
    def get_booking_details(self, obj):
        if obj.booking:
            if obj.booking.is_venue_booking and obj.booking.area:
                return {
                    "type": "venue",
                    "name": obj.booking.area.area_name if obj.booking.area else "Unknown Venue",
                    "check_in_date": obj.booking.check_in_date,
                    "check_out_date": obj.booking.check_out_date
                }
            else:
                return {
                    "type": "room",
                    "name": obj.booking.room.room_name if obj.booking.room else "Unknown Room",
                    "check_in_date": obj.booking.check_in_date,
                    "check_out_date": obj.booking.check_out_date
                }
        return None
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['booking'] = self.context['booking']
        
        if validated_data['booking'].is_venue_booking:
            validated_data['area'] = validated_data['booking'].area
        else:
            validated_data['room'] = validated_data['booking'].room
            
        return super().create(validated_data)

# CraveOn Food Order Review Serializer
class CraveOnReviewSerializer(serializers.ModelSerializer):
    order_details = serializers.SerializerMethodField()
    
    class Meta:
        model = CraveOnReview
        fields = ['id', 'order_id', 'rating', 'comment', 'created_at', 'order_details']
        read_only_fields = ['id', 'created_at']
    
    def get_order_details(self, obj):
        """Get order details from CraveOn database"""
        from django.db import connections
        try:
            cursor = connections['SystemInteg'].cursor()
            cursor.execute("""
                SELECT o.order_id, o.total_amount, o.status, o.guest_name, 
                       o.hotel_room_area, o.ordered_at
                FROM orders o 
                WHERE o.order_id = %s
            """, [obj.order_id])
            
            result = cursor.fetchone()
            if result:
                return {
                    'order_id': result[0],
                    'total_amount': float(result[1]),
                    'status': result[2],
                    'guest_name': result[3],
                    'hotel_room_area': result[4],
                    'ordered_at': result[5]
                }
        except Exception as e:
            return None
        return None
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def validate_order_id(self, value):
        """Validate that the order exists and is completed"""
        from django.db import connections
        try:
            cursor = connections['SystemInteg'].cursor()
            cursor.execute("SELECT status FROM orders WHERE order_id = %s", [value])
            result = cursor.fetchone()
            
            if not result:
                raise serializers.ValidationError("Order not found")
            
            if result[0] != 'Completed':
                raise serializers.ValidationError("Only completed orders can be reviewed")
            
            # Check if already reviewed
            cursor.execute("SELECT id FROM reviews WHERE order_id = %s", [value])
            if cursor.fetchone():
                raise serializers.ValidationError("This order has already been reviewed")
                
        except Exception as e:
            if "already been reviewed" in str(e) or "not found" in str(e) or "completed orders" in str(e):
                raise e
            raise serializers.ValidationError("Error validating order")
        
        return value