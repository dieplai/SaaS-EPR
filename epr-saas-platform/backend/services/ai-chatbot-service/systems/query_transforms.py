"""
Query Transformation Techniques
- HyDE (Hypothetical Document Embeddings)
- Multi-Query Generation
- Step-back Prompting
"""
import logging
from typing import List, Optional
from config import Config

logger = logging.getLogger(__name__)


class HyDETransform:
    """
    Hypothetical Document Embeddings (HyDE)
    Generates hypothetical answer, then searches using that answer's embedding
    """

    def __init__(self, llm_client):
        self.llm_client = llm_client
        logger.info("HyDE transform initialized")

    def generate_hypothetical_document(self, query: str) -> str:
        """
        Generate a hypothetical document (answer) for the query
        """
        prompt = f"""Hãy viết một đoạn văn trả lời câu hỏi sau về luật EPR Việt Nam.
Không cần chính xác 100%, chỉ cần viết theo kiến thức chung và ngữ cảnh pháp luật.

Câu hỏi: {query}

Đoạn văn giả định (2-3 câu, ngắn gọn):"""

        try:
            response = self.llm_client.chat.completions.create(
                model=Config.LLM_MODEL,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,  # Higher temperature for creativity
                max_tokens=200
            )

            hypothetical_doc = response.choices[0].message.content.strip()
            logger.debug(f"HyDE generated: {hypothetical_doc[:100]}...")

            return hypothetical_doc

        except Exception as e:
            logger.error(f"HyDE generation failed: {e}")
            return query  # Fallback to original query

    def transform(self, query: str, include_original: bool = True) -> List[str]:
        """
        Transform query to HyDE document(s)

        Args:
            query: Original query
            include_original: Whether to include original query

        Returns:
            List of queries (original + hypothetical)
        """
        queries = []

        if include_original:
            queries.append(query)

        # Generate hypothetical document
        hyde_doc = self.generate_hypothetical_document(query)
        if hyde_doc != query:  # Only add if different
            queries.append(hyde_doc)

        logger.info(f"HyDE transform: {len(queries)} queries")
        return queries


