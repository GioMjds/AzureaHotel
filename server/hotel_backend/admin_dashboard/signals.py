from django.db.models.signals import post_save
from django.dispatch import receiver
from booking.models import Bookings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

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