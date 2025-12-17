"""
FastAPI Server for EPR Legal Chatbot Service

Microservice that wraps epr_chatbot_core.py functions to expose as REST API endpoints.
Integrates with epr-saas-platform backend and allows calling from other microservices.

Features:
- Streaming chat responses
- FAQ matching and document retrieval
- Web search fallback
- Chat history management
- Authentication integration with epr-backend
"""

import os
import sys
import asyncio
import importlib.util
import logging
from typing import AsyncIterator, Dict, Any, List
from contextlib import redirect_stdout, redirect_stderr
import io
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# Import Redis and Backend clients
from redis_client import redis_client
from backend_client import backend_client

# ==========================================
# 🔧 CUSTOM JSON ENCODER
# ==========================================

class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle Document and other non-serializable objects"""
    def default(self, obj):
        # Handle LangChain Document objects
        if hasattr(obj, 'page_content') and hasattr(obj, 'metadata'):
            return {
                'content': obj.page_content,
                'metadata': obj.metadata
            }
        # Handle other objects with __dict__
        if hasattr(obj, '__dict__'):
            return obj.__dict__
        return str(obj)

# ==========================================
# 📊 LOGGING SETUP
# ==========================================

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ==========================================
# 🛠️ LOAD CHATBOT CORE MODULE
# ==========================================

def load_chatbot_core():
    """Load and initialize the chatbot core module"""
    try:
        spec = importlib.util.spec_from_file_location(
            "epr_chatbot_core",
            os.path.join(os.path.dirname(__file__), "epr_chatbot_core.py")
        )
        core_module = importlib.util.module_from_spec(spec)
        sys.modules["epr_chatbot_core"] = core_module

        # Redirect stdout to capture init logs
        output_buffer = io.StringIO()

        with redirect_stdout(output_buffer), redirect_stderr(output_buffer):
            spec.loader.exec_module(core_module)

        logger.info("✅ Chatbot core module loaded successfully")
        return core_module
    except Exception as e:
        logger.error(f"❌ Failed to load chatbot core: {e}", exc_info=True)
        raise

# Load the core module
try:
    chatbot_core = load_chatbot_core()
except Exception as e:
    logger.error(f"Failed to initialize chatbot core: {e}")
    chatbot_core = None

# ==========================================
# 🚀 FASTAPI APP SETUP
# ==========================================

SERVICE_NAME = os.getenv("SERVICE_NAME", "epr-chatbot-service")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "1.0.0")
API_PREFIX = os.getenv("API_PREFIX", "/api/v1")

app = FastAPI(
    title="EPR Legal Chatbot Service",
    description="Vietnamese EPR Legal Question-Answering System - Microservice",
    version=SERVICE_VERSION,
    openapi_url=f"{API_PREFIX}/openapi.json",
    docs_url=f"{API_PREFIX}/docs",
    redoc_url=f"{API_PREFIX}/redoc"
)

# ==========================================
# 🔄 CORS MIDDLEWARE
# ==========================================

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:8080").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 📝 LOGGING MIDDLEWARE
# ==========================================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    start_time = datetime.utcnow()

    response = await call_next(request)

    process_time = (datetime.utcnow() - start_time).total_seconds()
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s"
    )

    return response

# ==========================================
# 🔄 STARTUP & SHUTDOWN EVENTS
# ==========================================

@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    logger.info("🚀 Starting EPR Chatbot Service...")
    await redis_client.connect()
    logger.info("✅ All services initialized")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("🛑 Shutting down EPR Chatbot Service...")
    await redis_client.disconnect()
    logger.info("👋 Shutdown complete")

# ==========================================
# 🔐 AUTHENTICATION HELPERS
# ==========================================

def extract_auth_token(request: Request) -> str:
    """Extract JWT token from HTTP-only cookie or Authorization header"""
    # Try to get token from HTTP-only cookie first (preferred for web app)
    # Check both 'auth_token' and 'accessToken' (frontend uses accessToken)
    token = request.cookies.get("auth_token") or request.cookies.get("accessToken")
    if token:
        logger.debug(f"🔐 Token extracted from cookie")
        return token

    # Fallback to Authorization header (for API clients)
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        logger.debug(f"🔐 Token extracted from Authorization header")
        return auth_header[7:]  # Remove "Bearer " prefix

    logger.debug("⚠️ No auth token found in cookies or headers")
    return ""

def get_user_id_from_token(token: str) -> str:
    """Extract user ID from JWT token (simplified)"""
    # In production, properly decode and verify JWT
    # For now, we rely on backend API validation
    return "anonymous" if not token else "authenticated"

# ==========================================
# 🛡️ RATE LIMITING MIDDLEWARE
# ==========================================

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting for chatbot API"""
    # Skip rate limiting for health checks and docs
    if request.url.path in ["/", f"{API_PREFIX}/health", f"{API_PREFIX}/docs", f"{API_PREFIX}/openapi.json"]:
        return await call_next(request)

    # Get client identifier (IP or user ID)
    client_ip = request.client.host if request.client else "unknown"
    auth_token = extract_auth_token(request)
    user_id = get_user_id_from_token(auth_token)

    # Use user ID if authenticated, otherwise IP
    rate_limit_key = f"rate_limit:chatbot:{user_id if auth_token else client_ip}"

    # Rate limit: 20 requests per minute for authenticated users, 5 for anonymous
    max_requests = 20 if auth_token else 5
    window_seconds = 60

    allowed, remaining = await redis_client.check_rate_limit(
        rate_limit_key,
        max_requests,
        window_seconds
    )

    if not allowed:
        logger.warning(f"⚠️  Rate limit exceeded for {rate_limit_key}")
        return JSONResponse(
            status_code=429,
            content={
                "error": "rate_limit_exceeded",
                "message": f"Too many requests. Maximum {max_requests} requests per minute.",
                "retry_after": window_seconds
            },
            headers={
                "X-RateLimit-Limit": str(max_requests),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(window_seconds),
                "Retry-After": str(window_seconds)
            }
        )

    # Add rate limit headers to response
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(max_requests)
    response.headers["X-RateLimit-Remaining"] = str(remaining)

    return response

