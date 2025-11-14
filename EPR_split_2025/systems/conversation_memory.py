"""
Advanced Conversation Memory System - Professional LLM-style memory management
Implements context-aware conversation tracking with smart history management
"""
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from collections import deque
import json

logger = logging.getLogger(__name__)

class Message:
    """Represents a single message in conversation"""
    def __init__(self, role: str, content: str, metadata: Optional[Dict] = None):
        self.role = role  # 'user' or 'assistant'
        self.content = content
        self.metadata = metadata or {}
        self.timestamp = datetime.now()

    def to_dict(self) -> Dict:
        return {
            'role': self.role,
            'content': self.content,
            'metadata': self.metadata,
            'timestamp': self.timestamp.isoformat()
        }

    def to_openai_format(self) -> Dict:
        """Convert to OpenAI chat format"""
        return {
            'role': self.role,
            'content': self.content
        }

class ConversationMemory:
    """
    Advanced conversation memory system inspired by ChatGPT/Claude

    Features:
    - Rolling window context management
    - Smart summarization for long conversations
    - Context relevance scoring
    - Metadata tracking (sources, citations, topics)
    """

    def __init__(
        self,
        max_messages: int = 20,  # Keep last 20 messages
        max_tokens_estimate: int = 8000,  # Approximate token limit
        summarize_threshold: int = 15,  # Summarize after 15 messages
        session_timeout_minutes: int = 60
    ):
        self.max_messages = max_messages
        self.max_tokens_estimate = max_tokens_estimate
        self.summarize_threshold = summarize_threshold
        self.session_timeout = timedelta(minutes=session_timeout_minutes)

        # Session storage: {session_id: ConversationSession}
        self.sessions: Dict[str, 'ConversationSession'] = {}

    def get_or_create_session(self, session_id: str) -> 'ConversationSession':
        """Get existing session or create new one"""
        current_time = datetime.now()

        if session_id in self.sessions:
            session = self.sessions[session_id]
            # Check if expired
            if current_time - session.last_activity > self.session_timeout:
                logger.info(f"Session {session_id} expired, creating new")
                self.sessions[session_id] = ConversationSession(
                    session_id,
                    self.max_messages,
                    self.summarize_threshold
                )
        else:
            logger.info(f"Creating new conversation session: {session_id}")
            self.sessions[session_id] = ConversationSession(
                session_id,
                self.max_messages,
                self.summarize_threshold
            )

        return self.sessions[session_id]

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict] = None
    ):
        """Add a message to conversation history"""
        session = self.get_or_create_session(session_id)
        session.add_message(role, content, metadata)

    def get_context(
        self,
        session_id: str,
        include_summary: bool = True,
        max_messages: Optional[int] = None
    ) -> List[Dict]:
        """
        Get conversation context in OpenAI format

        Returns: List of messages in format [{'role': 'user', 'content': '...'}, ...]
        """
        session = self.get_or_create_session(session_id)
        return session.get_context(include_summary, max_messages)

    def get_relevant_context(
        self,
        session_id: str,
        current_query: str,
        max_relevant: int = 5
    ) -> List[Dict]:
        """
        Get most relevant context based on current query
        Uses simple keyword matching (can be enhanced with embeddings)
        """
        session = self.get_or_create_session(session_id)
        return session.get_relevant_context(current_query, max_relevant)

    def get_session_summary(self, session_id: str) -> Optional[str]:
        """Get conversation summary if available"""
        if session_id in self.sessions:
            return self.sessions[session_id].summary
        return None

    def clear_session(self, session_id: str):
        """Clear a conversation session"""
        if session_id in self.sessions:
            logger.info(f"Clearing session: {session_id}")
            del self.sessions[session_id]

    def get_session_info(self, session_id: str) -> Dict:
        """Get information about a session"""
        if session_id not in self.sessions:
            return {
                'exists': False,
                'message_count': 0
            }

        session = self.sessions[session_id]
        return {
            'exists': True,
            'message_count': len(session.messages),
            'has_summary': session.summary is not None,
            'last_activity': session.last_activity.isoformat(),
            'topics': list(session.topics)
        }

