"""
Query Routing Agent
Intelligently selects best retrieval and processing strategy based on query characteristics
"""
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
from config import Config

logger = logging.getLogger(__name__)


@dataclass
class QueryProfile:
    """Profile/characteristics of a query"""
    query: str
    length: int
    has_exact_reference: bool  # e.g., "Điều 15"
    has_multiple_intents: bool  # e.g., "và", "hoặc"
    complexity: str  # "simple", "medium", "complex"
    query_type: str  # "factual", "procedural", "comparison", "general"
    recommended_strategy: str


@dataclass
class RoutingDecision:
    """Routing decision with justification"""
    retrieval_strategy: str
    query_transform: str
    rerank_strategy: str
    use_self_rag: bool
    reasoning: str


class QueryRouter:
    """
    Intelligent query router that analyzes query and selects best strategy
    """

    def __init__(self, llm_client=None):
        """
        Args:
            llm_client: Optional LLM for advanced routing
        """
        self.llm_client = llm_client
        self.enable_llm_routing = llm_client is not None

        # Strategy definitions
        self.strategies = {
            "exact_match": {
                "description": "Exact article reference search",
                "best_for": "Queries with specific article numbers"
            },
            "hybrid": {
                "description": "Hybrid vector + keyword search",
                "best_for": "Most queries, balanced semantic + exact match"
            },
            "semantic": {
                "description": "Pure vector semantic search",
                "best_for": "Conceptual questions, no specific references"
            },
            "hyde": {
                "description": "HyDE query transformation",
                "best_for": "Short, broad questions needing context"
            },
            "multi_query": {
                "description": "Multi-query decomposition",
                "best_for": "Complex queries with multiple intents"
            }
        }

        logger.info("Query router initialized")
        logger.info(f"  LLM-based routing: {self.enable_llm_routing}")

    # ============================================
    # QUERY PROFILING
    # ============================================

    def profile_query(self, query: str) -> QueryProfile:
        """
        Analyze query characteristics
        """
        query = query.strip()
        length = len(query)

        # Detect exact references
        import re
        has_exact_reference = bool(
            re.search(r'Điều\s+\d+|Khoản\s+\d+|Chương\s+[IVX]+', query)
        )

        # Detect multiple intents
        has_multiple_intents = any(
            keyword in query for keyword in [' và ', ' hoặc ', ', ', ';']
        )

        # Determine complexity
        if length < 30:
            complexity = "simple"
        elif length < 100 or not has_multiple_intents:
            complexity = "medium"
        else:
            complexity = "complex"

        # Determine query type
        query_type = self._classify_query_type(query)

        # Recommend strategy
        recommended_strategy = self._recommend_strategy(
            has_exact_reference,
            has_multiple_intents,
            complexity,
            query_type
        )

        profile = QueryProfile(
            query=query,
            length=length,
            has_exact_reference=has_exact_reference,
            has_multiple_intents=has_multiple_intents,
            complexity=complexity,
            query_type=query_type,
            recommended_strategy=recommended_strategy
        )

        logger.info(f"Query profile: complexity={complexity}, type={query_type}, "
                   f"strategy={recommended_strategy}")

        return profile

    def _classify_query_type(self, query: str) -> str:
        """
        Classify query into types
        """
        query_lower = query.lower()

        # Factual (specific fact/definition)
        if any(word in query_lower for word in ['là gì', 'là ai', 'định nghĩa', 'nghĩa là']):
            return "factual"

        # Procedural (how-to, process)
        if any(word in query_lower for word in ['làm thế nào', 'cách', 'quy trình', 'thủ tục', 'bước']):
            return "procedural"

        # Comparison
        if any(word in query_lower for word in ['so sánh', 'khác nhau', 'giống', 'vs', 'hay']):
            return "comparison"

        # Conditional
        if any(word in query_lower for word in ['nếu', 'khi nào', 'trường hợp']):
            return "conditional"

        # Default: general
        return "general"

    def _recommend_strategy(
        self,
        has_exact_ref: bool,
        has_multiple: bool,
        complexity: str,
        query_type: str
    ) -> str:
        """
        Recommend retrieval strategy based on profile
        """
        # Exact reference → hybrid (keyword + semantic)
        if has_exact_ref:
            return "hybrid"

        # Multiple intents → multi-query
        if has_multiple:
            return "multi_query"

        # Simple query → hyde
        if complexity == "simple":
            return "hyde"

        # Complex query → multi_query
        if complexity == "complex":
            return "multi_query"

        # Default → hybrid
        return "hybrid"

    # ============================================
    # RULE-BASED ROUTING
    # ============================================

    def route_query_rules(self, query: str) -> RoutingDecision:
        """
        Route query using rule-based logic (fast, no LLM)
        """
        profile = self.profile_query(query)

        # Determine retrieval strategy
        if profile.has_exact_reference:
            retrieval_strategy = "hybrid"  # Best for exact matches
            query_transform = "none"
        elif profile.complexity == "complex":
            retrieval_strategy = "hybrid"
            query_transform = "multi_query"
        elif profile.complexity == "simple":
            retrieval_strategy = "semantic"
            query_transform = "hyde"
        else:
            retrieval_strategy = "hybrid"
            query_transform = "none"

        # Reranking strategy
        if profile.complexity == "complex" or profile.query_type == "comparison":
            rerank_strategy = "both"  # Cross-encoder + LLM
        else:
            rerank_strategy = "cross_encoder"  # Fast path

        # Self-RAG for critical queries
        use_self_rag = (
            profile.complexity == "complex" or
            profile.query_type in ["procedural", "comparison"]
        )

        reasoning = (
            f"Query is {profile.complexity} {profile.query_type} query. "
            f"Using {retrieval_strategy} retrieval"
        )
        if profile.has_exact_reference:
            reasoning += " with exact reference optimization"
        if profile.has_multiple_intents:
            reasoning += " with multi-intent handling"

        decision = RoutingDecision(
            retrieval_strategy=retrieval_strategy,
            query_transform=query_transform,
            rerank_strategy=rerank_strategy,
            use_self_rag=use_self_rag,
            reasoning=reasoning
        )

        logger.info(f"Routing decision: {decision.retrieval_strategy} + "
                   f"{decision.query_transform} | {decision.reasoning}")

        return decision

    # ============================================
    # LLM-BASED ROUTING (Advanced)
    # ============================================

    def route_query_llm(self, query: str) -> RoutingDecision:
        """
        Route query using LLM for advanced reasoning
        More accurate but slower
        """
        if not self.enable_llm_routing:
            return self.route_query_rules(query)

        try:
            prompt = f"""Phân tích câu hỏi và chọn chiến lược RAG tối ưu.

Câu hỏi: {query}

Các chiến lược có sẵn:

Retrieval:
- "hybrid": Vector + BM25, tốt cho hầu hết câu hỏi
- "semantic": Chỉ vector, tốt cho câu hỏi khái niệm
- "exact": Keyword search, tốt cho tìm điều luật cụ thể

Query Transform:
- "none": Không chuyển đổi
- "hyde": Tạo văn bản giả định, tốt cho câu hỏi ngắn
- "multi_query": Tạo nhiều biến thể, tốt cho câu hỏi phức tạp

Reranking:
- "cross_encoder": Nhanh, chính xác khá
- "both": Cross-encoder + LLM, chậm nhưng chính xác nhất

Self-RAG:
- true: Verify và refine, tốt cho câu hỏi quan trọng
- false: Nhanh, đủ cho câu hỏi đơn giản

Trả về JSON:
{{
    "retrieval_strategy": "hybrid",
    "query_transform": "none",
    "rerank_strategy": "cross_encoder",
    "use_self_rag": false,
    "reasoning": "Lý do ngắn gọn"
}}"""

            response = self.llm_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=200
            )

            result = response.choices[0].message.content.strip()

            # Parse JSON
            import re
            import json

            json_match = re.search(r'\{.*\}', result, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())

                decision = RoutingDecision(
                    retrieval_strategy=data.get('retrieval_strategy', 'hybrid'),
                    query_transform=data.get('query_transform', 'none'),
                    rerank_strategy=data.get('rerank_strategy', 'cross_encoder'),
                    use_self_rag=data.get('use_self_rag', False),
                    reasoning=data.get('reasoning', 'LLM routing decision')
                )

                logger.info(f"LLM routing: {decision.reasoning}")

                return decision

        except Exception as e:
            logger.error(f"LLM routing failed: {e}, falling back to rules")

        # Fallback to rule-based
        return self.route_query_rules(query)

    # ============================================
    # MAIN ROUTING
    # ============================================

    def route(
        self,
        query: str,
        use_llm: Optional[bool] = None
    ) -> RoutingDecision:
        """
        Main routing method

        Args:
            query: User query
            use_llm: Whether to use LLM routing (None = auto-decide)

        Returns:
            RoutingDecision
        """
        # Auto-decide: use LLM for complex queries only
        if use_llm is None:
            profile = self.profile_query(query)
            use_llm = (
                profile.complexity == "complex" or
                profile.query_type in ["comparison", "conditional"]
            )

        if use_llm and self.enable_llm_routing:
            return self.route_query_llm(query)
        else:
            return self.route_query_rules(query)

    # ============================================
    # STATISTICS
    # ============================================

    def get_routing_stats(self) -> Dict:
        """
        Get routing statistics (would need to store history)
        """
        return {
            "total_routes": 0,
            "strategy_distribution": {},
            "avg_decision_time_ms": 0
        }


