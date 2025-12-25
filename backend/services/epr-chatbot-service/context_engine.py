"""
Context Engineering Module
Handles intelligent context inference, ambiguity detection, and clarification
Following 2025 best practices for conversational AI
"""

import re
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ContextInference:
    """Result of context inference"""
    current_chapter: Optional[str] = None  # e.g., "Chương 2"
    current_section: Optional[str] = None  # e.g., "Mục 4"
    current_article: Optional[str] = None  # e.g., "Điều 45"
    current_law: Optional[str] = None  # e.g., "Luật Bảo vệ môi trường"
    confidence: float = 0.0  # 0.0 - 1.0


@dataclass
class AmbiguityDetection:
    """Result of ambiguity detection"""
    is_ambiguous: bool = False
    ambiguity_type: Optional[str] = None  # "missing_chapter", "missing_law", etc.
    clarification_question: Optional[str] = None
    inferred_context: Optional[ContextInference] = None


def extract_references(text: str) -> Dict[str, List[str]]:
    """
    Extract all legal references from text

    Returns:
        Dict with keys: 'chapters', 'sections', 'articles', 'laws'
    """
    references = {
        'chapters': [],
        'sections': [],
        'articles': [],
        'laws': []
    }

    # Extract Chương (Chapter) - unique
    chapter_pattern = r'[Cc]hương\s+(\d+)'
    references['chapters'] = re.findall(chapter_pattern, text)

    # Extract Mục (Section) - can be repeated across chapters
    section_pattern = r'[Mm]ục\s+(\d+)'
    references['sections'] = re.findall(section_pattern, text)

    # Extract Điều (Article) - unique
    article_pattern = r'[Dd]iều\s+(\d+)'
    references['articles'] = re.findall(article_pattern, text)

    # Extract Luật (Law)
    law_pattern = r'[Ll]uật\s+([^\n\.,;]+?)(?:\.|,|;|\n|$)'
    references['laws'] = re.findall(law_pattern, text)

    return references


def infer_context_from_history(chat_history: str) -> ContextInference:
    """
    Infer current context (chapter, section, etc.) from conversation history

    Strategy:
    - Look at the MOST RECENT mentions
    - Recent mentions have higher weight
    """
    if not chat_history:
        return ContextInference(confidence=0.0)

    # Split into messages and reverse (most recent first)
    lines = chat_history.strip().split('\n')
    lines.reverse()

    context = ContextInference()

    # Extract from recent messages (up to 6 messages back)
    recent_text = '\n'.join(lines[:6])
    refs = extract_references(recent_text)

    # Infer chapter (most recent)
    if refs['chapters']:
        context.current_chapter = f"Chương {refs['chapters'][0]}"
        context.confidence += 0.4

    # Infer section (most recent)
    if refs['sections']:
        context.current_section = f"Mục {refs['sections'][0]}"
        context.confidence += 0.3

    # Infer article (most recent)
    if refs['articles']:
        context.current_article = f"Điều {refs['articles'][0]}"
        context.confidence += 0.3

    # Normalize confidence to 0-1
    context.confidence = min(context.confidence, 1.0)

    logger.info(f"📍 Context inferred: Chapter={context.current_chapter}, "
                f"Section={context.current_section}, "
                f"Confidence={context.confidence:.2f}")

    return context


def detect_ambiguity(query: str, chat_history: str = "") -> AmbiguityDetection:
    """
    Detect if query is ambiguous and needs clarification

    Rules:
    1. Điều (Article) → UNIQUE → No ambiguity
    2. Chương (Chapter) → UNIQUE → No ambiguity
    3. Mục (Section) → AMBIGUOUS → Need chapter context

    Args:
        query: User's current question
        chat_history: Recent conversation history

    Returns:
        AmbiguityDetection with clarification if needed
    """
    query_lower = query.lower()
    refs = extract_references(query)

    # Infer context from history
    inferred_context = infer_context_from_history(chat_history)

    # RULE 1: Query mentions Điều (Article) - UNIQUE, no ambiguity
    if refs['articles']:
        logger.info(f"✅ Query mentions Điều (unique) - No ambiguity")
        return AmbiguityDetection(
            is_ambiguous=False,
            inferred_context=inferred_context
        )

    # RULE 2: Query mentions Chương (Chapter) - UNIQUE, no ambiguity
    if refs['chapters']:
        logger.info(f"✅ Query mentions Chương (unique) - No ambiguity")
        return AmbiguityDetection(
            is_ambiguous=False,
            inferred_context=inferred_context
        )

    # RULE 3: Query mentions Mục (Section) - AMBIGUOUS without chapter
    if refs['sections']:
        section_num = refs['sections'][0]

        # Check if chapter is mentioned in the same query
        if refs['chapters']:
            logger.info(f"✅ Query has both Mục and Chương - No ambiguity")
            return AmbiguityDetection(
                is_ambiguous=False,
                inferred_context=inferred_context
            )

        # Mục without Chương - AMBIGUOUS!
        # Check if we can infer chapter from history
        if inferred_context.current_chapter and inferred_context.confidence > 0.3:
            # We have context - ASK FOR CONFIRMATION (User chose Option A)
            clarification = (
                f"Bạn hỏi về Mục {section_num} trong {inferred_context.current_chapter} "
                f"đúng không?"
            )
            logger.info(f"❓ Ambiguous: Mục {section_num} - Asking for confirmation with inferred context")
            return AmbiguityDetection(
                is_ambiguous=True,
                ambiguity_type="confirm_chapter_context",
                clarification_question=clarification,
                inferred_context=inferred_context
            )
        else:
            # No context - ASK FOR MISSING INFO
            clarification = f"Bạn hỏi về Mục {section_num} trong chương nào?"
            logger.info(f"❓ Ambiguous: Mục {section_num} - Asking for missing chapter")
            return AmbiguityDetection(
                is_ambiguous=True,
                ambiguity_type="missing_chapter",
                clarification_question=clarification,
                inferred_context=inferred_context
            )

    # RULE 4: No specific references - might be follow-up or general question
    # Let LLM handle this
    logger.info(f"ℹ️  No specific legal references - Passing to LLM")
    return AmbiguityDetection(
        is_ambiguous=False,
        inferred_context=inferred_context
    )