class MultiQueryGenerator:
    """
    Generates multiple variations/decompositions of a query
    for comprehensive retrieval
    """

    def __init__(self, llm_client, num_queries: int = 3):
        self.llm_client = llm_client
        self.num_queries = num_queries
        logger.info(f"MultiQuery generator initialized (n={num_queries})")

    def generate_multi_queries(self, query: str) -> List[str]:
        """
        Generate multiple query variations
        """
        prompt = f"""Cho câu hỏi về luật EPR sau, hãy tạo {self.num_queries} câu hỏi con hoặc biến thể để tìm kiếm toàn diện hơn.

Câu hỏi gốc: {query}

Yêu cầu:
1. Nếu câu hỏi phức tạp có nhiều ý: chia thành các câu hỏi con
2. Nếu câu hỏi đơn giản: tạo các cách hỏi khác nhau
3. Giữ nguyên bối cảnh pháp luật EPR

Trả về JSON:
{{"queries": ["câu hỏi 1", "câu hỏi 2", "câu hỏi 3"]}}"""

        try:
            response = self.llm_client.chat.completions.create(
                model=Config.LLM_MODEL,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )

            result = response.choices[0].message.content.strip()

            # Parse JSON
            import re
            import json

            json_match = re.search(r'\{.*\}', result, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                queries = data.get('queries', [])

                if queries:
                    logger.info(f"Generated {len(queries)} query variations")
                    return queries

        except Exception as e:
            logger.error(f"Multi-query generation failed: {e}")

        # Fallback
        return [query]

    def generate(self, query: str, include_original: bool = True) -> List[str]:
        """
        Generate multiple queries including original
        """
        queries = self.generate_multi_queries(query)

        if include_original and query not in queries:
            queries.insert(0, query)

        # Deduplicate
        unique_queries = []
        seen = set()
        for q in queries:
            q_normalized = q.lower().strip()
            if q_normalized not in seen:
                unique_queries.append(q)
                seen.add(q_normalized)

        return unique_queries[:self.num_queries + 1]  # +1 for original


class StepBackPrompting:
    """
    Step-back prompting: Generate a higher-level question first
    to get better context before answering specific question
    """

    def __init__(self, llm_client):
        self.llm_client = llm_client
        logger.info("Step-back prompting initialized")

    def generate_step_back_query(self, query: str) -> str:
        """
        Generate a broader, more general question
        """
        prompt = f"""Cho câu hỏi cụ thể sau, hãy tạo một câu hỏi tổng quát hơn, bao quát hơn về chủ đề đó.

Câu hỏi cụ thể: {query}

Ví dụ:
- Cụ thể: "Chi phí EPR cho doanh nghiệp may mặc quy mô nhỏ?"
- Tổng quát: "Quy định về chi phí EPR cho các doanh nghiệp là gì?"

Câu hỏi tổng quát:"""

        try:
            response = self.llm_client.chat.completions.create(
                model=Config.LLM_MODEL,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=100
            )

            general_query = response.choices[0].message.content.strip()
            logger.debug(f"Step-back query: {general_query}")

            return general_query

        except Exception as e:
            logger.error(f"Step-back generation failed: {e}")
            return query

    def transform(self, query: str) -> tuple[str, str]:
        """
        Returns: (general_query, specific_query)
        """
        general_query = self.generate_step_back_query(query)
        return general_query, query


class QueryDecomposer:
    """
    Decomposes complex queries into simpler sub-questions
    """

    def __init__(self, llm_client):
        self.llm_client = llm_client
        logger.info("Query decomposer initialized")

    def decompose(self, query: str) -> List[str]:
        """
        Decompose complex query into sub-questions
        """
        prompt = f"""Phân tích câu hỏi sau và chia thành các câu hỏi con đơn giản hơn nếu cần.

Câu hỏi: {query}

Nếu câu hỏi đơn giản (1 ý duy nhất): trả về câu hỏi gốc
Nếu câu hỏi phức tạp (nhiều ý): chia thành 2-4 câu hỏi con

Trả về JSON:
{{"sub_questions": ["câu 1", "câu 2", ...]}}"""

        try:
            response = self.llm_client.chat.completions.create(
                model=Config.LLM_MODEL,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=300
            )

            result = response.choices[0].message.content.strip()

            # Parse JSON
            import re
            import json

            json_match = re.search(r'\{.*\}', result, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                sub_questions = data.get('sub_questions', [])

                if sub_questions:
                    logger.info(f"Decomposed into {len(sub_questions)} sub-questions")
                    return sub_questions

        except Exception as e:
            logger.error(f"Query decomposition failed: {e}")

        return [query]


class QueryTransformPipeline:
    """
    Complete query transformation pipeline
    Combines multiple transformation techniques
    """

    def __init__(self, llm_client):
        self.llm_client = llm_client

        # Initialize transformers
        self.hyde = HyDETransform(llm_client) if Config.ENABLE_HYDE else None
        self.multi_query = MultiQueryGenerator(
            llm_client,
            num_queries=Config.NUM_MULTI_QUERIES
        ) if Config.ENABLE_MULTI_QUERY else None
        self.step_back = StepBackPrompting(llm_client) if Config.ENABLE_STEP_BACK else None
        self.decomposer = QueryDecomposer(llm_client)

        logger.info("Query transform pipeline initialized")
        logger.info(f"  HyDE: {self.hyde is not None}")
        logger.info(f"  Multi-query: {self.multi_query is not None}")
        logger.info(f"  Step-back: {self.step_back is not None}")

    def transform(
        self,
        query: str,
        strategy: str = "auto"
    ) -> List[str]:
        """
        Transform query using specified strategy

        Args:
            query: Original query
            strategy: Transformation strategy
                - "auto": Automatic selection based on query
                - "hyde": Use HyDE
                - "multi": Use multi-query
                - "step_back": Use step-back prompting
                - "decompose": Decompose query
                - "none": No transformation

        Returns:
            List of transformed queries
        """
        if strategy == "none":
            return [query]

        # Auto strategy: simple heuristics
        if strategy == "auto":
            query_length = len(query)
            has_and = " và " in query or " hoặc " in query

            if has_and or query_length > 100:
                # Complex query: decompose or multi-query
                strategy = "multi" if self.multi_query else "decompose"
            elif query_length < 20:
                # Short query: HyDE
                strategy = "hyde" if self.hyde else "none"
            else:
                # Medium query: multi-query
                strategy = "multi" if self.multi_query else "none"

        # Apply transformation
        logger.info(f"Using transformation strategy: {strategy}")

        if strategy == "hyde" and self.hyde:
            return self.hyde.transform(query, include_original=True)

        elif strategy == "multi" and self.multi_query:
            return self.multi_query.generate(query, include_original=True)

        elif strategy == "step_back" and self.step_back:
            general, specific = self.step_back.transform(query)
            return [general, specific]

        elif strategy == "decompose":
            return self.decomposer.decompose(query)

        else:
            return [query]

    def get_strategy_recommendation(self, query: str) -> str:
        """
        Recommend transformation strategy for query
        """
        query_length = len(query)
        has_multiple_intents = " và " in query or " hoặc " in query

        if has_multiple_intents:
            return "decompose"
        elif query_length < 20:
            return "hyde"
        elif query_length > 100:
            return "multi"
        else:
            return "multi"
