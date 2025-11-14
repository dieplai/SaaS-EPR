from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from middleware.auth import verify_token
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class QueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

@router.post("/query")
async def query_endpoint(
    request: Request,
    query_req: QueryRequest,
    user: dict = Depends(verify_token)
):
    """
    Main query endpoint với quota checking.

    Flow:
    1. Verify JWT token (done by dependency)
    2. Check quota with Package Service
    3. Process query through RAG pipeline
    4. Record usage with Package Service
    5. Return response
    """
    # Get services from app state
    query_handler = request.app.state.query_handler
    package_client = request.app.state.package_client

    if not query_handler:
        raise HTTPException(status_code=503, detail="Service not ready")

    # Extract access token from Authorization header
    auth_header = request.headers.get("Authorization", "")
    access_token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else ""

    # 1. Check quota
    can_query, error_msg = await package_client.check_quota(access_token)
    if not can_query:
        raise HTTPException(
            status_code=403,
            detail=error_msg or "Quota exceeded"
        )

    # 2. Process query
    try:
        result = query_handler.process_query(
            query_text=query_req.query,
            session_id=query_req.session_id
        )

        # 3. Record usage (only if successful and on-topic)
        if not result.get("is_off_topic", False) and not result.get("is_restricted", False):
            await package_client.record_query(access_token)

        return result

    except Exception as e:
        # Log detailed error for debugging
        logger.error(f"Error processing query: {str(e)}", exc_info=True)

        # Return user-friendly error message
        error_msg = "Đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau."

        # Check specific error types for better messages
        if "OpenAI" in str(e) or "API key" in str(e):
            error_msg = "Lỗi kết nối với AI service. Vui lòng thử lại sau."
        elif "Weaviate" in str(e) or "vector" in str(e).lower():
            error_msg = "Lỗi truy vấn cơ sở dữ liệu. Vui lòng thử lại sau."
        elif "timeout" in str(e).lower():
            error_msg = "Yêu cầu hết thời gian chờ. Vui lòng thử lại."

        raise HTTPException(status_code=500, detail=error_msg)


@router.post("/search")
async def search_endpoint(
    request: Request,
    query_req: QueryRequest,
    user: dict = Depends(verify_token)
):
    """
    Document search only (no quota check).
    """
    query_handler = request.app.state.query_handler

    if not query_handler:
        raise HTTPException(status_code=503, detail="Service not ready")

    try:
        result = query_handler.search_documents(query_req.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversation/{session_id}/history")
async def get_conversation_history(
    request: Request,
    session_id: str,
    user: dict = Depends(verify_token)
):
    """
    Get conversation history for a session.
    """
    query_handler = request.app.state.query_handler

    if not query_handler or not query_handler.conversation_memory:
        raise HTTPException(status_code=503, detail="Service not ready")

    try:
        context = query_handler.conversation_memory.get_context(session_id)
        session_info = {
            "message_count": len(context),
            "last_activity": query_handler.conversation_memory.get_session(session_id).last_activity if query_handler.conversation_memory.get_session(session_id) else None,
            "topics": list(query_handler.conversation_memory.get_session(session_id).topics) if query_handler.conversation_memory.get_session(session_id) else []
        }

        return {
            "session_id": session_id,
            "messages": context,
            "session_info": session_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversation/{session_id}/clear")
async def clear_conversation(
    request: Request,
    session_id: str,
    user: dict = Depends(verify_token)
):
    """
    Clear conversation history.
    """
    query_handler = request.app.state.query_handler

    if not query_handler or not query_handler.conversation_memory:
        raise HTTPException(status_code=503, detail="Service not ready")

    try:
        query_handler.conversation_memory.clear_session(session_id)
        return {
            "status": "success",
            "message": f"Conversation history cleared for session {session_id}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
