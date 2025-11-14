"""
Advanced RAG Evaluation Framework
Tracks retrieval quality, generation quality, and performance metrics
"""
import logging
import time
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
import json

logger = logging.getLogger(__name__)

@dataclass
class RetrievalMetrics:
    """Metrics for retrieval quality"""
    query: str
    retrieved_docs: List[Dict]
    relevant_doc_ids: Optional[List[str]] = None
    hit_rate: Optional[float] = None
    mrr: Optional[float] = None
    ndcg: Optional[float] = None
    avg_score: Optional[float] = None
    timestamp: datetime = field(default_factory=datetime.now)

@dataclass
class GenerationMetrics:
    """Metrics for answer generation quality"""
    query: str
    answer: str
    sources: List[Dict]
    faithfulness: Optional[float] = None
    relevancy: Optional[float] = None
    has_hallucination: bool = False
    citation_accuracy: Optional[float] = None
    timestamp: datetime = field(default_factory=datetime.now)

@dataclass
class PerformanceMetrics:
    """Performance and cost metrics"""
    query: str
    retrieval_latency_ms: float = 0
    generation_latency_ms: float = 0
    total_latency_ms: float = 0
    tokens_used: int = 0
    estimated_cost_usd: float = 0
    cache_hit: bool = False
    timestamp: datetime = field(default_factory=datetime.now)


