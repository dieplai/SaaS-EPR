"""
Scope Checker - Determines if a question is about EPR law
"""
import logging
from typing import Dict
import openai
from config import Config

logger = logging.getLogger(__name__)

class ScopeChecker:
    """
    Uses LLM to determine if a question is related to EPR law or off-topic.
    """

    def __init__(self, openai_client):
        """
        Initialize scope checker with OpenAI client

        Args:
            openai_client: OpenAI client instance
        """
        self.client = openai_client

    def is_question_on_topic(self, query: str) -> Dict:
        """
        Check if a question is about EPR law (Extended Producer Responsibility)

        Args:
            query: User's question

        Returns:
            Dictionary with 'is_on_topic' (bool) and 'confidence' (str)
        """
        try:
            # System prompt to classify the question
            system_prompt = """Bạn là chuyên gia phân loại câu hỏi về Luật EPR (Trách nhiệm mở rộng của nhà sản xuất) tại Việt Nam.

**Luật EPR bao gồm TẤT CẢ các chủ đề sau (is_on_topic = true):**
1. EPR, trách nhiệm mở rộng của nhà sản xuất
2. Bao bì (nhựa, giấy, kim loại, thủy tinh) - sản xuất, nhập khẩu, quản lý
3. Sản phẩm (điện tử, lốp xe, pin, ắc quy, dệt may, vải, quần áo)
4. Tái chế, thu gom, xử lý chất thải
5. Nghĩa vụ doanh nghiệp (sản xuất, nhập khẩu, phân phối)
6. Môi trường, bảo vệ môi trường
7. Điều luật cụ thể (Điều 15, Nghị định 08/2022, Luật 72/2020)
8. Phạt vi phạm, chi phí tuân thủ, thủ tục hành chính

**VÍ DỤ CÂU HỎI ON-TOPIC (is_on_topic = true):**
- "EPR là gì?"
- "Doanh nghiệp sản xuất bao bì nhựa có nghĩa vụ gì?"
- "Doanh nghiệp tôi làm về vải tái chế, có cần tuân thủ EPR không?"
- "Điều 15 quy định gì?"
- "Nghị định 08/2022 nói về gì?"
- "Sản xuất quần áo có phải thực hiện EPR?"
- "Chi phí tái chế bao bì là bao nhiêu?"
- "Nhập khẩu sản phẩm điện tử có nghĩa vụ gì?"

**CÂU HỎI OFF-TOPIC (is_on_topic = false):**
- Luật lao động, hợp đồng, thuế, kế toán
- Công nghệ, AI, blockchain (không liên quan EPR)
- Du lịch, ẩm thực, thể thao
- Chào hỏi đơn thuần ("xin chào", "hello")

**QUY TẮC QUAN TRỌNG:**
1. Nếu đề cập DOANH NGHIỆP + SẢN PHẨM/BAO BÌ/TÁI CHẾ → is_on_topic = true
2. Nếu đề cập ĐIỀU LUẬT, NGHỊ ĐỊNH, THÔNG TƯ → is_on_topic = true
3. Nếu hỏi về NGHĨA VỤ, TRÁCH NHIỆM liên quan môi trường → is_on_topic = true
4. KHI KHÔNG CHẮC CHẮN → ƯU TIÊN is_on_topic = true (để tránh từ chối câu hỏi hợp lệ)

Trả lời theo định dạng JSON:
{
    "is_on_topic": true/false,
    "confidence": "high/medium/low",
    "reason": "Lý do ngắn gọn"
}"""

            user_prompt = f"Câu hỏi: {query}"

            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=Config.LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                max_tokens=150
            )

            # Parse response
            result_text = response.choices[0].message.content.strip()

            # Try to parse as JSON
            import json
            try:
                result = json.loads(result_text)
                is_on_topic = result.get('is_on_topic', False)
                confidence = result.get('confidence', 'medium')
                reason = result.get('reason', '')

                logger.info(f"Scope check for '{query[:50]}...': on_topic={is_on_topic}, confidence={confidence}")

                return {
                    'is_on_topic': is_on_topic,
                    'confidence': confidence,
                    'reason': reason
                }
            except json.JSONDecodeError:
                # Fallback: check if response contains "true" or "false"
                is_on_topic = "true" in result_text.lower() and "false" not in result_text.lower()
                logger.warning(f"Failed to parse JSON, using fallback: {is_on_topic}")

                return {
                    'is_on_topic': is_on_topic,
                    'confidence': 'low',
                    'reason': 'Fallback parsing'
                }

        except Exception as e:
            logger.error(f"Error checking question scope: {str(e)}")
            # Default to on-topic to avoid blocking legitimate questions
            return {
                'is_on_topic': True,
                'confidence': 'low',
                'reason': f'Error: {str(e)}'
            }

    def is_greeting_or_chitchat(self, query: str) -> bool:
        """
        Quick check if query is a simple greeting or chitchat

        Args:
            query: User's question

        Returns:
            True if it's likely a greeting/chitchat
        """
        query_lower = query.lower().strip()

        # Common greetings and chitchat patterns
        greetings = [
            'xin chào', 'chào bạn', 'hello', 'hi', 'hey',
            'chào', 'chào buổi sáng', 'chào buổi chiều',
            'cảm ơn', 'thank you', 'thanks',
            'tạm biệt', 'bye', 'goodbye'
        ]

        # Check if query is just a greeting
        for greeting in greetings:
            if query_lower == greeting or query_lower.startswith(greeting + ' ') or query_lower.startswith(greeting + ','):
                return True

        return False
