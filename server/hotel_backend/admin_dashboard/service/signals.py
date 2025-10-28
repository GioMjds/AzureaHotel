from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from booking.models import Bookings
from service.firebase import firebase_service
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Bookings)
def booking_status_changed(sender, instance, created, **kwargs):
    """Trigger Firebase update when booking status changes"""
    try:
        if created:
            # New booking created
            firebase_service.send_booking_update(
                booking_id=instance.id,
                user_id=instance.user.id,
                status='created',
                additional_data={
                    'room_id': instance.room.id if instance.room else None,
                    'area_id': instance.area.id if instance.area else None,
                    'check_in_date': instance.check_in_date.isoformat() if instance.check_in_date else None,
                    'check_out_date': instance.check_out_date.isoformat() if instance.check_out_date else None,
                    'start_time': instance.start_time.isoformat() if instance.start_time else None,
                    'end_time': instance.end_time.isoformat() if instance.end_time else None,
                    'total_price': float(instance.total_price) if instance.total_price else 0,
                    'is_venue_booking': instance.is_venue_booking,
                    'number_of_guests': instance.number_of_guests,
                    'payment_status': instance.payment_status,
                    'has_food_order': instance.has_food_order
                }
            )
            
            # Update room availability if room booking
            if instance.room:
                firebase_service.send_room_availability_update(
                    room_id=instance.room.id,
                    is_available=False,  # Room is now booked
                    current_bookings=[instance.id]
                )
            
            # Update area availability if area booking
            if instance.area and instance.is_venue_booking:
                firebase_service.send_area_availability_update(
                    area_id=instance.area.id,
                    is_available=False,  # Area is now booked
                    current_bookings=[instance.id]
                )
        else:
            # Existing booking updated
            firebase_service.send_booking_update(
                booking_id=instance.id,
                user_id=instance.user.id,
                status=instance.status,
                additional_data={
                    'room_id': instance.room.id if instance.room else None,
                    'area_id': instance.area.id if instance.area else None,
                    'is_venue_booking': instance.is_venue_booking,
                    'payment_status': instance.payment_status,
                    'updated_at': instance.updated_at.isoformat(),
                    'cancellation_reason': instance.cancellation_reason if instance.cancellation_reason else None
                }
            )
            
            # Update availability based on status changes
            if instance.status in ['cancelled', 'checked_out', 'rejected']:
                # Make room/area available again
                if instance.room:
                    firebase_service.send_room_availability_update(
                        room_id=instance.room.id,
                        is_available=True,
                        current_bookings=[]
                    )
                
                if instance.area and instance.is_venue_booking:
                    firebase_service.send_area_availability_update(
                        area_id=instance.area.id,
                        is_available=True,
                        current_bookings=[]
                    )
            
        # Notify admin dashboard about booking changes
        property_name = ""
        if instance.room:
            property_name = f"{instance.room.room_name}"
        elif instance.area:
            property_name = f"{instance.area.area_name}"
        
        firebase_service.broadcast_admin_notification(
            message=f"Booking #{instance.id} ({property_name}) status changed to {instance.status}",
            data={
                'booking_id': instance.id,
                'user_id': instance.user.id,
                'user_email': instance.user.email,
                'status': instance.status,
                'type': 'booking_update',
                'property_type': 'room' if instance.room else 'area',
                'property_id': instance.room.id if instance.room else (instance.area.id if instance.area else None),
                'total_price': float(instance.total_price) if instance.total_price else 0,
                'is_venue_booking': instance.is_venue_booking
            },
            notification_type='booking'
        )
        
    except Exception as e:
        logger.error(f"Error in booking signal: {e}")

@receiver(post_delete, sender=Bookings)
def booking_deleted(sender, instance, **kwargs):
    """Handle booking deletion"""
    try:
        firebase_service.send_user_notification(
            user_id=instance.user.id,
            notification_data={
                'type': 'booking_deleted',
                'booking_id': instance.id,
                'message': f'({property_name}) has been deleted',
            }
        )
        
        # Update room availability
        if instance.room:
            firebase_service.send_room_availability_update(
                room_id=instance.room.id,
                is_available=True,
                current_bookings=[]
            )
        
        # Update area availability
        if instance.area and instance.is_venue_booking:
            firebase_service.send_area_availability_update(
                area_id=instance.area.id,
                is_available=True,
                current_bookings=[]
            )
            
        # Notify admin dashboard
        property_name = ""
        if instance.room:
            property_name = f"Room {instance.room.room_name}"
        elif instance.area:
            property_name = f"Area {instance.area.area_name}"
            
        firebase_service.broadcast_admin_notification(
            message=f"({property_name}) has been deleted",
            data={
                'booking_id': instance.id,
                'user_id': instance.user.id,
                'user_email': instance.user.email,
                'type': 'booking_deleted',
                'property_type': 'room' if instance.room else 'area',
                'property_id': instance.room.id if instance.room else (instance.area.id if instance.area else None)
            },
            notification_type='booking'
        )
            
    except Exception as e:
        logger.error(f"Error in booking deletion signal: {e}")