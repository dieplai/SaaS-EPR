"""
Advanced Retriever Setup
Integrates all top-tier RAG components
"""
import logging
import weaviate
from weaviate.classes.init import Auth
from llama_index.vector_stores.weaviate import WeaviateVectorStore
from llama_index.core import VectorStoreIndex
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding

from config import Config
from retriever.hybrid_retriever import HybridRetrieverFactory
from systems.advanced_reranker import MultiStageReranker, DiversityReranker
from systems.query_transforms import QueryTransformPipeline
from systems.semantic_cache import get_semantic_cache
from systems.evaluation import EvaluationFramework
from systems.self_rag import SelfRAG
from systems.query_router import QueryRouter, AdaptiveRouter

logger = logging.getLogger(__name__)


class AdvancedRetrieverSystem:
    """
    Complete top-tier RAG system with all advanced features
    """

    def __init__(self):
        self.client = None
        self.index = None
        self.vector_retriever = None
        self.hybrid_retriever = None
        self.reranker = None
        self.query_transformer = None
        self.semantic_cache = None
        self.evaluator = None
        self.self_rag = None
        self.query_router = None
        self.llm = None
        self.embed_model = None

    def initialize(self) -> bool:
        """
        Initialize complete advanced RAG system
        """
        try:
            logger.info("="*60)
            logger.info("Initializing TOP-TIER RAG SYSTEM")
            logger.info("="*60)

            # Validate config
            Config.validate()

            # 1. Initialize LLM and Embeddings
            self._init_models()

            # 2. Connect to Weaviate
            self._init_weaviate()

            # 3. Setup retrievers
            self._init_retrievers()

            # 4. Setup reranker
            self._init_reranker()

            # 5. Setup query transformations
            self._init_query_transformer()

            # 6. Setup semantic cache
            self._init_semantic_cache()

            # 7. Setup evaluation
            self._init_evaluation()

            # 8. Setup Self-RAG
            self._init_self_rag()

            # 9. Setup query router
            self._init_query_router()

            logger.info("="*60)
            logger.info("✅ TOP-TIER RAG SYSTEM READY!")
            logger.info("="*60)

            self._print_system_status()

            return True

        except Exception as e:
            logger.error(f"Failed to initialize advanced RAG system: {e}")
            import traceback
            traceback.print_exc()
            return False

    def _init_models(self):
        """Initialize LLM and embedding models"""
        logger.info("📚 Initializing models...")

        self.llm = OpenAI(
            model=Config.LLM_MODEL,
            temperature=Config.LLM_TEMPERATURE
        )

        self.embed_model = OpenAIEmbedding(
            model="text-embedding-3-small"
        )

        logger.info(f"  ✓ LLM: {Config.LLM_MODEL}")
        logger.info(f"  ✓ Embeddings: text-embedding-3-small")

    def _init_weaviate(self):
        """Initialize Weaviate connection"""
        logger.info("🔗 Connecting to Weaviate...")

        self.client = weaviate.connect_to_weaviate_cloud(
            cluster_url=Config.WEAVIATE_URL,
            auth_credentials=Auth.api_key(Config.WEAVIATE_API_KEY),
            skip_init_checks=True,
        )

        # Setup vector store
        vector_store = WeaviateVectorStore(
            weaviate_client=self.client,
            index_name=Config.WEAVIATE_CLASS_NAME
        )

        # Load index
        self.index = VectorStoreIndex.from_vector_store(vector_store)

        logger.info(f"  ✓ Connected to Weaviate")
        logger.info(f"  ✓ Index: {Config.WEAVIATE_CLASS_NAME}")

    def _init_retrievers(self):
        """Initialize retrieval systems"""
        logger.info("🔍 Initializing retrievers...")

        # Base vector retriever
        self.vector_retriever = VectorIndexRetriever(
            index=self.index,
            similarity_top_k=Config.SIMILARITY_TOP_K
        )
        logger.info(f"  ✓ Vector retriever (top_k={Config.SIMILARITY_TOP_K})")

        # Hybrid retriever (Vector + BM25)
        if Config.ENABLE_HYBRID_SEARCH:
            try:
                self.hybrid_retriever = HybridRetrieverFactory.create(
                    vector_retriever=self.vector_retriever,
                    index=self.index,
                    vector_weight=Config.VECTOR_WEIGHT,
                    bm25_weight=Config.BM25_WEIGHT,
                    top_k=Config.HYBRID_TOP_K
                )
                logger.info(f"  ✓ Hybrid retriever ({Config.VECTOR_WEIGHT:.1%} vector + "
                          f"{Config.BM25_WEIGHT:.1%} BM25)")
            except Exception as e:
                logger.warning(f"  ⚠ Hybrid retriever failed: {e}")
                self.hybrid_retriever = None

    def _init_reranker(self):
        """Initialize reranking system"""
        logger.info("🎯 Initializing reranker...")

        try:
            # Get OpenAI client for LLM reranking
            import openai
            openai_client = openai.OpenAI(api_key=Config.OPENAI_API_KEY)

            self.reranker = MultiStageReranker(
                llm_client=openai_client
            )

            features = []
            if Config.ENABLE_CROSS_ENCODER_RERANK:
                features.append("Cross-Encoder")
            if Config.ENABLE_LLM_RERANK:
                features.append("LLM")

            logger.info(f"  ✓ Multi-stage reranker ({' + '.join(features)})")

        except Exception as e:
            logger.warning(f"  ⚠ Reranker initialization failed: {e}")
            self.reranker = None

    def _init_query_transformer(self):
        """Initialize query transformation pipeline"""
        logger.info("🔄 Initializing query transformations...")

        try:
            import openai
            openai_client = openai.OpenAI(api_key=Config.OPENAI_API_KEY)

            self.query_transformer = QueryTransformPipeline(
                llm_client=openai_client
            )

            features = []
            if Config.ENABLE_HYDE:
                features.append("HyDE")
            if Config.ENABLE_MULTI_QUERY:
                features.append(f"Multi-Query(n={Config.NUM_MULTI_QUERIES})")
            if Config.ENABLE_STEP_BACK:
                features.append("Step-Back")

            logger.info(f"  ✓ Query transformations ({', '.join(features)})")

        except Exception as e:
            logger.warning(f"  ⚠ Query transformer failed: {e}")
            self.query_transformer = None

    def _init_semantic_cache(self):
        """Initialize semantic caching"""
        logger.info("💾 Initializing semantic cache...")

        if Config.ENABLE_SEMANTIC_CACHE:
            try:
                self.semantic_cache = get_semantic_cache()
                if self.semantic_cache:
                    logger.info(f"  ✓ Semantic cache (TTL={Config.CACHE_TTL_SECONDS}s, "
                              f"threshold={Config.CACHE_SIMILARITY_THRESHOLD})")
                else:
                    logger.info("  ⚠ Semantic cache disabled (Redis unavailable)")
            except Exception as e:
                logger.warning(f"  ⚠ Semantic cache failed: {e}")
                self.semantic_cache = None
        else:
            logger.info("  ⊝ Semantic cache disabled")

    def _init_evaluation(self):
        """Initialize evaluation framework"""
        logger.info("📊 Initializing evaluation...")

        if Config.ENABLE_EVALUATION:
            try:
                self.evaluator = EvaluationFramework(
                    enable_llm_evaluation=True
                )
                logger.info(f"  ✓ Evaluation framework (LLM-based metrics)")
            except Exception as e:
                logger.warning(f"  ⚠ Evaluation failed: {e}")
                self.evaluator = None
        else:
            logger.info("  ⊝ Evaluation disabled")

    def _init_self_rag(self):
        """Initialize Self-RAG system"""
        logger.info("🔬 Initializing Self-RAG...")

        if Config.ENABLE_SELF_RAG:
            try:
                import openai
                openai_client = openai.OpenAI(api_key=Config.OPENAI_API_KEY)

                # Prepare retrievers dict
                retrievers = {
                    "vector": self.vector_retriever,
                }
                if self.hybrid_retriever:
                    retrievers["hybrid"] = self.hybrid_retriever

                self.self_rag = SelfRAG(
                    llm_client=openai_client,
                    retrievers=retrievers
                )

                logger.info(f"  ✓ Self-RAG (threshold={Config.RELEVANCE_THRESHOLD}, "
                          f"max_retries={Config.MAX_RETRY_ATTEMPTS})")

            except Exception as e:
                logger.warning(f"  ⚠ Self-RAG failed: {e}")
                self.self_rag = None
        else:
            logger.info("  ⊝ Self-RAG disabled")

    def _init_query_router(self):
        """Initialize query routing"""
        logger.info("🧭 Initializing query router...")

        if Config.ENABLE_QUERY_ROUTING:
            try:
                import openai
                openai_client = openai.OpenAI(api_key=Config.OPENAI_API_KEY)

                if Config.ENABLE_AGENTIC_RAG:
                    self.query_router = AdaptiveRouter(llm_client=openai_client)
                    logger.info(f"  ✓ Adaptive query router (learning-enabled)")
                else:
                    self.query_router = QueryRouter(llm_client=openai_client)
                    logger.info(f"  ✓ Query router (rule + LLM)")

            except Exception as e:
                logger.warning(f"  ⚠ Query router failed: {e}")
                self.query_router = None
        else:
            logger.info("  ⊝ Query routing disabled")

    def _print_system_status(self):
        """Print system status summary"""
        logger.info("")
        logger.info("System Status:")
        logger.info(f"  Retrieval: {'Hybrid ✓' if self.hybrid_retriever else 'Vector-only'}")
        logger.info(f"  Reranking: {'Multi-stage ✓' if self.reranker else 'Basic'}")
        logger.info(f"  Query Transform: {'Enabled ✓' if self.query_transformer else 'Disabled'}")
        logger.info(f"  Semantic Cache: {'Enabled ✓' if self.semantic_cache else 'Disabled'}")
        logger.info(f"  Self-RAG: {'Enabled ✓' if self.self_rag else 'Disabled'}")
        logger.info(f"  Query Router: {'Enabled ✓' if self.query_router else 'Disabled'}")
        logger.info(f"  Evaluation: {'Enabled ✓' if self.evaluator else 'Disabled'}")
        logger.info("")

    # ============================================
    # ACCESSORS
    # ============================================

    def get_retriever(self, strategy: str = "auto"):
        """Get retriever by strategy"""
        if strategy == "auto":
            return self.hybrid_retriever if self.hybrid_retriever else self.vector_retriever
        elif strategy == "hybrid":
            return self.hybrid_retriever
        elif strategy == "vector":
            return self.vector_retriever
        else:
            return self.vector_retriever

    def get_reranker(self):
        """Get reranker instance"""
        return self.reranker

    def get_query_transformer(self):
        """Get query transformer"""
        return self.query_transformer

    def get_semantic_cache(self):
        """Get semantic cache"""
        return self.semantic_cache

    def get_evaluator(self):
        """Get evaluation framework"""
        return self.evaluator

    def get_self_rag(self):
        """Get Self-RAG system"""
        return self.self_rag

    def get_query_router(self):
        """Get query router"""
        return self.query_router

    def get_llm(self):
        """Get LLM instance"""
        return self.llm

    def get_embed_model(self):
        """Get embedding model"""
        return self.embed_model

    def get_system_info(self) -> dict:
        """Get comprehensive system information"""
        return {
            "version": "2.0.0-advanced",
            "components": {
                "retrieval": {
                    "hybrid_search": self.hybrid_retriever is not None,
                    "vector_only": self.vector_retriever is not None,
                },
                "reranking": {
                    "enabled": self.reranker is not None,
                    "cross_encoder": Config.ENABLE_CROSS_ENCODER_RERANK,
                    "llm_rerank": Config.ENABLE_LLM_RERANK,
                },
                "query_transformation": {
                    "enabled": self.query_transformer is not None,
                    "hyde": Config.ENABLE_HYDE,
                    "multi_query": Config.ENABLE_MULTI_QUERY,
                },
                "caching": {
                    "enabled": self.semantic_cache is not None,
                    "type": "semantic",
                },
                "self_rag": {
                    "enabled": self.self_rag is not None,
                },
                "query_routing": {
                    "enabled": self.query_router is not None,
                    "adaptive": Config.ENABLE_AGENTIC_RAG,
                },
                "evaluation": {
                    "enabled": self.evaluator is not None,
                },
            },
            "config": {
                "llm_model": Config.LLM_MODEL,
                "similarity_top_k": Config.SIMILARITY_TOP_K,
                "hybrid_weights": {
                    "vector": Config.VECTOR_WEIGHT,
                    "bm25": Config.BM25_WEIGHT,
                } if Config.ENABLE_HYBRID_SEARCH else None,
            }
        }
