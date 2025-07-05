from .models import CustomUsers, Notification
from rest_framework import serializers

class CustomUserSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()
    valid_id_type_display = serializers.SerializerMethodField()
    valid_id_front = serializers.SerializerMethodField()
    valid_id_back = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUsers
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'profile_image',
            'valid_id_type',
            'valid_id_type_display',
            'valid_id_front',
            'valid_id_back',
            'is_verified',
            'valid_id_rejection_reason',
            'last_booking_date',
            'is_senior_or_pwd',
        ]
        extra_kwargs = { 'password': { 'write_only': True } }
        
    def get_profile_image(self, obj):
        if obj.profile_image and hasattr(obj.profile_image, 'url'):
            return obj.profile_image.url
        return None
    
    def get_valid_id_front(self, obj):
        if obj.valid_id_front and hasattr(obj.valid_id_front, 'url'):
            return obj.valid_id_front.url
        return None
    
    def get_valid_id_back(self, obj):
        if obj.valid_id_back and hasattr(obj.valid_id_back, 'url'):
            return obj.valid_id_back.url
        return None
    
    def get_valid_id_type_display(self, obj):
        return obj.get_valid_id_type_display()

    def create(self, validated_data):
        if not validated_data.get('username'):
            validated_data['username'] = validated_data.get('email')
        password = validated_data.pop('password', None)
        user = CustomUsers(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

class NotificationSerializer(serializers.ModelSerializer):
    booking_id = serializers.SerializerMethodField()
    
    def get_booking_id(self, obj):
        return str(obj.booking.id) if obj.booking else None
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'user',
            'message',
            'notification_type',
            'booking',
            'booking_id',
            'is_read',
            'created_at'
        ]