# ==========================================
# 📁 STATIC FILES & UI
# ==========================================

# Mount static files
static_dir = Path(__file__).parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
    logger.info(f"✅ Static files mounted from {static_dir}")

@app.get("/")
async def root():
    """Serve the chat UI"""
    static_file = Path(__file__).parent / "static" / "index.html"
    if static_file.exists():
        return FileResponse(static_file)
    return {"message": "Chat UI not found. Visit /api/v1/docs for API documentation"}

@app.get("/chat")
async def chat_ui():
    """Alternative route to access chat UI"""
    static_file = Path(__file__).parent / "static" / "index.html"
    if static_file.exists():
        return FileResponse(static_file)
    return {"message": "Chat UI not available"}

@app.get("/health")
async def health():
    """Simple health check endpoint for monitoring"""
    return {"status": "ok", "service": "epr-chatbot-service"}

# ==========================================
# 📋 PYDANTIC MODELS
# ==========================================

class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    question: str
    chat_history: str = ""
    faq_threshold: float = 0.6
    use_parallel: bool = True
    # Auth token will be extracted from Authorization header instead

class ChatHistoryResponse(BaseModel):
    """Response model for chat history"""
    history: str

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    message: str

# ==========================================
# 🔌 API ENDPOINTS
# ==========================================

