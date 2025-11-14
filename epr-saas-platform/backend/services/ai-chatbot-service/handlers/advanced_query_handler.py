"""
Advanced Query Handler - Top-Tier RAG
Integrates all advanced features for world-class RAG performance
"""
import logging
import time
from typing import Dict, Optional, List
from config import Config

logger = logging.getLogger(__name__)


class AdvancedQueryHandler:
    """
    Top-tier query handler with:
    - Hybrid search (vector + BM25)
    - Multi-stage reranking
    - Query transformations (HyDE, multi-query)
    - Semantic caching
    - Self-RAG verification
    - Intelligent query routing
    - Comprehensive evaluation
    """

    def __init__(
        self,
        faq_system,
        pdf_catalog_system,
        app_info_system,
        advanced_retriever_system,
        scope_checker=None,
        conversation_tracker=None,
        conversation_memory=None,
        openai_client=None
    ):
        self.faq_system = faq_system
        self.pdf_catalog_system = pdf_catalog_system
        self.app_info_system = app_info_system
        self.scope_checker = scope_checker
        self.conversation_tracker = conversation_tracker
        self.conversation_memory = conversation_memory
        self.openai_client = openai_client

        # Advanced RAG components
        self.retriever_system = advanced_retriever_system
        self.hybrid_retriever = advanced_retriever_system.get_retriever("hybrid")
        self.vector_retriever = advanced_retriever_system.get_retriever("vector")
        self.reranker = advanced_retriever_system.get_reranker()
        self.query_transformer = advanced_retriever_system.get_query_transformer()
        self.semantic_cache = advanced_retriever_system.get_semantic_cache()
        self.evaluator = advanced_retriever_system.get_evaluator()
        self.self_rag = advanced_retriever_system.get_self_rag()
        self.query_router = advanced_retriever_system.get_query_router()
        self.llm = advanced_retriever_system.get_llm()

        logger.info("Advanced Query Handler initialized")

    # ============================================
    # MAIN QUERY PROCESSING
    # ============================================

    def process_query(
        self,
        query_text: str,
        session_id: Optional[str] = None
    ) -> Dict:
        """
        Process query through advanced RAG pipeline

        Pipeline:
        1. Check cache
        2. Quick systems (FAQ, PDF, App Info)
        3. Scope check
        4. Query routing
        5. Query transformation (if needed)
        6. Advanced retrieval (hybrid/Self-RAG)
        7. Multi-stage reranking
        8. Answer generation
        9. Answer verification (if Self-RAG)
        10. Evaluation & metrics
        11. Cache result
        """
        start_time = time.time()
        logger.info(f"Processing query: {query_text[:60]}... [Session: {session_id}]")

        # Get conversation context
        conversation_context = []
        if session_id and self.conversation_memory:
            conversation_context = self.conversation_memory.get_context(session_id, max_messages=6)

        # ============================================
        # STEP 1: SEMANTIC CACHE CHECK
        # ============================================
        if self.semantic_cache:
            cached = self.semantic_cache.get(query_text, session_id)
            if cached:
                cached_response = cached.get('response', {})
                logger.info(f"✅ CACHE HIT ({cached.get('cache_hit_type', 'unknown')})")

                # Add cache metadata
                cached_response['from_cache'] = True
                cached_response['cache_similarity'] = cached.get('similarity_score')

                return cached_response

        # ============================================
        # STEP 2: QUICK SYSTEMS (FAQ, PDF, APP INFO)
        # ============================================

        # FAQ
        faq_response = self.faq_system.handle_faq_query(query_text)
        if faq_response:
            logger.info("✓ Handled as FAQ")
            self._update_conversation_memory(session_id, query_text, faq_response['answer'], 'faq')
            self._cache_response(query_text, faq_response, session_id)
            return faq_response

        # PDF Catalog
        pdf_response = self.pdf_catalog_system.handle_pdf_catalog_query(query_text)
        if pdf_response:
            logger.info("✓ Handled as PDF catalog")
            self._update_conversation_memory(session_id, query_text, pdf_response['answer'], 'pdf_catalog')
            self._cache_response(query_text, pdf_response, session_id)
            return pdf_response

        # App Info
        app_info_response = self.app_info_system.handle_app_info_query(query_text)
        if app_info_response:
            logger.info("✓ Handled as app info")
            self._update_conversation_memory(session_id, query_text, app_info_response['answer'], 'app_info')
            self._cache_response(query_text, app_info_response, session_id)
            return app_info_response

        # ============================================
        # STEP 3: SCOPE CHECK
        # ============================================

        is_on_topic = True
        scope_info = None

        if self.scope_checker:
            if self.scope_checker.is_greeting_or_chitchat(query_text):
                is_on_topic = False
                scope_info = {'is_on_topic': False, 'reason': 'Greeting/chitchat'}
            elif conversation_context and len(conversation_context) > 2:
                is_on_topic = True  # Follow-up in conversation
                scope_info = {'is_on_topic': True, 'reason': 'Follow-up question'}
            else:
                scope_info = self.scope_checker.is_question_on_topic(query_text)
                is_on_topic = scope_info.get('is_on_topic', True)

        # Check conversation tracker
        should_restrict = False
        if self.conversation_tracker and session_id:
            tracking_info = self.conversation_tracker.record_question(session_id, not is_on_topic)
            should_restrict = tracking_info['should_restrict']

        if should_restrict:
            return self._create_restriction_response(query_text, tracking_info, scope_info)

        if not is_on_topic:
            return self._handle_off_topic(query_text, session_id, conversation_context, tracking_info, scope_info)

        # ============================================
        # STEP 4: ADVANCED RAG PIPELINE
        # ============================================

        retrieval_start = time.time()

        # Query routing
        routing_decision = None
        if self.query_router:
            routing_decision = self.query_router.route(query_text)
            logger.info(f"🧭 Routing: {routing_decision.reasoning}")

        # Process legal query with advanced RAG
        result = self._process_advanced_legal_query(
            query_text,
            conversation_context,
            routing_decision
        )

        retrieval_time = (time.time() - retrieval_start) * 1000

        # ============================================
        # STEP 5: UPDATE CONVERSATION & CACHE
        # ============================================

        if session_id and self.conversation_memory:
            articles = [src['metadata'].get('dieu') for src in result.get('sources', [])
                       if 'metadata' in src and 'dieu' in src['metadata']]

            self.conversation_memory.add_message(session_id, 'user', query_text)
            self.conversation_memory.add_message(
                session_id, 'assistant', result['answer'],
                metadata={
                    'source_type': 'legal_rag',
                    'num_sources': result.get('num_sources', 0),
                    'articles': articles
                }
            )

        # Cache the result
        self._cache_response(query_text, result, session_id)

        # ============================================
        # STEP 6: EVALUATION & METRICS
        # ============================================

        if self.evaluator:
            total_time = (time.time() - start_time) * 1000

            # Track performance
            perf_metrics = self.evaluator.track_performance(
                query=query_text,
                retrieval_time_ms=retrieval_time,
                generation_time_ms=total_time - retrieval_time,
                tokens_used=result.get('tokens_used', 0),
                cache_hit=False
            )

            # Evaluate retrieval
            if result.get('sources'):
                retrieval_metrics = self.evaluator.evaluate_retrieval(
                    query=query_text,
                    retrieved_docs=result['sources'],
                    llm_client=self.openai_client
                )

                # Evaluate generation
                generation_metrics = self.evaluator.evaluate_generation(
                    query=query_text,
                    answer=result['answer'],
                    sources=result['sources'],
                    llm_client=self.openai_client
                )

                # Log all metrics
                self.evaluator.log_metrics(
                    retrieval_metrics=retrieval_metrics,
                    generation_metrics=generation_metrics,
                    performance_metrics=perf_metrics
                )

        # Add metadata
        result['processing_time_ms'] = (time.time() - start_time) * 1000
        result['from_cache'] = False

        return result

    # ============================================
    # ADVANCED RAG PROCESSING
    # ============================================

    def _process_advanced_legal_query(
        self,
        query_text: str,
        conversation_context: List,
        routing_decision
    ) -> Dict:
        """
        Process query through advanced RAG pipeline
        """
        logger.info("🚀 Advanced RAG pipeline started")

        # Determine strategies from routing
        if routing_decision:
            retrieval_strategy = routing_decision.retrieval_strategy
            query_transform_strategy = routing_decision.query_transform
            rerank_strategy = routing_decision.rerank_strategy
            use_self_rag = routing_decision.use_self_rag
        else:
            # Default strategies
            retrieval_strategy = "hybrid"
            query_transform_strategy = "auto"
            rerank_strategy = "cross_encoder"
            use_self_rag = False

        # ============================================
        # QUERY TRANSFORMATION
        # ============================================

        queries = [query_text]
        if self.query_transformer and query_transform_strategy != "none":
            logger.info(f"🔄 Query transform: {query_transform_strategy}")
            queries = self.query_transformer.transform(
                query_text,
                strategy=query_transform_strategy
            )
            logger.info(f"  Generated {len(queries)} query variations")

        # ============================================
        # RETRIEVAL
        # ============================================

        if use_self_rag and self.self_rag:
            logger.info("🔬 Using Self-RAG")

            # Self-RAG with verification
            def generator_func(q, docs):
                answer = self._generate_answer(q, docs, conversation_context)
                sources = self._format_sources(docs)
                return answer, sources

            result = self.self_rag.query(
                query_text,
                generator_func,
                initial_strategy=retrieval_strategy
            )

            return result

        else:
            # Standard retrieval
            logger.info(f"🔍 Retrieval: {retrieval_strategy}")

            all_nodes = []
            for q in queries:
                retriever = self._get_retriever(retrieval_strategy)
                nodes = retriever.retrieve(q)
                all_nodes.extend(nodes)

            # Deduplicate
            unique_nodes = self._deduplicate_nodes(all_nodes)

            logger.info(f"  Retrieved {len(unique_nodes)} unique documents")

            # ============================================
            # RERANKING
            # ============================================

            if self.reranker:
                logger.info(f"🎯 Reranking: {rerank_strategy}")
                unique_nodes = self.reranker.rerank(
                    query_text,
                    unique_nodes,
                    stage=rerank_strategy
                )
                logger.info(f"  Reranked to {len(unique_nodes)} documents")

            # ============================================
            # ANSWER GENERATION
            # ============================================

            answer = self._generate_answer(query_text, unique_nodes, conversation_context)
            sources = self._format_sources(unique_nodes[:5])

            return {
                'answer': answer,
                'sources': sources,
                'query': query_text,
                'num_sources': len(sources),
                'retrieval_strategy': retrieval_strategy,
                'query_transform': query_transform_strategy,
                'rerank_strategy': rerank_strategy
            }

    def _get_retriever(self, strategy: str):
        """Get retriever by strategy"""
        if strategy == "hybrid" and self.hybrid_retriever:
            return self.hybrid_retriever
        else:
            return self.vector_retriever

    def _deduplicate_nodes(self, nodes: List) -> List:
        """Remove duplicate nodes"""
        seen = set()
        unique = []
        for node in nodes:
            node_id = node.node.id_ if hasattr(node, 'node') else str(node)
            if node_id not in seen:
                seen.add(node_id)
                unique.append(node)
        return unique

    def _format_sources(self, nodes: List) -> List[Dict]:
        """Format nodes as source dicts"""
        sources = []
        for node in nodes[:5]:
            if hasattr(node, 'node'):
                sources.append({
                    'metadata': node.node.metadata,
                    'text': node.node.text,
                    'score': node.score if hasattr(node, 'score') else None
                })
        return sources

    def _generate_answer(
        self,
        query: str,
        nodes: List,
        conversation_context: List
    ) -> str:
        """Generate answer from retrieved nodes"""
        # Build context
        context_str = "\n\n".join([
            f"[{node.node.metadata.get('dieu', 'N/A')}] {node.node.text}"
            for node in nodes[:5] if hasattr(node, 'node')
        ])

        # Build conversation history
        conv_str = ""
        if conversation_context:
            conv_str = "\n".join([
                f"{msg['role'].upper()}: {msg['content'][:100]}"
                for msg in conversation_context[-3:]
            ])

        # Generate with LLM
        from systems.legal_prompts import CONTEXT_AWARE_QA_TEMPLATE, LEGAL_CONSULTANT_SYSTEM_PROMPT

        if conversation_context:
            prompt = CONTEXT_AWARE_QA_TEMPLATE.format(
                conversation_summary="Đang tư vấn về luật EPR",
                conversation_history=conv_str,
                context_str=context_str,
                query_str=query
            )
        else:
            prompt = f"""Dựa trên thông tin pháp luật dưới đây, hãy trả lời câu hỏi.

Thông tin pháp luật:
{context_str}

Câu hỏi: {query}

Trả lời:"""

        response = self.llm.complete(prompt)
        return str(response)

    # ============================================
    # HELPERS
    # ============================================

    def _handle_off_topic(self, query_text, session_id, conversation_context, tracking_info, scope_info):
        """Handle off-topic queries"""
        brief_answer = self._generate_brief_off_topic_response(query_text, conversation_context)

        if session_id and self.conversation_memory:
            self.conversation_memory.add_message(session_id, 'user', query_text)
            self.conversation_memory.add_message(
                session_id, 'assistant', brief_answer,
                metadata={'source_type': 'off_topic'}
            )

        response = {
            'answer': brief_answer,
            'sources': [],
            'query': query_text,
            'is_off_topic': True,
            'scope_info': scope_info
        }

        if tracking_info:
            response['off_topic_count'] = tracking_info['off_topic_count']
            response['remaining_off_topic'] = tracking_info['remaining_off_topic']

        return response

    def _generate_brief_off_topic_response(self, query_text, conversation_context):
        """Generate brief off-topic response"""
        from systems.legal_prompts import OFF_TOPIC_FRIENDLY_RESPONSE, LEGAL_CONSULTANT_SYSTEM_PROMPT

        messages = [{"role": "system", "content": LEGAL_CONSULTANT_SYSTEM_PROMPT}]

        if conversation_context:
            messages.extend(conversation_context[-2:])

        messages.append({
            "role": "user",
            "content": OFF_TOPIC_FRIENDLY_RESPONSE.format(query=query_text)
        })

        response = self.llm.chat(messages)
        return str(response)

    def _create_restriction_response(self, query_text, tracking_info, scope_info):
        """Create restriction response"""
        return {
            'answer': 'Xin lỗi, tôi chỉ có thể trả lời các câu hỏi liên quan đến Luật EPR.',
            'sources': [],
            'query': query_text,
            'is_restricted': True,
            'off_topic_count': tracking_info['off_topic_count'],
            'scope_info': scope_info
        }

    def _update_conversation_memory(self, session_id, query, answer, source_type):
        """Update conversation memory"""
        if session_id and self.conversation_memory:
            self.conversation_memory.add_message(session_id, 'user', query)
            self.conversation_memory.add_message(
                session_id, 'assistant', answer,
                metadata={'source_type': source_type}
            )

    def _cache_response(self, query, response, session_id):
        """Cache response"""
        if self.semantic_cache:
            self.semantic_cache.set(query, response, session_id)

    # ============================================
    # STATISTICS
    # ============================================

    def get_stats(self) -> Dict:
        """Get system statistics"""
        stats = {
            'cache': self.semantic_cache.get_stats() if self.semantic_cache else None,
            'evaluation': self.evaluator.get_aggregate_metrics() if self.evaluator else None,
        }

        if self.query_router and hasattr(self.query_router, 'get_strategy_stats'):
            stats['routing'] = self.query_router.get_strategy_stats()

        return stats
