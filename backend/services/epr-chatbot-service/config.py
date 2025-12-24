"""
EPR Chatbot Configuration
Centralized configuration for easy tuning
"""

# ============================================================================
# LLM MODELS CONFIGURATION
# ============================================================================

# Model names
LLM_MODEL_FAST = "gpt-3.5-turbo"      # Fast, cheap - for routing, grading
LLM_MODEL_SMART = "gpt-4o-mini"       # Smart, accurate - for complex tasks
LLM_MODEL_REWRITER = "gpt-4o-mini"    # Question rewriting

# Temperatures
LLM_TEMP_DETERMINISTIC = 0            # For routing, grading (need consistent output)
LLM_TEMP_CREATIVE = 0.7               # For chitchat (more natural)

# ============================================================================
# RETRIEVAL CONFIGURATION
# ============================================================================

# Score thresholds
FAQ_SCORE_THRESHOLD = 0.75            # Minimum score for FAQ retrieval
LEGAL_SCORE_THRESHOLD = 0.7           # Minimum score for legal retrieval

# Retrieval limits
FAQ_RETRIEVAL_TOP_K = 5               # Number of candidates for FAQ hybrid search
LEGAL_RETRIEVAL_TOP_K = 5             # Number of legal documents to retrieve
MAX_DOCS_IN_CONTEXT = 5               # Maximum documents to include in prompt

# Hybrid search weights
SEMANTIC_WEIGHT = 1.0                 # Weight for semantic similarity score
KEYWORD_BOOST = 0.3                   # Boost for keyword matching

# ============================================================================
# TOKEN MANAGEMENT
# ============================================================================

# Context limits (tokens)
MAX_CONTEXT_TOKENS = 15000            # Maximum total tokens for GPT-3.5-turbo
MAX_TOKENS_PER_DOC = 800              # Maximum tokens per document
MAX_CHAT_HISTORY_TOKENS = 2000        # Maximum tokens for chat history
MAX_SINGLE_MESSAGE_TOKENS = 500       # Maximum tokens per message in history

# Chat history
CHAT_HISTORY_MAX_EXCHANGES = 3        # Number of recent conversation pairs to keep
                                      # Each exchange = 1 user + 1 assistant message

# ============================================================================
# RETRY & QUALITY CONTROL
# ============================================================================

# Retry limits
MAX_RETRIEVAL_RETRIES = 1             # Max retries for document retrieval
MAX_GENERATION_RETRIES = 1            # Max retries for answer generation
MAX_TOTAL_RETRIES = 3                 # Global retry limit for entire pipeline

# Quality thresholds
MIN_DOCUMENT_RELEVANCE = "có"         # Minimum relevance grade (có/không)
HALLUCINATION_THRESHOLD = "có"        # Hallucination check threshold

# ============================================================================
# QDRANT CONFIGURATION
# ============================================================================

# Collection names
QDRANT_FAQ_COLLECTION = "faq_collection"
QDRANT_LEGAL_COLLECTION = "law_collection"

# Scroll limits (only if needed, prefer count() API)
QDRANT_SCROLL_LIMIT = 100             # Number of documents per scroll batch

# ============================================================================
# PERFORMANCE SETTINGS
# ============================================================================

# Async/Parallel settings
ENABLE_PARALLEL_RETRIEVAL = True      # Enable parallel FAQ + Legal retrieval
PARALLEL_RETRIEVAL_TIMEOUT = 30       # Timeout in seconds for parallel retrieval

# Streaming
ENABLE_STREAMING = True               # Enable streaming response

# ============================================================================
# VIETNAMESE NLP
# ============================================================================

# Stopwords for Vietnamese keyword matching
VIETNAMESE_STOPWORDS = {
    'của', 'và', 'các', 'có', 'được', 'theo', 'trong', 'từ',
    'với', 'cho', 'để', 'về', 'là', 'này', 'đó', 'như',
    'khi', 'hay', 'hoặc', 'nhưng', 'vì', 'đã', 'sẽ', 'bị',
    'những', 'một', 'không', 'đến', 'thì', 'phải', 'trên',
    'sau', 'nếu', 'người', 'việc', 'lại', 'năm', 'ngày',
    'bạn', 'tôi', 'chúng', 'họ', 'nó', 'gì', 'nào', 'sao', 'bao'
}

# Minimum word length for keyword matching
MIN_KEYWORD_LENGTH = 2

# ============================================================================
# LOGGING & DEBUGGING
# ============================================================================

# Debug mode
DEBUG_MODE = False                    # Enable verbose logging
PRINT_RETRIEVAL_SCORES = False        # Print retrieval scores for debugging
PRINT_TOKEN_COUNTS = False            # Print token counts for debugging

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_llm_config(purpose: str) -> dict:
    """
    Get LLM configuration for specific purpose

    Args:
        purpose: One of ['fast', 'smart', 'creative', 'rewriter']

    Returns:
        dict with 'model' and 'temperature'
    """
    configs = {
        'fast': {
            'model': LLM_MODEL_FAST,
            'temperature': LLM_TEMP_DETERMINISTIC
        },
        'smart': {
            'model': LLM_MODEL_SMART,
            'temperature': LLM_TEMP_DETERMINISTIC
        },
        'creative': {
            'model': LLM_MODEL_FAST,
            'temperature': LLM_TEMP_CREATIVE
        },
        'rewriter': {
            'model': LLM_MODEL_REWRITER,
            'temperature': LLM_TEMP_DETERMINISTIC
        }
    }
    return configs.get(purpose, configs['fast'])
