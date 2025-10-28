import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from booking.models import Bookings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from firebase_admin import db as firebase_db
from channels.layers import get_channel_layer
from service.firebase import firebase_service
from user_roles.models import Notification as UserNotification
from datetime import datetime

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=Bookings)
def bookings_pre_save(sender, instance: Bookings, **kwargs):
    if not instance.pk:
        instance._previous_status = None
        return

    try:
        previous = sender.objects.filter(pk=instance.pk).first()
        instance._previous_status = previous.status if previous else None
    except Exception:
        instance._previous_status = None

def _build_additional_data(booking: Bookings) -> dict:
    data = {
        'is_venue_booking': bool(booking.is_venue_booking),
        'total_price': float(booking.total_price) if booking.total_price is not None else None,
        'number_of_guests': int(booking.number_of_guests) if booking.number_of_guests is not None else None,
    }
    
    try:
        if booking.is_venue_booking and booking.area:
            data['area_name'] = booking.area.area_name
            data['area_id'] = booking.area.id
        elif booking.room:
            data['room_name'] = getattr(booking.room, 'room_name', None)
            data['room_id'] = booking.room.id
    except Exception:
        logger.debug('Could not include related area/room data names for booking ID %s', booking.id)

    return data

@receiver(post_save, sender=Bookings)
def booking_post_save(sender, instance: Bookings, created: bool, **kwargs):
    """
    When a booking is created or its status changes, push an update to
    Firebase Realtime Database, so mobile cliens receive real-time updates regarding 
    to their bookings.
    """
    try:
        prev_status = getattr(instance, '_previous_status', None)
        curr_status = instance.status
        
        # Notify when created or status changed
        if not created and prev_status == curr_status:
            return
        
        user = instance.user
        user_id = user.id if user else None
        booking_id = instance.id
        
        additional_data = _build_additional_data(instance)
        
        # Primary write using existing helper (writes booking-updates, user-bookings, user-notifications, ...)
        try:
            if firebase_service is not None:
                firebase_service.send_booking_update(
                    user_id=user_id,
                    booking_id=booking_id,
                    status=curr_status,
                    additional_data=additional_data
                )
        except Exception:
            logger.exception('Failed to send booking update to Firebase for booking ID %s', booking_id)
            
        # Mirror/write to the exact path mobile expects: user-notifications/{user_id}
        try:
            if firebase_db is not None and user_id is not None:
                root_ref = firebase_db.reference('/')
                
                booking_update_ref = root_ref.child('booking_updates').child(str(booking_id))
                booking_update_ref.set({
                    'booking_id': booking_id,
                    'user_id': user_id,
                    'status': curr_status,
                    'timestamp': datetime.now().isoformat(),
                    'data': additional_data
                })
                
                user_bookings_ref = root_ref.child('user_bookings').child(f'user_{user_id}').child(str(booking_id))
                user_bookings_ref.set({
                    'booking_id': booking_id,
                    'status': curr_status,
                    'timestamp': datetime.now().isoformat(),
                    'is_venue_booking': additional_data.get('is_venue_booking', False)
                })
                
                user_notifications_ref = root_ref.child('user_notifications').child(f'user_{user_id}').push()
                notif_payload = {
                    'type': 'booking_update',
                    'booking_id': booking_id,
                    'status': curr_status,
                    'message': f'Booking #{booking_id} status updated to {curr_status}.',
                    'timestamp': int(datetime.now().timestamp() * 1000),
                    'read': False,
                    'data': additional_data
                }
                user_notifications_ref.set(notif_payload)
        except Exception:
            logger.exception('Failed to update Firebase Realtime Database for booking ID %s', booking_id)
            
        # Persist an internal Notification DB record for audit/admin views
        try:
            if user is not None:
                notif_type = 'booking_update'
                UserNotification.objects.create(
                    user=user,
                    notification_type=notif_type,
                    booking=instance,
                    message=f'Booking #{booking_id} status updated to {curr_status}.',
                )
        except Exception:
            logger.exception('Failed to create internal Notification record for booking ID %s', booking_id)
            
        # Push active count update to channels group (admin dashboard realtime)
        try:
            if get_channel_layer is not None and async_to_sync is not None:
                channel_layer = get_channel_layer()
                include_statuses = ['pending', 'reserved', 'checked_in']
                count = Bookings.objects.filter(status__in=include_statuses).count()
                async_to_sync(channel_layer.group_send)(
                    'admin_notifications',
                    {
                        'type': 'active_count_update',
                        'count': count
                    }
                )
        except Exception:
            logger.exception('Failed to update Firebase Realtime Database for booking ID %s', booking_id)
    except Exception:
        logger.exception('Error in booking_post_save signal for booking ID %s', instance.id)

@receiver(post_save, sender=Bookings)
def send_active_count_update(sender, instance, created, **kwargs):
    try:
        channel_layer = get_channel_layer()
        include_statuses = ['pending', 'reserved', 'checked_in']
        count = Bookings.objects.filter(status__in=include_statuses).count()
        
        async_to_sync(channel_layer.group_send)(
            'admin_notifications',
            {
                'type': 'active_count_update',
                'count': count
            }
        )
    except Exception as e:
        raise f"Error in send_active_count_update: {e}"