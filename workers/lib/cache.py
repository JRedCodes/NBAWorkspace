import os
import json
import redis as redis_lib
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../server/.env'))

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')

# Upstash uses rediss:// (TLS) — redis-py handles this natively
client = redis_lib.from_url(REDIS_URL, decode_responses=True)


def get(key: str):
    value = client.get(key)
    return json.loads(value) if value else None


def set(key: str, value, ttl_seconds: int):
    client.setex(key, ttl_seconds, json.dumps(value))


def delete(*keys: str):
    if keys:
        client.delete(*keys)


def delete_pattern(pattern: str):
    keys = client.keys(pattern)
    if keys:
        client.delete(*keys)


def invalidate_team(team_id: str):
    delete_pattern(f'http:/api/teams/{team_id}*')
    delete_pattern(f'team:{team_id}:*')


def invalidate_player(player_id: str):
    delete_pattern(f'http:/api/players/{player_id}*')
    delete_pattern(f'player:{player_id}:*')
