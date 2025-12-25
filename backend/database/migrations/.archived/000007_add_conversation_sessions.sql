-- ============================================
-- Add Conversation Sessions for ChatGPT-style History
-- ============================================

-- Create conversation_sessions table
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Session info
    title VARCHAR(500) NOT NULL DEFAULT 'New Chat',

    -- Auto-generated from first user message
    auto_title BOOLEAN DEFAULT TRUE,

    -- Metadata
    message_count INT DEFAULT 0,
    last_message_at TIMESTAMP DEFAULT NOW(),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Soft delete
    deleted_at TIMESTAMP
);

CREATE INDEX idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX idx_conversation_sessions_updated_at ON conversation_sessions(last_message_at DESC);
CREATE INDEX idx_conversation_sessions_user_recent ON conversation_sessions(user_id, last_message_at DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE conversation_sessions IS 'ChatGPT-style conversation sessions';
COMMENT ON COLUMN conversation_sessions.auto_title IS 'If true, title was auto-generated from first message';

-- Modify existing conversations table to link to session
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS conversation_session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_conversations_session_id_v2 ON conversations(conversation_session_id);

-- Update trigger for updated_at
CREATE TRIGGER set_conversation_sessions_updated_at
BEFORE UPDATE ON conversation_sessions
FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Function: Auto-update session metadata when message is added
CREATE OR REPLACE FUNCTION update_conversation_session_metadata()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversation_sessions
    SET
        message_count = (
            SELECT COUNT(*)
            FROM conversations
            WHERE conversation_session_id = NEW.conversation_session_id
        ),
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_session_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_session_metadata
AFTER INSERT ON conversations
FOR EACH ROW
WHEN (NEW.conversation_session_id IS NOT NULL)
EXECUTE FUNCTION update_conversation_session_metadata();

COMMENT ON FUNCTION update_conversation_session_metadata IS 'Auto-update conversation session metadata when messages are added';

-- ============================================
-- SUMMARY
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Conversation sessions table created!';
    RAISE NOTICE '📊 Table: conversation_sessions';
    RAISE NOTICE '🔗 conversations table updated with conversation_session_id FK';
    RAISE NOTICE '⚡ Triggers: auto-update session metadata';
END $$;
