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

    # ============================================
    # BASIC RAG SETTINGS
    # ============================================
    SIMILARITY_TOP_K = 10
    EMPTY_QUERY_TOP_K = 10
    MAX_SOURCES = 3
    MAX_SOURCES_FALLBACK = 5

    # LLM Settings
    LLM_MODEL = "gpt-4o-mini"
    LLM_TEMPERATURE = 0.2
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

    # ============================================
    # TOP-TIER RAG ENHANCEMENTS
    # ============================================

    # Hybrid Search Settings
    ENABLE_HYBRID_SEARCH = os.getenv("ENABLE_HYBRID_SEARCH", "True").lower() == "true"
    BM25_WEIGHT = float(os.getenv("BM25_WEIGHT", "0.3"))  # 30% keyword, 70% semantic
    VECTOR_WEIGHT = float(os.getenv("VECTOR_WEIGHT", "0.7"))
    HYBRID_TOP_K = int(os.getenv("HYBRID_TOP_K", "20"))

    # Query Transformation
    ENABLE_HYDE = os.getenv("ENABLE_HYDE", "True").lower() == "true"
    ENABLE_MULTI_QUERY = os.getenv("ENABLE_MULTI_QUERY", "True").lower() == "true"
    NUM_MULTI_QUERIES = int(os.getenv("NUM_MULTI_QUERIES", "3"))
    ENABLE_STEP_BACK = os.getenv("ENABLE_STEP_BACK", "False").lower() == "true"

    # Advanced Reranking
    ENABLE_CROSS_ENCODER_RERANK = os.getenv("ENABLE_CROSS_ENCODER_RERANK", "True").lower() == "true"
    ENABLE_LLM_RERANK = os.getenv("ENABLE_LLM_RERANK", "True").lower() == "true"
    CROSS_ENCODER_MODEL = os.getenv("CROSS_ENCODER_MODEL", "cross-encoder/ms-marco-MiniLM-L-12-v2")
    CROSS_ENCODER_TOP_K = int(os.getenv("CROSS_ENCODER_TOP_K", "10"))
    LLM_RERANK_TOP_K = int(os.getenv("LLM_RERANK_TOP_K", "5"))

    # Hierarchical Chunking
    ENABLE_HIERARCHICAL_CHUNKING = os.getenv("ENABLE_HIERARCHICAL_CHUNKING", "True").lower() == "true"
    CHUNK_SIZES = [2048, 512, 128]  # Parent, Child, Grandchild
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "50"))

    # Self-RAG Settings
    ENABLE_SELF_RAG = os.getenv("ENABLE_SELF_RAG", "True").lower() == "true"
    RELEVANCE_THRESHOLD = float(os.getenv("RELEVANCE_THRESHOLD", "0.7"))
    MIN_RELEVANT_DOCS = int(os.getenv("MIN_RELEVANT_DOCS", "2"))
    MAX_RETRY_ATTEMPTS = int(os.getenv("MAX_RETRY_ATTEMPTS", "3"))

    # CRAG Settings
    ENABLE_CRAG = os.getenv("ENABLE_CRAG", "True").lower() == "true"
    CRAG_QUALITY_THRESHOLD = float(os.getenv("CRAG_QUALITY_THRESHOLD", "0.6"))

    # Semantic Caching
    ENABLE_SEMANTIC_CACHE = os.getenv("ENABLE_SEMANTIC_CACHE", "True").lower() == "true"
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "3600"))  # 1 hour
    CACHE_SIMILARITY_THRESHOLD = float(os.getenv("CACHE_SIMILARITY_THRESHOLD", "0.95"))

    # Agentic RAG
    ENABLE_QUERY_ROUTING = os.getenv("ENABLE_QUERY_ROUTING", "True").lower() == "true"
    ENABLE_AGENTIC_RAG = os.getenv("ENABLE_AGENTIC_RAG", "False").lower() == "true"  # Advanced feature

    # Evaluation & Monitoring
    ENABLE_EVALUATION = os.getenv("ENABLE_EVALUATION", "True").lower() == "true"
    ENABLE_METRICS = os.getenv("ENABLE_METRICS", "True").lower() == "true"
    ENABLE_TRACING = os.getenv("ENABLE_TRACING", "False").lower() == "true"
    PHOENIX_COLLECTOR_ENDPOINT = os.getenv("PHOENIX_COLLECTOR_ENDPOINT", "http://localhost:6006")

    # Performance Targets
    TARGET_HIT_RATE = float(os.getenv("TARGET_HIT_RATE", "0.90"))
    TARGET_MRR = float(os.getenv("TARGET_MRR", "0.80"))
    TARGET_FAITHFULNESS = float(os.getenv("TARGET_FAITHFULNESS", "0.95"))
    TARGET_P95_LATENCY_MS = int(os.getenv("TARGET_P95_LATENCY_MS", "3000"))

    # Cost Optimization
    MAX_COST_PER_QUERY_USD = float(os.getenv("MAX_COST_PER_QUERY_USD", "0.02"))
    ENABLE_COST_TRACKING = os.getenv("ENABLE_COST_TRACKING", "True").lower() == "true"
