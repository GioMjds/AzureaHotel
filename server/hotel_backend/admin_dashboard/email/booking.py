from django.core.mail import EmailMultiAlternatives
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

def send_booking_confirmation_email(email, booking_details):
    try:
        subject = "Azurea Hotel - Your Booking Has Been Confirmed"
        
        booking_id = booking_details.get('id', 'N/A')
        check_in = booking_details.get('check_in_date', 'N/A')
        check_out = booking_details.get('check_out_date', 'N/A')
        property_type = "Venue" if booking_details.get('is_venue_booking') else "Room"
        property_name = booking_details.get('area_details', {}).get('area_name', '') if booking_details.get('is_venue_booking') else booking_details.get('room_details', {}).get('room_name', '')
        
        guest_first_name = booking_details.get('user', {}).get('first_name', '')
        guest_last_name = booking_details.get('user', {}).get('last_name', '')
        guest_name = f"{guest_first_name} {guest_last_name}".strip() or "Guest"
        
        email_html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="X-UA-Compatible" content="ie=edge" />
            <title>Booking Confirmation</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
        </head>
        <body style="margin: 0; font-family: 'Poppins', sans-serif; background: #ffffff; font-size: 14px;">
            <div style="max-width: 680px; margin: 0 auto; padding: 45px 30px 60px; background: #f4f7ff; background-image: url(https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661497957196_595865/email-template-background-banner); background-repeat: no-repeat; background-size: 800px 452px; background-position: top center; font-size: 14px; color: #434343;">
                <main>
                    <div style="margin: 0; margin-top: 70px; padding: 92px 30px 115px; background: #ffffff; border-radius: 30px; text-align: center;">
                        <div style="width: 100%; max-width: 489px; margin: 0 auto;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 500; color: #1f1f1f;">Your Booking Has Been Confirmed</h1>
                            <p style="margin: 0; margin-top: 17px; font-size: 16px; font-weight: 500;">Hello {guest_name},</p>
                            <p style="margin: 0; margin-top: 17px; font-weight: 500; letter-spacing: 0.56px;">
                                We're pleased to inform you that your reservation at Azurea Hotel has been confirmed. Here are your booking details:
                            </p>
                            
                            <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 10px; text-align: left;">
                                <p style="margin: 10px 0;"><strong>Guest Name:</strong> {guest_name}</p>
                                <p style="margin: 10px 0;"><strong>Booking ID:</strong> {booking_id}</p>
                                <p style="margin: 10px 0;"><strong>Property Type:</strong> {property_type}</p>
                                <p style="margin: 10px 0;"><strong>Property Name:</strong> {property_name}</p>
                                <p style="margin: 10px 0;"><strong>Check-in Date:</strong> {check_in}</p>
                                <p style="margin: 10px 0;"><strong>Check-out Date:</strong> {check_out}</p>
                                <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #38a169; font-weight: 600;">RESERVED</span></p>
                            </div>
                            
                            <p style="margin: 0; margin-top: 30px; font-weight: 500; letter-spacing: 0.56px;">
                                We look forward to welcoming you to Azurea Hotel. If you have any questions, please feel free to contact us.
                            </p>
                            
                            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                    &copy; {datetime.now().year} Azurea Hotel. All rights reserved.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </body>
        </html>
        """
        
        text_message = f"""
        Your Booking Has Been Confirmed
        
        Hello {guest_name},
        
        We're pleased to inform you that your reservation at Azurea Hotel has been confirmed. Here are your booking details:
        
        Guest Name: {guest_name}
        Booking ID: {booking_id}
        Property Type: {property_type}
        Property Name: {property_name}
        Check-in Date: {check_in}
        Check-out Date: {check_out}
        Status: RESERVED
        
        We look forward to welcoming you to Azurea Hotel. If you have any questions, please feel free to contact us.
        
        © {datetime.now().year} Azurea Hotel. All rights reserved.
        """
        
        email_from = os.getenv('EMAIL_HOST_USER')
        message = EmailMultiAlternatives(subject, text_message, email_from, [email])
        message.attach_alternative(email_html, "text/html")
        message.send()
        
        return True
    except Exception as e:
        return False

def send_booking_rejection_email(email, booking_details):
    try:
        subject = "Azurea Hotel - Your Booking Has Been Rejected"
        
        booking_id = booking_details.get('id', 'N/A')
        check_in = booking_details.get('check_in_date', 'N/A')
        check_out = booking_details.get('check_out_date', 'N/A')
        property_type = "Venue" if booking_details.get('is_venue_booking') else "Room"
        property_name = booking_details.get('area_details', {}).get('area_name', '') if booking_details.get('is_venue_booking') else booking_details.get('room_details', {}).get('room_name', '')
        cancellation_reason = booking_details.get('cancellation_reason', 'No reason provided')
        
        guest_first_name = booking_details.get('user', {}).get('first_name', '')
        guest_last_name = booking_details.get('user', {}).get('last_name', '')
        guest_name = f"{guest_first_name} {guest_last_name}".strip() or "Guest"
        
        email_html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="X-UA-Compatible" content="ie=edge" />
            <title>Booking Rejection</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
        </head>
        <body style="margin: 0; font-family: 'Poppins', sans-serif; background: #ffffff; font-size: 14px;">
            <div style="max-width: 680px; margin: 0 auto; padding: 45px 30px 60px; background: #f4f7ff; background-image: url(https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661497957196_595865/email-template-background-banner); background-repeat: no-repeat; background-size: 800px 452px; background-position: top center; font-size: 14px; color: #434343;">
                <main>
                    <div style="margin: 0; margin-top: 70px; padding: 92px 30px 115px; background: #ffffff; border-radius: 30px; text-align: center;">
                        <div style="width: 100%; max-width: 489px; margin: 0 auto;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 500; color: #1f1f1f;">Your Booking Has Been Rejected</h1>
                            <p style="margin: 0; margin-top: 17px; font-size: 16px; font-weight: 500;">Hello {guest_name},</p>
                            <p style="margin: 0; margin-top: 17px; font-weight: 500; letter-spacing: 0.56px;">
                                We regret to inform you that your reservation at Azurea Hotel has been rejected. Here are your booking details:
                            </p>
                            
                            <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 10px; text-align: left;">
                                <p style="margin: 10px 0;"><strong>Guest Name:</strong> {guest_name}</p>
                                <p style="margin: 10px 0;"><strong>Booking ID:</strong> {booking_id}</p>
                                <p style="margin: 10px 0;"><strong>Property Type:</strong> {property_type}</p>
                                <p style="margin: 10px 0;"><strong>Property Name:</strong> {property_name}</p>
                                <p style="margin: 10px 0;"><strong>Check-in Date:</strong> {check_in}</p>
                                <p style="margin: 10px 0;"><strong>Check-out Date:</strong> {check_out}</p>
                                <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #e53e3e; font-weight: 600;">REJECTED</span></p>
                            </div>
                            
                            <div style="margin-top: 30px; padding: 20px; background-color: #fff8f8; border-radius: 10px; border-left: 4px solid #e53e3e; text-align: left;">
                                <p style="margin: 0; font-weight: 500;">Reason for Rejection:</p>
                                <p style="margin: 10px 0 0 0; color: #4b5563;">{cancellation_reason}</p>
                            </div>
                            
                            <p style="margin: 0; margin-top: 30px; font-weight: 500; letter-spacing: 0.56px;">
                                We appreciate your interest in Azurea Hotel and hope we can serve you in the future. If you have any questions, please feel free to contact us.
                            </p>
                            
                            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                    &copy; {datetime.now().year} Azurea Hotel. All rights reserved.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </body>
        </html>
        """
        
        text_message = f"""
        Your Booking Has Been Rejected
        
        Hello {guest_name},
        
        We regret to inform you that your reservation at Azurea Hotel has been rejected. Here are your booking details:
        
        Guest Name: {guest_name}
        Booking ID: {booking_id}
        Property Type: {property_type}
        Property Name: {property_name}
        Check-in Date: {check_in}
        Check-out Date: {check_out}
        Status: REJECTED
        
        Reason for Rejection:
        {cancellation_reason}
        
        We appreciate your interest in Azurea Hotel and hope we can serve you in the future. If you have any questions, please feel free to contact us.
        
        © {datetime.now().year} Azurea Hotel. All rights reserved.
        """
        
        email_from = os.getenv('EMAIL_HOST_USER')
        message = EmailMultiAlternatives(subject, text_message, email_from, [email])
        message.attach_alternative(email_html, "text/html")
        message.send()
        
        return True
    except Exception:
        return False

