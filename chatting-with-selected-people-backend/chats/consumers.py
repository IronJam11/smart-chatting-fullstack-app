import json
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework.exceptions import AuthenticationFailed
import jwt
from asgiref.sync import sync_to_async
from userApp.models import User
from .models import Room, Message
from .serializers import UserSerializer

class ChatConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
       self.enrollmentNo1 = self.scope['url_route']['kwargs']['enrollmentNo1']
       self.enrollmentNo2 = self.scope['url_route']['kwargs']['enrollmentNo2']

        # Ensure enrollment numbers are in a consistent order (sorted)
       sorted_enrollment_numbers = sorted([self.enrollmentNo1, self.enrollmentNo2])

        # Create the room name by joining the sorted enrollment numbers
       self.room_name = f"{sorted_enrollment_numbers[0]}_{sorted_enrollment_numbers[1]}"

       self.room_group_name = f'chat_{self.room_name}'
       print(self.room_name)
       print(f"Connecting to room: {self.room_group_name}")

        # Join room group
       await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

       await self.accept()
       print(f"Connected to room: {self.room_group_name}")

    async def disconnect(self, close_code):
        print(f"Disconnecting from room: {self.room_group_name}, Close code: {close_code}")
        
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            print(data)
            message = data['message']
            room = self.room_name
            print(room)
            enrollmentNo = self.enrollmentNo1
            print(f"Received message: {message} from user: {enrollmentNo} in room: {room}")

            # Save the message to the database
            await self.save_message(enrollmentNo, room, message)

            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',  # Change to match the method name exactly
                    'message': message,
                    'enrollmentNo': enrollmentNo,
                    'user': enrollmentNo
                }
            )
        except Exception as e:
            print(f"Error receiving message: {str(e)}")

    # Receive message from room group
    async def chat_message(self, event):
        print("----------")
        print("----------")
        print(event)
        print("----------")
        print("----------")
        message = event['message']
        enrollmentNo = event['enrollmentNo']
        print(message)
        print(enrollmentNo)
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'enrollmentNo': enrollmentNo
        }))
        print(f"Sent message: {message} to WebSocket for user: {enrollmentNo}")
    @sync_to_async
    def save_message(self, username, room, message):
        try:
            # Retrieve the user
            user = User.objects.get(enrollmentNo=int(username))
            
            # Retrieve or create the room
            room_obj, created = Room.objects.get_or_create(slug=room, defaults={'name': 'DM'})
            if created:
                print(f"Room created: {room}")
            
            # Create the message
            Message.objects.create(user=user, room=room_obj, content=message)
            print(f"Message saved: {message} by user: {username} in room: {room}")

        except User.DoesNotExist:
            print(f"User does not exist: {username}")
        except Exception as e:
            print(f"Error saving message: {str(e)}")