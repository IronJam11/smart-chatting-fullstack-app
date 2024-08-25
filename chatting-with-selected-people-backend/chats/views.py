import datetime
import json
import jwt # type: ignore
from django.http import JsonResponse # type: ignore
from rest_framework import status, generics
from django.utils.dateparse import parse_datetime
from django.views.decorators.csrf import csrf_exempt # type: ignore
from rest_framework.views import APIView # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework.exceptions import AuthenticationFailed, NotFound # type: ignore
from .models import Room, Message
from userApp.models import User
from .serializers import UserSerializer, MessageSerializer, RoomSerializer

# Utility function to decode JWT
def decode_jwt(token):
    try:
        payload = jwt.decode(token, 'secret', algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Token expired!")
    except jwt.DecodeError:
        raise AuthenticationFailed("Invalid token!")

class Register(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class Login(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = User.objects.filter(email=email).first()
        if user is None:
            raise AuthenticationFailed("User not found")
        if not user.check_password(password):
            raise AuthenticationFailed("Incorrect password!")
        
        payload = {
            'id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=60),
            'iat': datetime.datetime.utcnow()
        }
        
        token = jwt.encode(payload, 'secret', algorithm='HS256')
        response = Response()
        response.set_cookie(key='jwt', value=token, httponly=True)
        serializer = UserSerializer(user)
        response.data = {
            'jwt': token,
            'email': email,
            'name': serializer.data['name'],
            'enrollmentNo': serializer.data['enrollmentNo']
        }
        return response

class CurrentUserView(APIView):
    def get(self, request):
        token = request.COOKIES.get('jwt')
        if not token:
            raise AuthenticationFailed("Unauthenticated!")
        
        payload = decode_jwt(token)
        user = User.objects.filter(id=payload['id']).first()
        serializer = UserSerializer(user)
        return Response(serializer.data)

class LogoutView(APIView):
    def post(self, request):
        response = Response()
        response.delete_cookie('jwt')
        response.data = {'message': 'success'}
        return response

class AllUserView(APIView):
    @csrf_exempt
    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class RoomMessagesListView(APIView):
    def get(self, request, slug):
        # token = request.COOKIES.get('jwt')
        # if not token:
        #     raise AuthenticationFailed("Unauthenticated!")
        
        # payload = decode_jwt(token)
        try:
            room = Room.objects.get(slug=slug)
            messages = Message.objects.filter(room=room)
            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data)
        except Room.DoesNotExist:
            return JsonResponse({'error': 'Room not found'}, status=404)

    

class AllRoomNamesView(APIView):
    def get(self, request):
        rooms = Room.objects.all()
        serializer = RoomSerializer(rooms, many=True)
        return JsonResponse(serializer.data, safe=False)
@csrf_exempt
def create_message(request):
    if request.method == 'POST':
        try:
            # Parse the request body
            data = json.loads(request.body)
            
            # Extract data from the request
            enrollment_number = data.get('enrollmentNo')
            room_slug = data.get('room_slug')
            time_added = data.get('time_added')
            content = data.get('content')
            
            # Validate data
            if not enrollment_number or not room_slug or not time_added or not content:
                return JsonResponse({'error': 'Missing required fields'}, status=400)
            
            # Retrieve user by enrollment number
            try:
                user = User.objects.get(enrollmentNo=enrollment_number)  # Assuming enrollment number is stored in username field
            except User.DoesNotExist:
                return JsonResponse({'error': 'User not found'}, status=404)
            
            # Retrieve room by slug
            try:
                room = Room.objects.get(slug=room_slug)
            except Room.DoesNotExist:
                return JsonResponse({'error': 'Room not found'}, status=404)
            
            # Parse date_added
            try:
                date_added = parse_datetime(time_added)
                if time_added is None:
                    raise ValueError
            except (ValueError, TypeError):
                return JsonResponse({'error': 'Invalid date format'}, status=400)
            
            # Create the message
            message = Message(user=user, content=content, time_added=time_added, room=room)
            message.save()
            
            return JsonResponse({'success': 'Message created'}, status=201)
        
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)