class AdaptiveRouter(QueryRouter):
    """
    Adaptive router that learns from feedback
    """

    def __init__(self, llm_client=None):
        super().__init__(llm_client)
        self.routing_history = []
        self.strategy_performance = {
            "hybrid": {"success": 0, "total": 0},
            "semantic": {"success": 0, "total": 0},
            "hyde": {"success": 0, "total": 0},
            "multi_query": {"success": 0, "total": 0}
        }

    def record_result(
        self,
        query: str,
        strategy: str,
        success: bool,
        metrics: Optional[Dict] = None
    ):
        """
        Record routing result for learning
        """
        if strategy in self.strategy_performance:
            self.strategy_performance[strategy]["total"] += 1
            if success:
                self.strategy_performance[strategy]["success"] += 1

        self.routing_history.append({
            "query": query,
            "strategy": strategy,
            "success": success,
            "metrics": metrics
        })

        logger.debug(f"Recorded routing result: {strategy} → {'✓' if success else '✗'}")

    def get_best_strategy(self) -> str:
        """
        Get currently best-performing strategy
        """
        best_strategy = "hybrid"
        best_rate = 0.0

        for strategy, stats in self.strategy_performance.items():
            if stats["total"] > 0:
                success_rate = stats["success"] / stats["total"]
                if success_rate > best_rate:
                    best_rate = success_rate
                    best_strategy = strategy

        return best_strategy

    def get_strategy_stats(self) -> Dict:
        """
        Get performance stats for all strategies
        """
        stats = {}
        for strategy, data in self.strategy_performance.items():
            if data["total"] > 0:
                stats[strategy] = {
                    "success_rate": data["success"] / data["total"],
                    "total_queries": data["total"]
                }
            else:
                stats[strategy] = {
                    "success_rate": 0.0,
                    "total_queries": 0
                }

        return stats
