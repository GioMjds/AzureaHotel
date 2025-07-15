from django.db import connections
from .models import CraveOnItem
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class CraveOnIntegration:
    @staticmethod
    def get_or_create_craveon_user(hotel_user, booking) -> int:
        """
        Get existing CraveOn user by email or create a new one.
        Returns the CraveOn user_id (auto-incremented).
        """
        cursor = connections['SystemInteg'].cursor()
        
        try:
            cursor.execute(
                "SELECT user_id FROM users WHERE email = %s AND is_archived = FALSE", 
                [hotel_user.email]
            )
            result = cursor.fetchone()
            
            if result:
                logger.info(f"Found existing CraveOn user with ID: {result[0]} for email: {hotel_user.email}")
                return result[0]
            
            logger.info(f"Creating new CraveOn user for email: {hotel_user.email}")
            cursor.execute(
                """INSERT INTO users (first_name, last_name, email, contact, address, password, is_archived, status) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                [
                    hotel_user.first_name,
                    hotel_user.last_name,
                    hotel_user.email,
                    getattr(hotel_user, 'phone_number', '') or '',
                    '',
                    'hotel_guest_temp_password',
                    False,
                    'Active'
                ]
            )
            
            new_user_id = cursor.lastrowid
            logger.info(f"Created new CraveOn user with ID: {new_user_id}")
            return new_user_id
            
        except Exception as e:
            logger.error(f"Error managing CraveOn user: {str(e)}")
            raise
    
    @staticmethod
    def create_craveon_order(craveon_user_id: int, total_amount: float, payment_ss_data: str, booking_id: int, hotel_user, booking) -> int:
        """
        Create a new order in CraveOn database with all hotel information.
        Returns the CraveOn order_id.
        """
        cursor = connections['SystemInteg'].cursor()
        
        try:
            hotel_room_area = booking.room.room_name if booking.room else (
                booking.area.area_name if booking.area else "Unknown"
            )
            guest_name = f"{hotel_user.first_name} {hotel_user.last_name}"
            
            cursor.execute(
                """INSERT INTO orders (user_id, total_amount, status, payment_ss, payment_submitted, 
                   booking_id, hotel_room_area, guest_email, guest_name, ordered_at) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())""",
                [
                    craveon_user_id,
                    total_amount,
                    'Pending',
                    payment_ss_data,
                    True,
                    booking_id,
                    hotel_room_area,
                    hotel_user.email,
                    guest_name
                ]
            )
            
            order_id = cursor.lastrowid
            return order_id
            
        except Exception as e:
            print(f"Error creating CraveOn order: {str(e)}")
            raise
    
    @staticmethod
    def add_order_items(order_id: int, cart_items: list):
        """
        Add items to the CraveOn order.
        """
        cursor = connections['SystemInteg'].cursor()
        
        try:
            for item in cart_items:
                cursor.execute(
                    "INSERT INTO order_items (order_id, item_id, quantity) VALUES (%s, %s, %s)",
                    [order_id, item.get('item_id'), item.get('quantity', 1)]
                )
                        
        except Exception as e:
            print(f"Error adding items to CraveOn order: {str(e)}")
            raise
    
    @staticmethod
    def validate_cart_items(cart_items: list) -> Dict[str, Any]:
        """
        Validate cart items and calculate total amount.
        Returns dict with validation results and total amount.
        """
        
        total_amount = 0
        validated_items = []
        
        try:
            for item in cart_items:
                item_id = item.get('item_id')
                quantity = int(item.get('quantity', 1))
                
                if not item_id or quantity <= 0:
                    raise ValueError(f"Invalid item or quantity: {item}")
                
                craveon_item = CraveOnItem.objects.using('SystemInteg').filter(
                    item_id=item_id,
                    is_archived=False
                ).first()
                
                if not craveon_item:
                    raise ValueError(f"Item with ID {item_id} not found or archived")
                
                item_total = float(craveon_item.price) * quantity
                total_amount += item_total
                
                validated_items.append({
                    'item_id': item_id,
                    'quantity': quantity,
                    'price': float(craveon_item.price),
                    'item_total': item_total,
                    'name': craveon_item.item_name
                })
            
            return {
                'valid': True,
                'total_amount': total_amount,
                'items': validated_items,
                'item_count': len(validated_items)
            }
            
        except Exception as e:
            print(f"Cart validation error: {str(e)}")
            return {
                'valid': False,
                'error': str(e),
                'total_amount': 0,
                'items': [],
                'item_count': 0
            }

    @staticmethod
    def get_order_details(order_id: int) -> Dict[str, Any]:
        """
        Get detailed information about a CraveOn order.
        """
        cursor = connections['SystemInteg'].cursor()
        
        try:
            cursor.execute("""
                SELECT o.order_id, o.user_id, o.total_amount, o.status, 
                       o.payment_submitted, o.reviewed, o.ordered_at,
                       o.booking_id, o.hotel_room_area, o.guest_email, o.guest_name
                FROM orders o 
                WHERE o.order_id = %s
            """, [order_id])
            
            result = cursor.fetchone()
            if not result:
                return {'found': False, 'error': 'Order not found'}
            
            order_data = {
                'found': True,
                'order_id': result[0],
                'user_id': result[1],
                'total_amount': float(result[2]),
                'status': result[3],
                'payment_submitted': result[4],
                'reviewed': result[5],
                'ordered_at': result[6],
                'booking_id': result[7],
                'hotel_room_area': result[8],
                'guest_email': result[9],
                'guest_name': result[10]
            }
            
            # Get order items
            cursor.execute("""
                SELECT oi.item_id, oi.quantity, i.item_name, i.price
                FROM order_items oi
                JOIN items i ON oi.item_id = i.item_id
                WHERE oi.order_id = %s
            """, [order_id])
            
            order_data['items'] = []
            for item_row in cursor.fetchall():
                order_data['items'].append({
                    'item_id': item_row[0],
                    'quantity': item_row[1],
                    'item_name': item_row[2],
                    'price': float(item_row[3]),
                    'item_total': float(item_row[3]) * item_row[1]
                })
            
            return order_data
            
        except Exception as e:
            logger.error(f"Error getting order details: {str(e)}")
            return {'found': False, 'error': str(e)}

    @staticmethod
    def update_order_status(order_id: int, new_status: str) -> bool:
        """
        Update the status of a CraveOn order.
        """
        cursor = connections['SystemInteg'].cursor()
        
        try:
            cursor.execute("""
                UPDATE orders 
                SET status = %s 
                WHERE order_id = %s
            """, [new_status, order_id])
            
            return cursor.rowcount > 0
            
        except Exception as e:
            logger.error(f"Error updating order status: {str(e)}")
            return False
