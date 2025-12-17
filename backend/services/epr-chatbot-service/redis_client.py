"""
Redis Client for EPR Chatbot Service
Provides caching and rate limiting functionality
"""

import redis.asyncio as aioredis
import os
import logging
from typing import Optional
import json
from datetime import timedelta

logger = logging.getLogger(__name__)


class RedisClient:
    """Async Redis client for caching and rate limiting"""

    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.client: Optional[aioredis.Redis] = None
        self.connected = False

    async def connect(self):
        """Initialize Redis connection"""
        try:
            self.client = await aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5
            )
            # Test connection
            await self.client.ping()
            self.connected = True
            logger.info(f"✅ Redis connected: {self.redis_url}")
        except Exception as e:
            logger.warning(f"⚠️  Redis connection failed: {e}. Continuing without cache.")
            self.connected = False

    async def disconnect(self):
        """Close Redis connection"""
        if self.client:
            await self.client.close()
            logger.info("🔌 Redis disconnected")

    async def get(self, key: str) -> Optional[str]:
        """Get value from Redis"""
        if not self.connected:
            return None
        try:
            return await self.client.get(key)
        except Exception as e:
            logger.error(f"❌ Redis GET error: {e}")
            return None

    async def set(self, key: str, value: str, ttl: Optional[int] = None) -> bool:
        """Set value in Redis with optional TTL (seconds)"""
        if not self.connected:
            return False
        try:
            if ttl:
                await self.client.setex(key, ttl, value)
            else:
                await self.client.set(key, value)
            return True
        except Exception as e:
            logger.error(f"❌ Redis SET error: {e}")
            return False

    async def get_json(self, key: str) -> Optional[dict]:
        """Get JSON object from Redis"""
        value = await self.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                logger.error(f"❌ Failed to decode JSON for key: {key}")
        return None

    async def set_json(self, key: str, value: dict, ttl: Optional[int] = None) -> bool:
        """Set JSON object in Redis"""
        try:
            json_str = json.dumps(value)
            return await self.set(key, json_str, ttl)
        except (TypeError, json.JSONEncodeError) as e:
            logger.error(f"❌ Failed to encode JSON: {e}")
            return False

    async def delete(self, *keys: str) -> bool:
        """Delete keys from Redis"""
        if not self.connected:
            return False
        try:
            await self.client.delete(*keys)
            return True
        except Exception as e:
            logger.error(f"❌ Redis DELETE error: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        if not self.connected:
            return False
        try:
            return await self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"❌ Redis EXISTS error: {e}")
            return False

    async def incr(self, key: str) -> Optional[int]:
        """Increment counter"""
        if not self.connected:
            return None
        try:
            return await self.client.incr(key)
        except Exception as e:
            logger.error(f"❌ Redis INCR error: {e}")
            return None

    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on key"""
        if not self.connected:
            return False
        try:
            await self.client.expire(key, seconds)
            return True
        except Exception as e:
            logger.error(f"❌ Redis EXPIRE error: {e}")
            return False

    async def ttl(self, key: str) -> Optional[int]:
        """Get TTL of key in seconds"""
        if not self.connected:
            return None
        try:
            return await self.client.ttl(key)
        except Exception as e:
            logger.error(f"❌ Redis TTL error: {e}")
            return None

    # ==========================================
    # RATE LIMITING
    # ==========================================

    async def check_rate_limit(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
        """
        Check rate limit using sliding window

        Args:
            key: Rate limit key (e.g., "rate_limit:user:123")
            max_requests: Maximum requests allowed
            window_seconds: Time window in seconds

        Returns:
            tuple: (allowed: bool, remaining: int)
        """
        if not self.connected:
            return True, max_requests  # Allow if Redis unavailable

        try:
            # Check if key exists
            exists = await self.exists(key)

            if not exists:
                # First request, set counter to 1
                await self.set(key, "1", window_seconds)
                return True, max_requests - 1

            # Increment counter
            count = await self.incr(key)

            if count == 2:
                # Ensure expiration is set
                await self.expire(key, window_seconds)

            remaining = max_requests - count
            allowed = count <= max_requests

            return allowed, max(0, remaining)

        except Exception as e:
            logger.error(f"❌ Rate limit check error: {e}")
            return True, max_requests  # Allow on error

    async def reset_rate_limit(self, key: str) -> bool:
        """Reset rate limit for a key"""
        return await self.delete(key)

    # ==========================================
    # CACHING HELPERS
    # ==========================================

    async def cache_response(self, query: str, response: str, ttl: int = 3600) -> bool:
        """Cache chatbot response"""
        key = f"chat_cache:{hash(query)}"
        return await self.set(key, response, ttl)

    async def get_cached_response(self, query: str) -> Optional[str]:
        """Get cached chatbot response"""
        key = f"chat_cache:{hash(query)}"
        return await self.get(key)

    async def cache_subscription(self, user_id: str, sub_data: dict, ttl: int = 300) -> bool:
        """Cache user subscription info"""
        key = f"subscription:user:{user_id}"
        return await self.set_json(key, sub_data, ttl)

    async def get_cached_subscription(self, user_id: str) -> Optional[dict]:
        """Get cached subscription info"""
        key = f"subscription:user:{user_id}"
        return await self.get_json(key)


# Global singleton instance
redis_client = RedisClient()
