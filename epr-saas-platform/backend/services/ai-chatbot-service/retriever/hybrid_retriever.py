"""
Hybrid Retriever combining Vector Search (semantic) and BM25 (keyword)
Uses Reciprocal Rank Fusion (RRF) to merge results
"""
import logging
from typing import List, Dict, Optional
from rank_bm25 import BM25Okapi
from llama_index.core import QueryBundle
from llama_index.core.schema import NodeWithScore, TextNode
from config import Config

logger = logging.getLogger(__name__)


class HybridRetriever:
    """
    Combines vector search (semantic) with BM25 (keyword) search
    for better retrieval accuracy
    """

    def __init__(
        self,
        vector_retriever,
        documents: List[Dict],
        vector_weight: float = 0.7,
        bm25_weight: float = 0.3,
        top_k: int = 10
    ):
        """
        Args:
            vector_retriever: LlamaIndex vector retriever
            documents: List of documents for BM25 indexing
            vector_weight: Weight for vector search results (0-1)
            bm25_weight: Weight for BM25 results (0-1)
            top_k: Number of results to return
        """
        self.vector_retriever = vector_retriever
        self.vector_weight = vector_weight
        self.bm25_weight = bm25_weight
        self.top_k = top_k

        # Build BM25 index
        self._build_bm25_index(documents)

        logger.info(f"HybridRetriever initialized with {len(self.documents)} documents")
        logger.info(f"Weights: Vector={vector_weight}, BM25={bm25_weight}")

    def _build_bm25_index(self, documents: List[Dict]):
        """
        Build BM25 index from documents
        """
        self.documents = documents
        self.doc_ids = []
        self.doc_metadata = []

        # Tokenize documents for BM25
        tokenized_corpus = []
        for doc in documents:
            # Get text content
            text = doc.get('text', '')
            if hasattr(doc, 'node'):
                text = doc.node.text
            elif hasattr(doc, 'get_content'):
                text = doc.get_content()

            # Simple tokenization (split by whitespace)
            tokens = text.lower().split()
            tokenized_corpus.append(tokens)

            # Store metadata
            if hasattr(doc, 'node'):
                self.doc_ids.append(doc.node.id_)
                self.doc_metadata.append(doc.node.metadata)
            else:
                self.doc_ids.append(doc.get('id', ''))
                self.doc_metadata.append(doc.get('metadata', {}))

        # Build BM25 index
        self.bm25 = BM25Okapi(tokenized_corpus)

        logger.info(f"BM25 index built with {len(tokenized_corpus)} documents")

    def _bm25_retrieve(self, query: str, top_k: int = 10) -> List[tuple]:
        """
        Retrieve using BM25 keyword search
        Returns list of (doc_index, score) tuples
        """
        # Tokenize query
        query_tokens = query.lower().split()

        # Get BM25 scores
        scores = self.bm25.get_scores(query_tokens)

        # Get top k results
        top_indices = sorted(
            range(len(scores)),
            key=lambda i: scores[i],
            reverse=True
        )[:top_k]

        results = [(idx, scores[idx]) for idx in top_indices]

        logger.debug(f"BM25 retrieved {len(results)} results")
        return results

    def _reciprocal_rank_fusion(
        self,
        vector_results: List[NodeWithScore],
        bm25_results: List[tuple],
        k: int = 60
    ) -> List[NodeWithScore]:
        """
        Merge results using Reciprocal Rank Fusion (RRF)

        RRF Score = Σ 1/(k + rank_i) for each retriever

        Args:
            vector_results: Results from vector search
            bm25_results: Results from BM25 search (doc_index, score)
            k: Constant for RRF (typically 60)

        Returns:
            Merged and reranked results
        """
        # Build score dict
        rrf_scores = {}

        # Add vector search scores
        for rank, node_with_score in enumerate(vector_results, 1):
            doc_id = node_with_score.node.id_
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0) + \
                                 self.vector_weight * (1 / (k + rank))

        # Add BM25 scores
        for rank, (doc_idx, bm25_score) in enumerate(bm25_results, 1):
            doc_id = self.doc_ids[doc_idx]
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0) + \
                                 self.bm25_weight * (1 / (k + rank))

        # Create merged results
        merged_results = []

        # Use vector results as base and update scores
        for node_with_score in vector_results:
            doc_id = node_with_score.node.id_
            if doc_id in rrf_scores:
                # Update score with RRF score
                node_with_score.score = rrf_scores[doc_id]
                merged_results.append(node_with_score)
                del rrf_scores[doc_id]

        # Add BM25-only results (not in vector results)
        for rank, (doc_idx, bm25_score) in enumerate(bm25_results):
            doc_id = self.doc_ids[doc_idx]
            if doc_id in rrf_scores:
                # Create NodeWithScore from BM25 result
                node = TextNode(
                    text=self.documents[doc_idx].get('text', ''),
                    id_=doc_id,
                    metadata=self.doc_metadata[doc_idx]
                )
                node_with_score = NodeWithScore(
                    node=node,
                    score=rrf_scores[doc_id]
                )
                merged_results.append(node_with_score)

        # Sort by RRF score
        merged_results.sort(key=lambda x: x.score, reverse=True)

        logger.debug(f"RRF merged {len(merged_results)} unique documents")

        return merged_results[:self.top_k]

    def retrieve(self, query: str) -> List[NodeWithScore]:
        """
        Retrieve using hybrid search (vector + BM25 + RRF)

        Args:
            query: Query string

        Returns:
            List of NodeWithScore objects
        """
        logger.info(f"Hybrid retrieval for query: {query[:50]}...")

        # 1. Vector search
        query_bundle = QueryBundle(query_str=query)
        vector_results = self.vector_retriever.retrieve(query_bundle)
        logger.debug(f"Vector search returned {len(vector_results)} results")

        # 2. BM25 search
        bm25_results = self._bm25_retrieve(query, top_k=self.top_k * 2)
        logger.debug(f"BM25 search returned {len(bm25_results)} results")

        # 3. Merge with RRF
        merged_results = self._reciprocal_rank_fusion(
            vector_results,
            bm25_results
        )

        logger.info(f"Hybrid retrieval returned {len(merged_results)} results")

        return merged_results

    def update_documents(self, documents: List[Dict]):
        """
        Update BM25 index with new documents
        """
        logger.info("Updating BM25 index...")
        self._build_bm25_index(documents)
        logger.info("BM25 index updated")