@app.get(f"{API_PREFIX}/health")
async def health_check():
    """
    Health check endpoint

    Returns status of the service and its dependencies
    """
    chatbot_status = "ok" if chatbot_core else "error"

    return {
        "status": chatbot_status,
        "message": "EPR Legal Chatbot Service is running",
        "version": SERVICE_VERSION,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post(f"{API_PREFIX}/chat")
async def chat(chat_request: ChatRequest, http_request: Request):
    """
    Main chat endpoint with streaming response and token tracking

    This endpoint processes a legal question and streams the response
    in real-time as it's being generated. Tracks token usage and
    deducts from user's subscription.

    Args:
        chat_request: ChatRequest containing:
            - question: User's legal question
            - chat_history: Previous conversation context (optional)
            - faq_threshold: Minimum FAQ match score (default: 0.6)
            - use_parallel: Use parallel retrieval (default: True)
        http_request: FastAPI Request object for auth header

    Returns:
        StreamingResponse: Server-sent events with chat updates

    Streams:
        - status: Status updates (e.g., "Searching knowledge base...")
        - response_chunk: Individual response chunks for streaming
        - response_complete: Final complete response with metadata
        - token_usage: Token consumption info
    """
    try:
        # Extract auth token
        auth_token = extract_auth_token(http_request)

        # DEBUG: Log cookies and auth token
        logger.info(f"🍪 Cookies received: {list(http_request.cookies.keys())}")
        logger.info(f"🔐 Auth token extracted: {bool(auth_token)} (length: {len(auth_token) if auth_token else 0})")

        # Check subscription and quota BEFORE processing (optional, for immediate feedback)
        if auth_token:
            logger.info(f"✅ Auth token found, checking subscription...")
            subscription = await backend_client.get_subscription_info(auth_token)
            if subscription:
                remaining_tokens = subscription.get("remaining_tokens", 0)
                logger.info(f"ℹ️  User has {remaining_tokens} tokens remaining")

                # Optional: Check if user has minimum tokens (e.g., 100 tokens)
                if remaining_tokens < 100:
                    logger.warning(f"⚠️  Low tokens: {remaining_tokens}")

        async def generate_response():
            """Async generator that streams response chunks and tracks tokens"""
            total_tokens = 0
            response_text = ""

            try:
                # Call the optimized chatbot pipeline
                async for update in chatbot_core.optimized_chatbot_pipeline(
                    query=chat_request.question,
                    chat_history=chat_request.chat_history,
                    faq_threshold=chat_request.faq_threshold,
                    use_parallel=chat_request.use_parallel
                ):
                    # Track response text for token counting
                    if update.get("type") == "response_chunk":
                        chunk_text = update.get("chunk", "")  # ← FIXED: Use 'chunk' not 'text'
                        response_text += chunk_text
                    elif update.get("type") == "response_complete":
                        response_text = update.get("response", response_text)

                    # Convert each update to JSON and send as SSE event
                    try:
                        json_str = json.dumps(update, cls=CustomJSONEncoder)
                        yield f"data: {json_str}\n\n"
                    except Exception as e:
                        logger.error(f"Error serializing update: {e}")
                        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

                    # Small delay to allow event processing
                    await asyncio.sleep(0.01)

                # After response complete, count tokens
                if response_text:
                    total_tokens = chatbot_core.count_tokens(response_text)
                    logger.info(f"📊 Response token count: {total_tokens}")
                    logger.info(f"🔐 Auth token present: {bool(auth_token)}")
                    logger.info(f"🔐 Auth token length: {len(auth_token) if auth_token else 0}")

                    # Consume tokens from backend if authenticated
                    if auth_token and total_tokens > 0:
                        logger.info(f"💰 Attempting to consume {total_tokens} tokens...")
                        success, error_msg = await backend_client.consume_tokens(
                            token_count=total_tokens,
                            auth_token=auth_token
                        )
                        logger.info(f"💰 Consumption result: success={success}, error={error_msg}")

                        # Send token usage update
                        token_update = {
                            "type": "token_usage",
                            "tokens_used": total_tokens,
                            "consumed": success,
                            "error": error_msg if not success else None
                        }
                        yield f"data: {json.dumps(token_update)}\n\n"

                        if not success:
                            logger.warning(f"⚠️  Token consumption failed: {error_msg}")
                    else:
                        # For unauthenticated users, still report token count
                        token_update = {
                            "type": "token_usage",
                            "tokens_used": total_tokens,
                            "consumed": False,
                            "message": "Authentication required to track usage"
                        }
                        yield f"data: {json.dumps(token_update)}\n\n"

            except Exception as e:
                error_update = {
                    "type": "error",
                    "message": str(e)
                }
                yield f"data: {json.dumps(error_update, cls=CustomJSONEncoder)}\n\n"

        # Return streaming response
        return StreamingResponse(
            generate_response(),
            media_type="text/event-stream"
        )

    except Exception as e:
        logger.error(f"Chat endpoint error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat: {str(e)}"
        )

@app.get(f"{API_PREFIX}/chat-history")
async def get_chat_history(max_exchanges: int = 3):
    """
    Get the current chat history from memory

    Args:
        max_exchanges: Number of recent conversation pairs to keep
                      (default: 3, each exchange = 1 user msg + 1 assistant msg)

    Returns:
        ChatHistoryResponse: Formatted chat history string
    """
    try:
        history = chatbot_core.get_full_chat_history(max_exchanges=max_exchanges)
        return {"history": history}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving chat history: {str(e)}"
        )

@app.post(f"{API_PREFIX}/clear-memory")
async def clear_memory():
    """
    Clear all conversation memory

    This endpoint removes all stored conversation history from the chatbot's memory.

    Returns:
        Dict with success message
    """
    try:
        chatbot_core.clear_memory()
        return {
            "status": "success",
            "message": "Conversation memory cleared"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error clearing memory: {str(e)}"
        )

# ==========================================
# 📊 INFO ENDPOINT
# ==========================================

@app.get(f"{API_PREFIX}/info")
async def get_info():
    """
    Get information about the chatbot

    Returns:
        Dict with chatbot information and capabilities
    """
    return {
        "name": SERVICE_NAME,
        "description": "Vietnamese EPR (Extended Producer Responsibility) Legal Question-Answering System",
        "version": SERVICE_VERSION,
        "endpoints": {
            "health": f"{API_PREFIX}/health",
            "chat": f"{API_PREFIX}/chat (POST)",
            "chat_history": f"{API_PREFIX}/chat-history (GET)",
            "clear_memory": f"{API_PREFIX}/clear-memory (POST)",
            "info": f"{API_PREFIX}/info"
        },
        "features": [
            "Legal document retrieval (RAG)",
            "FAQ matching",
            "Web search fallback",
            "Hallucination detection",
            "Context awareness from chat history",
            "Streaming responses"
        ]
    }

# ==========================================
# 🚀 RUN SERVER
# ==========================================

if __name__ == "__main__":
    import uvicorn

    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8002"))

    print("\n" + "="*70)
    print(f"🚀 Starting {SERVICE_NAME} v{SERVICE_VERSION}")
    print("="*70)
    print(f"📡 Server URL: http://localhost:{PORT}")
    print(f"📚 API Documentation: http://localhost:{PORT}{API_PREFIX}/docs")
    print(f"🔄 ReDoc: http://localhost:{PORT}{API_PREFIX}/redoc")
    print("="*70 + "\n")

    uvicorn.run(
        app,
        host=HOST,
        port=PORT,
        log_level=os.getenv("LOG_LEVEL", "info")
    )
