from django.urls import path
from . import views

# /master/** routes
urlpatterns = [
    path('stats', views.dashboard_stats, name='dashboard_stats'),
    path('booking_status_counts', views.booking_status_counts, name='booking_status_counts'),
    
    # Analytics
    path('daily_revenue', views.daily_revenue, name='daily_revenue'),
    path('daily_bookings', views.daily_bookings, name='daily_bookings'),
    path('daily_occupancy', views.daily_occupancy, name='daily_occupancy'),
    path('daily_checkins_checkouts', views.daily_checkins_checkouts, name='daily_checkins_checkouts'),
    path('daily_cancellations', views.daily_cancellations, name='daily_cancellations'),
    path('daily_no_shows_rejected', views.daily_no_shows_rejected, name='daily_no_shows_rejected'),
    path('room_revenue', views.room_revenue, name='room_revenue'),
    path('room_bookings', views.room_bookings, name='room_bookings'),
    path('area_revenue', views.area_revenue, name='area_revenue'),
    path('area_bookings', views.area_bookings, name='area_bookings'),
    
    # CRUD Rooms
    path('rooms', views.fetch_rooms, name='fetch_rooms'),
    path('add_room', views.add_new_room, name='add_new_room'),
    path('show_room/<int:room_id>', views.show_room_details, name='show_room_details'),
    path('edit_room/<int:room_id>', views.edit_room, name='edit_room'),
    path('delete_room/<int:room_id>', views.delete_room, name='delete_room'),
    
    # CRUD Areas
    path('areas', views.fetch_areas, name='fetch_areas'),
    path('add_area', views.add_new_area, name='add_new_area'),
    path('show_area/<int:area_id>', views.show_area_details, name='show_area_details'),
    path('edit_area/<int:area_id>', views.edit_area, name='edit_area'),
    path('delete_area/<int:area_id>', views.delete_area, name='delete_area'),
    
    # CRUD Amenities
    path('amenities', views.fetch_amenities, name='fetch_amenities'),
    path('add_amenity', views.create_amenity, name='create_amenity'),
    path('show_amenity/<int:pk>', views.retreive_amenity, name='retreive_amenity'),
    path('edit_amenity/<int:pk>', views.update_amenity, name='update_amenity'),
    path('delete_amenity/<int:pk>', views.delete_amenity, name='delete_amenity'),
    
    # Regular Users Management
    path('users', views.fetch_all_users, name='fetch_all_users'),
    path('show_user/<int:user_id>', views.show_user_details, name='show_user_details'),
    path('edit_user/<int:user_id>', views.manage_user, name='manage_user'),
    path('archived_user/<int:user_id>', views.archive_user, name='archive_user'),
    path('approve_valid_id/<int:user_id>', views.approve_valid_id, name='approve_valid_id'),
    path('reject_valid_id/<int:user_id>', views.reject_valid_id, name='reject_valid_id'),

    # Archived Users Management
    path('archived_users', views.fetch_archived_users, name='fetch_archived_users'),
    path('restore_user/<int:user_id>', views.restore_user, name='restore_user'),

    # Booking Management
    path('bookings', views.admin_bookings, name='admin_bookings'),
    path('booking/<int:booking_id>', views.booking_detail, name='admin_booking_detail'),
    path('booking/<int:booking_id>/status', views.update_booking_status, name='update_booking_status'),
    path('booking/<int:booking_id>/payment', views.record_payment, name='record_payment'),
    
    # Commission Tracking
    
]
