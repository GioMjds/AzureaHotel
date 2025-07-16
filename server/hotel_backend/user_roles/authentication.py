import jwt
from django.conf import settings
from datetime import datetime, timedelta
from rest_framework_simplejwt.authentication import JWTAuthentication

def generate_customer_jwt(customer, token_type='access'):
    lifetime = timedelta(days=1) if token_type == 'access' else timedelta(days=7)
    payload = {
        'customer_id': customer.customer_id,
        'email': customer.email,
        'type': token_type,
        'exp': datetime.utcnow() + lifetime,
        'iat': datetime.utcnow(),
        'is_flask_customer': True
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token

def decode_customer_jwt(token):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        if payload.get('is_flask_customer'):
            return payload
        return None
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        
        if header is not None:
            raw_token = self.get_raw_token(header)
        else:
            raw_token = None
        
        if raw_token is None:
            raw_token = request.COOKIES.get('access_token')
            
        if raw_token is None:
            return None
        
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token