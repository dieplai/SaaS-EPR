"""
Advanced Multi-Stage Reranking
Stage 1: Cross-Encoder Reranking
Stage 2: LLM-based Reranking for final refinement
"""
import logging
from typing import List, Dict, Optional
from config import Config

logger = logging.getLogger(__name__)


class MultiStageReranker:
    """
    Multi-stage reranking pipeline:
    1. Cross-encoder for fast, accurate relevance scoring
    2. LLM for final refinement with deep understanding
    """

    def __init__(
        self,
        cross_encoder_model: Optional[object] = None,
        llm_client: Optional[object] = None
    ):
        """
        Args:
            cross_encoder_model: Sentence transformer cross-encoder
            llm_client: OpenAI client for LLM reranking
        """
        self.llm_client = llm_client

        # Initialize cross-encoder
        if Config.ENABLE_CROSS_ENCODER_RERANK:
            try:
                from sentence_transformers import CrossEncoder
                if cross_encoder_model is None:
                    self.cross_encoder = CrossEncoder(Config.CROSS_ENCODER_MODEL)
                else:
                    self.cross_encoder = cross_encoder_model
                logger.info(f"Cross-encoder initialized: {Config.CROSS_ENCODER_MODEL}")
            except Exception as e:
                logger.warning(f"Failed to load cross-encoder: {e}")
                self.cross_encoder = None
        else:
            self.cross_encoder = None

        self.enable_llm_rerank = Config.ENABLE_LLM_RERANK and llm_client is not None

        logger.info("Multi-stage reranker initialized")
        logger.info(f"  Cross-encoder: {self.cross_encoder is not None}")
        logger.info(f"  LLM reranking: {self.enable_llm_rerank}")

    # ============================================
    # STAGE 1: CROSS-ENCODER RERANKING
    # ============================================

    def cross_encoder_rerank(
        self,
        query: str,
        nodes: List,
        top_k: Optional[int] = None
    ) -> List:
        """
        Rerank nodes using cross-encoder

        Args:
            query: User query
            nodes: List of nodes to rerank
            top_k: Number of nodes to return

        Returns:
            Reranked list of nodes
        """
        if not self.cross_encoder or not nodes:
            return nodes

        top_k = top_k or Config.CROSS_ENCODER_TOP_K

        try:
            # Prepare query-document pairs
            pairs = []
            for node in nodes:
                if hasattr(node, 'get_content'):
                    text = node.get_content()
                elif hasattr(node, 'node'):
                    text = node.node.text
                else:
                    text = node.get('text', '')

                pairs.append([query, text[:512]])  # Limit text length

            # Get relevance scores from cross-encoder
            scores = self.cross_encoder.predict(pairs)

            # Update node scores and sort
            for i, node in enumerate(nodes):
                if hasattr(node, 'score'):
                    node.score = float(scores[i])

            # Sort by score descending
            ranked_nodes = sorted(
                nodes,
                key=lambda x: getattr(x, 'score', 0),
                reverse=True
            )

            logger.info(f"Cross-encoder reranked {len(nodes)} → {min(top_k, len(ranked_nodes))} nodes")

            return ranked_nodes[:top_k]

        except Exception as e:
            logger.error(f"Cross-encoder reranking failed: {e}")
            return nodes[:top_k] if top_k else nodes

    # ============================================
    # STAGE 2: LLM RERANKING
    # ============================================

    def llm_rerank(
        self,
        query: str,
        nodes: List,
        top_k: Optional[int] = None
    ) -> List:
        """
        Rerank nodes using LLM for deep understanding

        Args:
            query: User query
            nodes: List of nodes to rerank
            top_k: Number of nodes to return

        Returns:
            Reranked list of nodes
        """
        if not self.enable_llm_rerank or not nodes:
            return nodes

        top_k = top_k or Config.LLM_RERANK_TOP_K

        # Only rerank if we have more nodes than needed
        if len(nodes) <= top_k:
            return nodes

        try:
            # Prepare documents for LLM evaluation
            docs_text = ""
            for i, node in enumerate(nodes, 1):
                if hasattr(node, 'get_content'):
                    text = node.get_content()
                elif hasattr(node, 'node'):
                    text = node.node.text
                else:
                    text = node.get('text', '')

                # Get metadata for context
                metadata = {}
                if hasattr(node, 'node') and hasattr(node.node, 'metadata'):
                    metadata = node.node.metadata
                elif hasattr(node, 'metadata'):
                    metadata = node.metadata

                article = metadata.get('dieu', 'N/A')
                title = metadata.get('dieu_title', '')

                docs_text += f"\n\nDoc {i}:\n"
                docs_text += f"[Điều {article}]: {title}\n"
                docs_text += f"{text[:300]}..."

            # LLM prompt for reranking
            prompt = f"""Đánh giá độ liên quan của các văn bản pháp luật với câu hỏi.

Câu hỏi: {query}

Văn bản pháp luật:
{docs_text}

Đánh giá mỗi văn bản theo các tiêu chí:
1. Trả lời trực tiếp câu hỏi: /4 điểm
2. Độ chính xác pháp lý: /3 điểm
3. Tính đầy đủ: /3 điểm

Tổng: /10 điểm

Trả về JSON với điểm số:
{{"doc_1": 9, "doc_2": 7, "doc_3": 5, ...}}

Chỉ trả về JSON, không giải thích."""

            response = self.llm_client.chat.completions.create(
                model=Config.LLM_MODEL,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0,
                max_tokens=200
            )

            result = response.choices[0].message.content.strip()

            # Parse scores
            import re
            import json

            json_match = re.search(r'\{.*\}', result, re.DOTALL)
            if json_match:
                scores_dict = json.loads(json_match.group())

                # Update node scores
                for i, node in enumerate(nodes, 1):
                    score = scores_dict.get(f"doc_{i}", 5.0) / 10.0  # Normalize to 0-1
                    if hasattr(node, 'score'):
                        # Combine with existing score (weighted average)
                        existing_score = getattr(node, 'score', 0.5)
                        node.score = 0.7 * score + 0.3 * existing_score
                    else:
                        node.score = score

                # Sort by updated scores
                ranked_nodes = sorted(
                    nodes,
                    key=lambda x: getattr(x, 'score', 0),
                    reverse=True
                )

                logger.info(f"LLM reranked {len(nodes)} → {top_k} nodes")

                return ranked_nodes[:top_k]

        except Exception as e:
            logger.error(f"LLM reranking failed: {e}")

        return nodes[:top_k]

    # ============================================
    # COMPLETE PIPELINE
    # ============================================

    def rerank(
        self,
        query: str,
        nodes: List,
        stage: str = "both"
    ) -> List:
        """
        Complete reranking pipeline

        Args:
            query: User query
            nodes: Nodes to rerank
            stage: Which stages to apply
                - "cross_encoder": Only cross-encoder
                - "llm": Only LLM
                - "both": Both stages (default)

        Returns:
            Reranked nodes
        """
        if not nodes:
            return nodes

        logger.info(f"Multi-stage reranking: {len(nodes)} nodes, stage={stage}")

        # Stage 1: Cross-encoder (fast, many documents)
        if stage in ["cross_encoder", "both"] and self.cross_encoder:
            nodes = self.cross_encoder_rerank(
                query,
                nodes,
                top_k=Config.CROSS_ENCODER_TOP_K if stage == "both" else None
            )

        # Stage 2: LLM (slow, few documents for precision)
        if stage in ["llm", "both"] and self.enable_llm_rerank:
            nodes = self.llm_rerank(
                query,
                nodes,
                top_k=Config.LLM_RERANK_TOP_K
            )

        logger.info(f"Final reranked result: {len(nodes)} nodes")

        return nodes

    # ============================================
    # UTILITIES
    # ============================================

    def get_rerank_explanation(
        self,
        query: str,
        node
    ) -> str:
        """
        Get explanation for why a document was ranked highly
        """
        if not self.enable_llm_rerank:
            return "Reranking based on semantic similarity"

        try:
            if hasattr(node, 'get_content'):
                text = node.get_content()
            elif hasattr(node, 'node'):
                text = node.node.text
            else:
                text = node.get('text', '')

            prompt = f"""Giải thích ngắn gọn (1-2 câu) tại sao văn bản này liên quan đến câu hỏi.

Câu hỏi: {query}

Văn bản: {text[:300]}...

Giải thích:"""

            response = self.llm_client.chat.completions.create(
                model=Config.LLM_MODEL,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=100
            )

            explanation = response.choices[0].message.content.strip()
            return explanation

        except Exception as e:
            logger.error(f"Failed to generate explanation: {e}")
            return f"Relevance score: {getattr(node, 'score', 0):.3f}"


