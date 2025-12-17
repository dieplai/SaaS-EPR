"""
Backend Client for EPR Chatbot Service
Communicates with epr-backend service for subscription and token management
"""

import httpx
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class BackendClient:
    """Client to interact with epr-backend service for token management"""

    def __init__(self):
        self.base_url = os.getenv("EPR_BACKEND_URL", "http://epr-backend:8001")
        self.timeout = 10.0
        logger.info(f"✅ Backend client initialized with URL: {self.base_url}")

    async def consume_tokens(self, token_count: int, auth_token: str) -> tuple[bool, Optional[str]]:
        """
        Consume tokens from user's active subscription

        Args:
            token_count: Number of tokens to consume
            auth_token: JWT token for authentication

        Returns:
            tuple: (success: bool, error_message: Optional[str])
        """
        if not auth_token:
            logger.warning("⚠️  No auth token provided")
            return False, "Authentication required"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/subscriptions/consume-tokens",
                    json={"token_count": token_count},
                    headers={"Authorization": f"Bearer {auth_token}"}
                )

                if response.status_code == 200:
                    logger.info(f"✅ Consumed {token_count} tokens successfully")
                    return True, None
                elif response.status_code == 401:
                    logger.warning("⚠️  Unauthorized - invalid or expired token")
                    return False, "Authentication failed"
                elif response.status_code == 400:
                    error_data = response.json()
                    error_msg = error_data.get("error", "Invalid request")
                    logger.warning(f"⚠️  Token consumption failed: {error_msg}")
                    return False, error_msg
                elif response.status_code == 404:
                    logger.warning("⚠️  No active subscription found")
                    return False, "No active subscription found"
                else:
                    logger.error(f"❌ Backend error: {response.status_code} - {response.text}")
                    return False, f"Backend error: {response.status_code}"

        except httpx.ConnectError as e:
            logger.error(f"❌ Cannot connect to backend: {e}")
            return False, "Backend service unavailable"
        except httpx.TimeoutException:
            logger.error("❌ Backend request timed out")
            return False, "Request timeout"
        except Exception as e:
            logger.error(f"❌ Unexpected error consuming tokens: {e}")
            return False, f"Unexpected error: {str(e)}"

    async def get_subscription_info(self, auth_token: str) -> Optional[dict]:
        """
        Get user's current subscription information

        Args:
            auth_token: JWT token for authentication

        Returns:
            dict: Subscription info with remaining_tokens, or None if not found
        """
        if not auth_token:
            logger.warning("⚠️  No auth token provided")
            return None

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/subscriptions/current",
                    headers={"Authorization": f"Bearer {auth_token}"}
                )

                if response.status_code == 200:
                    data = response.json().get("data", {})
                    logger.info(f"✅ Retrieved subscription info: {data.get('remaining_tokens', 0)} tokens remaining")
                    return data
                elif response.status_code == 404:
                    logger.info("ℹ️  No active subscription found")
                    return None
                else:
                    logger.warning(f"⚠️  Failed to get subscription: {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"❌ Error getting subscription info: {e}")
            return None

    async def check_token_availability(self, token_count: int, auth_token: str) -> tuple[bool, Optional[str]]:
        """
        Check if user has enough tokens before processing

        Args:
            token_count: Number of tokens needed
            auth_token: JWT token for authentication

        Returns:
            tuple: (has_enough: bool, error_message: Optional[str])
        """
        subscription = await self.get_subscription_info(auth_token)

        if not subscription:
            return False, "No active subscription found. Please subscribe to a plan."

        remaining = subscription.get("remaining_tokens", 0)

        if remaining < token_count:
            return False, f"Insufficient tokens. You have {remaining} tokens but need {token_count}."

        return True, None


# Global singleton instance
backend_client = BackendClient()