class ConversationSession:
    """Represents a single conversation session"""

    def __init__(self, session_id: str, max_messages: int, summarize_threshold: int):
        self.session_id = session_id
        self.max_messages = max_messages
        self.summarize_threshold = summarize_threshold

        self.messages: deque = deque(maxlen=max_messages)
        self.summary: Optional[str] = None
        self.topics: set = set()  # Track discussed topics
        self.last_activity = datetime.now()
        self.created_at = datetime.now()
        self.metadata: Dict = {}

    def add_message(self, role: str, content: str, metadata: Optional[Dict] = None):
        """Add a message to the session"""
        message = Message(role, content, metadata)
        self.messages.append(message)
        self.last_activity = datetime.now()

        # Extract and track topics from metadata
        if metadata:
            if 'topics' in metadata:
                self.topics.update(metadata['topics'])
            if 'articles' in metadata:
                # Track legal articles discussed
                self.topics.update(f"Điều {art}" for art in metadata['articles'])

        logger.debug(f"Added {role} message to session {self.session_id}")

    def get_context(
        self,
        include_summary: bool = True,
        max_messages: Optional[int] = None
    ) -> List[Dict]:
        """Get conversation context"""
        context = []

        # Add summary if exists and requested
        if include_summary and self.summary:
            context.append({
                'role': 'system',
                'content': f"Tóm tắt cuộc trò chuyện trước: {self.summary}"
            })

        # Get recent messages
        messages_to_include = list(self.messages)
        if max_messages:
            messages_to_include = messages_to_include[-max_messages:]

        # Convert to OpenAI format
        context.extend([msg.to_openai_format() for msg in messages_to_include])

        return context

    def get_relevant_context(self, current_query: str, max_relevant: int = 5) -> List[Dict]:
        """
        Get most relevant messages based on keyword overlap
        Can be enhanced with semantic similarity using embeddings
        """
        query_lower = current_query.lower()
        query_words = set(query_lower.split())

        # Score each message by relevance
        scored_messages = []
        for msg in self.messages:
            if msg.role == 'user':  # Only consider user questions
                content_lower = msg.content.lower()
                content_words = set(content_lower.split())

                # Simple Jaccard similarity
                overlap = len(query_words & content_words)
                score = overlap / len(query_words) if query_words else 0

                if score > 0.1:  # Threshold for relevance
                    scored_messages.append((score, msg))

        # Sort by score and get top messages with their responses
        scored_messages.sort(reverse=True, key=lambda x: x[0])

        relevant_context = []
        for score, msg in scored_messages[:max_relevant]:
            relevant_context.append(msg.to_openai_format())
            # Also include the assistant's response if available
            msg_index = list(self.messages).index(msg)
            if msg_index + 1 < len(self.messages):
                next_msg = list(self.messages)[msg_index + 1]
                if next_msg.role == 'assistant':
                    relevant_context.append(next_msg.to_openai_format())

        return relevant_context

    def should_summarize(self) -> bool:
        """Check if conversation should be summarized"""
        return len(self.messages) >= self.summarize_threshold and not self.summary

    def to_dict(self) -> Dict:
        """Export session to dictionary"""
        return {
            'session_id': self.session_id,
            'messages': [msg.to_dict() for msg in self.messages],
            'summary': self.summary,
            'topics': list(self.topics),
            'created_at': self.created_at.isoformat(),
            'last_activity': self.last_activity.isoformat(),
            'metadata': self.metadata
        }

class ConversationSummarizer:
    """Helper class to generate conversation summaries"""

    @staticmethod
    def summarize_conversation(messages: List[Message], openai_client) -> str:
        """
        Generate a concise summary of the conversation
        Useful for maintaining context in long conversations
        """
        try:
            # Prepare conversation text
            conversation_text = "\n".join([
                f"{msg.role.upper()}: {msg.content[:200]}"
                for msg in messages
            ])

            summary_prompt = f"""Tóm tắt ngắn gọn cuộc trò chuyện pháp lý sau đây, tập trung vào:
- Các chủ đề pháp luật đã thảo luận
- Các điều luật/quy định chính được hỏi
- Bối cảnh quan trọng để tiếp tục tư vấn

Cuộc trò chuyện:
{conversation_text}

Tóm tắt (tối đa 150 từ):"""

            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": summary_prompt}],
                max_tokens=300,
                temperature=0.3
            )

            summary = response.choices[0].message.content.strip()
            logger.info("Generated conversation summary")
            return summary

        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return "Cuộc trò chuyện về các quy định pháp luật EPR."
