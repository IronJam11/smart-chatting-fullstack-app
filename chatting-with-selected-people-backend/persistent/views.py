from django.http import JsonResponse, HttpResponseBadRequest
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import json
from django.views.decorators.http import require_http_methods
import redis
import time

redis_instance = redis.Redis(**settings.REDIS_CONFIG)

# Store a key-value pair in Redis
@csrf_exempt
@require_http_methods(["POST"])
def store_key_value(request):
    try:
        data = json.loads(request.body)
        key = data.get('key')
        value = data.get('value')
        
        if key and value:
            redis_instance.set(key, value)
            return JsonResponse({'message': f'Successfully stored {key}: {value}'})
        return HttpResponseBadRequest('Invalid data. Provide both key and value.')
    except json.JSONDecodeError:
        return HttpResponseBadRequest('Invalid JSON format')
# Retrieve the value for a given key from Redis
def get_value_by_key(request, key):
    value = redis_instance.get(key)

    if value:
        return JsonResponse({'key': key, 'value': value.decode('utf-8')})
    return JsonResponse({'message': 'Key not found'}, status=404)

@csrf_exempt
@require_http_methods(["POST"])
def store_chat_message(request):
    try:
        data = json.loads(request.body)
        room = data.get('room')
        user = data.get('user')
        body = data.get('body')

        if room and user and body:
            message = {
                'user': user,
                'body': body,
                'timestamp': time.time()
            }
            redis_instance.lpush(room, json.dumps(message))
            return JsonResponse({'message': 'Message stored successfully'})
        return HttpResponseBadRequest('Invalid data. Provide room, user, and body.')
    except json.JSONDecodeError:
        return HttpResponseBadRequest('Invalid JSON format')

@require_http_methods(["GET"])
def get_chat_messages(request, room):
    messages = redis_instance.lrange(room, 0, -1)
    if messages:
        return JsonResponse({
            'room': room,
            'messages': [json.loads(m.decode('utf-8')) for m in messages]
        })
    return JsonResponse({'message': 'No messages found'}, status=404)

# Optional: Function to get the latest N messages
def get_latest_messages(request, room, count=10):
    messages = redis_instance.lrange(room, 0, count - 1)
    if messages:
        return JsonResponse({
            'room': room,
            'messages': [json.loads(m.decode('utf-8')) for m in messages]
        })
    return JsonResponse({'message': 'No messages found'}, status=404)
