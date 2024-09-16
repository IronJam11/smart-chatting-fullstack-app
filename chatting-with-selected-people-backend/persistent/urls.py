from django.urls import path
from .views import store_key_value, get_value_by_key, store_chat_message, get_chat_messages, get_latest_messages

urlpatterns = [
    path('store/', store_key_value, name='store_key_value'),  # store key-value pair
    path('get/<str:key>/', get_value_by_key, name='get_value_by_key'),  # retrieve value by key
    path('chat/store/',store_chat_message, name='store_chat_message'),
    path('chat/get/<str:room>/', get_chat_messages, name='get_chat_messages'),
    path('chat/latest/<str:room>/<int:count>/', get_latest_messages, name='get_latest_messages')
]
