"""
Query Handler - Main query processing orchestration with conversation memory
"""
import logging
from typing import Dict, Optional, List
from llama_index.core import QueryBundle
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.llms.openai import OpenAI
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.prompts import PromptTemplate

from systems.conversation_memory import ConversationMemory
from systems.legal_prompts import (
    LEGAL_CONSULTANT_SYSTEM_PROMPT,
    CONTEXT_AWARE_QA_TEMPLATE,
    ENHANCED_LEGAL_ANALYSIS_PROMPT,
    OFF_TOPIC_FRIENDLY_RESPONSE
)

logger = logging.getLogger(__name__)

class QueryHandler:
    def __init__(self, faq_system, pdf_catalog_system, app_info_system, retriever, query_engine,
                 scope_checker=None, conversation_tracker=None, openai_client=None):
        self.faq_system = faq_system
        self.pdf_catalog_system = pdf_catalog_system
        self.app_info_system = app_info_system
        self.retriever = retriever
        self.query_engine = query_engine
        self.scope_checker = scope_checker
        self.conversation_tracker = conversation_tracker
        self.openai_client = openai_client

        # Initialize conversation memory system
        self.conversation_memory = ConversationMemory(
            max_messages=20,
            max_tokens_estimate=8000,
            summarize_threshold=15,
            session_timeout_minutes=60
        )
        logger.info("Conversation memory system initialized")
    
    def process_query(self, query_text: str, session_id: Optional[str] = None) -> Dict:
        """
        Process a legal query through the priority chain with conversation memory:
        1. FAQ
        2. PDF Catalog
        3. App Info
        4. Legal Document Search (with scope checking and conversation tracking)
        """
        logger.info(f"Processing query: {query_text} [Session: {session_id}]")

        # Get conversation context if session exists
        conversation_context = []
        conversation_summary = None
        if session_id:
            conversation_context = self.conversation_memory.get_context(session_id, max_messages=6)
            conversation_summary = self.conversation_memory.get_session_summary(session_id)
            logger.info(f"Loaded {len(conversation_context)} messages from conversation history")

        # 1. Check FAQ first (always allowed, even if off-topic)
        faq_response = self.faq_system.handle_faq_query(query_text)
        if faq_response:
            logger.info("Handled as FAQ query")
            # Add to conversation memory
            if session_id:
                self.conversation_memory.add_message(session_id, 'user', query_text)
                self.conversation_memory.add_message(
                    session_id, 'assistant', faq_response['answer'],
                    metadata={'source_type': 'faq', 'is_faq': True}
                )
            return faq_response

        # 2. Check PDF catalog (always allowed)
        pdf_catalog_response = self.pdf_catalog_system.handle_pdf_catalog_query(query_text)
        if pdf_catalog_response:
            logger.info("Handled as PDF catalog query")
            # Add to conversation memory
            if session_id:
                self.conversation_memory.add_message(session_id, 'user', query_text)
                self.conversation_memory.add_message(
                    session_id, 'assistant', pdf_catalog_response['answer'],
                    metadata={'source_type': 'pdf_catalog', 'is_pdf_catalog': True}
                )
            return pdf_catalog_response

        # 3. Check app information (always allowed)
        app_info_response = self.app_info_system.handle_app_info_query(query_text)
        if app_info_response:
            logger.info("Handled as app info query")
            # Add to conversation memory
            if session_id:
                self.conversation_memory.add_message(session_id, 'user', query_text)
                self.conversation_memory.add_message(
                    session_id, 'assistant', app_info_response['answer'],
                    metadata={'source_type': 'app_info', 'is_app_info': True}
                )
            return app_info_response

        # 4. Check if question is about EPR law (scope checking)
        is_on_topic = True
        scope_info = None

        if self.scope_checker:
            # Check if it's a simple greeting/chitchat first
            if self.scope_checker.is_greeting_or_chitchat(query_text):
                logger.info("Detected greeting/chitchat, allowing friendly response")
                is_on_topic = False
                scope_info = {
                    'is_on_topic': False,
                    'confidence': 'high',
                    'reason': 'Greeting or chitchat'
                }
            else:
                # Use LLM to check scope only if not a greeting
                scope_info = self.scope_checker.is_question_on_topic(query_text)
                is_on_topic = scope_info.get('is_on_topic', True)

        # 5. Track conversation and check if we should restrict
        should_restrict = False
        tracking_info = None

        if self.conversation_tracker and session_id:
            tracking_info = self.conversation_tracker.record_question(session_id, not is_on_topic)
            should_restrict = tracking_info['should_restrict']

            logger.info(f"Session {session_id}: Off-topic={not is_on_topic}, "
                       f"Count={tracking_info['off_topic_count']}, "
                       f"Should restrict={should_restrict}")

        # 6. If should restrict (exceeded limit), return restriction message
        if should_restrict:
            return {
                'answer': 'Xin lỗi, tôi chỉ có thể trả lời các câu hỏi liên quan đến Luật EPR, mong bạn thông cảm!',
                'sources': [],
                'query': query_text,
                'num_sources': 0,
                'is_restricted': True,
                'off_topic_count': tracking_info['off_topic_count'] if tracking_info else 0,
                'scope_info': scope_info
            }

        # 7. If off-topic (but within limit), generate brief GPT response
        if not is_on_topic:
            brief_answer = self._generate_brief_off_topic_response(
                query_text,
                conversation_context=conversation_context if session_id else None
            )
            # Add to conversation memory
            if session_id:
                self.conversation_memory.add_message(session_id, 'user', query_text)
                self.conversation_memory.add_message(
                    session_id, 'assistant', brief_answer,
                    metadata={'source_type': 'off_topic', 'is_off_topic': True}
                )
            return {
                'answer': brief_answer,
                'sources': [],
                'query': query_text,
                'num_sources': 0,
                'is_off_topic': True,
                'off_topic_count': tracking_info['off_topic_count'] if tracking_info else 0,
                'remaining_off_topic': tracking_info['remaining_off_topic'] if tracking_info else 0,
                'scope_info': scope_info
            }

        # 8. Process on-topic query with conversation context
        logger.info("Processing as legal document query with conversation context")
        result = self._process_legal_query(
            query_text,
            conversation_context=conversation_context if session_id else None,
            conversation_summary=conversation_summary
        )

        # Add to conversation memory
        if session_id:
            self.conversation_memory.add_message(session_id, 'user', query_text)
            # Extract article numbers from sources for metadata
            articles = []
            if result.get('sources'):
                for source in result['sources']:
                    if 'metadata' in source and 'dieu' in source['metadata']:
                        articles.append(source['metadata']['dieu'])

            self.conversation_memory.add_message(
                session_id, 'assistant', result['answer'],
                metadata={
                    'source_type': 'legal_rag',
                    'num_sources': result.get('num_sources', 0),
                    'articles': articles,
                    'topics': [f"Điều {art}" for art in articles if art]
                }
            )

        # Add tracking information to response
        if tracking_info:
            result['off_topic_count'] = tracking_info['off_topic_count']
            result['remaining_off_topic'] = tracking_info['remaining_off_topic']

        if scope_info:
            result['scope_info'] = scope_info

        return result
    
    def _process_legal_query(
        self,
        query_text: str,
        conversation_context: Optional[List[Dict]] = None,
        conversation_summary: Optional[str] = None
    ) -> Dict:
        """Process legal document search with conversation context and fallback handling"""
        used_fallback = False

        # Get response from query engine with error handling and context
        try:
            if conversation_context and len(conversation_context) > 0:
                # Use context-aware query with enhanced prompt
                logger.info("Using context-aware legal analysis with conversation history")
                answer_text = self._query_with_context(
                    query_text,
                    conversation_context,
                    conversation_summary
                )
            else:
                # Standard query without context
                response = self.query_engine.query(query_text)
                answer_text = str(response)
            used_fallback = False
        except Exception as query_error:
            if "Filter operator" in str(query_error) and "not supported" in str(query_error):
                logger.warning(f"Filter operator error, switching to basic retriever: {query_error}")
                answer_text = self._query_with_fallback(query_text, conversation_context, conversation_summary)
                used_fallback = True
            else:
                raise query_error
        
        # Get source nodes
        try:
            nodes = self.retriever.retrieve(QueryBundle(query_text))
        except Exception as retrieve_error:
            if "Filter operator" in str(retrieve_error) and "not supported" in str(retrieve_error):
                logger.warning(f"Filter operator error in retrieval: {retrieve_error}")
                nodes = self._retrieve_with_fallback(query_text)
                used_fallback = True
            else:
                raise retrieve_error
        
        # Deduplicate and format sources
        max_sources = 5 if used_fallback else 3
        unique_sources = self._deduplicate_sources(nodes, max_sources)
        
        logger.info(f"Found {len(unique_sources)} unique source nodes" + 
                   (" (using fallback mode)" if used_fallback else ""))
        
        # Return response
        if unique_sources:
            response_data = {
                'answer': answer_text,
                'sources': unique_sources,
                'query': query_text,
                'num_sources': len(unique_sources),
                'is_app_info': False,
                'is_pdf_catalog': False,
                'is_faq': False,
                'used_fallback': used_fallback
            }
            
            if used_fallback:
                response_data['fallback_info'] = {
                    'reason': 'Enhanced retrieval mode for comprehensive answer',
                    'enhanced_features': ['More detailed explanations', 'Additional context', 'More source references']
                }
            
            return response_data
        
        # No results found
        return {
            'answer': 'Xin lỗi, tôi không tìm thấy thông tin phù hợp với câu hỏi của bạn. Vui lòng thử diễn đạt lại câu hỏi hoặc liên hệ bộ phận hỗ trợ để được trợ giúp.',
            'sources': [],
            'query': query_text,
            'num_sources': 0,
            'is_app_info': False,
            'is_pdf_catalog': False,
            'is_faq': False,
            'used_fallback': False,
            'no_results_found': True
        }
    
    def _query_with_context(
        self,
        query_text: str,
        conversation_context: List[Dict],
        conversation_summary: Optional[str]
    ) -> str:
        """Query with conversation context using enhanced prompts"""
        try:
            # Get relevant documents
            nodes = self.retriever.retrieve(QueryBundle(query_text))

            # Build context string from nodes
            context_str = "\n\n".join([
                f"[Điều {node.node.metadata.get('dieu', 'N/A')} - {node.node.metadata.get('dieu_title', '')}]\n{node.node.text}"
                for node in nodes[:5]
            ])

            # Build conversation history string
            conv_history_str = "\n".join([
                f"{msg['role'].upper()}: {msg['content'][:200]}..."
                for msg in conversation_context[-4:]  # Last 4 messages
            ])

            # Use context-aware prompt
            prompt = CONTEXT_AWARE_QA_TEMPLATE.format(
                conversation_summary=conversation_summary or "Đây là lần đầu tư vấn trong phiên này.",
                conversation_history=conv_history_str if conv_history_str else "Chưa có lịch sử hội thoại.",
                context_str=context_str,
                query_str=query_text
            )

            # Call OpenAI with context
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": LEGAL_CONSULTANT_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=1500
            )

            answer = response.choices[0].message.content.strip()
            logger.info("Generated context-aware legal response")
            return answer

        except Exception as e:
            logger.error(f"Error in context-aware query: {e}")
            # Fallback to standard query
            response = self.query_engine.query(query_text)
            return str(response)

    def _query_with_fallback(
        self,
        query_text: str,
        conversation_context: Optional[List[Dict]] = None,
        conversation_summary: Optional[str] = None
    ) -> str:
        """Query using fallback basic retriever with optional context"""
        if hasattr(self.retriever, '_index'):
            basic_retriever = VectorIndexRetriever(
                index=self.retriever._index,
                similarity_top_k=8
            )

            enhanced_llm = OpenAI(model="gpt-3.5-turbo", temperature=0.1)

            # Use enhanced prompt if no context, or context-aware if context exists
            if conversation_context and len(conversation_context) > 0:
                detailed_qa_prompt = PromptTemplate(CONTEXT_AWARE_QA_TEMPLATE)
            else:
                detailed_qa_prompt = PromptTemplate(ENHANCED_LEGAL_ANALYSIS_PROMPT)

            basic_query_engine = RetrieverQueryEngine.from_args(
                basic_retriever,
                llm=enhanced_llm,
                text_qa_template=detailed_qa_prompt
            )
            response = basic_query_engine.query(query_text)
            return str(response)

        raise Exception("Cannot create fallback retriever")
    
    def _retrieve_with_fallback(self, query_text: str):
        """Retrieve using fallback basic retriever"""
        if hasattr(self.retriever, '_index'):
            basic_retriever = VectorIndexRetriever(
                index=self.retriever._index,
                similarity_top_k=8
            )
            return basic_retriever.retrieve(QueryBundle(query_text))
        return []
    
    def _deduplicate_sources(self, nodes, max_sources: int):
        """Deduplicate source nodes"""
        seen_articles = set()
        unique_sources = []
        
        for node in nodes:
            metadata = node.node.metadata
            article_id = f"{metadata.get('dieu', '')}-{metadata.get('chuong', '')}-{metadata.get('muc', '')}"
            
            if article_id not in seen_articles and len(unique_sources) < max_sources:
                seen_articles.add(article_id)
                source_info = {
                    'metadata': metadata,
                    'text': node.node.text,
                    'score': node.score if hasattr(node, 'score') else None
                }
                unique_sources.append(source_info)
        
        return unique_sources
    
    def _generate_brief_off_topic_response(
        self,
        query_text: str,
        conversation_context: Optional[List[Dict]] = None
    ) -> str:
        """Generate a brief response for off-topic questions using GPT with conversation awareness"""
        try:
            if not self.openai_client:
                return 'Xin chào! Tôi là Luật sư Minh Anh, chuyên gia tư vấn pháp luật EPR. Tôi có thể giúp bạn về các câu hỏi liên quan đến luật trách nhiệm mở rộng của nhà sản xuất!'

            # Build messages with conversation context
            messages = [
                {
                    "role": "system",
                    "content": LEGAL_CONSULTANT_SYSTEM_PROMPT
                }
            ]

            # Add recent conversation context if available
            if conversation_context and len(conversation_context) > 0:
                # Add last 3 messages for context
                messages.extend(conversation_context[-3:])

            # Add current query with off-topic prompt
            messages.append({
                "role": "user",
                "content": OFF_TOPIC_FRIENDLY_RESPONSE.format(query=query_text)
            })

            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.7,
                max_tokens=150
            )

            answer = response.choices[0].message.content.strip()
            logger.info(f"Generated context-aware off-topic response: {answer[:50]}...")
            return answer

        except Exception as e:
            logger.error(f"Error generating brief response: {str(e)}")
            return 'Xin chào! Tôi là chuyên gia tư vấn pháp luật EPR. Tôi rất vui được trò chuyện với bạn, nhưng tôi chuyên về các vấn đề pháp lý liên quan đến trách nhiệm mở rộng của nhà sản xuất. Bạn có câu hỏi nào về luật EPR không?'

    def search_documents(self, query_text: str, top_k: int = 3) -> Dict:
        """Search for documents without generating an answer"""
        logger.info(f"Searching documents for: {query_text}")
        
        # Update retriever top_k temporarily
        original_top_k = self.retriever.similarity_top_k
        self.retriever.similarity_top_k = top_k * 2
        
        # Get source nodes with error handling
        try:
            nodes = self.retriever.retrieve(QueryBundle(query_text))
        except Exception as retrieve_error:
            if "Filter operator" in str(retrieve_error) and "not supported" in str(retrieve_error):
                logger.warning(f"Filter operator error in search: {retrieve_error}")
                nodes = self._retrieve_with_fallback(query_text)
            else:
                raise retrieve_error
        
        # Restore original top_k
        self.retriever.similarity_top_k = original_top_k
        
        # Deduplicate sources
        unique_sources = self._deduplicate_sources(nodes, top_k)
        
        logger.info(f"Found {len(unique_sources)} unique documents")
        
        return {
            'sources': unique_sources,
            'query': query_text,
            'num_sources': len(unique_sources)
        }
    
    