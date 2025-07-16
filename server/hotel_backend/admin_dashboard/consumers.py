import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from booking.models import Bookings

class PendingBookingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = 'admin_notifications'
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        count = await self.get_active_count()
        await self.send(text_data=json.dumps({
            'type': 'active_count_update',
            'count': count,
        }))

    async def bookings_data_update(self, event):
        bookings = event['bookings']
        count = event['count']
        await self.send(text_data=json.dumps({
            'type': 'bookings_data_update',
            'count': count,
            'bookings': bookings
        }))

    async def active_count_update(self, event):
        count = event['count']
        await self.send(text_data=json.dumps({
            'type': 'active_count_update',
            'count': count
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'authenticate':
                await self.send(text_data=json.dumps({
                    'type': 'auth_response',
                    'success': True,
                    'message': 'Authentication successful'
                }))
                
                count = await self.get_active_count()
                await self.send(text_data=json.dumps({
                    'type': 'active_count_update',
                    'count': count,
                }))
                
            elif message_type == 'get_active_count':
                count = await self.get_active_count()
                await self.send(text_data=json.dumps({
                    'type': 'active_count_update',
                    'count': count,
                }))
                
            elif message_type == 'heartbeat':
                pass
                
        except Exception as e:
            raise f"Error processing message: {e}"

    @database_sync_to_async
    def get_active_count(self):
        try:
            include_statuses = ['pending', 'reserved', 'checked_in']
            count = Bookings.objects.filter(status__in=include_statuses).count()
            return count
        except Exception as e:
            raise f"Error in the get_active_count: {e}"