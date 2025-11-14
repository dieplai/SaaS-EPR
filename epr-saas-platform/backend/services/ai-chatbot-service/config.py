import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Server
    PORT = int(os.getenv("PORT", 8004))
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"

    # Weaviate Vector Database
    WEAVIATE_URL = os.getenv("WEAVIATE_URL", "https://jdoeuawspwptiewpq7ua.c0.asia-southeast1.gcp.weaviate.cloud")
    WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY", "eTRVYzJlcU1BVWtTUnM4dl9aLzg3T0Fma3k1cVVyb2lBS0pQT25Jc1RvczcrczhzbWN3WlJYcjFPdVlvPV92MjAw")
    WEAVIATE_CLASS_NAME = "LlamaIndex_auto_EPR"

    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    @classmethod
    def validate(cls):
        """Validate required configuration"""
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required")
        if not cls.WEAVIATE_URL:
            raise ValueError("WEAVIATE_URL is required")
        if not cls.WEAVIATE_API_KEY:
            raise ValueError("WEAVIATE_API_KEY is required")

    # RAG Settings
    SIMILARITY_TOP_K = 10  # Increased from 6 to 10 for better retrieval
    EMPTY_QUERY_TOP_K = 10
    MAX_SOURCES = 3
    MAX_SOURCES_FALLBACK = 5

    # LLM Settings
    LLM_MODEL = "gpt-4o-mini"  # Upgraded from gpt-3.5-turbo for better accuracy
    LLM_TEMPERATURE = 0.2  # Increased for more natural, conversational responses while maintaining accuracy
    FAQ_MATCHING_MODEL = "gpt-4o-mini"

    # JWT (for verifying tokens from User Service)
    JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-jwt-key-change-this-in-production")
    JWT_ALGORITHM = "HS256"

    # Microservices URLs
    PACKAGE_SERVICE_URL = os.getenv("PACKAGE_SERVICE_URL", "http://localhost:8002")
    USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://localhost:8001")

    # Quota Settings
    CHECK_QUOTA = os.getenv("CHECK_QUOTA", "True").lower() == "true"
    RECORD_USAGE = os.getenv("RECORD_USAGE", "True").lower() == "true"
