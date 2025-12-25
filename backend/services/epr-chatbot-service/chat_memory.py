"""
Chat Memory Management with PostgreSQL
Provides session-based chat history using LangChain PostgresChatMessageHistory
"""

import os
import logging
from typing import Optional, List, Tuple
from langchain_community.chat_message_histories import PostgresChatMessageHistory
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

logger = logging.getLogger(__name__)


def get_chat_history(session_id: str) -> PostgresChatMessageHistory:
    """
    Get chat history for a session from PostgreSQL

    Args:
        session_id: UUID of the conversation session

    Returns:
        PostgresChatMessageHistory instance
    """
    connection_string = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/epr_saas")

    return PostgresChatMessageHistory(
        session_id=session_id,
        connection_string=connection_string,
        table_name="langchain_chat_message_history",  # Separate table for LangChain
    )


def get_formatted_history(session_id: str, max_messages: int = 6) -> str:
    """
    Get formatted chat history as string for prompt context

    Args:
        session_id: UUID of the conversation session
        max_messages: Maximum number of recent messages to include (default: 6 = 3 exchanges)

    Returns:
        Formatted chat history string
    """
    try:
        history = get_chat_history(session_id)
        messages = history.messages[-max_messages:] if history.messages else []

        if not messages:
            logger.info(f"📭 No chat history found for session {session_id}")
            return ""

        formatted = []
        for msg in messages:
            if isinstance(msg, HumanMessage) or getattr(msg, 'type', None) == 'human':
                role = "Người dùng"
            elif isinstance(msg, AIMessage) or getattr(msg, 'type', None) == 'ai':
                role = "Trợ lý pháp luật EPR"
            else:
                role = "System"

            content = msg.content if hasattr(msg, 'content') else str(msg)
            formatted.append(f"{role}: {content}")

        result = "\n".join(formatted)
        logger.info(f"📚 Loaded {len(messages)} messages ({len(result)} chars) from session {session_id}")

        return result

    except Exception as e:
        logger.error(f"❌ Error loading chat history for session {session_id}: {e}")
        return ""


def add_message_to_history(session_id: str, role: str, content: str) -> bool:
    """
    Add a message to chat history

    Args:
        session_id: UUID of the conversation session
        role: 'user' or 'assistant'
        content: Message content

    Returns:
        bool: Success status
    """
    try:
        history = get_chat_history(session_id)

        if role == "user":
            history.add_user_message(content)
        elif role == "assistant":
            history.add_ai_message(content)
        else:
            logger.warning(f"⚠️  Unknown role: {role}")
            return False

        logger.info(f"💾 Added {role} message to session {session_id}")
        return True

    except Exception as e:
        logger.error(f"❌ Error adding message to history: {e}")
        return False


def clear_history(session_id: str) -> bool:
    """
    Clear all messages in a session

    Args:
        session_id: UUID of the conversation session

    Returns:
        bool: Success status
    """
    try:
        history = get_chat_history(session_id)
        history.clear()
        logger.info(f"🗑️  Cleared history for session {session_id}")
        return True

    except Exception as e:
        logger.error(f"❌ Error clearing history: {e}")
        return False


def get_message_count(session_id: str) -> int:
    """
    Get count of messages in a session

    Args:
        session_id: UUID of the conversation session

    Returns:
        int: Number of messages
    """
    try:
        history = get_chat_history(session_id)
        return len(history.messages)
    except Exception as e:
        logger.error(f"❌ Error getting message count: {e}")
        return 0


# Initialize table on first import
def _initialize_table():
    """Create the langchain_chat_message_history table if it doesn't exist"""
    try:
        # Create a dummy session to trigger table creation
        test_history = get_chat_history("_init_test_")
        # LangChain will auto-create the table on first access
        _ = test_history.messages  # Trigger table creation
        logger.info("✅ LangChain chat message history table initialized")
    except Exception as e:
        logger.warning(f"⚠️  Could not initialize chat history table: {e}")


# Auto-initialize on module import
_initialize_table()
