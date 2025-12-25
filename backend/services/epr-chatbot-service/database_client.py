"""
Database Client for Conversation Management
Handles conversation sessions and message persistence
"""

import os
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor, Json
import json

logger = logging.getLogger(__name__)


class DatabaseClient:
    """Client to interact with PostgreSQL for conversation management"""

    def __init__(self):
        # Parse DATABASE_URL from environment
        database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/epr_saas")

        # Convert to psycopg2 connection params
        # Format: postgresql://user:password@host:port/database
        if database_url.startswith("postgresql://"):
            parts = database_url.replace("postgresql://", "").split("@")
            user_pass = parts[0].split(":")
            host_port_db = parts[1].split("/")
            host_port = host_port_db[0].split(":")

            self.conn_params = {
                "user": user_pass[0],
                "password": user_pass[1] if len(user_pass) > 1 else "",
                "host": host_port[0],
                "port": host_port[1] if len(host_port) > 1 else "5432",
                "database": host_port_db[1].split("?")[0]  # Remove SSL params
            }
        else:
            self.conn_params = {
                "user": "postgres",
                "password": "postgres",
                "host": "localhost",
                "port": "5432",
                "database": "epr_saas"
            }

        logger.info(f"✅ Database client initialized for {self.conn_params['database']}")

    def _get_connection(self):
        """Get a new database connection"""
        return psycopg2.connect(**self.conn_params, cursor_factory=RealDictCursor)

    async def create_conversation_session(self, user_id: str, title: str = "New Chat") -> Optional[str]:
        """
        Create a new conversation session

        Args:
            user_id: UUID of the user
            title: Initial title (default: "New Chat")

        Returns:
            str: Session ID (UUID) or None if failed
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO conversation_sessions (user_id, title, auto_title)
                VALUES (%s, %s, %s)
                RETURNING id
            """, (user_id, title, True))

            result = cursor.fetchone()
            session_id = str(result['id']) if result else None

            conn.commit()
            cursor.close()
            conn.close()

            logger.info(f"✅ Created conversation session {session_id} for user {user_id}")
            return session_id

        except Exception as e:
            logger.error(f"❌ Error creating conversation session: {e}")
            return None

    async def get_user_conversations(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get user's conversation sessions

        Args:
            user_id: UUID of the user
            limit: Max number of conversations to return

        Returns:
            List of conversation session dicts
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                SELECT
                    id,
                    title,
                    message_count,
                    last_message_at,
                    created_at
                FROM conversation_sessions
                WHERE user_id = %s AND deleted_at IS NULL
                ORDER BY last_message_at DESC
                LIMIT %s
            """, (user_id, limit))

            conversations = cursor.fetchall()
            cursor.close()
            conn.close()

            # Convert to list of dicts
            result = []
            for conv in conversations:
                result.append({
                    "id": str(conv['id']),
                    "title": conv['title'],
                    "message_count": conv['message_count'],
                    "last_message_at": conv['last_message_at'].isoformat() if conv['last_message_at'] else None,
                    "created_at": conv['created_at'].isoformat() if conv['created_at'] else None
                })

            logger.info(f"✅ Retrieved {len(result)} conversations for user {user_id}")
            return result

        except Exception as e:
            logger.error(f"❌ Error getting user conversations: {e}")
            return []

    async def save_message(
        self,
        session_id: str,
        user_id: str,
        role: str,
        content: str,
        model: Optional[str] = None,
        tokens_used: int = 0,
        sources: Optional[List] = None
    ) -> bool:
        """
        Save a message to a conversation session

        Args:
            session_id: UUID of the conversation session
            user_id: UUID of the user
            role: Message role (user/assistant/system)
            content: Message content
            model: AI model used (optional)
            tokens_used: Number of tokens consumed
            sources: List of source documents

        Returns:
            bool: Success status
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            # Save the message
            cursor.execute("""
                INSERT INTO conversations (
                    conversation_session_id,
                    user_id,
                    session_id,
                    role,
                    content,
                    model,
                    tokens_used,
                    sources
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                session_id,
                user_id,
                session_id,  # session_id field (legacy)
                role,
                content,
                model,
                tokens_used,
                Json(sources) if sources else None
            ))

            # Auto-update title from first user message
            if role == "user":
                # Check if conversation has auto_title enabled and no custom title yet
                # Note: message_count will be 1 after trigger runs (AFTER INSERT)
                cursor.execute("""
                    SELECT auto_title, message_count
                    FROM conversation_sessions
                    WHERE id = %s AND user_id = %s
                """, (session_id, user_id))

                session = cursor.fetchone()
                # Check message_count == 1 because trigger already updated it after first message
                if session and session['auto_title'] and session['message_count'] == 1:
                    # This is the first user message - update title
                    title = content.strip()[:50]  # First 50 chars
                    if len(content.strip()) > 50:
                        title += "..."

                    cursor.execute("""
                        UPDATE conversation_sessions
                        SET title = %s, updated_at = NOW()
                        WHERE id = %s AND user_id = %s
                    """, (title, session_id, user_id))

                    logger.info(f"✅ Auto-updated title for session {session_id}: {title}")

            conn.commit()
            cursor.close()
            conn.close()

            logger.info(f"✅ Saved {role} message to session {session_id}")
            return True

        except Exception as e:
            logger.error(f"❌ Error saving message: {e}")
            return False

    async def get_conversation_messages(self, session_id: str, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all messages in a conversation session

        Args:
            session_id: UUID of the conversation session
            user_id: UUID of the user (for security)

        Returns:
            List of message dicts
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                SELECT
                    role,
                    content,
                    model,
                    tokens_used,
                    sources,
                    created_at
                FROM conversations
                WHERE conversation_session_id = %s AND user_id = %s
                ORDER BY created_at ASC
            """, (session_id, user_id))

            messages = cursor.fetchall()
            cursor.close()
            conn.close()

            # Convert to list of dicts
            result = []
            for msg in messages:
                result.append({
                    "role": msg['role'],
                    "content": msg['content'],
                    "model": msg['model'],
                    "tokens_used": msg['tokens_used'],
                    "sources": msg['sources'],
                    "created_at": msg['created_at'].isoformat() if msg['created_at'] else None
                })

            logger.info(f"✅ Retrieved {len(result)} messages from session {session_id}")
            return result

        except Exception as e:
            logger.error(f"❌ Error getting conversation messages: {e}")
            return []

    async def get_conversation_with_messages(self, session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get conversation session info with all messages

        Args:
            session_id: UUID of the conversation session
            user_id: UUID of the user (for security)

        Returns:
            Dict with conversation info and messages, or None if not found
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            # Get conversation info
            cursor.execute("""
                SELECT
                    id,
                    title,
                    message_count,
                    last_message_at,
                    created_at
                FROM conversation_sessions
                WHERE id = %s AND user_id = %s AND deleted_at IS NULL
            """, (session_id, user_id))

            conversation = cursor.fetchone()

            if not conversation:
                cursor.close()
                conn.close()
                return None

            # Get messages
            cursor.execute("""
                SELECT
                    role,
                    content,
                    model,
                    tokens_used,
                    sources,
                    created_at
                FROM conversations
                WHERE conversation_session_id = %s AND user_id = %s
                ORDER BY created_at ASC
            """, (session_id, user_id))

            messages = cursor.fetchall()
            cursor.close()
            conn.close()

            # Convert messages to list of dicts
            message_list = []
            for msg in messages:
                message_list.append({
                    "role": msg['role'],
                    "content": msg['content'],
                    "model": msg['model'],
                    "tokens_used": msg['tokens_used'],
                    "sources": msg['sources'],
                    "created_at": msg['created_at'].isoformat() if msg['created_at'] else None
                })

            result = {
                "id": str(conversation['id']),
                "title": conversation['title'],
                "message_count": conversation['message_count'],
                "last_message_at": conversation['last_message_at'].isoformat() if conversation['last_message_at'] else None,
                "created_at": conversation['created_at'].isoformat() if conversation['created_at'] else None,
                "messages": message_list
            }

            logger.info(f"✅ Retrieved conversation {session_id} with {len(message_list)} messages")
            return result

        except Exception as e:
            logger.error(f"❌ Error getting conversation with messages: {e}")
            return None

    async def update_conversation_title(self, session_id: str, user_id: str, title: str) -> bool:
        """
        Update conversation session title

        Args:
            session_id: UUID of the conversation session
            user_id: UUID of the user (for security)
            title: New title

        Returns:
            bool: Success status
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE conversation_sessions
                SET title = %s, auto_title = FALSE, updated_at = NOW()
                WHERE id = %s AND user_id = %s
            """, (title, session_id, user_id))

            conn.commit()
            cursor.close()
            conn.close()

            logger.info(f"✅ Updated title for session {session_id}")
            return True

        except Exception as e:
            logger.error(f"❌ Error updating conversation title: {e}")
            return False

    async def delete_conversation(self, session_id: str, user_id: str) -> bool:
        """
        Soft delete a conversation session

        Args:
            session_id: UUID of the conversation session
            user_id: UUID of the user (for security)

        Returns:
            bool: Success status
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE conversation_sessions
                SET deleted_at = NOW()
                WHERE id = %s AND user_id = %s
            """, (session_id, user_id))

            conn.commit()
            cursor.close()
            conn.close()

            logger.info(f"✅ Deleted conversation session {session_id}")
            return True

        except Exception as e:
            logger.error(f"❌ Error deleting conversation: {e}")
            return False

    async def delete_all_conversations(self, user_id: str) -> int:
        """
        Soft delete all conversation sessions for a user

        Args:
            user_id: UUID of the user

        Returns:
            int: Number of conversations deleted
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE conversation_sessions
                SET deleted_at = NOW()
                WHERE user_id = %s AND deleted_at IS NULL
            """, (user_id,))

            deleted_count = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()

            logger.info(f"✅ Deleted {deleted_count} conversation sessions for user {user_id}")
            return deleted_count

        except Exception as e:
            logger.error(f"❌ Error deleting all conversations: {e}")
            return 0


# Global singleton instance
database_client = DatabaseClient()
