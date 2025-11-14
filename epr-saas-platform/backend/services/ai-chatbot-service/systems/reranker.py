"""
Reranker System - Cross-encoder reranking for improved retrieval accuracy
Uses sentence-transformers cross-encoder to rerank retrieved documents
"""
import logging
from typing import List, Tuple

logger = logging.getLogger(__name__)

class Reranker:
    """
    Reranks retrieved documents using cross-encoder for better relevance
    """

    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        """
        Initialize reranker with cross-encoder model

        Args:
            model_name: Hugging Face model name for cross-encoder
                       Default: ms-marco-MiniLM-L-6-v2 (fast, good balance)
        """
        self.model_name = model_name
        self.model = None

        # Try to import and initialize cross-encoder (optional dependency)
        try:
            from sentence_transformers import CrossEncoder
            self.model = CrossEncoder(model_name)
            logger.info(f"Reranker initialized with model: {model_name}")
        except ImportError:
            logger.warning("sentence-transformers not installed. Reranking disabled.")
        except Exception as e:
            logger.warning(f"Failed to load reranker model: {e}. Reranking disabled.")

    def rerank(
        self,
        query: str,
        documents: List[str],
        top_k: int = 5
    ) -> List[Tuple[int, float]]:
        """
        Rerank documents based on relevance to query

        Args:
            query: User query string
            documents: List of document texts
            top_k: Number of top documents to return

        Returns:
            List of (index, score) tuples sorted by relevance
        """
        if not self.model or not documents:
            # Return original order if reranker not available
            return [(i, 1.0) for i in range(min(top_k, len(documents)))]

        try:
            # Prepare query-document pairs
            pairs = [[query, doc] for doc in documents]

            # Get relevance scores
            scores = self.model.predict(pairs)

            # Create (index, score) pairs and sort by score descending
            ranked = sorted(
                enumerate(scores),
                key=lambda x: x[1],
                reverse=True
            )

            # Return top_k results
            return ranked[:top_k]

        except Exception as e:
            logger.error(f"Reranking failed: {e}")
            # Fallback to original order
            return [(i, 1.0) for i in range(min(top_k, len(documents)))]

    def rerank_nodes(
        self,
        query: str,
        nodes: List,  # LlamaIndex nodes
        top_k: int = 5
    ) -> List:
        """
        Rerank LlamaIndex nodes

        Args:
            query: User query
            nodes: List of LlamaIndex nodes
            top_k: Number of nodes to return

        Returns:
            Reranked list of nodes
        """
        if not nodes:
            return []

        # Extract text from nodes
        node_texts = [node.get_content() for node in nodes]

        # Rerank
        ranked_indices = self.rerank(query, node_texts, top_k)

        # Return reranked nodes with updated scores
        reranked_nodes = []
        for idx, score in ranked_indices:
            node = nodes[idx]
            # Update node score if available
            if hasattr(node, 'score'):
                node.score = float(score)
            reranked_nodes.append(node)

        logger.info(f"Reranked {len(nodes)} nodes to top {len(reranked_nodes)}")
        return reranked_nodes
