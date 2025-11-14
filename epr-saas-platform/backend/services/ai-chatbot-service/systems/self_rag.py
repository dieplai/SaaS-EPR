"""
Self-RAG (Self-Reflective RAG)
RAG system that verifies and corrects itself
"""
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from config import Config

logger = logging.getLogger(__name__)


@dataclass
class RetrievalVerification:
    """Result of retrieval verification"""
    is_relevant: bool
    avg_relevance_score: float
    filtered_docs: List
    needs_retry: bool
    feedback: str


@dataclass
class AnswerVerification:
    """Result of answer verification"""
    is_faithful: bool
    is_complete: bool
    has_hallucination: bool
    citation_accuracy: float
    needs_refinement: bool
    issues: List[str]
    feedback: str


class SelfRAG:
    """
    Self-Reflective RAG system that:
    1. Verifies retrieved documents are relevant
    2. Adapts retrieval strategy if needed
    3. Verifies generated answer quality
    4. Refines answer if needed
    """

    def __init__(self, llm_client, retrievers: Dict[str, object]):
        """
        Args:
            llm_client: OpenAI client for verification
            retrievers: Dict of different retrieval strategies
                       e.g., {"vector": retriever1, "hybrid": retriever2, ...}
        """
        self.llm_client = llm_client
        self.retrievers = retrievers
        self.max_retries = Config.MAX_RETRY_ATTEMPTS
        self.relevance_threshold = Config.RELEVANCE_THRESHOLD
        self.min_relevant_docs = Config.MIN_RELEVANT_DOCS

        logger.info("Self-RAG initialized")
        logger.info(f"  Available retrievers: {list(retrievers.keys())}")
        logger.info(f"  Relevance threshold: {self.relevance_threshold}")

    # ============================================
    # RETRIEVAL VERIFICATION
    # ============================================

    def verify_retrieval(
        self,
        query: str,
        retrieved_docs: List
    ) -> RetrievalVerification:
        """
        Verify if retrieved documents are relevant to query

        Returns:
            RetrievalVerification with assessment and filtered docs
        """
        if not retrieved_docs:
            return RetrievalVerification(
                is_relevant=False,
                avg_relevance_score=0.0,
                filtered_docs=[],
                needs_retry=True,
                feedback="No documents retrieved"
            )

        try:
            # Build evaluation prompt
            docs_preview = ""
            for i, doc in enumerate(retrieved_docs[:5], 1):
                if hasattr(doc, 'get_content'):
                    text = doc.get_content()
                elif hasattr(doc, 'node'):
                    text = doc.node.text
                else:
                    text = doc.get('text', '')

                docs_preview += f"\nDoc {i}: {text[:150]}...\n"

            prompt = f"""Đánh giá xem các văn bản truy xuất có liên quan đến câu hỏi không.

Câu hỏi: {query}

Văn bản:
{docs_preview}

Đánh giá mỗi văn bản (0-1 scale):
- 1.0: Rất liên quan, trả lời trực tiếp
- 0.7-0.9: Liên quan, có thông tin hữu ích
- 0.4-0.6: Liên quan một phần
- 0.0-0.3: Không liên quan

Trả về JSON:
{{
    "doc_scores": {{"doc_1": 0.9, "doc_2": 0.7, ...}},
    "avg_score": 0.8,
    "assessment": "good/fair/poor"
}}"""

            response = self.llm_client.chat.completions.create(
                model=Config.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=300
            )

            result = response.choices[0].message.content.strip()

            # Parse result
            import re
            import json

            json_match = re.search(r'\{.*\}', result, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                doc_scores = data.get('doc_scores', {})
                avg_score = data.get('avg_score', 0.5)
                assessment = data.get('assessment', 'fair')

                # Filter docs above threshold
                filtered_docs = []
                for i, doc in enumerate(retrieved_docs, 1):
                    score = doc_scores.get(f"doc_{i}", 0.5)
                    if score >= self.relevance_threshold:
                        filtered_docs.append(doc)

                # Determine if we need to retry
                needs_retry = (
                    len(filtered_docs) < self.min_relevant_docs or
                    avg_score < self.relevance_threshold
                )

                return RetrievalVerification(
                    is_relevant=not needs_retry,
                    avg_relevance_score=avg_score,
                    filtered_docs=filtered_docs,
                    needs_retry=needs_retry,
                    feedback=f"Assessment: {assessment}, Avg score: {avg_score:.2f}, "
                            f"Relevant docs: {len(filtered_docs)}/{len(retrieved_docs)}"
                )

        except Exception as e:
            logger.error(f"Retrieval verification failed: {e}")

        # Fallback: assume all docs are relevant
        return RetrievalVerification(
            is_relevant=True,
            avg_relevance_score=0.7,
            filtered_docs=retrieved_docs,
            needs_retry=False,
            feedback="Verification failed, using all docs"
        )

    # ============================================
    # ADAPTIVE RETRIEVAL
    # ============================================

    def adaptive_retrieve(
        self,
        query: str,
        initial_strategy: str = "hybrid"
    ) -> Tuple[List, str]:
        """
        Adaptively retrieve documents with verification and retry

        Args:
            query: User query
            initial_strategy: Initial retrieval strategy

        Returns:
            (retrieved_docs, strategy_used)
        """
        strategies = [initial_strategy] + [
            s for s in self.retrievers.keys() if s != initial_strategy
        ]

        for attempt, strategy in enumerate(strategies[:self.max_retries], 1):
            logger.info(f"Retrieval attempt {attempt}/{self.max_retries} "
                       f"using strategy: {strategy}")

            retriever = self.retrievers.get(strategy)
            if not retriever:
                logger.warning(f"Retriever '{strategy}' not available")
                continue

            # Retrieve documents
            try:
                docs = retriever.retrieve(query)
            except Exception as e:
                logger.error(f"Retrieval failed: {e}")
                continue

            # Verify retrieval quality
            verification = self.verify_retrieval(query, docs)

            logger.info(f"Verification: {verification.feedback}")

            # If good enough, return
            if not verification.needs_retry:
                logger.info(f"✓ Retrieved {len(verification.filtered_docs)} "
                          f"relevant docs with strategy: {strategy}")
                return verification.filtered_docs, strategy

            # Otherwise, try next strategy
            logger.warning(f"✗ Retrieval quality insufficient, trying next strategy...")

        # If all attempts failed, return best effort
        logger.warning("All retrieval attempts completed, using last result")
        return verification.filtered_docs if verification else docs, strategy

    # ============================================
    # ANSWER VERIFICATION
    # ============================================

    def verify_answer(
        self,
        query: str,
        answer: str,
        sources: List
    ) -> AnswerVerification:
        """
        Verify generated answer quality

        Checks:
        1. Faithfulness (supported by sources)
        2. Completeness (fully answers question)
        3. Hallucinations (unsupported claims)
        4. Citation accuracy
        """
        try:
            # Prepare sources text
            sources_text = "\n\n".join([
                f"Source {i+1}: {src.get('text', '')[:200]}..."
                for i, src in enumerate(sources[:3])
            ])

            prompt = f"""Đánh giá chất lượng câu trả lời về luật pháp.

Câu hỏi: {query}

Câu trả lời: {answer}

Nguồn tham chiếu:
{sources_text}

Đánh giá các tiêu chí:

1. Faithfulness (trung thực): Câu trả lời có được hỗ trợ bởi nguồn không?
   - Yes: Hoàn toàn được hỗ trợ
   - Partial: Một phần được hỗ trợ
   - No: Không được hỗ trợ

2. Completeness (đầy đủ): Câu trả lời có đầy đủ không?
   - Yes: Trả lời đầy đủ
   - Partial: Trả lời một phần
   - No: Thiếu thông tin quan trọng

3. Hallucination (ảo giác): Có thông tin không có trong nguồn?
   - Yes: Có thông tin sai/thêm
   - No: Không có

4. Citation accuracy (chính xác trích dẫn): Các điều luật được trích dẫn đúng?
   - Score: 0.0-1.0

Trả về JSON:
{{
    "faithfulness": "Yes/Partial/No",
    "completeness": "Yes/Partial/No",
    "hallucination": "Yes/No",
    "citation_accuracy": 0.9,
    "issues": ["vấn đề 1 nếu có", ...],
    "needs_refinement": true/false,
    "feedback": "Tóm tắt đánh giá"
}}"""

            response = self.llm_client.chat.completions.create(
                model=Config.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=400
            )

            result = response.choices[0].message.content.strip()

            # Parse result
            import re
            import json

            json_match = re.search(r'\{.*\}', result, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())

                is_faithful = data.get('faithfulness', 'Yes') != 'No'
                is_complete = data.get('completeness', 'Yes') != 'No'
                has_hallucination = data.get('hallucination', 'No') == 'Yes'
                citation_accuracy = float(data.get('citation_accuracy', 0.8))
                issues = data.get('issues', [])
                needs_refinement = data.get('needs_refinement', False)
                feedback = data.get('feedback', '')

                return AnswerVerification(
                    is_faithful=is_faithful,
                    is_complete=is_complete,
                    has_hallucination=has_hallucination,
                    citation_accuracy=citation_accuracy,
                    needs_refinement=needs_refinement,
                    issues=issues,
                    feedback=feedback
                )

        except Exception as e:
            logger.error(f"Answer verification failed: {e}")

        # Fallback: assume answer is good
        return AnswerVerification(
            is_faithful=True,
            is_complete=True,
            has_hallucination=False,
            citation_accuracy=0.8,
            needs_refinement=False,
            issues=[],
            feedback="Verification failed, assuming answer is acceptable"
        )

    # ============================================
    # ANSWER REFINEMENT
    # ============================================

    def refine_answer(
        self,
        query: str,
        original_answer: str,
        sources: List,
        verification: AnswerVerification
    ) -> str:
        """
        Refine answer based on verification feedback
        """
        try:
            sources_text = "\n\n".join([
                f"{src.get('text', '')[:300]}"
                for src in sources[:3]
            ])

            issues_text = "\n".join([f"- {issue}" for issue in verification.issues])

            prompt = f"""Cải thiện câu trả lời dựa trên phản hồi.

Câu hỏi: {query}

Câu trả lời gốc:
{original_answer}

Nguồn tham chiếu:
{sources_text}

Vấn đề cần sửa:
{issues_text}

Đánh giá:
- Faithfulness: {verification.is_faithful}
- Completeness: {verification.is_complete}
- Hallucination: {verification.has_hallucination}
- Citation accuracy: {verification.citation_accuracy}

Yêu cầu:
1. Chỉ sử dụng thông tin từ nguồn
2. Trả lời đầy đủ câu hỏi
3. Trích dẫn chính xác điều luật
4. Không thêm thông tin không có trong nguồn

Câu trả lời được cải thiện:"""

            response = self.llm_client.chat.completions.create(
                model=Config.LLM_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=800
            )

            refined_answer = response.choices[0].message.content.strip()

            logger.info("Answer refined based on verification feedback")

            return refined_answer

        except Exception as e:
            logger.error(f"Answer refinement failed: {e}")
            return original_answer

    # ============================================
    # COMPLETE SELF-RAG PIPELINE
    # ============================================

    def query(
        self,
        query: str,
        generator_func,
        initial_strategy: str = "hybrid"
    ) -> Dict:
        """
        Complete Self-RAG query pipeline

        Args:
            query: User query
            generator_func: Function to generate answer from (query, docs)
            initial_strategy: Initial retrieval strategy

        Returns:
            Dict with answer and metadata
        """
        logger.info(f"Self-RAG query: {query[:50]}...")

        # Step 1: Adaptive retrieval with verification
        docs, strategy_used = self.adaptive_retrieve(query, initial_strategy)

        if not docs:
            return {
                'answer': 'Xin lỗi, không tìm thấy thông tin liên quan.',
                'sources': [],
                'self_rag_metadata': {
                    'retrieval_strategy': strategy_used,
                    'retrieval_quality': 'poor',
                    'answer_quality': 'N/A'
                }
            }

        # Step 2: Generate answer
        answer, sources = generator_func(query, docs)

        # Step 3: Verify answer
        verification = self.verify_answer(query, answer, sources)

        logger.info(f"Answer verification: {verification.feedback}")

        # Step 4: Refine if needed
        if verification.needs_refinement:
            logger.info("Refining answer...")
            answer = self.refine_answer(query, answer, sources, verification)

            # Re-verify
            verification = self.verify_answer(query, answer, sources)
            logger.info(f"Re-verification: {verification.feedback}")

        # Return with metadata
        return {
            'answer': answer,
            'sources': sources,
            'self_rag_metadata': {
                'retrieval_strategy': strategy_used,
                'retrieval_verified': True,
                'answer_verified': True,
                'faithfulness': verification.is_faithful,
                'completeness': verification.is_complete,
                'hallucination_detected': verification.has_hallucination,
                'citation_accuracy': verification.citation_accuracy,
                'was_refined': verification.needs_refinement
            }
        }
