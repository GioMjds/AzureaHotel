import json
import base64
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Bookings, Reviews, CraveOnItem
from user_roles.models import CraveOnUser
from property.models import Rooms, Areas
from property.serializers import AreaSerializer, RoomSerializer
from .serializers import (
    BookingSerializer, 
    BookingRequestSerializer,
    ReviewSerializer,
)
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
from django.db import transaction, connections
from django.db.models import Q
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from .craveon_integration import CraveOnIntegration
import base64
import imghdr
import json
import json

# Create your views here.
@api_view(['GET'])
def fetch_availability(request):
    arrival_date = request.query_params.get('arrival') or request.data.get('arrival')
    departure_date = request.query_params.get('departure') or request.data.get('departure')
    exclude_statuses = request.query_params.get('exclude_statuses', '').split(',')
    
    if not exclude_statuses or '' in exclude_statuses:
        exclude_statuses = ['reserved', 'checked_in']
    
    if not arrival_date or not departure_date:
        return Response({
            "error": "Please provide both arrival and departure dates"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        arrival = datetime.strptime(arrival_date, "%Y-%m-%d")
        departure = datetime.strptime(departure_date, "%Y-%m-%d")
    except ValueError:
        return Response({
            "error": "Invalid date format. Use YYYY-MM-DD"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if departure <= arrival:
        return Response({
            'error': "Departure date should be greater than arrival date"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    rooms = Rooms.objects.filter(status='available')
    
    booked_room_ids = Bookings.objects.filter(
        ~Q(status__in=['cancelled', 'rejected', 'checked_out', 'no_show']),
        Q(check_in_date__lt=departure) & Q(check_out_date__gt=arrival),
        is_venue_booking=False
    ).values_list('room_id', flat=True)
    
    rooms = rooms.exclude(id__in=booked_room_ids)
    
    areas = Areas.objects.filter(status='available')
    
    booked_area_ids = Bookings.objects.filter(
        ~Q(status__in=['cancelled', 'rejected', 'checked_out', 'no_show']),
        Q(check_in_date__lt=departure) & Q(check_out_date__gt=arrival),
        is_venue_booking=True
    ).values_list('area_id', flat=True)
    
    areas = areas.exclude(id__in=booked_area_ids)
    
    room_serializer = RoomSerializer(rooms, many=True, context={'request': request})
    area_serializer = AreaSerializer(areas, many=True)
    
    return Response({
        "rooms": room_serializer.data,
        "areas": area_serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['GET', 'POST'])
def bookings_list(request):
    try:
        if request.method == 'GET':
            if not request.user.is_authenticated:
                return Response({
                    "error": "Authentication required to view bookings"
                }, status=status.HTTP_401_UNAUTHORIZED)

            page = request.query_params.get('page', 1)
            page_size = request.query_params.get('page_size', 10)
            status_filter = request.query_params.get('status')
            bookings = Bookings.objects.all().order_by('-created_at')
            
            if status_filter:
                bookings = bookings.filter(status=status_filter)
                
            if request.user.role == 'guest':
                bookings = bookings.filter(user=request.user)
            
            paginator = Paginator(bookings, page_size)
            try:
                paginated_bookings = paginator.page(page)
            except PageNotAnInteger:
                paginated_bookings = paginator.page(1)
            except EmptyPage:
                paginated_bookings = paginator.page(paginator.num_pages)
            
            serializer = BookingSerializer(paginated_bookings, many=True)
            
            return Response({
                "data": serializer.data,
                "pagination": {
                    "total_pages": paginator.num_pages,
                    "current_page": int(page),
                    "total_items": paginator.count,
                    "page_size": int(page_size)
                }
            }, status=status.HTTP_200_OK)
            
        elif request.method == 'POST':

            request_data = request.data.copy()
            if 'payment_proof' in request.FILES:
                request_data['payment_proof'] = request.FILES['payment_proof']
            unauthenticated = not (request.user and request.user.is_authenticated)
            
            try:
                serializer = BookingRequestSerializer(
                    data=request_data, 
                    context={
                        'request': request,
                        'unauthenticated': unauthenticated
                    }
                )
                
                if serializer.is_valid():
                    booking = serializer.save()
                    booking_data = BookingSerializer(booking).data
                    
                    return Response({
                        "id": booking.id,
                        "message": "Booking created successfully",
                        "data": booking_data
                    }, status=status.HTTP_201_CREATED)
                return Response({
                    "error": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def booking_detail(request, booking_id):
    if not booking_id.isdigit():
        return Response({"error": "Invalid booking ID"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        booking = Bookings.objects.get(id=booking_id)
    except Bookings.DoesNotExist:
        return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        booking_serializer = BookingSerializer(booking)
        data = booking_serializer.data
        
        if booking.is_venue_booking and booking.area:
            area_serializer = AreaSerializer(booking.area)
            data['area'] = area_serializer.data
        elif booking.room:
            room_serializer = RoomSerializer(booking.room)
            data['room'] = room_serializer.data

        return Response({
            "data": data
        }, status=status.HTTP_200_OK)
    elif request.method == 'PUT':
        serializer = BookingSerializer(booking, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        return Response({
            "error": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == "DELETE":
        booking.delete()
        return Response({
            "message": "Booking deleted successfully"
        }, status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
def reservation_list(request):
    try:
        if request.method == 'GET':
            if not request.user.is_authenticated:
                return Response({"error": "Authentication required to view reservations"}, 
                                status=status.HTTP_401_UNAUTHORIZED)
            
            bookings = Bookings.objects.all()
            serializer = BookingSerializer(bookings, many=True)
            return Response({
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        elif request.method == 'POST':
            serializer = BookingRequestSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                booking = serializer.save()
                booking_data = BookingSerializer(booking).data
                
                return Response({
                    "id": booking.id,
                    "message": "Booking created successfully",
                    "data": booking_data
                }, status=status.HTTP_201_CREATED)
            return Response({
                "error": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def reservation_detail(request, reservation_id):
    try:
        booking = Bookings.objects.get(id=reservation_id)
    except Bookings.DoesNotExist:
        return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        serializer = BookingSerializer(booking)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = BookingSerializer(booking, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response({
            "error": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        booking.delete()
        return Response({
            "message": "Reservation deleted successfully"
        }, status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
def area_reservations(request):
    try:
        if request.method == 'GET':
            if not request.user.is_authenticated:
                return Response({"error": "Authentication required to view area reservations"}, 
                                status=status.HTTP_401_UNAUTHORIZED)
                
            bookings = Bookings.objects.filter(is_venue_booking=True).order_by('-created_at')
            serializer = BookingSerializer(bookings, many=True)
            return Response({
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        elif request.method == 'POST':
            serializer = BookingRequestSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                booking = serializer.save()
                booking_data = BookingSerializer(booking).data
                
                return Response({
                    "id": booking.id,
                    "message": "Venue booking created successfully",
                    "data": booking_data
                }, status=status.HTTP_201_CREATED)
            return Response({
                "error": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def area_detail(request, area_id):
    try:
        area = Areas.objects.get(id=area_id)
        
        serializer = AreaSerializer(area, context={'request': request})
        serialized_data = serializer.data
        
        return Response({
            "data": serialized_data
        }, status=status.HTTP_200_OK)
    except Areas.DoesNotExist:
        return Response({"error": "Area not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def room_detail(request, room_id):
    try:
        room = Rooms.objects.get(id=room_id)
        serializer = RoomSerializer(room, context={'request': request})
        return Response({
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    except Rooms.DoesNotExist:
        return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_bookings(request):
    try:
        user = request.user
        bookings = Bookings.objects.filter(user=user).order_by('-created_at')
        
        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 5)
        
        paginator = Paginator(bookings, page_size)
        
        try:
            paginated_bookings = paginator.page(page)
        except PageNotAnInteger:
            paginated_bookings = paginator.page(1)
        except EmptyPage:
            paginated_bookings = paginator.page(paginator.num_pages)
            
        booking_data = []
        for booking in paginated_bookings:
            booking_serializer = BookingSerializer(booking)
            data = booking_serializer.data
            
            if booking.is_venue_booking and booking.area:
                area_serializer = AreaSerializer(booking.area)
                data['area'] = area_serializer.data
            elif booking.room:
                room_serializer = RoomSerializer(booking.room)
                data['room'] = room_serializer.data
            
            booking_data.append(data)
        
        return Response({
            "data": booking_data,
            "pagination": {
                "total_pages": paginator.num_pages,
                "current_page": int(page),
                "total_items": paginator.count,
                "page_size": int(page_size)
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_booking(request, booking_id):
    try:
        booking = Bookings.objects.get(id=booking_id)
    except Bookings.DoesNotExist:
        return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.user.role == 'guest':
        if booking.user != request.user:
            return Response({"error": "You do not have permission to cancel this booking"},
                            status=status.HTTP_403_FORBIDDEN)
        if booking.status.lower() != 'pending':
            return Response({"error": "You can only cancel bookings that are pending"},
                            status=status.HTTP_400_BAD_REQUEST)
    else:
        if booking.status.lower() == 'cancelled':
            return Response({"error": "Booking is already cancelled"},
                            status=status.HTTP_400_BAD_REQUEST)

    reason = request.data.get('reason', '').strip()
    if not reason:
        return Response({"error": "A cancellation reason is required"},
                        status=status.HTTP_400_BAD_REQUEST)

    booking.status = 'cancelled'
    booking.cancellation_reason = reason
    booking.cancellation_date = timezone.now()
    booking.save()

    if booking.status.lower() == 'reserved':
        if booking.is_venue_booking and booking.area:
            booking.area.status = 'available'
            booking.area.save()
        elif booking.room:
            booking.room.status = 'available'
            booking.room.save()

    serializer = BookingSerializer(booking)
    return Response({
        "message": "Booking cancelled successfully",
        "data": serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
def fetch_room_bookings(request, room_id):
    try:
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        query = Q(room_id=room_id) & ~Q(status__in=['cancelled', 'rejected'])

        if start_date and end_date:
            try:
                start = datetime.strptime(start_date, "%Y-%m-%d")
                end = datetime.strptime(end_date, "%Y-%m-%d")
                
                query = query & Q(check_in_date__lte=end) & Q(check_out_date__gte=start)
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, 
                               status=status.HTTP_400_BAD_REQUEST)
        
        bookings = Bookings.objects.filter(query)
        
        booking_data = []
        for booking in bookings:
            booking_data.append({
                'id': booking.id,
                'check_in_date': booking.check_in_date,
                'check_out_date': booking.check_out_date,
                'status': booking.status
            })
        
        return Response({
            "data": booking_data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def fetch_area_bookings(request, area_id):
    try:
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        query = Q(area_id=area_id) & ~Q(status__in=['cancelled', 'rejected'])
        
        if start_date and end_date:
            try:
                start = datetime.strptime(start_date, "%Y-%m-%d")
                end = datetime.strptime(end_date, "%Y-%m-%d")
                
                query = query & Q(check_in_date__lte=end) & Q(check_out_date__gte=start)
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, 
                               status=status.HTTP_400_BAD_REQUEST)
        
        bookings = Bookings.objects.filter(query)
        
        booking_data = []
        for booking in bookings:
            booking_data.append({
                'id': booking.id,
                'check_in_date': booking.check_in_date,
                'check_out_date': booking.check_out_date,
                'status': booking.status,
                'start_time': booking.start_time,
                'end_time': booking.end_time
            })
        
        return Response({
            "data": booking_data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def booking_reviews(request, booking_id):
    try:
        booking = Bookings.objects.get(id=booking_id)
    except Bookings.DoesNotExist:
        return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)
    
    if booking.user.id != request.user.id and not request.user.is_staff:
        return Response({"error": "You don't have permission to access these reviews"}, 
                    status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        reviews = Reviews.objects.filter(booking=booking)
        serializer = ReviewSerializer(reviews, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        if booking.status != 'checked_out':
            return Response({
                "error": "Reviews can only be submitted for checked-out bookings"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if Reviews.objects.filter(booking=booking, user=request.user).exists():
            return Response({
                "error": "You have already submitted a review for this booking"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = request.data.copy()
        data['booking'] = booking.id 
        
        serializer = ReviewSerializer(data=data, context={'request': request, 'booking': booking})
        if serializer.is_valid():
            review = serializer.save(user=request.user)
            if booking.is_venue_booking:
                review.area = booking.area
            else:
                review.room = booking.room
            review.save()
            return Response({
                "message": "Review submitted successfully",
                "data": ReviewSerializer(review).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_reviews(request):
    reviews = Reviews.objects.filter(user=request.user).order_by('-created_at')
    serializer = ReviewSerializer(reviews, many=True)
    return Response({"data": serializer.data}, status=status.HTTP_200_OK)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def review_detail(request, review_id):
    try:
        review = Reviews.objects.get(id=review_id)
    except Reviews.DoesNotExist:
        return Response({"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND)
    
    if review.user.id != request.user.id and not request.user.is_staff:
        return Response({"error": "You don't have permission to access this review"}, 
                    status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        serializer = ReviewSerializer(review)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        serializer = ReviewSerializer(review, data=request.data, partial=True, 
                                     context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({"data": serializer.data}, status=status.HTTP_200_OK)
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        review.delete()
        return Response({"message": "Review deleted successfully"}, 
                       status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
def room_reviews(request, room_id):
    try:
        page = int(request.query_params.get('page'))
        page_size = int(request.query_params.get('page_size'))
        
        reviews = Reviews.objects.filter(room_id=room_id).order_by('-created_at')
        paginator = Paginator(reviews, page_size)
        
        try:
            page_obj = paginator.page(page)
        except EmptyPage:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReviewSerializer(page_obj, many=True)
        return Response({
            "data": serializer.data,
            "total": paginator.count,
            "page": page_obj.number,
            "page_size": page_size,
            "total_pages": paginator.num_pages
        }, status=status.HTTP_200_OK)
    except Rooms.DoesNotExist:
        return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def area_reviews(request, area_id):
    try:
        page = int(request.query_params.get('page'))
        page_size = int(request.query_params.get('page_size'))
        
        reviews = Reviews.objects.filter(area_id=area_id).order_by('-created_at')
        paginator = Paginator(reviews, page_size)
        
        try:
            page_obj = paginator.page(page)
        except EmptyPage:
            return Response({"error": "Page not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReviewSerializer(page_obj, many=True)
        return Response({
            "data": serializer.data,
            "total": paginator.count,
            "page": page_obj.number,
            "page_size": page_size,
            "total_pages": paginator.num_pages
        }, status=status.HTTP_200_OK)
    
    except Areas.DoesNotExist:
        return Response({"error": "Area not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_checkout_e_receipt(request, booking_id):
    try:
        try:
            booking = Bookings.objects.get(id=booking_id)
        except Bookings.DoesNotExist:
            return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user has permission to view this booking
        if request.user.role == 'guest' and booking.user != request.user:
            return Response({"error": "You don't have permission to access this booking"}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        # Check if booking is checked out
        if booking.status.lower() != 'checked_out':
            return Response({"error": "E-Receipt can only be generated for checked-out bookings"}, 
                            status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare booking data for E-Receipt
        booking_serializer = BookingSerializer(booking)
        booking_data = booking_serializer.data
        
        if booking.is_venue_booking and booking.area:
            area_serializer = AreaSerializer(booking.area)
            booking_data['area_details'] = area_serializer.data
            booking_data['property_type'] = 'Area'
            booking_data['property_name'] = booking.area.area_name
            booking_data['property_capacity'] = booking.area.capacity
        elif booking.room:
            room_serializer = RoomSerializer(booking.room)
            booking_data['room_details'] = room_serializer.data
            booking_data['property_type'] = 'Room'
            booking_data['property_name'] = booking.room.room_name
            booking_data['property_capacity'] = booking.room.max_guests
        
        # Calculate stay duration
        if booking.check_in_date and booking.check_out_date:
            check_in = booking.check_in_date
            check_out = booking.check_out_date
            if booking.is_venue_booking:
                # For venues, calculate hours
                if booking.start_time and booking.end_time:
                    start_datetime = datetime.combine(check_in, booking.start_time)
                    end_datetime = datetime.combine(check_out, booking.end_time)
                    duration_hours = (end_datetime - start_datetime).total_seconds() / 3600
                    booking_data['duration'] = f"{int(duration_hours)} hours"
                else:
                    booking_data['duration'] = "1 hour"
            else:
                duration_days = (check_out - check_in).days
                booking_data['duration'] = f"{duration_days} night{'s' if duration_days != 1 else ''}"
        
        booking_data['receipt_data'] = {
            'receipt_number': f"REC-{booking.id}-{timezone.now().strftime('%Y%m%d')}",
            'generated_at': timezone.now().isoformat(),
            'generated_by': f"{request.user.first_name} {request.user.last_name}",
            'hotel_info': {
                'name': 'Azurea: Hotel Management',
                'address': 'Brgy. Dayap, Calauan, Laguna',
                'phone': '+63 912 345 6789',
                'email': 'azureahotelmanagement@gmail.com'
            }
        }
        
        total_amount = float(booking.total_price or 0)
        down_payment = float(booking.down_payment or 0)
        remaining_balance = total_amount - down_payment
        
        booking_data['payment_breakdown'] = {
            'total_amount': total_amount,
            'down_payment': down_payment,
            'remaining_balance': remaining_balance,
            'payment_method': booking.get_payment_method_display(),
            'payment_status': booking.payment_status
        }
        
        print(f"Booking E-Receipt Data: {booking_data}")
        
        return Response({
            "success": True,
            "message": "E-Receipt data generated successfully",
            "data": booking_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "success": False,
            "error": f"Failed to generate E-Receipt: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fetch_foods(request):
    try:
        items = CraveOnItem.objects.using('SystemInteg').filter(
            is_archived=False
        ).select_related('category')
        data = []
        for item in items:
            image_type = imghdr.what(None, h=item.image)
            mime_type = f"image/{image_type}"
            image_base64 = ""
            if item.image:
                image_base64 = base64.b64encode(item.image).decode('utf-8')
            data.append({
                "item_id": item.item_id,
                "name": item.item_name,
                "price": float(item.price),
                "image": image_base64,
                "image_mime": mime_type,
                "category_id": item.category.category_id if item.category else None,
                "category_name": item.category.category_name if item.category else "",
            })
        return Response({
            "message": "Food items fetched successfully.",
            "data": data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_food_order(request):
    try:
        booking_id = request.data.get('booking_id')
        cart_items_str = request.data.get('items', '[]')
        payment_ss = request.FILES.get('payment_ss')

        if not booking_id:
            return Response({"error": "Booking ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            cart_items = json.loads(cart_items_str) if isinstance(cart_items_str, str) else cart_items_str
        except json.JSONDecodeError:
            return Response({"error": "Invalid items format"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not cart_items:
            return Response({"error": "Cart items are required"}, status=status.HTTP_400_BAD_REQUEST)
        if not payment_ss:
            return Response({"error": "Payment screenshot is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = Bookings.objects.get(id=booking_id)
        except Bookings.DoesNotExist:
            return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

        if booking.status.lower() != 'checked_in':
            return Response({
                "error": "Food orders can only be placed for checked-in bookings"
            }, status=status.HTTP_400_BAD_REQUEST)

        hotel_user = request.user

        validation_result = CraveOnIntegration.validate_cart_items(cart_items)
        if not validation_result['valid']:
            return Response({"error": validation_result['error']}, status=status.HTTP_400_BAD_REQUEST)
        
        total_amount = validation_result['total_amount']

        try:
            payment_ss_data = base64.b64encode(payment_ss.read()).decode('utf-8')
        except Exception as e:
            return Response({
                "error": f"Failed to process payment screenshot: {str(e)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic(using='SystemInteg'):
            craveon_user_id = CraveOnIntegration.get_or_create_craveon_user(hotel_user, booking)
            order_id = CraveOnIntegration.create_craveon_order(
                craveon_user_id, 
                total_amount, 
                payment_ss_data, 
                booking.id,
                hotel_user,
                booking
            )
            CraveOnIntegration.add_order_items(order_id, cart_items)

        booking.has_food_order = True
        booking.save()

        return Response({
            "message": "Food order placed successfully!",
            "success": True,
            "user_id": craveon_user_id,
            "order_id": order_id,
            "total_amount": total_amount,
            "hotel_booking_info": {
                "hotel_booking_id": booking.id,
                "hotel_user_id": hotel_user.id,
                "guest_name": f"{hotel_user.first_name} {hotel_user.last_name}",
                "guest_email": hotel_user.email,
                "room_or_area": booking.room.room_name if booking.room else (booking.area.area_name if booking.area else "Unknown"),
                "check_in_date": str(booking.check_in_date),
                "check_out_date": str(booking.check_out_date),
            },
            "craveon_order_info": {
                "craveon_user_id": craveon_user_id,
                "craveon_order_id": order_id,
                "items_count": len(cart_items),
                "status": "Pending"
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": f"Unexpected error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fetch_food_orders(request):
    try:        
        booking_id = request.query_params.get('booking_id')
        if booking_id:
            user_bookings = Bookings.objects.filter(
                id=booking_id,
                user=request.user,
                has_food_order=True
            )
        else:
            user_bookings = Bookings.objects.filter(
                user=request.user,
                has_food_order=True
            )

        all_orders = []
        for booking in user_bookings:
            with connections['SystemInteg'].cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM orders WHERE booking_id = %s ORDER BY ordered_at DESC",
                    [booking.id]
                )
                order_rows = cursor.fetchall()
                columns = [col[0] for col in cursor.description]
                for order_row in order_rows:
                    order = dict(zip(columns, order_row))

                    cursor.execute(
                        """
                        SELECT oi.order_item_id, oi.order_id, oi.item_id, oi.quantity, 
                                i.item_name AS name, i.price
                                FROM order_items oi
                                JOIN items i ON oi.item_id = i.item_id
                                WHERE oi.order_id = %s
                        """,
                        [order['order_id']]
                    )
                    item_rows = cursor.fetchall()

                    items = []
                    for item_row in item_rows:
                        items.append({
                            "order_item_id": item_row[0],
                            "order_id": item_row[1], 
                            "item_id": item_row[2],
                            "quantity": item_row[3],
                            "name": item_row[4],
                            "price": float(item_row[5])
                        })                    
                    order['items'] = items
                    order['booking_info'] = {
                        'id': booking.id,
                        'room_name': booking.room.room_name if booking.room else None,
                        'area_name': booking.area.area_name if booking.area else None,
                        'check_in_date': booking.check_in_date,
                        'check_out_date': booking.check_out_date,
                        'is_venue_booking': booking.is_venue_booking
                    }
                    order['id'] = order['order_id']
                    order['total_amount'] = float(order['total_amount'])
                    order['created_at'] = order['ordered_at']
                    all_orders.append(order)
        
        return Response({
            "data": all_orders,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "error": f"Failed to fetch food orders: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)