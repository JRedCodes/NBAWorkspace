import os
import json
import logging
import redis as redis_lib
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../server/.env'))

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')

# ssl_cert_reqs=None required for Upstash TLS (rediss://) with redis-py
# Short timeouts so a Redis outage never blocks an ingestion run
client = redis_lib.from_url(
    REDIS_URL,
    decode_responses=True,
    ssl_cert_reqs=None,
    socket_connect_timeout=0.1,
    socket_timeout=0.1,
)


def get(key: str):
    try:
        value = client.get(key)
        return json.loads(value) if value else None
    except Exception as e:
        logger.warning(f'Redis get failed for {key}: {e}')
        return None


def set(key: str, value, ttl_seconds: int):
    try:
        client.setex(key, ttl_seconds, json.dumps(value))
    except Exception as e:
        logger.warning(f'Redis set failed for {key}: {e}')


def delete(*keys: str):
    try:
        if keys:
            client.delete(*keys)
    except Exception as e:
        logger.warning(f'Redis delete failed: {e}')


def delete_pattern(pattern: str):
    try:
        keys = client.keys(pattern)
        if keys:
            client.delete(*keys)
    except Exception as e:
        logger.warning(f'Redis delete_pattern failed for {pattern}: {e}')


def invalidate_team(team_id: str):
    delete_pattern(f'http:/api/teams/{team_id}*')
    delete_pattern(f'team:{team_id}:*')


def invalidate_player(player_id: str):
    delete_pattern(f'http:/api/players/{player_id}*')
    delete_pattern(f'player:{player_id}:*')
