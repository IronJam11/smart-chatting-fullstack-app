from django.urls import path
from .views import Register,Login,LogoutView
from .views import AllUserView, create_message, RoomMessagesListView

urlpatterns = [
    path('register/', Register.as_view()),
    path('login/', Login.as_view()),
    path('logout/', LogoutView.as_view()),
    path('all-users/',AllUserView.as_view()),
    path('rooms/<slug:slug>/messages/', RoomMessagesListView.as_view(), name='room-messages-list'),
    path('create-message/', create_message, name='create_message'),
]