class DiversityReranker:
    """
    Reranker that promotes diversity in results
    Ensures results cover different aspects of the query
    """

    def __init__(self):
        logger.info("Diversity reranker initialized")

    def rerank_for_diversity(
        self,
        nodes: List,
        top_k: int = 5,
        diversity_threshold: float = 0.3
    ) -> List:
        """
        Rerank to maximize diversity while maintaining relevance

        Uses MMR (Maximal Marginal Relevance) approach
        """
        if len(nodes) <= top_k:
            return nodes

        selected = []
        remaining = list(nodes)

        # Select first node (highest score)
        selected.append(remaining.pop(0))

        # Iteratively select diverse nodes
        while len(selected) < top_k and remaining:
            best_mmr_score = -float('inf')
            best_idx = 0

            for i, candidate in enumerate(remaining):
                # Relevance score
                relevance = getattr(candidate, 'score', 0.5)

                # Diversity score (different from selected)
                diversity = self._calculate_diversity(candidate, selected)

                # MMR score: balance relevance and diversity
                mmr_score = (1 - diversity_threshold) * relevance + \
                           diversity_threshold * diversity

                if mmr_score > best_mmr_score:
                    best_mmr_score = mmr_score
                    best_idx = i

            # Add most diverse relevant document
            selected.append(remaining.pop(best_idx))

        logger.info(f"Diversity reranking: selected {len(selected)} diverse nodes")

        return selected

    def _calculate_diversity(self, candidate, selected: List) -> float:
        """
        Calculate how different candidate is from selected nodes
        Simple heuristic: check if different article/chapter
        """
        if not selected:
            return 1.0

        # Get candidate metadata
        candidate_metadata = {}
        if hasattr(candidate, 'node') and hasattr(candidate.node, 'metadata'):
            candidate_metadata = candidate.node.metadata

        candidate_article = candidate_metadata.get('dieu', '')
        candidate_chapter = candidate_metadata.get('chuong', '')

        # Check overlap with selected
        different_count = 0
        for node in selected:
            node_metadata = {}
            if hasattr(node, 'node') and hasattr(node.node, 'metadata'):
                node_metadata = node.node.metadata

            node_article = node_metadata.get('dieu', '')
            node_chapter = node_metadata.get('chuong', '')

            if candidate_article != node_article or candidate_chapter != node_chapter:
                different_count += 1

        # Diversity score: ratio of different nodes
        diversity = different_count / len(selected)

        return diversity
