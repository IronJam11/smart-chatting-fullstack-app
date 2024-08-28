from django.urls import path, re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"^ws/(?P<enrollmentNo1>[\w@.-]+)/(?P<enrollmentNo2>[\w@.-]+)/$", consumers.ChatConsumer.as_asgi()),
]