def send_checkout_e_receipt(email, booking_details):
    try:
        subject = "Azurea Hotel - Your Check-Out E-Receipt"
        
        booking_id = booking_details.get('id', 'N/A')
        check_in = booking_details.get('check_in_date', 'N/A')
        check_out = booking_details.get('check_out_date', 'N/A')
        property_type = "Venue" if booking_details.get('is_venue_booking') else "Room"
        property_name = booking_details.get('area_details', {}).get('area_name', '') if booking_details.get('is_venue_booking') else booking_details.get('room_details', {}).get('room_name', '')
        
        total_amount = booking_details.get('total_amount', 0)
        
        user_data = booking_details.get('user', {})
        guest_name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip() or "Guest"
        
        email_html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="X-UA-Compatible" content="ie=edge" />
            <title>Check-Out Receipt</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
        </head>
        <body style="margin: 0; font-family: 'Poppins', sans-serif; background: #ffffff; font-size: 14px;">
            <div style="max-width: 680px; margin: 0 auto; padding: 45px 30px 60px; background: #f4f7ff; background-image: url(https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661497957196_595865/email-template-background-banner); background-repeat: no-repeat; background-size: 800px 452px; background-position: top center; font-size: 14px; color: #434343;">
                <main>
                    <div style="margin: 0; margin-top: 70px; padding: 92px 30px 115px; background: #ffffff; border-radius: 30px; text-align: center;">
                        <div style="width: 100%; max-width: 489px; margin: 0 auto;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 500; color: #1f1f1f;">Check-Out Receipt</h1>
                            <p style="margin: 0; margin-top: 17px; font-size: 16px; font-weight: 500;">Hello {guest_name},</p>
                            <p style="margin: 0; margin-top: 17px; font-weight: 500; letter-spacing: 0.56px;">
                                Thank you for staying with us at Azurea Hotel. Here's your e-receipt for your booking:
                            </p>
                            
                            <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 10px; text-align: left;">
                                <p style="margin: 10px 0;"><strong>Guest Name:</strong> {guest_name}</p>
                                <p style="margin: 10px 0;"><strong>Booking ID:</strong> {booking_id}</p>
                                <p style="margin: 10px 0;"><strong>Property Type:</strong> {property_type}</p>
                                <p style="margin: 10px 0;"><strong>Property Name:</strong> {property_name}</p>
                                <p style="margin: 10px 0;"><strong>Check-in Date:</strong> {check_in}</p>
                                <p style="margin: 10px 0;"><strong>Check-out Date:</strong> {check_out}</p>
                                <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #3182ce; font-weight: 600;">CHECKED OUT</span></p>
                                <p style="margin: 10px 0;"><strong>Total Amount:</strong> <span style="font-weight: 600;">₱{float(total_amount):,.2f}</span></p>
                            </div>
                            
                            <p style="margin: 0; margin-top: 30px; font-weight: 500; letter-spacing: 0.56px;">
                                We hope you enjoyed your stay and look forward to welcoming you back soon!
                            </p>
                            
                            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                    &copy; {datetime.now().year} Azurea Hotel. All rights reserved.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </body>
        </html>
        """
        
        text_message = f"""
        Check-Out Receipt
        
        Hello {guest_name},
        
        Thank you for staying with us at Azurea Hotel. Here's your e-receipt for your booking:
        
        Guest Name: {guest_name}
        Booking ID: {booking_id}
        Property Type: {property_type}
        Property Name: {property_name}
        Check-in Date: {check_in}
        Check-out Date: {check_out}
        Status: CHECKED OUT
        Total Amount: ₱{float(total_amount):,.2f}
        
        We hope you enjoyed your stay and look forward to welcoming you back soon!
        
        © {datetime.now().year} Azurea Hotel. All rights reserved.
        """
        
        email_from = os.getenv('EMAIL_HOST_USER')
        message = EmailMultiAlternatives(subject, text_message, email_from, [email])
        message.attach_alternative(email_html, "text/html")
        message.send()
        
        return True
    except Exception as e:
        return False

def send_checkout_e_receipt(email, booking_details):
    try:
        subject = "Azurea Hotel - Your Check-Out E-Receipt"
        
        booking_id = booking_details.get('id', 'N/A')
        check_in = booking_details.get('check_in_date', 'N/A')
        check_out = booking_details.get('check_out_date', 'N/A')
        property_type = "Venue" if booking_details.get('is_venue_booking') else "Room"
        property_name = booking_details.get('area_details', {}).get('area_name', '') if booking_details.get('is_venue_booking') else booking_details.get('room_details', {}).get('room_name', '')
        
        total_amount = booking_details.get('total_amount', 0)
        
        user_data = booking_details.get('user', {})
        guest_name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip() or "Guest"
        
        email_html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="X-UA-Compatible" content="ie=edge" />
            <title>Check-Out Receipt</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
        </head>
        <body style="margin: 0; font-family: 'Poppins', sans-serif; background: #ffffff; font-size: 14px;">
            <div style="max-width: 680px; margin: 0 auto; padding: 45px 30px 60px; background: #f4f7ff; background-image: url(https://archisketch-resources.s3.ap-northeast-2.amazonaws.com/vrstyler/1661497957196_595865/email-template-background-banner); background-repeat: no-repeat; background-size: 800px 452px; background-position: top center; font-size: 14px; color: #434343;">
                <main>
                    <div style="margin: 0; margin-top: 70px; padding: 92px 30px 115px; background: #ffffff; border-radius: 30px; text-align: center;">
                        <div style="width: 100%; max-width: 489px; margin: 0 auto;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 500; color: #1f1f1f;">Check-Out Receipt</h1>
                            <p style="margin: 0; margin-top: 17px; font-size: 16px; font-weight: 500;">Hello {guest_name},</p>
                            <p style="margin: 0; margin-top: 17px; font-weight: 500; letter-spacing: 0.56px;">
                                Thank you for staying with us at Azurea Hotel. Here's your e-receipt for your booking:
                            </p>
                            
                            <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 10px; text-align: left;">
                                <p style="margin: 10px 0;"><strong>Guest Name:</strong> {guest_name}</p>
                                <p style="margin: 10px 0;"><strong>Booking ID:</strong> {booking_id}</p>
                                <p style="margin: 10px 0;"><strong>Property Type:</strong> {property_type}</p>
                                <p style="margin: 10px 0;"><strong>Property Name:</strong> {property_name}</p>
                                <p style="margin: 10px 0;"><strong>Check-in Date:</strong> {check_in}</p>
                                <p style="margin: 10px 0;"><strong>Check-out Date:</strong> {check_out}</p>
                                <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #3182ce; font-weight: 600;">CHECKED OUT</span></p>
                                <p style="margin: 10px 0;"><strong>Total Amount:</strong> <span style="font-weight: 600;">₱{float(total_amount):,.2f}</span></p>
                            </div>
                            
                            <p style="margin: 0; margin-top: 30px; font-weight: 500; letter-spacing: 0.56px;">
                                We hope you enjoyed your stay and look forward to welcoming you back soon!
                            </p>
                            
                            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                    &copy; {datetime.now().year} Azurea Hotel. All rights reserved.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </body>
        </html>
        """
        
        text_message = f"""
        Check-Out Receipt
        
        Hello {guest_name},
        
        Thank you for staying with us at Azurea Hotel. Here's your e-receipt for your booking:
        
        Guest Name: {guest_name}
        Booking ID: {booking_id}
        Property Type: {property_type}
        Property Name: {property_name}
        Check-in Date: {check_in}
        Check-out Date: {check_out}
        Status: CHECKED OUT
        Total Amount: ₱{float(total_amount):,.2f}
        
        We hope you enjoyed your stay and look forward to welcoming you back soon!
        
        © {datetime.now().year} Azurea Hotel. All rights reserved.
        """
        
        email_from = os.getenv('EMAIL_HOST_USER')
        message = EmailMultiAlternatives(subject, text_message, email_from, [email])
        message.attach_alternative(email_html, "text/html")
        message.send()
        
        return True
    except Exception as e:
        return False