class EvaluationFramework:
    """
    Comprehensive evaluation framework for RAG system
    """

    def __init__(self, enable_llm_evaluation: bool = True):
        self.enable_llm_evaluation = enable_llm_evaluation
        self.metrics_history: List[Dict] = []
        logger.info("Evaluation framework initialized")

    # ============================================
    # RETRIEVAL METRICS
    # ============================================

    def calculate_hit_rate(
        self,
        retrieved_doc_ids: List[str],
        relevant_doc_ids: List[str],
        k: int = 5
    ) -> float:
        """
        Calculate Hit Rate@k
        Returns 1.0 if any relevant doc in top k, else 0.0
        """
        top_k_ids = retrieved_doc_ids[:k]
        for relevant_id in relevant_doc_ids:
            if relevant_id in top_k_ids:
                return 1.0
        return 0.0

    def calculate_mrr(
        self,
        retrieved_doc_ids: List[str],
        relevant_doc_ids: List[str]
    ) -> float:
        """
        Calculate Mean Reciprocal Rank (MRR)
        Returns 1/rank of first relevant document
        """
        for i, doc_id in enumerate(retrieved_doc_ids, 1):
            if doc_id in relevant_doc_ids:
                return 1.0 / i
        return 0.0

    def calculate_ndcg(
        self,
        retrieved_docs: List[Dict],
        relevance_scores: List[float],
        k: int = 5
    ) -> float:
        """
        Calculate Normalized Discounted Cumulative Gain (NDCG@k)
        """
        if not relevance_scores or len(relevance_scores) != len(retrieved_docs):
            return 0.0

        import math

        # DCG
        dcg = relevance_scores[0]
        for i in range(1, min(k, len(relevance_scores))):
            dcg += relevance_scores[i] / math.log2(i + 1)

        # IDCG (ideal DCG with perfect ranking)
        ideal_scores = sorted(relevance_scores, reverse=True)
        idcg = ideal_scores[0]
        for i in range(1, min(k, len(ideal_scores))):
            idcg += ideal_scores[i] / math.log2(i + 1)

        return dcg / idcg if idcg > 0 else 0.0

    def evaluate_retrieval(
        self,
        query: str,
        retrieved_docs: List[Dict],
        relevant_doc_ids: Optional[List[str]] = None,
        llm_client=None
    ) -> RetrievalMetrics:
        """
        Comprehensive retrieval evaluation
        """
        metrics = RetrievalMetrics(
            query=query,
            retrieved_docs=retrieved_docs
        )

        # Calculate average retrieval score
        if retrieved_docs:
            scores = [doc.get('score', 0) for doc in retrieved_docs]
            metrics.avg_score = sum(scores) / len(scores) if scores else 0

        # If ground truth available, calculate precision metrics
        if relevant_doc_ids:
            retrieved_ids = [doc.get('id') or doc.get('metadata', {}).get('dieu', '')
                           for doc in retrieved_docs]

            metrics.hit_rate = self.calculate_hit_rate(retrieved_ids, relevant_doc_ids, k=5)
            metrics.mrr = self.calculate_mrr(retrieved_ids, relevant_doc_ids)

        # LLM-based evaluation (if enabled)
        if self.enable_llm_evaluation and llm_client:
            try:
                relevance_scores = self._llm_evaluate_retrieval(
                    query, retrieved_docs, llm_client
                )
                if relevance_scores:
                    metrics.ndcg = self.calculate_ndcg(
                        retrieved_docs, relevance_scores, k=5
                    )
            except Exception as e:
                logger.warning(f"LLM retrieval evaluation failed: {e}")

        return metrics

    def _llm_evaluate_retrieval(
        self,
        query: str,
        retrieved_docs: List[Dict],
        llm_client
    ) -> List[float]:
        """
        Use LLM to evaluate relevance of retrieved documents
        Returns relevance scores 0-1 for each doc
        """
        prompt = f"""Evaluate the relevance of each document to the query on a scale of 0-1.

Query: {query}

Documents:
"""
        for i, doc in enumerate(retrieved_docs[:5], 1):
            text = doc.get('text', '')[:200]
            prompt += f"\nDoc {i}: {text}..."

        prompt += "\n\nReturn JSON with scores: {\"doc_1\": 0.9, \"doc_2\": 0.5, ...}"

        try:
            response = llm_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )

            result = response.choices[0].message.content
            # Parse JSON from response
            import re
            json_match = re.search(r'\{.*\}', result, re.DOTALL)
            if json_match:
                scores_dict = json.loads(json_match.group())
                return [scores_dict.get(f"doc_{i}", 0) for i in range(1, len(retrieved_docs) + 1)]
        except Exception as e:
            logger.error(f"LLM eval parsing error: {e}")

        return []

    # ============================================
    # GENERATION METRICS
    # ============================================

    def evaluate_generation(
        self,
        query: str,
        answer: str,
        sources: List[Dict],
        llm_client=None
    ) -> GenerationMetrics:
        """
        Evaluate answer generation quality
        """
        metrics = GenerationMetrics(
            query=query,
            answer=answer,
            sources=sources
        )

        if self.enable_llm_evaluation and llm_client:
            try:
                # Faithfulness check
                metrics.faithfulness = self._check_faithfulness(
                    answer, sources, llm_client
                )

                # Relevancy check
                metrics.relevancy = self._check_relevancy(
                    query, answer, llm_client
                )

                # Hallucination check
                metrics.has_hallucination = self._check_hallucination(
                    answer, sources, llm_client
                )

                # Citation accuracy
                metrics.citation_accuracy = self._check_citations(
                    answer, sources, llm_client
                )

            except Exception as e:
                logger.warning(f"Generation evaluation failed: {e}")

        return metrics

    def _check_faithfulness(
        self,
        answer: str,
        sources: List[Dict],
        llm_client
    ) -> float:
        """
        Check if answer is faithful to source documents
        Returns score 0-1
        """
        sources_text = "\n\n".join([
            doc.get('text', '')[:300] for doc in sources[:3]
        ])

        prompt = f"""Is this answer supported by the source documents?

Answer: {answer}

Sources:
{sources_text}

Rate faithfulness 0-1 (1 = fully supported, 0 = not supported).
Return only a number."""

        try:
            response = llm_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )

            score_text = response.choices[0].message.content.strip()
            return float(score_text)
        except Exception as e:
            logger.error(f"Faithfulness check failed: {e}")
            return 0.5

    def _check_relevancy(
        self,
        query: str,
        answer: str,
        llm_client
    ) -> float:
        """
        Check if answer is relevant to query
        Returns score 0-1
        """
        prompt = f"""Does this answer address the query?

Query: {query}
Answer: {answer}

Rate relevancy 0-1 (1 = fully addresses query, 0 = irrelevant).
Return only a number."""

        try:
            response = llm_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )

            score_text = response.choices[0].message.content.strip()
            return float(score_text)
        except Exception as e:
            logger.error(f"Relevancy check failed: {e}")
            return 0.5

    def _check_hallucination(
        self,
        answer: str,
        sources: List[Dict],
        llm_client
    ) -> bool:
        """
        Check if answer contains hallucinations (unsupported claims)
        Returns True if hallucination detected
        """
        sources_text = "\n\n".join([
            doc.get('text', '')[:300] for doc in sources[:3]
        ])

        prompt = f"""Does the answer contain information NOT supported by the sources?

Answer: {answer}

Sources:
{sources_text}

Answer 'Yes' if hallucination detected, 'No' if all claims are supported."""

        try:
            response = llm_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )

            result = response.choices[0].message.content.strip().lower()
            return 'yes' in result
        except Exception as e:
            logger.error(f"Hallucination check failed: {e}")
            return False

    def _check_citations(
        self,
        answer: str,
        sources: List[Dict],
        llm_client
    ) -> float:
        """
        Check accuracy of legal citations in answer
        Returns score 0-1
        """
        # Extract article numbers mentioned in answer
        import re
        cited_articles = re.findall(r'Điều\s+(\d+)', answer)

        if not cited_articles:
            return 1.0  # No citations to verify

        # Check if cited articles are in sources
        source_articles = []
        for source in sources:
            metadata = source.get('metadata', {})
            article = metadata.get('dieu', '')
            if article:
                source_articles.append(str(article))

        if not source_articles:
            return 0.5

        # Calculate accuracy
        correct_citations = sum(1 for art in cited_articles if art in source_articles)
        accuracy = correct_citations / len(cited_articles) if cited_articles else 0

        return accuracy

    # ============================================
    # PERFORMANCE TRACKING
    # ============================================

    def track_performance(
        self,
        query: str,
        retrieval_time_ms: float,
        generation_time_ms: float,
        tokens_used: int,
        cache_hit: bool = False
    ) -> PerformanceMetrics:
        """
        Track performance and cost metrics
        """
        # Estimate cost (GPT-4o-mini pricing)
        # Input: $0.15 / 1M tokens, Output: $0.60 / 1M tokens
        # Approximate 50/50 split
        estimated_cost = (tokens_used / 1_000_000) * 0.375

        metrics = PerformanceMetrics(
            query=query,
            retrieval_latency_ms=retrieval_time_ms,
            generation_latency_ms=generation_time_ms,
            total_latency_ms=retrieval_time_ms + generation_time_ms,
            tokens_used=tokens_used,
            estimated_cost_usd=estimated_cost,
            cache_hit=cache_hit
        )

        return metrics

    # ============================================
    # AGGREGATION & REPORTING
    # ============================================

    def log_metrics(
        self,
        retrieval_metrics: Optional[RetrievalMetrics] = None,
        generation_metrics: Optional[GenerationMetrics] = None,
        performance_metrics: Optional[PerformanceMetrics] = None
    ):
        """
        Log metrics for analysis
        """
        entry = {
            'timestamp': datetime.now().isoformat(),
            'retrieval': retrieval_metrics.__dict__ if retrieval_metrics else None,
            'generation': generation_metrics.__dict__ if generation_metrics else None,
            'performance': performance_metrics.__dict__ if performance_metrics else None
        }

        self.metrics_history.append(entry)

        # Log summary
        if retrieval_metrics:
            logger.info(f"Retrieval | Avg Score: {retrieval_metrics.avg_score:.3f} | "
                       f"Hit@5: {retrieval_metrics.hit_rate or 'N/A'}")

        if generation_metrics:
            logger.info(f"Generation | Faithfulness: {generation_metrics.faithfulness or 'N/A'} | "
                       f"Relevancy: {generation_metrics.relevancy or 'N/A'} | "
                       f"Hallucination: {generation_metrics.has_hallucination}")

        if performance_metrics:
            logger.info(f"Performance | Total: {performance_metrics.total_latency_ms:.0f}ms | "
                       f"Tokens: {performance_metrics.tokens_used} | "
                       f"Cost: ${performance_metrics.estimated_cost_usd:.4f} | "
                       f"Cache: {performance_metrics.cache_hit}")

    def get_aggregate_metrics(self, last_n: int = 100) -> Dict[str, Any]:
        """
        Get aggregated metrics from recent queries
        """
        recent = self.metrics_history[-last_n:]

        if not recent:
            return {}

        # Retrieval metrics
        hit_rates = [m['retrieval'].hit_rate for m in recent
                     if m.get('retrieval') and m['retrieval'].hit_rate is not None]
        mrrs = [m['retrieval'].mrr for m in recent
                if m.get('retrieval') and m['retrieval'].mrr is not None]
        avg_scores = [m['retrieval'].avg_score for m in recent
                      if m.get('retrieval') and m['retrieval'].avg_score is not None]

        # Generation metrics
        faithfulness = [m['generation'].faithfulness for m in recent
                       if m.get('generation') and m['generation'].faithfulness is not None]
        relevancy = [m['generation'].relevancy for m in recent
                    if m.get('generation') and m['generation'].relevancy is not None]
        hallucinations = [m['generation'].has_hallucination for m in recent
                         if m.get('generation')]

        # Performance metrics
        latencies = [m['performance'].total_latency_ms for m in recent
                    if m.get('performance')]
        costs = [m['performance'].estimated_cost_usd for m in recent
                if m.get('performance')]
        cache_hits = [m['performance'].cache_hit for m in recent
                     if m.get('performance')]

        return {
            'retrieval': {
                'avg_hit_rate': sum(hit_rates) / len(hit_rates) if hit_rates else None,
                'avg_mrr': sum(mrrs) / len(mrrs) if mrrs else None,
                'avg_score': sum(avg_scores) / len(avg_scores) if avg_scores else None,
            },
            'generation': {
                'avg_faithfulness': sum(faithfulness) / len(faithfulness) if faithfulness else None,
                'avg_relevancy': sum(relevancy) / len(relevancy) if relevancy else None,
                'hallucination_rate': sum(hallucinations) / len(hallucinations) if hallucinations else None,
            },
            'performance': {
                'avg_latency_ms': sum(latencies) / len(latencies) if latencies else None,
                'p95_latency_ms': sorted(latencies)[int(len(latencies) * 0.95)] if latencies else None,
                'avg_cost_usd': sum(costs) / len(costs) if costs else None,
                'total_cost_usd': sum(costs) if costs else None,
                'cache_hit_rate': sum(cache_hits) / len(cache_hits) if cache_hits else None,
            },
            'total_queries': len(recent)
        }

    def export_metrics(self, filepath: str):
        """Export metrics to JSON file"""
        with open(filepath, 'w') as f:
            json.dump(self.metrics_history, f, indent=2, default=str)
        logger.info(f"Metrics exported to {filepath}")
