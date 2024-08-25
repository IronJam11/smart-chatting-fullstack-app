# Run redis server:  docker run --rm -p 6379:6379 redis:7

import os

from django.core.asgi import get_asgi_application

from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

from channels.routing import ProtocolTypeRouter, URLRouter

import chats.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(URLRouter(chats.routing.websocket_urlpatterns))
        )
})

