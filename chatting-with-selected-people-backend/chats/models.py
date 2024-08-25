from django.db import models
from userApp.models import User
class Room(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    def __str__(self):
        return self.name
    
class Message(models.Model):
    room = models.ForeignKey(Room,on_delete=models.CASCADE, related_name="messages")
    user = models.ForeignKey(User,on_delete=models.CASCADE, related_name="messages")
    content = models.TextField()
    time_added = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ('time_added',)
        