class HybridRetrieverFactory:
    """
    Factory to create HybridRetriever with proper initialization
    """

    @staticmethod
    def create(
        vector_retriever,
        index,
        vector_weight: Optional[float] = None,
        bm25_weight: Optional[float] = None,
        top_k: Optional[int] = None
    ) -> HybridRetriever:
        """
        Create HybridRetriever from vector index

        Args:
            vector_retriever: Existing vector retriever
            index: VectorStoreIndex to extract documents
            vector_weight: Weight for vector search
            bm25_weight: Weight for BM25 search
            top_k: Number of results

        Returns:
            HybridRetriever instance
        """
        # Use config defaults if not specified
        vector_weight = vector_weight or Config.VECTOR_WEIGHT
        bm25_weight = bm25_weight or Config.BM25_WEIGHT
        top_k = top_k or Config.HYBRID_TOP_K

        # Extract documents from index
        documents = []
        try:
            # Get all nodes from the index
            docstore = index.docstore
            nodes = docstore.docs.values()

            documents = list(nodes)
            logger.info(f"Extracted {len(documents)} documents from index")

        except Exception as e:
            logger.error(f"Failed to extract documents from index: {e}")
            # Fallback: use empty list (BM25 disabled)
            documents = []

        # Create hybrid retriever
        return HybridRetriever(
            vector_retriever=vector_retriever,
            documents=documents,
            vector_weight=vector_weight,
            bm25_weight=bm25_weight,
            top_k=top_k
        )
