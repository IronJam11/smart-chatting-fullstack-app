from rest_framework import serializers
from userApp.models import User
from .models import Room, Message


class MessageSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # To display the user's string representation instead of the ID
    time_added = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S")  # Formatting the time_added field

    class Meta:
        model = Message
        fields = ['id', 'room', 'user', 'content', 'time_added']

class RoomSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)  # Nesting messages under rooms

    class Meta:
        model = Room
        fields = ['id', 'name', 'slug', 'messages']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','name','email','password','enrollmentNo']
        extra_kwargs = {
            'password' : {'write_only': True}
        }


    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance       
