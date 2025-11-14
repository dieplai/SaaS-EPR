import httpx
from typing import Optional
from config import Config

class PackageServiceClient:
    """
    HTTP client để gọi Package Service APIs.
    """

    def __init__(self):
        self.base_url = Config.PACKAGE_SERVICE_URL
        self.timeout = 10.0  # 10 seconds timeout

    async def check_quota(self, access_token: str) -> tuple[bool, Optional[str]]:
        """
        Check if user can make a query.

        Returns:
            (can_query: bool, error_message: Optional[str])
        """
        if not Config.CHECK_QUOTA:
            return True, None  # Quota check disabled

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/subscriptions/check-quota",
                    headers={"Authorization": f"Bearer {access_token}"}
                )

                if response.status_code == 200:
                    data = response.json()
                    can_query = data.get("can_query", False)
                    return can_query, None if can_query else "No queries remaining"

                elif response.status_code == 401:
                    return False, "Unauthorized"

                else:
                    error = response.json().get("error", "Failed to check quota")
                    return False, error

        except httpx.TimeoutException:
            # Timeout → Cho phép query (fail-open)
            return True, None

        except Exception as e:
            # Error → Cho phép query (fail-open)
            print(f"Error checking quota: {e}")
            return True, None

    async def record_query(self, access_token: str) -> bool:
        """
        Record query usage (decrement quota).

        Returns:
            success: bool
        """
        if not Config.RECORD_USAGE:
            return True  # Recording disabled

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/subscriptions/record-query",
                    headers={"Authorization": f"Bearer {access_token}"}
                )

                return response.status_code == 200

        except Exception as e:
            print(f"Error recording query: {e}")
            return False
