import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from userApp.models import User
from .models import Room, Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
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
            username = data['username']
            room = data['room']

            print(f"Received message: {message} from user: {username} in room: {room}")

            # Save the message to the database
            await self.save_message(username, room, message)

            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',  # Change to match the method name exactly
                    'message': message,
                    'username': username
                }
            )
        except Exception as e:
            print(f"Error receiving message: {str(e)}")

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        username = event['username']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'username': username
        }))
        print(f"Sent message: {message} to WebSocket for user: {username}")

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


