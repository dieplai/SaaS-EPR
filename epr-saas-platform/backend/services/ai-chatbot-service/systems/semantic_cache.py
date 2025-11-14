"""
Semantic Caching Layer
Caches RAG responses based on semantic similarity of queries
"""
import logging
import json
import hashlib
from typing import Optional, Dict, Any
import redis
from datetime import timedelta
from llama_index.embeddings.openai import OpenAIEmbedding
import numpy as np
from config import Config

logger = logging.getLogger(__name__)


class SemanticCache:
    """
    Semantic cache that stores query-answer pairs
    and retrieves based on semantic similarity
    """

    def __init__(
        self,
        redis_url: str = None,
        ttl_seconds: int = None,
        similarity_threshold: float = None,
        embed_model: Optional[OpenAIEmbedding] = None
    ):
        """
        Args:
            redis_url: Redis connection URL
            ttl_seconds: Time-to-live for cache entries
            similarity_threshold: Minimum cosine similarity for cache hit
            embed_model: Embedding model for query encoding
        """
        self.redis_url = redis_url or Config.REDIS_URL
        self.ttl_seconds = ttl_seconds or Config.CACHE_TTL_SECONDS
        self.similarity_threshold = similarity_threshold or Config.CACHE_SIMILARITY_THRESHOLD

        # Initialize Redis client
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                decode_responses=True
            )
            # Test connection
            self.redis_client.ping()
            logger.info(f"Semantic cache connected to Redis: {self.redis_url}")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}. Cache disabled.")
            self.redis_client = None

        # Initialize embedding model
        self.embed_model = embed_model or OpenAIEmbedding(
            model="text-embedding-3-small"
        )

        # Cache stats
        self.hits = 0
        self.misses = 0
        self.total_queries = 0

    def _get_query_embedding(self, query: str) -> np.ndarray:
        """
        Get embedding vector for query
        """
        try:
            embedding = self.embed_model.get_query_embedding(query)
            return np.array(embedding)
        except Exception as e:
            logger.error(f"Failed to get query embedding: {e}")
            return None

    def _cosine_similarity(
        self,
        vec1: np.ndarray,
        vec2: np.ndarray
    ) -> float:
        """
        Calculate cosine similarity between two vectors
        """
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)

    def _generate_cache_key(self, query_hash: str) -> str:
        """Generate Redis key for cache entry"""
        return f"semantic_cache:{query_hash}"

    def _hash_query(self, query: str) -> str:
        """Generate hash for exact match caching"""
        return hashlib.md5(query.lower().strip().encode()).hexdigest()

    def get(
        self,
        query: str,
        session_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached response for query

        Args:
            query: User query
            session_id: Optional session ID for context-aware caching

        Returns:
            Cached response dict or None if cache miss
        """
        if not self.redis_client:
            return None

        self.total_queries += 1

        try:
            # 1. Try exact match first (fast path)
            query_hash = self._hash_query(query)
            exact_key = self._generate_cache_key(query_hash)

            cached_data = self.redis_client.get(exact_key)
            if cached_data:
                self.hits += 1
                logger.info(f"Cache HIT (exact): {query[:50]}...")
                result = json.loads(cached_data)
                result['cache_hit_type'] = 'exact'
                return result

            # 2. Semantic similarity search
            query_embedding = self._get_query_embedding(query)
            if query_embedding is None:
                self.misses += 1
                return None

            # Get all cache keys
            cache_keys = self.redis_client.keys("semantic_cache:*")

            best_match = None
            best_similarity = 0.0

            for cache_key in cache_keys[:100]:  # Limit search to avoid performance issues
                try:
                    cached_data = self.redis_client.get(cache_key)
                    if not cached_data:
                        continue

                    cached_entry = json.loads(cached_data)

                    # Get cached embedding
                    cached_embedding_list = cached_entry.get('query_embedding')
                    if not cached_embedding_list:
                        continue

                    cached_embedding = np.array(cached_embedding_list)

                    # Calculate similarity
                    similarity = self._cosine_similarity(
                        query_embedding,
                        cached_embedding
                    )

                    # Update best match
                    if similarity > best_similarity:
                        best_similarity = similarity
                        best_match = cached_entry

                except Exception as e:
                    logger.debug(f"Error processing cache entry: {e}")
                    continue

            # Check if best match exceeds threshold
            if best_match and best_similarity >= self.similarity_threshold:
                self.hits += 1
                logger.info(f"Cache HIT (semantic): {query[:50]}... "
                          f"(similarity: {best_similarity:.3f})")
                best_match['cache_hit_type'] = 'semantic'
                best_match['similarity_score'] = best_similarity
                return best_match

            # Cache miss
            self.misses += 1
            logger.debug(f"Cache MISS: {query[:50]}... "
                        f"(best similarity: {best_similarity:.3f})")
            return None

        except Exception as e:
            logger.error(f"Cache get error: {e}")
            self.misses += 1
            return None

    def set(
        self,
        query: str,
        response: Dict[str, Any],
        session_id: Optional[str] = None
    ):
        """
        Store query-response pair in cache

        Args:
            query: User query
            response: RAG response dict
            session_id: Optional session ID
        """
        if not self.redis_client:
            return

        try:
            # Get query embedding
            query_embedding = self._get_query_embedding(query)
            if query_embedding is None:
                logger.warning("Failed to get embedding, skipping cache")
                return

            # Prepare cache entry
            cache_entry = {
                'query': query,
                'query_embedding': query_embedding.tolist(),
                'response': response,
                'session_id': session_id,
                'cached_at': str(timedelta())
            }

            # Generate cache key
            query_hash = self._hash_query(query)
            cache_key = self._generate_cache_key(query_hash)

            # Store in Redis with TTL
            self.redis_client.setex(
                cache_key,
                self.ttl_seconds,
                json.dumps(cache_entry)
            )

            logger.debug(f"Cached response for query: {query[:50]}...")

        except Exception as e:
            logger.error(f"Cache set error: {e}")

    def invalidate(self, query: str):
        """
        Invalidate cache entry for specific query
        """
        if not self.redis_client:
            return

        try:
            query_hash = self._hash_query(query)
            cache_key = self._generate_cache_key(query_hash)
            self.redis_client.delete(cache_key)
            logger.info(f"Invalidated cache for: {query[:50]}...")
        except Exception as e:
            logger.error(f"Cache invalidate error: {e}")

    def clear_all(self):
        """
        Clear all cache entries
        """
        if not self.redis_client:
            return

        try:
            keys = self.redis_client.keys("semantic_cache:*")
            if keys:
                self.redis_client.delete(*keys)
                logger.info(f"Cleared {len(keys)} cache entries")
        except Exception as e:
            logger.error(f"Cache clear error: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics
        """
        if self.total_queries == 0:
            hit_rate = 0.0
        else:
            hit_rate = self.hits / self.total_queries

        stats = {
            'total_queries': self.total_queries,
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': hit_rate,
            'enabled': self.redis_client is not None
        }

        if self.redis_client:
            try:
                cache_keys = self.redis_client.keys("semantic_cache:*")
                stats['total_entries'] = len(cache_keys)
            except:
                stats['total_entries'] = 0

        return stats

    def reset_stats(self):
        """Reset cache statistics"""
        self.hits = 0
        self.misses = 0
        self.total_queries = 0
        logger.info("Cache statistics reset")


# Singleton instance
_cache_instance: Optional[SemanticCache] = None


def get_semantic_cache() -> Optional[SemanticCache]:
    """
    Get or create semantic cache singleton
    """
    global _cache_instance

    if not Config.ENABLE_SEMANTIC_CACHE:
        return None

    if _cache_instance is None:
        try:
            _cache_instance = SemanticCache()
        except Exception as e:
            logger.error(f"Failed to initialize semantic cache: {e}")
            return None

    return _cache_instance
