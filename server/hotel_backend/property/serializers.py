from rest_framework import serializers
from django.db.models import Avg
from .models import Amenities, Rooms, Areas, RoomImages, AreaImages

class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenities
        fields = ['id', 'description']
        
class RoomImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomImages
        fields = ['id', 'image_url']
        
    def get_image_url(self, obj):
        return obj.image.url if obj.image else None
    
class AreaImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = AreaImages
        fields = ['id', 'image_url']
        
    def get_image_url(self, obj):
        return obj.image.url if obj.image else None

class RoomSerializer(serializers.ModelSerializer):
    amenities = serializers.PrimaryKeyRelatedField(queryset=Amenities.objects.all(), many=True, required=False)
    average_rating = serializers.SerializerMethodField()
    images = RoomImageSerializer(many=True, read_only=True, source='room_images')
    
    class Meta:
        model = Rooms
        fields = [
            'id',
            'room_name',
            'room_type',
            'bed_type',
            'status',
            'room_price',
            'room_image',
            'description',
            'max_guests',
            'amenities',
            'average_rating',
            'images',
        ]
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['room_image'] = instance.room_image.url if instance.room_image else None
        
        if instance.room_price is not None:
            representation['room_price'] = f"₱{float(instance.room_price):,.2f}"
        return representation

    def get_average_rating(self, obj):
        return obj.reviews.aggregate(Avg('rating'))['rating__avg'] or 0

class AreaSerializer(serializers.ModelSerializer):
    average_rating = serializers.SerializerMethodField()
    images = AreaImageSerializer(many=True, read_only=True, source='area_images')
    
    class Meta:
        model = Areas
        fields = [
            'id',
            'area_name',
            'description',
            'area_image',
            'status',
            'capacity',
            'price_per_hour',
            'average_rating',
            'images',
        ]
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['area_image'] = instance.area_image.url if instance.area_image else None
        
        if instance.price_per_hour is not None:
            representation['price_per_hour'] = f"₱{float(instance.price_per_hour):,.2f}"
        return representation

    def get_average_rating(self, obj):
        return obj.reviews.aggregate(Avg('rating'))['rating__avg'] or 0