def build_layered_context_prompt(
    query: str,
    chat_history: str,
    inferred_context: Optional[ContextInference] = None,
    documents: Optional[List] = None
) -> str:
    """
    Build a layered context prompt following Context Engineering best practices

    Layers:
    1. PERSISTENT: System role and capabilities
    2. CONVERSATION: Recent chat history
    3. INFERRED: Context inference from conversation
    4. CURRENT: User's current query
    5. KNOWLEDGE: Retrieved documents
    """

    # LAYER 1: PERSISTENT CONTEXT
    persistent_layer = """Bạn là chuyên gia pháp luật EPR (Extended Producer Responsibility) Việt Nam.

NHIỆM VỤ:
- Trả lời câu hỏi về pháp luật EPR dựa trên tài liệu được cung cấp
- Nếu câu hỏi THIẾU THÔNG TIN cần thiết → Hỏi lại để làm rõ
- Nếu câu hỏi RÕ RÀNG → Trả lời chi tiết với trích dẫn cụ thể

CẤU TRÚC VĂN BẢN PHÁP LUẬT:
- Điều (Article): DUY NHẤT trong luật - không cần hỏi thêm context
- Chương (Chapter): DUY NHẤT trong luật - không cần hỏi thêm context
- Mục (Section): CÓ THỂ LẶP trong các chương khác nhau - cần biết chương nào

QUY TẮC:
1. User hỏi "Điều 45 nói về gì" → Trả lời luôn (Điều unique)
2. User hỏi "Chương 2 có gì" → Trả lời luôn (Chương unique)
3. User hỏi "Mục 4 có gì" → Hỏi lại "Bạn hỏi về Mục 4 trong chương nào?"
"""

    # LAYER 2: CONVERSATION CONTEXT
    conversation_layer = ""
    if chat_history:
        # Get last 6 messages for context
        messages = chat_history.strip().split('\n')[-6:]
        conversation_layer = f"""
LỊCH SỬ HỘI THOẠI GẦN ĐÂY:
{chr(10).join(messages)}
"""

    # LAYER 3: INFERRED CONTEXT
    inferred_layer = ""
    if inferred_context and inferred_context.confidence > 0.3:
        inferred_parts = []
        if inferred_context.current_chapter:
            inferred_parts.append(f"- Đang thảo luận về: {inferred_context.current_chapter}")
        if inferred_context.current_section:
            inferred_parts.append(f"- Section hiện tại: {inferred_context.current_section}")
        if inferred_context.current_article:
            inferred_parts.append(f"- Article hiện tại: {inferred_context.current_article}")

        if inferred_parts:
            inferred_layer = f"""
NGỮ CẢNH ĐƯỢC SUY LUẬN (Confidence: {inferred_context.confidence:.0%}):
{chr(10).join(inferred_parts)}
"""

    # LAYER 4: CURRENT QUERY
    current_layer = f"""
CÂU HỎI HIỆN TẠI:
{query}
"""

    # LAYER 5: KNOWLEDGE (Retrieved documents)
    knowledge_layer = ""
    if documents:
        doc_texts = []
        for i, doc in enumerate(documents[:3], 1):  # Limit to top 3
            content = doc.page_content if hasattr(doc, 'page_content') else str(doc)
            doc_texts.append(f"[Tài liệu {i}]\n{content[:500]}...")

        knowledge_layer = f"""
TÀI LIỆU THAM KHẢO:
{chr(10).join(doc_texts)}
"""

    # Combine all layers
    full_prompt = f"""{persistent_layer}
{conversation_layer}
{inferred_layer}
{current_layer}
{knowledge_layer}

HÃY TRẢ LỜI:
"""

    return full_prompt


def detect_user_correction(query: str) -> Optional[Dict[str, Any]]:
    """
    Detect if user is correcting previous bot response

    Returns:
        Dict with correction info if detected, None otherwise
    """
    query_lower = query.lower()

    # Correction patterns
    correction_patterns = [
        (r'không.*(?:tôi|mình).*(?:hỏi|nói|ý).*về\s+(.*)', 'explicit_correction'),
        (r'(?:ý|nghĩa).*(?:tôi|mình).*là\s+(.*)', 'clarification'),
        (r'không\s+phải.*là\s+(.*)', 'negation_correction'),
    ]

    for pattern, correction_type in correction_patterns:
        match = re.search(pattern, query_lower)
        if match:
            corrected_value = match.group(1).strip()
            logger.info(f"🔄 User correction detected: {correction_type} → {corrected_value}")
            return {
                'type': correction_type,
                'corrected_value': corrected_value,
                'original_query': query
            }

    return None
