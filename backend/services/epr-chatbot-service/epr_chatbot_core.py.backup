"""
EPR Legal Chatbot - Core Module
Vietnamese EPR (Extended Producer Responsibility) Legal Question-Answering System
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set environment variables
os.environ['LANGCHAIN_TRACING_V2'] = os.getenv('LANGCHAIN_TRACING_V2', 'true')
os.environ['LANGCHAIN_ENDPOINT'] = os.getenv('LANGCHAIN_ENDPOINT', 'https://api.smith.langchain.com')
os.environ['TAVILY_API_KEY'] = os.getenv('TAVILY_API_KEY', '')
os.environ['LANGCHAIN_API_KEY'] = os.getenv('LANGCHAIN_API_KEY', '')
os.environ['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY', '')


# Updated imports - ChromaTranslator is now in a different location
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

# Storage and vectorstore
from langchain_core.stores import InMemoryByteStore
from langchain_chroma import Chroma

# Retrievers
from langchain.retrievers.multi_vector import MultiVectorRetriever

# Self-query imports
from langchain.chains.query_constructor.schema import AttributeInfo
from langchain.retrievers.self_query.base import SelfQueryRetriever
from langchain.chains.query_constructor.base import (
    StructuredQueryOutputParser,
    get_query_constructor_prompt,
)

# FIXED: ChromaTranslator import
try:
    from langchain.retrievers.self_query.chroma import ChromaTranslator
except:
    from langchain_community.query_constructors.chroma import ChromaTranslator

import uuid
import tiktoken

print("✓ All imports successful!")

from langchain.schema import Document
from langchain_openai import OpenAIEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid

# Import improved prompts
from improved_prompts import format_legal_prompt, format_faq_prompt

# ========== TOKEN COUNTING UTILITIES ==========

def count_tokens(text: str, model: str = "gpt-3.5-turbo") -> int:
    """Count the number of tokens in a text string"""
    try:
        encoding = tiktoken.encoding_for_model(model)
        return len(encoding.encode(text))
    except Exception as e:
        print(f"  ⚠️ Error counting tokens: {e}")
        # Rough estimation: ~4 characters per token
        return len(text) // 4

def truncate_text(text: str, max_tokens: int = 1000, model: str = "gpt-3.5-turbo") -> str:
    """Truncate text to fit within max_tokens"""
    try:
        encoding = tiktoken.encoding_for_model(model)
        tokens = encoding.encode(text)

        if len(tokens) <= max_tokens:
            return text

        # Truncate and decode back to text
        truncated_tokens = tokens[:max_tokens]
        return encoding.decode(truncated_tokens) + "..."
    except Exception as e:
        print(f"  ⚠️ Error truncating text: {e}")
        # Rough fallback: character-based truncation
        max_chars = max_tokens * 4
        if len(text) <= max_chars:
            return text
        return text[:max_chars] + "..."

print("✓ Token counting utilities loaded")

# ========== CONFIGURATION ==========

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Initialize Qdrant client - Cloud or Local
USE_QDRANT_CLOUD = os.getenv('USE_QDRANT_CLOUD', 'false').lower() == 'true'
QDRANT_CLOUD_URL = os.getenv('QDRANT_CLOUD_URL')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')

if USE_QDRANT_CLOUD and QDRANT_CLOUD_URL and QDRANT_API_KEY:
    # Use Qdrant Cloud
    try:
        client = QdrantClient(
            url=QDRANT_CLOUD_URL,
            api_key=QDRANT_API_KEY,
        )
        print("✅ Connected to Qdrant Cloud")
        print(f"   URL: {QDRANT_CLOUD_URL}")
    except Exception as e:
        print(f"❌ Failed to connect to Qdrant Cloud: {e}")
        print("⚠️  Falling back to local storage...")
        try:
            client = QdrantClient(path="./qdrant_faq_db")
            print("✅ Using persistent Qdrant database at ./qdrant_faq_db")
        except Exception as e2:
            print(f"⚠️  Could not use file-based database: {e2}")
            print("📝 Using in-memory Qdrant database instead")
            client = QdrantClient(":memory:")
else:
    # Use local Qdrant
    print("📍 Using local Qdrant storage")
    try:
        client = QdrantClient(path="./qdrant_faq_db")
        print("✅ Using persistent Qdrant database at ./qdrant_faq_db")
    except Exception as e:
        print(f"⚠️  Could not use file-based database: {e}")
        print("📝 Using in-memory Qdrant database instead")
        client = QdrantClient(":memory:")

collection_name = "faq_collection"

# ========== FAQ DATA - Using Qdrant Cloud ==========
# FAQ data is now stored in Qdrant Cloud (faq_collection)
# No local hardcoded data needed

# ========== RETRIEVAL FUNCTION ==========

def retrieve_faq_top1(query: str, score_threshold: float = 0.75, keyword_boost: float = 0.3):
    """
    Retrieve top 1 FAQ using hybrid approach: semantic + keyword matching
    
    Args:
        query: User's question
        score_threshold: Minimum combined score to accept a match
        keyword_boost: Weight for keyword matching (0.0 - 1.0)
        
    Returns:
        List containing the best matching Document, or empty list if no match
    """
    print(f"\n{'='*80}")
    print(f"🔍 FAQ RETRIEVAL (HYBRID: Semantic + Keyword)")
    print(f"{'='*80}")
    print(f"Query: {query}")
    print(f"Threshold: {score_threshold} | Keyword Boost: {keyword_boost}")
    print(f"{'-'*80}")

    # Get query embedding for semantic search
    query_vector = embeddings.embed_query(query)

    # Search with more candidates for re-ranking
    results = client.query_points(
        collection_name=collection_name,
        query=query_vector,
        limit=5  # Get more candidates to re-rank
    )

    if not results or not results.points:
        print("  ❌ No results found")
        print(f"{'='*80}\n")
        return []

    # Tokenize query for keyword matching
    query_tokens = _tokenize_vietnamese(query)
    print(f"  🔤 Query tokens: {query_tokens}")
    print(f"{'-'*80}")

    # Calculate hybrid scores for all candidates
    scored_results = []
    for point in results.points:
        semantic_score = point.score
        question = point.payload['Câu_hỏi']
        question_tokens = _tokenize_vietnamese(question)
        
        # Calculate keyword overlap (Jaccard-like similarity)
        if query_tokens:
            overlap_count = len(query_tokens & question_tokens)
            keyword_score = overlap_count / len(query_tokens)
        else:
            keyword_score = 0.0
        
        # Combined score: semantic + keyword boost
        final_score = semantic_score + (keyword_boost * keyword_score)
        
        scored_results.append({
            'point': point,
            'semantic_score': semantic_score,
            'keyword_score': keyword_score,
            'keyword_matches': query_tokens & question_tokens,
            'final_score': final_score
        })

    # Re-rank by final combined score
    scored_results.sort(key=lambda x: x['final_score'], reverse=True)

    # Display top matches with detailed scoring
    print(f"  📊 Top matches (re-ranked by hybrid score):")
    for i, r in enumerate(scored_results[:5], 1):
        status = "✅ PASS" if r['final_score'] >= score_threshold else "❌ FAIL"
        print(f"     {i}. {status}")
        print(f"        Semantic: {r['semantic_score']:.4f} | Keyword: {r['keyword_score']:.4f} | Final: {r['final_score']:.4f}")
        print(f"        Matched words: {r['keyword_matches'] if r['keyword_matches'] else 'None'}")
        print(f"        Q: {r['point'].payload['Câu_hỏi'][:70]}...")
        print()

    print(f"{'-'*80}")

    # Get best match after re-ranking
    best = scored_results[0]
    best_point = best['point']
    best_score = best['final_score']

    if best_score >= score_threshold:
        doc = Document(
            page_content=best_point.payload["Trả_lời"],
            metadata={
                "Câu_hỏi": best_point.payload["Câu_hỏi"],
                "score": best_score,
                "semantic_score": best['semantic_score'],
                "keyword_score": best['keyword_score']
            }
        )
        print(f"  ✅ Returning match (final_score: {best_score:.4f} >= {score_threshold})")
        print(f"     Semantic: {best['semantic_score']:.4f} + Keyword boost: {keyword_boost * best['keyword_score']:.4f}")
        print(f"{'='*80}\n")
        return [doc]
    else:
        print(f"  ⚠️  Best score {best_score:.4f} < threshold {score_threshold}")
        print(f"  💡 Suggestions:")
        print(f"     - Try threshold={best_score:.2f} or lower")
        print(f"     - Increase keyword_boost if query has specific terms")
        print(f"{'='*80}\n")
        return []


def _tokenize_vietnamese(text: str) -> set:
    """
    Tokenize Vietnamese text for keyword matching
    
    Args:
        text: Input text
        
    Returns:
        Set of lowercase tokens (words)
    """
    # Convert to lowercase
    text = text.lower()
    
    # Remove punctuation but keep Vietnamese characters
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # Split into words
    words = text.split()
    
    # Remove common stopwords (expand this list as needed)
    stopwords = {
        'là', 'và', 'của', 'có', 'được', 'trong', 'cho', 'với', 'các',
        'này', 'đó', 'những', 'để', 'khi', 'từ', 'theo', 'về', 'như',
        'thì', 'mà', 'nhưng', 'hoặc', 'nếu', 'vì', 'do', 'bởi', 'tại',
        'đã', 'đang', 'sẽ', 'còn', 'cũng', 'rất', 'lại', 'nên', 'phải',
        'bạn', 'tôi', 'chúng', 'họ', 'nó', 'gì', 'nào', 'sao', 'bao'}
    
    # Filter out stopwords and very short words
    tokens = {w for w in words if w not in stopwords and len(w) > 1}
    
    return tokens

# ========== INITIALIZE LLM ==========

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

# ========== INITIALIZE LLM FOR ANSWER GENERATION ==========

llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)

print("✅ LLM initialized for answer generation")

# ========== OLD FAQ PIPELINE REMOVED ==========
# Old synchronous FAQ pipeline removed (replaced by optimized_chatbot_pipeline)



llm_rewrite_legal = ChatOpenAI(model="gpt-4o-mini", temperature=0)

rewrite_prompt_legal_improved = ChatPromptTemplate.from_messages([
    ("system", """Bạn là chuyên gia viết lại câu hỏi pháp luật.

**NHIỆM VỤ:**
1. Nếu câu hỏi có ĐẠI TỪ tham chiếu (đó, này, nó) → Thay thế bằng thông tin cụ thể từ lịch sử
2. Nếu câu hỏi ĐÃ RÕ RÀNG (không có đại từ mơ hồ) → GIỮ NGUYÊN
3. Nếu câu hỏi KHÔNG liên quan đến pháp luật → GIỮ NGUYÊN

**CÁC DẠNG THAM CHIẾU CẦN XỬ LÝ:**
- "nó", "đó", "này", "điều đó", "luật đó", "ở trên", "vừa rồi", "điều vừa đề cập" → Thay bằng Điều/Luật/Chương cụ thể
- "các điều ở trên", "những điều đã nói", "các luật ở trên" → Liệt kê các Điều cụ thể từ lịch sử
- "từ các điều trên", "dựa vào các điều đã nói" → Xác định các Điều từ lịch sử

**⚠️ CỰC KỲ QUAN TRỌNG:**
- CHỈ thay thế đại từ, KHÔNG thay đổi số điều cụ thể
- Nếu câu hỏi đã có SỐ ĐIỀU CỤ THỂ (ví dụ: "điều 2", "Điều 77") → GIỮ NGUYÊN HOÀN TOÀN
- TUYỆT ĐỐI KHÔNG thay đổi số điều trong câu hỏi gốc
- KHÔNG thêm từ khóa từ lịch sử vào câu hỏi đã rõ ràng

**QUY TẮC QUAN TRỌNG:**
✅ CHỈ thay thế khi có đại từ mơ hồ
✅ KHÔNG thêm ngữ cảnh vào câu hỏi đã rõ ràng
✅ KHÔNG thêm "theo Điều X" vào câu hỏi mới về chủ đề khác
✅ ĐỌC KỸ lịch sử để tìm Điều/Chương/Luật được nhắc đến
✅ CHỈ trả về câu hỏi ngắn gọn (10-20 từ)
✅ LUÔN giữ dạng câu hỏi với dấu "?"

❌ TUYỆT ĐỐI KHÔNG trả lời câu hỏi
❌ TUYỆT ĐỐI KHÔNG giải thích nội dung luật
❌ TUYỆT ĐỐI KHÔNG thêm ngữ cảnh khi câu hỏi đã rõ ràng

**PHÂN BIỆT CÂU HỎI MỚI vs CÂU HỎI TIẾP THEO:**

Câu hỏi MỚI (chủ đề khác) → GIỮ NGUYÊN:
- "Ai chịu trách nhiệm tái chế?" (đã rõ ràng, không cần thêm "theo Điều 7")
- "EPR là gì?" (câu hỏi mới, đầy đủ)
- "Quy định về bao bì?" (câu hỏi mới)

Câu hỏi TIẾP THEO (có đại từ) → THAY THẾ:
- "Điều đó có nói về X không?" → "Điều 7 có nói về X không?"
- "Nó quy định gì?" → "Điều 7 quy định gì?"
- "Cái này liên quan gì?" → "Điều 7 liên quan gì?"
"""),

    # Few-shot examples - Legal questions with pronouns (NEED TRANSFORMATION)
    ("human", """Lịch sử: User: Cho tôi biết về điều 1? Assistant: Theo Điều 1...
User: Cho tôi biết về điều 3? Assistant: Theo Điều 3...

Câu hỏi: Từ các điều ở trên hãy cho tôi biết áp dụng được gì không?"""),
    ("assistant", "Điều 1 và Điều 3 có thể áp dụng được gì"),

    ("human", """Lịch sử: User: Cho tôi hỏi về điều luật số 7? Assistant: Theo Điều 7...

Câu hỏi: Điều luật đó có nói về không khí hay không?"""),
    ("assistant", "Điều 7 có nói về không khí không"),

    # Few-shot examples - Clear legal questions (KEEP ORIGINAL)
    ("human", """Lịch sử: User: Cho tôi hỏi về Điều 7? Assistant: Theo Điều 7... nói về quản lý không khí

Câu hỏi: Ai chịu trách nhiệm tái chế?"""),
    ("assistant", "Ai chịu trách nhiệm tái chế?"),

    ("human", """Lịch sử: User: Điều 77 là gì? Assistant: Điều 77 về tái chế...

Câu hỏi: Quy định về bao bì là gì?"""),
    ("assistant", "Quy định về bao bì là gì?"),

    # IMPORTANT: Questions with specific article numbers - NEVER CHANGE THEM
    ("human", """Lịch sử: User: Cho tôi hỏi về Điều 5? Assistant: Theo Điều 5...
User: Điều 6 quy định gì? Assistant: Theo Điều 6...

Câu hỏi: Cho tôi hỏi chi tiết về điều 2 và điều 3?"""),
    ("assistant", "Cho tôi hỏi chi tiết về điều 2 và điều 3?"),

    ("human", """Lịch sử: User: Điều 10 là gì? Assistant: Điều 10 về...

Câu hỏi: Điều 1 quy định gì?"""),
    ("assistant", "Điều 1 quy định gì?"),

    ("human", """Lịch sử: (trống)

Câu hỏi: Cho tôi hỏi về điều luật số 1?"""),
    ("assistant", "Điều 1 quy định gì"),

    # Few-shot examples - Non-legal questions (KEEP ORIGINAL)
    ("human", """Lịch sử: (trống)

Câu hỏi: Xin chào!"""),
    ("assistant", "Xin chào!"),

    ("human", """Lịch sử: (trống)

Câu hỏi: Cảm ơn bạn"""),
    ("assistant", "Cảm ơn bạn"),

    ("human", """Lịch sử: (trống)

Câu hỏi: Làm thế nào để nấu phở?"""),
    ("assistant", "Làm thế nào để nấu phở?"),

    # Actual query
    ("human", """Lịch sử: {chat_history}

Câu hỏi: {question}

**HƯỚNG DẪN PHÂN TÍCH:**
1. Câu hỏi có SỐ ĐIỀU CỤ THỂ không? (điều 1, Điều 77, điều 2 và điều 3)
   - CÓ SỐ CỤ THỂ → GIỮ NGUYÊN HOÀN TOÀN (đừng thay đổi số điều!)
   - KHÔNG CÓ SỐ → Chuyển sang bước 2

2. Câu hỏi có chứa đại từ mơ hồ không? (đó, này, nó, ở trên, vừa rồi)
   - CÓ → Thay thế bằng thông tin từ lịch sử
   - KHÔNG → Chuyển sang bước 3

3. Câu hỏi đã đầy đủ và rõ ràng chưa?
   - ĐÃ RÕ RÀNG → GIỮ NGUYÊN (không thêm gì)
   - CHƯA RÕ → Làm rõ từ lịch sử

**LƯU Ý:**
- ⚠️ TUYỆT ĐỐI GIỮ NGUYÊN số điều trong câu hỏi gốc (điều 2 phải vẫn là điều 2, KHÔNG thay thành số khác!)
- Nếu có "các điều ở trên", "những điều đã nói" → TÌM TẤT CẢ Điều trong lịch sử và liệt kê
- Nếu có "điều đó", "nó" → TÌM Điều GẦN NHẤT trong lịch sử
- LUÔN LUÔN giữ dạng câu hỏi với dấu "?"
- TUYỆT ĐỐI KHÔNG thêm "theo Điều X" vào câu hỏi đã rõ ràng
- Nếu câu hỏi KHÔNG liên quan pháp luật → GIỮ NGUYÊN

**VÍ DỤ QUAN TRỌNG:**

❌ SAI:
Lịch sử: "User: có điều nào về tái chế?\nAssistant: Điều 3 về tái chế..."
Câu gốc: "nói rõ các điều đó ra"
Chuyển thành: "Nói rõ Điều 3 về tái chế ra?"  ❌ THÊM "về tái chế" không cần thiết!

✅ ĐÚNG:
Lịch sử: "User: có điều nào về tái chế?\nAssistant: Điều 3 về tái chế..."
Câu gốc: "nói rõ các điều đó ra"
Chuyển thành: "Nói rõ Điều 3 ra?"  ✅ CHỈ thay "điều đó" → "Điều 3"

❌ SAI:
Lịch sử: "User: Điều 77 là gì?\nAssistant: Điều 77 về trách nhiệm..."
Câu gốc: "Điều đó có nói về bao bì không?"
Chuyển thành: "Điều 77 có nói về bao bì và trách nhiệm không?"  ❌ THÊM "trách nhiệm"!

✅ ĐÚNG:
Lịch sử: "User: Điều 77 là gì?\nAssistant: Điều 77 về trách nhiệm..."
Câu gốc: "Điều đó có nói về bao bì không?"
Chuyển thành: "Điều 77 có nói về bao bì không?"  ✅ CHỈ thay "đó" → "77"

❌ SAI - THAY ĐỔI SỐ ĐIỀU:
Lịch sử: "User: Điều 5 là gì?\nAssistant: Điều 5...\nUser: Điều 6?\nAssistant: Điều 6..."
Câu gốc: "Cho tôi hỏi chi tiết về điều 2 và điều 3?"
Chuyển thành: "Cho tôi hỏi chi tiết về Điều 6 và Điều 7?"  ❌ SAI! Đã thay đổi số điều!

✅ ĐÚNG - GIỮ NGUYÊN SỐ ĐIỀU:
Lịch sử: "User: Điều 5 là gì?\nAssistant: Điều 5...\nUser: Điều 6?\nAssistant: Điều 6..."
Câu gốc: "Cho tôi hỏi chi tiết về điều 2 và điều 3?"
Chuyển thành: "Cho tôi hỏi chi tiết về điều 2 và điều 3?"  ✅ ĐÚNG! Giữ nguyên số điều gốc!

Câu hỏi viết lại (CHỈ câu hỏi ngắn, hoặc giữ nguyên nếu đã rõ):"""),
])

question_rewriter_legal = rewrite_prompt_legal_improved | llm_rewrite_legal | StrOutputParser()

print("✅ Question rewriter với xử lý reference context và ngăn over-adding")


def transform_query(state):
    print("---CHUYỂN HÓA CÂU HỎI---")

    question = state.get("question", "")
    documents = state.get("documents", [])
    chat_history = state.get("chat_history", "")

    # ✅ Lưu câu hỏi gốc nếu chưa có
    original_question = state.get("original_question", question)

    print(f"  Câu hỏi gốc: {question}")

    better_question = question_rewriter_legal.invoke({
        "question": question,
        "chat_history": chat_history
    })

    print(f"  Câu hỏi đã chuyển hóa: {better_question}")

    retries = state.get("retries", 0) + 1
    return {
        "question": better_question,
        "original_question": original_question,  # ✅ Lưu câu hỏi gốc
        "documents": documents,
        "chat_history": chat_history,
        "generation": state.get("generation", ""),
        "retries": retries,
    }

print("✓ Hàm transform_query sẵn sàng")


from langchain.memory import ConversationBufferMemory

# Create conversation memory
conversation_memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
    input_key="input",
    output_key="generation"
)

def chitchat(state):
    """Trò chuyện thân thiện với trợ lý pháp luật, có truy cập đầy đủ lịch sử"""
    print("---TRÒ CHUYỆN PHÁP LUẬT THÂN THIỆN---")

    question = state["question"]
    chat_history = state.get("chat_history", "")

    # Nếu chat_history quá ngắn, load từ memory
    if not chat_history or len(chat_history) < 200:
        try:
            memory_vars = conversation_memory.load_memory_variables({})
            if "chat_history" in memory_vars:
                messages = memory_vars["chat_history"]
                if messages:
                    formatted = []
                    for msg in messages:
                        if hasattr(msg, 'type'):
                            role = "Người dùng" if msg.type == "human" else "Trợ lý pháp luật EPR"
                            content = msg.content
                        else:
                            role = "Người dùng"
                            content = str(msg)
                        formatted.append(f"{role}: {content}")
                    chat_history = "\n".join(formatted)
        except Exception as e:
            print(f"  ⚠️ Không thể load full history: {e}")

    print(f"  Độ dài lịch sử: {len(chat_history)} ký tự")

    llm_chat = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.7)

    chitchat_prompt = ChatPromptTemplate.from_messages([
        ("system", """Bạn là **trợ lý pháp lý thông minh** hỗ trợ người dùng tra cứu và giải thích văn bản pháp luật Việt Nam.

**QUY TẮC QUAN TRỌNG VỀ BỘ NHỚ:**
1. **LUÔN ĐỌC KỸ lịch sử hội thoại** trước khi trả lời
2. **SỬ DỤNG thông tin** mà người dùng đã cung cấp trong lịch sử (tên, công ty, hoàn cảnh, etc.)
3. **GHI NHỚ context** từ các câu hỏi và trả lời trước đó
4. Nếu người dùng hỏi về thông tin họ đã cung cấp → **TRẢ LỜI dựa trên lịch sử**, KHÔNG nói "không biết"

**VÍ DỤ:**
- Nếu lịch sử có: "User: Tôi tên là Danh Thuận"
  → Khi user hỏi "Tên tôi là gì?" → Trả lời: "Tên của bạn là Danh Thuận"

- Nếu lịch sử có: "User: Tôi làm việc tại công ty ABC"
  → Khi user hỏi "Tôi làm ở đâu?" → Trả lời: "Bạn làm việc tại công ty ABC"

**HƯỚNG DẪN TRẢ LỜI:**
- Giải thích luật một cách rõ ràng, trung lập, dễ hiểu
- Nếu câu trả lời dựa trên văn bản pháp luật → nêu rõ tên văn bản và Điều/Mục/Chương
- Nếu thông tin từ web → nói rõ là tham khảo
- Giữ giọng điệu thân thiện, chuyên nghiệp
- **Nếu câu hỏi không rõ ràng hoặc vô nghĩa** (VD: chuỗi ký tự ngẫu nhiên), hãy lịch sự yêu cầu người dùng làm rõ câu hỏi của họ

📋 Lịch sử hội thoại (ĐỌC KỸ):
{chat_history}"""),
        ("human", "{question}"),
    ])

    chitchat_chain = chitchat_prompt | llm_chat | StrOutputParser()

    generation = chitchat_chain.invoke({
        "question": question,
        "chat_history": chat_history if chat_history else "(không có hội thoại trước)"
    })

    state["generation"] = generation
    state["history"] = chat_history

    return {
        "question": question,
        "documents": [],
        "chat_history": chat_history,
        "generation": generation,
        "retries": state.get("retries", 0)
    }

print("✓ Hàm chitchat với memory emphasis")

from typing import Literal
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
class FaqRouteQuery(BaseModel):
    """Phân loại câu hỏi người dùng tới FAQ, web search hoặc chitchat"""
    datasource: Literal["vectorstore_faq", "chitchat"] = Field(
        ...,
        description=(
            "vectorstore_faq (FAQ), "
            "chitchat (giao tiếp thân thiện)"
        )
    )

# ========== KHỞI TẠO LLM ROUTER ==========
llm_router_faq = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
structured_llm_router_faq = llm_router_faq.with_structured_output(FaqRouteQuery)

# ========== SYSTEM PROMPT ==========
router_system_faq = """Bạn là chuyên gia phân loại câu hỏi người dùng tới nguồn dữ liệu phù hợp.

Bạn có quyền truy cập các nguồn:
1. **vectorstore_faq** - FAQ pháp luật đã được biên soạn
2. **chitchat** - Giao tiếp thân thiện, hỏi thăm, cảm ơn, chào hỏi

Quy tắc ưu tiên:
- Nếu câu hỏi mang tính chào hỏi,trò chuyện, cảm ơn, giới thiệu bản thân → **chitchat**
- Nếu câu hỏi là chuỗi ký tự vô nghĩa, ngẫu nhiên, hoặc không có ý nghĩa rõ ràng (VD: "E, P, A, L, A, Z", "asdfgh", "123 abc xyz") → **chitchat**
- Nếu câu hỏi quá ngắn hoặc không rõ ràng và không liên quan đến pháp luật → **chitchat**
- CHỈ nếu câu hỏi có ý nghĩa rõ ràng và liên quan đến nội dung pháp luật EPR → **vectorstore_faq**

Câu hỏi hiện tại: {question}"""

# ========== TẠO PROMPT ==========
route_prompt_faq = ChatPromptTemplate.from_messages([
    ("system", router_system_faq),
    ("human", "{question}")
])

# ========== COMBINE PROMPT VỚI STRUCTURED LLM ==========
question_router_faq = route_prompt_faq | structured_llm_router_faq

print("✓ FAQ question router created successfully!")

def route_question_faq(state):
    """Route câu hỏi ban đầu và lưu snapshot của chat_history"""
    print("---PHÂN LUỒNG CÂU HỎI (VỚI NGỮ CẢNH)---")

    question = state["question"]
    chat_history = get_full_chat_history()  # Load from memory

    # ✅ Lưu câu hỏi gốc
    if "original_question" not in state or not state.get("original_question"):
        print(f"  💾 Lưu câu hỏi gốc: {question}")
        state["original_question"] = question

    # ✅ Lưu snapshot của chat_history TRƯỚC KHI vào FAQ path
    if "original_chat_history" not in state or not state.get("original_chat_history"):
        print(f"  💾 Lưu snapshot chat_history ({len(chat_history)} ký tự)")
        state["original_chat_history"] = chat_history

    print(f"Lịch sử hội thoại:\n{chat_history}\n")
    print(f"Câu hỏi hiện tại: {question}")

    # Gọi LLM router
    source = question_router_faq.invoke({
        "question": question,
        "chat_history": chat_history
    })

    datasource = source.get("datasource") if isinstance(source, dict) else getattr(source, "datasource", None)

    print(f"---PHÂN LUỒNG TỚI: {datasource.upper() if datasource else 'UNKNOWN'}---")

    if datasource == 'vectorstore_faq':
        return "vectorstore_faq"
    elif datasource == 'chitchat':
        return "chitchat"


print("✅ route_question_faq với chat_history snapshot")


from typing import List, TypedDict
from langgraph.graph import StateGraph, END


print("✓ State defined")

# ========== NODE FUNCTIONS ==========

def retrieve_faq_node(state):
    """Retrieve FAQ documents"""
    print("\n" + "="*80)
    print("📚 RETRIEVE FAQ")
    print("="*80)

    question = state["question"]
    print(f"  Question: {question}")

    # Use your existing retrieve_faq_top1 function
    documents = retrieve_faq_top1(question, score_threshold=0.75)

    print(f"  Documents found: {len(documents)}")
    print("="*80 + "\n")

    state["documents"] = documents
    return state




def generate_faq_node(state):
    """Generate answer from FAQ documents"""
    print("\n" + "="*80)
    print("💬 GENERATE FAQ ANSWER")
    print("="*80)

    question = state["question"]
    documents = state["documents"]

    if not documents:
        print("  ⚠️  No documents")
        state["generation"] = "Không tìm thấy thông tin trong FAQ."
        return state

    doc = documents[0]
    faq_question = doc.metadata.get("Câu_hỏi", "")
    faq_answer = doc.page_content

    print(f"  FAQ: {faq_question[:60]}...")

    prompt = ChatPromptTemplate.from_messages([
        ("system", """Bạn là trợ lý AI chuyên về luật EPR.
Dựa vào FAQ để trả lời câu hỏi."""),
        ("human", """FAQ: {faq_question}
Trả lời: {faq_answer}

Câu hỏi: {user_question}

Trả lời:""")
    ])

    chain = prompt | llm | StrOutputParser()

    generation = chain.invoke({
        "faq_question": faq_question,
        "faq_answer": faq_answer,
        "user_question": question
    })

    print(f"  Answer: {generation[:80]}...")
    print("="*80 + "\n")

    state["generation"] = generation
    return state


def new_round_router(state):
    """
    Reset state and restore chat_history from snapshot
    """
    print("\n" + "="*80)
    print("🔁 NEW ROUND: RESETTING STATE")
    print("="*80)

    # ✅ Restore chat_history from snapshot
    original_chat_history = state.get("original_chat_history", "")
    current_chat_history = state.get("chat_history", "")

    # Prefer original snapshot
    chat_history_to_use = original_chat_history if original_chat_history else current_chat_history

    # Restore original question
    original_question = state.get("original_question", state.get("question", ""))

    print(f"  📌 Restoring original question: {original_question}")

    if original_chat_history:
        print(f"  💬 Restoring chat history from snapshot ({len(original_chat_history)} chars)")
        print(f"     (Ignoring modified chat history from FAQ path)")
    elif current_chat_history:
        print(f"  💬 Using current chat history ({len(current_chat_history)} chars)")
    else:
        print(f"  ⚠️  No chat history")

    print("="*80 + "\n")

    return {
        **state,
        "question": original_question,
        "original_question": original_question,
        "chat_history": chat_history_to_use,  # ✅ Use clean snapshot
        "original_chat_history": original_chat_history,  # ✅ Keep snapshot
        "retries": 0,
        "generation_retries": 0,
        "documents": [],
        "generation": "",
    }

print("✅ new_round_router ready")



# ========== DECISION FUNCTIONS ==========

def decide_after_retrieve_faq(state):
    """
    Decision function after retrieve_faq_node

    Check if documents were retrieved:
    - If yes (has docs) → go to "generate_faq"
    - If no (no docs) → go to "new_round_router"

    Returns:
        str: "generate_faq" or "new_round_router"
    """
    documents = state.get("documents", [])

    print(f"\n🔀 DECISION AFTER RETRIEVE FAQ")
    print(f"   Documents: {len(documents)}")

    if documents:
        print(f"   ➡️  HAS DOCS → generate_faq")
        return "generate_faq"
    else:
        print(f"   ➡️  NO DOCS → new_round_router")
        return "new_round_router"






# ========== LEGAL DATA - Using Qdrant Cloud ==========
# Legal documents are now stored in Qdrant Cloud (law_collection)
# No local hardcoded data needed


# ========== LEGAL DATA VECTORSTORE - Using Qdrant Cloud ==========

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_qdrant import QdrantVectorStore

# Initialize LLMs
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
llm_creative = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.7)

# Initialize embeddings
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Connect to Qdrant Cloud for law collection
print("📡 Using Qdrant Cloud for law collection...")
vectorstore_fix = QdrantVectorStore.from_existing_collection(
    embedding=embeddings,
    collection_name="law_collection",
    url=QDRANT_CLOUD_URL,
    api_key=QDRANT_API_KEY,
)
print("✅ Connected to law_collection on Qdrant Cloud")

from langchain.chains.query_constructor.ir import Comparator, Operator
from langchain.retrievers.self_query.qdrant import QdrantTranslator

# --- Mô tả tổng quát về cấu trúc ---
mo_ta_van_ban = """Văn bản pháp luật Việt Nam có cấu trúc phân cấp:
- ĐIỀU (Dieu): Quy định chi tiết (ví dụ: "Điều 9. Phạm vi điều chỉnh")
- CHƯƠNG (Chuong): Phạm vi rộng nhất - LUÔN dùng SỐ LA MÃ (ví dụ: "Chương I", "Chương II", "Chương III", "Chương IV"...)
- MỤC (Muc): Chủ đề cụ thể - dùng số Ả Rập (ví dụ: "Mục 1", "Mục 2", "Mục 3"...)

⚠️ QUAN TRỌNG - Định dạng Chương:
- Chương LUÔN dùng SỐ LA MÃ: I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII, XIII
- VÍ DỤ CHUYỂN ĐỔI:
  * "chương 1" hoặc "Chương 1" → "Chương I"
  * "chương 2" hoặc "Chương 2" → "Chương II"
  * "chương 3" hoặc "Chương 3" → "Chương III"
  * "chương 10" hoặc "Chương 10" → "Chương X"
- Viết hoa chữ 'C': "Chương" (KHÔNG phải "chương")

⚠️ JSON OUTPUT FORMAT:
- MUST use actual Vietnamese characters in the JSON output, NOT Unicode escape sequences
- DO NOT use \\uXXXX escapes - use the actual characters directly (ụ, ơ, ư, etc.)

Khi tìm kiếm:
- SỐ ĐIỀU (ví dụ: "Điều 9") → dùng Dieu_Number với eq: eq("Dieu_Number", 9)
- CHƯƠNG (ví dụ: "chương 2", "Chương II") → chuyển sang SỐ LA MÃ VÀ viết hoa, dùng LIKE: like("Chuong", "Chương II")
- MỤC (ví dụ: "mục 2", "Mục 2") → viết hoa chữ 'M', dùng LIKE: like("Muc", "Mục 2")
- Kết hợp MỤC và CHƯƠNG → dùng AND: and(like("Muc", "Mục 2"), like("Chuong", "Chương II"))
"""

metadata_fields = [
    AttributeInfo(
        name="Dieu_Number",
        description="Số điều (integer, ví dụ: 9 cho Điều 9)",
        type="integer",
    ),
    AttributeInfo(
        name="Dieu",
        description="Tên đầy đủ của điều (ví dụ: 'Điều 9. Phạm vi điều chỉnh')",
        type="string",
    ),
    AttributeInfo(
        name="Chuong",
        description="Tên chương (ví dụ: 'Chương I. NHỮNG QUY ĐỊNH CHUNG')",
        type="string",
    ),
    AttributeInfo(
        name="Muc",
        description="Tên mục (ví dụ: 'Mục 1 BẢO VỆ MÔI TRƯỜNG NƯỚC')",
        type="string",
    ),
]

# --- Khởi tạo LLM ---
# Using gpt-4o-mini for better Unicode handling and structured output
llm_query = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# --- Tạo prompt constructor với allowed_operators ---
prompt_truy_van_phap_luat = get_query_constructor_prompt(
    mo_ta_van_ban,
    metadata_fields,
    allowed_comparators=[
        Comparator.EQ,
        Comparator.LT,
        Comparator.LTE,
        Comparator.GT,
        Comparator.GTE,
        Comparator.LIKE,
    ],
    allowed_operators=[Operator.AND, Operator.OR],  # Enable AND and OR
    examples=[
        # Tìm theo số điều
        ("Điều 6 quy định gì?", {"query": "nội dung điều 6", "filter": 'eq("Dieu_Number", 6)'}),
        ("Cho tôi hỏi về Điều 9?", {"query": "về điều 9", "filter": 'eq("Dieu_Number", 9)'}),

        # Tìm theo chương (chuyển đổi sang số La Mã)
        ("Chương 1 quy định gì?", {"query": "chương 1", "filter": 'like("Chuong", "Chương I")'}),
        ("Chương 2 quy định gì?", {"query": "chương 2", "filter": 'like("Chuong", "Chương II")'}),
        ("chương II quy định gì?", {"query": "chương II", "filter": 'like("Chuong", "Chương II")'}),
        ("Chương III về gì?", {"query": "chương III", "filter": 'like("Chuong", "Chương III")'}),

        # Tìm theo mục (viết hoa chữ M)
        ("mục 1 về gì?", {"query": "mục 1", "filter": 'like("Muc", "Mục 1")'}),
        ("Mục 2 về gì?", {"query": "mục 2", "filter": 'like("Muc", "Mục 2")'}),

        # Kết hợp mục và chương (chuyển đổi số sang La Mã, viết hoa)
        ("Mục 2 của chương 2 quy định gì?", {"query": "mục 2 chương 2", "filter": 'and(like("Muc", "Mục 2"), like("Chuong", "Chương II"))'}),
        ("Cho tôi hỏi về Mục 1 của chương 1?", {"query": "mục 1 chương 1", "filter": 'and(like("Muc", "Mục 1"), like("Chuong", "Chương I"))'}),
        ("Mục 3 Chương IV quy định gì?", {"query": "mục 3 chương IV", "filter": 'and(like("Muc", "Mục 3"), like("Chuong", "Chương IV"))'}),

        # Tìm theo nội dung
        ("Quy định về môi trường không khí", {"query": "môi trường không khí", "filter": 'like("Dieu", "môi trường không khí")'}),
        ("Chương nào về bảo vệ môi trường", {"query": "bảo vệ môi trường", "filter": 'like("Chuong", "bảo vệ môi trường")'}),

        # Nhiều điều
        ("Điều 5 hoặc Điều 6", {"query": "điều 5 điều 6", "filter": 'or(eq("Dieu_Number", 5), eq("Dieu_Number", 6))'}),

        # Không có filter cụ thể
        ("Trách nhiệm của tổ chức sản xuất", {"query": "trách nhiệm tổ chức sản xuất", "filter": None}),
    ],
)

# --- Khởi tạo parser ---
parser_phap_luat = StructuredQueryOutputParser.from_components(
    allowed_comparators=[
        Comparator.EQ,
        Comparator.LT,
        Comparator.LTE,
        Comparator.GT,
        Comparator.GTE,
        Comparator.LIKE,
    ],
    allowed_operators=[Operator.AND, Operator.OR],  # Enable AND and OR
)

# --- Custom function to fix Unicode escapes ---
def fix_unicode_in_query_output(llm_output: str):
    """Fix Unicode escape sequences in LLM output before parsing"""
    import re
    import json

    # Only fix Unicode escapes within JSON structures
    try:
        # Find JSON object in text (handles multiline)
        json_match = re.search(r'```json\s*(\{.*?\})\s*```', llm_output, re.DOTALL)
        if not json_match:
            # Try without code fence
            json_match = re.search(r'(\{.*?\})', llm_output, re.DOTALL)

        if json_match:
            json_text = json_match.group(1)

            # Replace Unicode escapes manually character by character
            def replace_unicode_escape(match):
                try:
                    code = match.group(1)
                    return chr(int(code, 16))
                except:
                    return match.group(0)

            # Pattern to match \uXXXX (4 hex digits)
            fixed_json = re.sub(r'\\u([0-9a-fA-F]{4})', replace_unicode_escape, json_text)

            # Verify it's valid JSON now
            try:
                json.loads(fixed_json)
                # Replace the JSON in the original text
                return llm_output.replace(json_text, fixed_json)
            except:
                return llm_output
        else:
            return llm_output

    except Exception as e:
        print(f"  ⚠️ Unicode fix error: {e}, using original text")
        return llm_output

# Create a simple wrapper using RunnableLambda
from langchain_core.runnables import RunnableLambda

# Wrap the fix function as a Runnable
unicode_fixer = RunnableLambda(fix_unicode_in_query_output)

# --- Kết hợp prompt và LLM ---
# Chain: prompt -> llm -> unicode_fixer -> parser
llm_constructor_phap_luat = prompt_truy_van_phap_luat | llm_query | unicode_fixer | parser_phap_luat

# --- Tạo SelfQueryRetriever ---
retriever_phap_luat = SelfQueryRetriever(
    query_constructor=llm_constructor_phap_luat,
    vectorstore=vectorstore_fix,
    structured_query_translator=QdrantTranslator(metadata_key="metadata"),
    verbose=True,
    search_kwargs={"k": 5}
)

print("✅ SelfQueryRetriever đã được tạo thành công!")

from langchain.retrievers.self_query.qdrant import QdrantTranslator
from qdrant_client.models import Filter

class FallbackLegalRetriever:
    """
    Retriever with fallback: if filtered search returns nothing, try without filter
    """

    def __init__(self, vectorstore, query_constructor, k=5):
        self.vectorstore = vectorstore
        self.query_constructor = query_constructor
        self.k = k
        # ✅ Create translator to convert LangChain filters to Qdrant format
        self.translator = QdrantTranslator(metadata_key="metadata")

    def invoke(self, query: str):
        """Get documents with fallback strategy"""
        print(f"\n{'='*80}")
        print(f"🔍 FALLBACK RETRIEVER")
        print(f"{'='*80}")
        print(f"Query: {query}")

        # Step 1: Construct structured query
        structured_query = self.query_constructor.invoke({"query": query})

        print(f"Structured query:")
        print(f"  Query: {structured_query.query}")
        print(f"  Filter: {structured_query.filter}")

        # Step 2: Try with filter first
        if structured_query.filter:
            print(f"\n🔍 Searching WITH filter...")

            # ✅ Translate LangChain filter to Qdrant filter
            try:
                result = self.translator.visit_structured_query(structured_query)

                # Extract filter from the result (it returns a tuple/dict)
                if isinstance(result, tuple):
                    # Result is (query, filter_dict)
                    _, filter_dict = result
                    qdrant_filter = filter_dict.get('filter') if isinstance(filter_dict, dict) else filter_dict
                elif isinstance(result, dict):
                    # Result is {'filter': Filter(...)}
                    qdrant_filter = result.get('filter', result)
                else:
                    # Result is directly the filter
                    qdrant_filter = result

                print(f"   Using Qdrant filter: {qdrant_filter}")

                docs = self.vectorstore.similarity_search(
                    structured_query.query,
                    k=self.k,
                    filter=qdrant_filter  # ✅ Use translated filter
                )

                if docs:
                    print(f"✅ Found {len(docs)} documents with filter")
                    print(f"{'='*80}\n")
                    return docs
                else:
                    print(f"⚠️  No results with filter, trying without filter...")
            except Exception as e:
                print(f"⚠️  Error with filter: {e}")
                print(f"   Trying without filter...")

        # Step 3: Fallback to search without filter
        print(f"\n🔍 Searching WITHOUT filter...")
        docs = self.vectorstore.similarity_search(
            structured_query.query,
            k=self.k
        )

        print(f"✅ Found {len(docs)} documents without filter")
        print(f"{'='*80}\n")

        return docs


# ✅ Create fallback retriever
fallback_retriever = FallbackLegalRetriever(
    vectorstore=vectorstore_fix,
    query_constructor=llm_constructor_phap_luat,
    k=5
)

print("✅ Fallback retriever created!")

# ========== COUNTING LOGIC FOR "HOW MANY" QUESTIONS ==========

def is_counting_question(query: str) -> bool:
    """
    Detect if a query is asking about quantity/count
    Returns True if the query contains counting keywords
    """
    counting_keywords = [
        "bao nhiêu",
        "bao nhiều",
        "có mấy",
        "tổng số",
        "tổng cộng",
        "số lượng",
        "đếm",
        "mấy điều",
        "how many"
    ]

    query_lower = query.lower()
    return any(keyword in query_lower for keyword in counting_keywords)


def count_articles_with_filter(structured_query, translator, vectorstore) -> dict:
    """
    Count unique articles (Dieu_Number) matching the structured query filter

    Args:
        structured_query: The structured query object with filter
        translator: QdrantTranslator instance
        vectorstore: Qdrant vectorstore instance

    Returns:
        dict with 'count', 'articles' (list of Dieu_Numbers), and 'filter_description'
    """
    print(f"\n{'='*80}")
    print(f"🔢 COUNTING ARTICLES WITH FILTER")
    print(f"{'='*80}")

    # Translate filter to Qdrant format
    if not structured_query.filter:
        print("⚠️  No filter found, cannot count")
        return {"count": None, "articles": [], "filter_description": "không có bộ lọc"}

    try:
        result = translator.visit_structured_query(structured_query)

        # Extract filter
        if isinstance(result, tuple):
            _, filter_dict = result
            qdrant_filter = filter_dict.get('filter') if isinstance(filter_dict, dict) else filter_dict
        elif isinstance(result, dict):
            qdrant_filter = result.get('filter', result)
        else:
            qdrant_filter = result

        print(f"   Using Qdrant filter: {qdrant_filter}")

        # Use scroll to get ALL matching documents (not limited by k)
        from qdrant_client.models import ScrollResult

        # Get the Qdrant client from vectorstore
        client = vectorstore.client
        collection_name = vectorstore.collection_name

        # Scroll through all matching documents
        all_points = []
        scroll_result = client.scroll(
            collection_name=collection_name,
            scroll_filter=qdrant_filter,
            limit=100,  # Get 100 at a time
            with_payload=True,
            with_vectors=False
        )

        all_points.extend(scroll_result[0])

        # Continue scrolling if there's more
        next_page_offset = scroll_result[1]
        while next_page_offset:
            scroll_result = client.scroll(
                collection_name=collection_name,
                scroll_filter=qdrant_filter,
                limit=100,
                offset=next_page_offset,
                with_payload=True,
                with_vectors=False
            )
            all_points.extend(scroll_result[0])
            next_page_offset = scroll_result[1]

        print(f"   📊 Found {len(all_points)} total documents matching filter")

        # Extract unique Dieu_Number values
        dieu_numbers = set()
        for point in all_points:
            dieu_num = point.payload.get('metadata', {}).get('Dieu_Number')
            if dieu_num is not None:
                dieu_numbers.add(dieu_num)

        sorted_articles = sorted(list(dieu_numbers))

        print(f"   📌 Unique articles (Dieu_Number): {sorted_articles}")
        print(f"   ✅ Total count: {len(sorted_articles)} điều luật")
        print(f"{'='*80}\n")

        # Create filter description for natural language response
        filter_desc = structured_query.query

        return {
            "count": len(sorted_articles),
            "articles": sorted_articles,
            "filter_description": filter_desc,
            "raw_filter": str(structured_query.filter)
        }

    except Exception as e:
        print(f"❌ Error counting articles: {e}")
        import traceback
        traceback.print_exc()
        return {"count": None, "articles": [], "filter_description": "lỗi khi đếm"}


def generate_counting_answer(count_result: dict, original_query: str) -> str:
    """
    Generate a natural language answer for counting questions
    """
    count = count_result.get("count")
    articles = count_result.get("articles", [])
    filter_desc = count_result.get("filter_description", "")

    if count is None:
        return "Xin lỗi, tôi không thể đếm số lượng điều luật dựa trên câu hỏi của bạn."

    if count == 0:
        return f"Không có điều luật nào trong phạm vi bạn yêu cầu ({filter_desc})."

    # Create answer
    answer = f"Có **{count} điều luật** trong phạm vi bạn yêu cầu"

    # Add filter context if available
    if "mục" in original_query.lower() or "chương" in original_query.lower():
        answer += f" ({filter_desc})"

    answer += "."

    # List the articles if count is reasonable (< 20)
    if count > 0 and count <= 20:
        articles_str = ", ".join([f"Điều {a}" for a in articles])
        answer += f"\n\nCụ thể: {articles_str}."
    elif count > 20:
        # Show first 10 and last 5
        first_10 = ", ".join([f"Điều {a}" for a in articles[:10]])
        last_5 = ", ".join([f"Điều {a}" for a in articles[-5:]])
        answer += f"\n\nCụ thể: {first_10}, ... , {last_5}."

    return answer


from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

# Data model
class GradeDocuments(BaseModel):
    """Đánh giá nhị phân về mức độ liên quan của tài liệu đã truy xuất."""

    binary_score: str = Field(
        description="Tài liệu có liên quan đến câu hỏi hay không, 'có' hoặc 'không'"
    )

# LLM with function call
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
structured_llm_grader = llm.with_structured_output(GradeDocuments)

# Enhanced Prompt
system = """Bạn là bộ đánh giá mức độ liên quan của tài liệu được truy xuất đối với câu hỏi người dùng.

🎯 MỤC TIÊU:
Xác định xem tài liệu có thể GIÚP TRẢ LỜI câu hỏi hay không (kể cả khi câu trả lời là "KHÔNG").

📋 QUY TẮC ĐÁNH GIÁ:

✅ ĐÁNH GIÁ "CÓ" (tài liệu LIÊN QUAN) KHI:

1. **Câu hỏi về Điều/Chương/Mục cụ thể**
   - Câu hỏi: "Điều 7 có nói về X không?"
   - Tài liệu: Chứa thông tin về Điều 7
   - → "CÓ" (dù tài liệu không nhắc đến X, vì có thể trả lời "KHÔNG")

2. **Câu hỏi về chủ đề**
   - Câu hỏi: "Quy định về tái chế là gì?"
   - Tài liệu: Chứa thông tin về tái chế
   - → "CÓ"

3. **Từ khóa hoặc ngữ nghĩa liên quan**
   - Câu hỏi: "Trách nhiệm của nhà sản xuất?"
   - Tài liệu: Nói về trách nhiệm sản xuất, EPR
   - → "CÓ"

❌ ĐÁNH GIÁ "KHÔNG" (tài liệu KHÔNG LIÊN QUAN) CHỈ KHI:

1. **Sai hoàn toàn Điều/Chương/Mục**
   - Câu hỏi: "Điều 7 nói gì?"
   - Tài liệu: Chỉ về Điều 99
   - → "KHÔNG"

2. **Chủ đề hoàn toàn khác**
   - Câu hỏi: "Quy định về tái chế?"
   - Tài liệu: Chỉ về xây dựng, y tế, không liên quan môi trường
   - → "KHÔNG"

🔍 TRƯỜNG HỢP ĐẶC BIỆT:

**Câu hỏi dạng "Điều X có nói về Y không?"**
- Nếu tài liệu CÓ Điều X → "CÓ" (vì có thể trả lời "có" hoặc "không")
- Nếu tài liệu KHÔNG CÓ Điều X → "KHÔNG"

VÍ DỤ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Câu hỏi: "Điều 7 có nói về lốp xe không?"
Tài liệu: [Metadata: Điều 7, Nội dung: Quy định về chất lượng không khí...]
→ "CÓ" ✅ (Vì có Điều 7, có thể trả lời "KHÔNG, Điều 7 không nói về lốp xe")

Câu hỏi: "Điều 7 có nói về lốp xe không?"
Tài liệu: [Metadata: Điều 99, Nội dung: Quy định về...]
→ "KHÔNG" ❌ (Vì tài liệu không phải Điều 7)

Câu hỏi: "Quy định về tái chế?"
Tài liệu: [Nội dung: Trách nhiệm tái chế sản phẩm...]
→ "CÓ" ✅

Câu hỏi: "Quy định về tái chế?"
Tài liệu: [Nội dung: Quy định về xây dựng nhà ở...]
→ "KHÔNG" ❌

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚖️ NGUYÊN TẮC:
Mục tiêu là GIỮ LẠI tài liệu có thể giúp trả lời (kể cả trả lời "không").
Chỉ loại bỏ tài liệu HOÀN TOÀN KHÔNG LIÊN QUAN.

Hãy đưa ra điểm nhị phân: 'có' hoặc 'không'"""

grade_prompt = ChatPromptTemplate.from_messages([
    ("system", system),
    ("human", """Tài liệu đã truy xuất:
{document}

Câu hỏi của người dùng:
{question}

Tài liệu này có liên quan đến câu hỏi không? ('có' hoặc 'không')"""),
])

retrieval_grader = grade_prompt | structured_llm_grader



def grade_documents(state):
    """
    Xác định xem các tài liệu đã truy xuất có liên quan đến câu hỏi hay không.

    Args:
        state (dict): Trạng thái hiện tại của đồ thị

    Returns:
        state (dict): Cập nhật khóa documents chỉ với các tài liệu liên quan đã được lọc
    """

    print("---CHECK DOCUMENT RELEVANCE TO QUESTION---")
    question = state["question"]
    documents = state["documents"]

    # Score each doc
    filtered_docs = []
    for d in documents:
        # Combine metadata with content
        doc_txt_with_metadata = f"""
Metadata:
- Điều {d.metadata.get('Dieu', 'N/A')}: {d.metadata.get('Dieu_Name', '')}
- Chương {d.metadata.get('Chuong', 'N/A')}: {d.metadata.get('Chuong_Name', '')}
- Mục {d.metadata.get('Muc', 'N/A')}: {d.metadata.get('Muc_Name', '')}

Nội dung:
{d.page_content}
"""

        score = retrieval_grader.invoke({"question": question, "document": doc_txt_with_metadata})
        grade = score.binary_score
        if grade == "có":
            print("---GRADE: DOCUMENT RELEVANT---")
            filtered_docs.append(d)
        else:
            print("---GRADE: DOCUMENT NOT RELEVANT---")
            continue

    return {"documents": filtered_docs, "question": question}

# ========== ROUTE QUERY MODEL FOR LEGAL DOCUMENTS ==========
class LegalRouteQuery(BaseModel):
    """Phân loại câu hỏi người dùng tới nguồn dữ liệu phù hợp"""
    datasource: Literal["vectorstore","chitchat"] = Field(
        ...,
        description="vectorstore (văn bản pháp luật), chitchat (giao tiếp thân thiện)"
    )

# ========== INITIALIZE LLM ROUTER ==========
llm_router = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
structured_llm_router = llm_router.with_structured_output(LegalRouteQuery)

# ========== SYSTEM PROMPT ==========
router_system = """Bạn là một chuyên gia phân loại câu hỏi người dùng tới nguồn dữ liệu phù hợp.

Bạn có quyền truy cập 2 nguồn:
1. **vectorstore** - Văn bản pháp luật Việt Nam (luật, nghị định, điều khoản)
q. **chitchat** - Giao tiếp thân thiện, hỏi thăm, cảm ơn, chào hỏi

## QUY TẮC ƯU TIÊN QUAN TRỌNG (kiểm tra theo thứ tự):

### 1. Chuyển tới **chitchat** nếu:
- Lời chào: "Xin chào", "Chào bạn", "Hi", "Good morning"
- Giới thiệu: "Tôi tên là...", "Mình là..."
- Cảm ơn: "Cảm ơn", "Thanks"
- Tạm biệt: "Tạm biệt", "Bye", "Goodbye"
- Hỏi thăm / nói chuyện thân thiện: "Bạn có khỏe không?", "Hôm nay thế nào?"
- Các câu hỏi về trợ lý: "Bạn nhớ tôi không?", "Tên tôi là gì?"
- **Lưu ý:** Nếu câu bắt đầu bằng lời chào, luôn là chitchat, ngay cả khi có nhắc đến luật.

### 2. Chuyển tới **vectorstore** nếu không phải chitchat và:
- Hỏi về luật / điều khoản cụ thể: "Điều kiện cấp giấy phép môi trường", "Quyền và nghĩa vụ của tổ chức sản xuất"
- Tra cứu nội dung Điều / Mục / Chương
- So sánh quy định: "So sánh Điều 5 và Điều 6 của Luật BVMT"
- Phạm vi áp dụng: "Phạm vi áp dụng của Luật BVMT là gì?"
- Yêu cầu tóm tắt hoặc giải thích văn bản pháp luật


## Ví dụ:

"Xin chào! Tôi muốn hỏi về luật môi trường" → **chitchat** (lời chào + câu hỏi)
"Cảm ơn bạn đã giúp tôi!" → **chitchat**
"Điều kiện cấp giấy phép môi trường là gì?" → **vectorstore**
"Quyền và nghĩa vụ của doanh nghiệp về chất thải?" → **vectorstore**



## Câu hỏi hiện tại:
{question}

Phân loại câu hỏi dựa trên quy tắc ưu tiên trên."""

# ========== CREATE ROUTER PROMPT ==========
route_prompt = ChatPromptTemplate.from_messages([
    ("system", router_system),
    ("human", "{question}")
])

# ========== COMBINE PROMPT WITH STRUCTURED LLM ==========
question_router = route_prompt | structured_llm_router

print("✓ Legal question router created successfully!")

def route_question_law(state):
    """Phân luồng câu hỏi với xử lý ngữ cảnh cải tiến"""
    print("---PHÂN LUỒNG CÂU HỎI (VỚI NGỮ CẢNH)---")

    question = state["question"]
    # Lấy lịch sử hội thoại đầy đủ
    chat_history = get_full_chat_history()  # hàm bạn đã định nghĩa để load memory

    print(f"Lịch sử hội thoại:\n{chat_history}\n")
    print(f"Câu hỏi hiện tại: {question}")

    # Gọi LLM router để quyết định nguồn dữ liệu
    source = question_router.invoke({
        "question": question,
        "chat_history": chat_history
    })

    # Lấy datasource
    if isinstance(source, dict):
        datasource = source.get("datasource")
    else:
        datasource = getattr(source, "datasource", None)

    print(f"---PHÂN LUỒNG TỚI: {datasource.upper() if datasource else 'UNKNOWN'}---")

    # Map datasource sang các hàm của pipeline pháp luật
    if datasource == 'vectorstore':
        return "vectorstore"  # Truy xuất Điều – Mục – Chương
    # elif datasource == 'websearch':
    #     return "websearch"  # Tìm kiếm trên web pháp luật
    elif datasource == 'chitchat':
        return "chitchat"  # Trò chuyện thân thiện"

def retrieve(state):
    print("---RETRIEVING LAW---")

    question = state["question"]
    original_question = state.get("original_question", question)

    # ✅ CHECK IF THIS IS A COUNTING QUESTION
    if is_counting_question(question):
        print("  🔢 Detected COUNTING question")

        try:
            # Parse the query to extract filters
            structured_query = llm_constructor_phap_luat.invoke({"query": question})

            # Count articles with the filter
            translator = QdrantTranslator(metadata_key="metadata")
            count_result = count_articles_with_filter(
                structured_query,
                translator,
                vectorstore_fix
            )

            # Generate counting answer
            counting_answer = generate_counting_answer(count_result, question)

            # Store the counting answer as a special document
            from langchain_core.documents import Document
            counting_doc = Document(
                page_content=counting_answer,
                metadata={"type": "counting_result", "count": count_result.get("count")}
            )

            print(f"  ✅ Counting complete: {count_result.get('count')} articles")

            return {
                **state,
                "documents": [counting_doc],  # Return counting result as document
                "original_question": original_question,
                "is_counting_query": True  # Flag to handle differently in generation
            }

        except Exception as e:
            print(f"  ⚠️ Counting failed: {e}")
            import traceback
            traceback.print_exc()
            print("  🔄 Falling back to normal retrieval...")
            # Fall through to normal retrieval

    # ✅ NORMAL RETRIEVAL FOR NON-COUNTING QUESTIONS
    try:
        # documents = retriever_phap_luat.invoke(question)
        documents = fallback_retriever.invoke(question)
    except Exception as e:
        print(f"  ⚠️ Lỗi khi retrieve với filter: {e}")
        print(f"  🔄 Fallback: semantic search không filter")

        # Fallback to simple semantic search
        documents = vectorstore_fix.similarity_search(question, k=5)

    print(f"  📊 Tìm thấy {len(documents)} tài liệu")

    if documents:
        for i, doc in enumerate(documents, 1):
            print(f"  📄 Doc {i}: {doc.page_content[:150]}...")

    return {
        **state,
        "documents": documents,
        "original_question": original_question,
        "is_counting_query": False
    }

### Generate

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

# Custom detailed prompt for Vietnamese legal RAG
prompt_template = """Bạn là trợ lý AI chuyên về pháp luật EPR (Extended Producer Responsibility - Trách nhiệm mở rộng của nhà sản xuất) tại Việt Nam.

NHIỆM VỤ CỦA BẠN:
1. Trả lời câu hỏi của người dùng dựa HOÀN TOÀN trên các văn bản pháp luật được cung cấp bên dưới
2. Trích dẫn cụ thể số Điều, Chương, Mục khi trả lời
3. Giải thích rõ ràng, dễ hiểu bằng tiếng Việt
4. Nếu thông tin không có trong tài liệu, hãy nói rõ "Thông tin này không có trong tài liệu được cung cấp"

QUY TẮC TRẢ LỜI:
- KHÔNG bịa đặt hoặc thêm thông tin không có trong tài liệu
- KHÔNG suy diễn ra ngoài phạm vi của tài liệu
- Luôn trích dẫn nguồn (Điều, Chương, Mục) khi có thể
- KHÔNG sử dụng cụm từ "Tài liệu 1", "Tài liệu 2" - CHỈ dùng "Điều X", "Chương Y", "Mục Z"
- Sử dụng ngôn ngữ pháp lý chính xác nhưng dễ hiểu
- Trả lời ngắn gọn, súc tích nhưng đầy đủ thông tin

ĐỊNH DẠNG TRẢ LỜI MẪU:
"Theo Điều X (Tên điều), [nội dung chính]. Cụ thể, [giải thích chi tiết]..."

Nếu có nhiều điều liên quan:
"Về vấn đề này:
- Theo Điều X (Tên điều): [nội dung]
- Theo Điều Y (Tên điều): [nội dung]"

ĐẶC BIỆT CHÚ Ý:
- Nếu câu hỏi dạng "Điều X có nói về Y không?":
  * Nếu tài liệu có Điều X nhưng KHÔNG đề cập Y → Trả lời rõ ràng: "KHÔNG, Điều X không đề cập đến Y. Điều X quy định về..."
  * Nếu tài liệu có Điều X và CÓ đề cập Y → Trả lời: "CÓ, Điều X có quy định về Y. Cụ thể..."
  * KHÔNG nói "không tìm thấy trong cơ sở dữ liệu" nếu đã có tài liệu về Điều X

VÍ DỤ:
Câu hỏi: "Điều 7 có nói về lốp xe không?"
Tài liệu: [Điều 7: Quy định về quản lý chất lượng không khí...]
✅ Đúng: "KHÔNG, Điều 7 không đề cập đến lốp xe. Điều 7 quy định về quản lý chất lượng môi trường không khí..."
❌ Sai: "Không tìm thấy thông tin trong cơ sở dữ liệu"

Câu hỏi: "Điều 7 quy định gì?"
✅ ĐÚNG: "Điều 7 quy định về trình tự, thủ tục ban hành kế hoạch quốc gia về quản lý chất lượng môi trường không khí..."
❌ SAI: "KHÔNG, Điều 7 không nói về lốp xe..." (Đây là trả lời câu hỏi khác!)

===============================================
TÀI LIỆU PHÁP LUẬT THAM KHẢO:

{context}

===============================================
CÂU HỎI: {question}

TRẢ LỜI:"""


prompt = ChatPromptTemplate.from_template(prompt_template)

# LLM
llm = ChatOpenAI(model_name="gpt-4o-mini", temperature=0)


def format_docs(docs, max_docs: int = 5, max_tokens_per_doc: int = 800):
    """
    Format documents with metadata for LLM context with token limits

    Args:
        docs: List of documents to format
        max_docs: Maximum number of documents to include (default: 5)
        max_tokens_per_doc: Maximum tokens per document content (default: 800)

    Returns:
        Formatted string with document content
    """
    if not docs:
        return "Không có tài liệu liên quan."

    # Limit number of documents
    docs_to_use = docs[:max_docs]

    formatted_parts = []
    for i, doc in enumerate(docs_to_use, 1):
        metadata = doc.metadata

        # Build citation label from metadata
        citation_parts = []
        if metadata.get('Dieu'):
            citation_parts.append(f"Điều {metadata.get('Dieu')}")
        if metadata.get('Muc'):
            citation_parts.append(f"Mục {metadata.get('Muc')}")
        if metadata.get('Chuong'):
            citation_parts.append(f"Chương {metadata.get('Chuong')}")

        # Create citation label
        if citation_parts:
            citation = ", ".join(citation_parts)
        else:
            citation = f"Tài liệu {i}"

        # Truncate document content to fit token limit
        content = truncate_text(doc.page_content, max_tokens=max_tokens_per_doc)

        # Include metadata in the formatted output
        doc_with_meta = f"""[{citation}]
Tên Điều: {metadata.get('Dieu_Name', 'N/A')}
Tên Chương: {metadata.get('Chuong_Name', 'N/A')}
Tên Mục: {metadata.get('Muc_Name', 'N/A')}

Nội dung:
{content}
"""
        formatted_parts.append(doc_with_meta)

    return "\n\n---\n\n".join(formatted_parts)
# Chain
rag_chain = prompt | llm | StrOutputParser()

# Generate function
def generate(state):
    """Generate answer using RAG with detailed prompt"""
    print("---GENERATE---")
    question = state["question"]
    documents = state["documents"]
    retries = state.get("retries", 0)
    is_counting_query = state.get("is_counting_query", False)

    # ✅ HANDLE COUNTING QUERIES - Return the counting answer directly
    if is_counting_query and documents:
        print("   🔢 Counting query detected - returning direct answer")
        generation = documents[0].page_content  # The counting answer is stored in the document
        print(f"   ✅ Answer: {generation[:200]}...")

        return {
            "documents": documents,
            "question": question,
            "generation": generation,
            "retries": retries
        }

    # ✅ NORMAL GENERATION FOR NON-COUNTING QUERIES
    if not documents:
        print("   ⚠️ No documents available")
        generation = "Xin lỗi, tôi không tìm thấy thông tin liên quan trong cơ sở dữ liệu."
    else:
        # Format documents with metadata
        context = format_docs(documents)
        print(f"   📄 Generating from {len(documents)} documents")

        # Generate answer
        generation = rag_chain.invoke({"context": context, "question": question})

    return {
        "documents": documents,
        "question": question,
        "generation": generation,
        "retries": retries
    }

def decide_to_generate(state):
    """
    Determines whether to generate an answer, or re-generate a question.
    Implements retry logic - allows up to 3 query transformations before giving up.

    Args:
        state (dict): The current graph state

    Returns:
        str: Binary decision for next node to call
    """

    print("---ASSESS GRADED DOCUMENTS---")
    question = state["question"]
    filtered_documents = state["documents"]
    retries = state.get("retries", 0)  # Get current retries from state
    max_retries = 3

    print(f"   Current retries: {retries}/{max_retries}")
    print(f"   Filtered documents: {len(filtered_documents)}")

    if not filtered_documents:
        # All documents have been filtered check_relevance

        if retries < max_retries:
            # Still have retries left - transform query
            print(f"---DECISION: ALL DOCUMENTS ARE NOT RELEVANT TO QUESTION, TRANSFORM QUERY (Attempt {retries + 1}/{max_retries})---")
            state["retries"] = retries + 1  # Increment retries
            return "transform_query"
        else:
            # Max retries reached - give up
            print(f"---DECISION: MAX RETRIES ({max_retries}) REACHED, GENERATING ANSWER WITH NO RELEVANT DOCUMENTS---")
            return "web_search"
    else:
        # We have relevant documents, so generate answer
        print(f"---DECISION: GENERATE WITH {len(filtered_documents)} RELEVANT DOCUMENTS---")
        return "generate"

### Web Search - Return Links Only

from langchain_community.tools.tavily_search import TavilySearchResults
import os

# Initialize web search tool with error handling
try:
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key or tavily_api_key == "your-tavily-api-key-here":
        print("⚠️ WARNING: TAVILY_API_KEY not configured. Web search will not work.")
        print("   Please set TAVILY_API_KEY in your .env file to enable web search.")
        web_search_tool = None
    else:
        web_search_tool = TavilySearchResults(k=3)
        print("✅ Tavily web search tool initialized successfully!")
except Exception as e:
    print(f"⚠️ WARNING: Failed to initialize Tavily web search: {e}")
    web_search_tool = None

def web_search(state):
    """
    Perform web search and store results in web_urls
    Does NOT generate final response - that's done by generate_web

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): Updates web_urls with search results
    """
    print("---WEB SEARCH FOR ADDITIONAL RESOURCES---")
    question = state["question"]

    # Check if web search tool is available
    if web_search_tool is None:
        print("   ⚠️ Web search tool not available (TAVILY_API_KEY not configured)")
        links_text = f"""Câu hỏi "{question}" không tìm thấy trong cơ sở dữ liệu pháp luật EPR.

⚠️ THÔNG BÁO:
Tính năng tìm kiếm web chưa được kích hoạt. Để sử dụng tính năng này:
1. Đăng ký tài khoản tại https://tavily.com
2. Lấy API key
3. Thêm TAVILY_API_KEY vào file .env

💡 GỢI Ý:
- Thử đặt câu hỏi khác hoặc cụ thể hơn
- Kiểm tra chính tả và từ khóa
- Liên hệ chuyên gia pháp lý để được tư vấn trực tiếp
"""
        return {
            "question": question,
            "web_urls": links_text,
        }

    try:
        # Perform web search
        print(f"   🔍 Searching web for: {question}")
        search_results = web_search_tool.invoke({"query": question})

        # Format results as links
        if search_results:
            links_text = f"""Câu hỏi "{question}" không tìm thấy trong cơ sở dữ liệu pháp luật EPR.

📚 CÁC NGUỒN THAM KHẢO TỪ WEB:

"""
            for i, result in enumerate(search_results, 1):
                title = result.get("title", "Không có tiêu đề")
                url = result.get("url", "")
                snippet = result.get("content", "")[:200] + "..." if result.get("content") else ""

                links_text += f"{i}. {title}\n"
                links_text += f"   🔗 {url}\n"
                if snippet:
                    links_text += f"   📝 {snippet}\n"
                links_text += "\n"

            links_text += """
⚠️ LƯU Ý:
- Các nguồn trên từ Internet, chưa được kiểm chứng
- Vui lòng xác minh độ chính xác từ cơ quan có thẩm quyền
- Để được tư vấn chính xác, liên hệ luật sư chuyên ngành
"""
            print(f"   ✅ Found {len(search_results)} web results")
        else:
            links_text = f"Không tìm thấy kết quả tìm kiếm web về '{question}'."
            print(f"   ⚠️  No web results found")

    except Exception as e:
        print(f"   ❌ Web search error: {e}")
        import traceback
        print(f"   Error details: {traceback.format_exc()}")
        links_text = f"""Không thể thực hiện tìm kiếm web cho câu hỏi "{question}".

❌ LỖI: {str(e)}

💡 GỢI Ý:
- Kiểm tra kết nối Internet
- Kiểm tra TAVILY_API_KEY trong file .env
- Thử lại sau vài phút
- Liên hệ quản trị viên nếu lỗi vẫn tiếp diễn
"""

    return {
        "question": question,
        "web_urls": links_text,
    }

### Generate Web - Separate Function for Web Search Results

def generate_web(state):
    """
    Generate response from web search results

    Args:
        state (dict): The current graph state

    Returns:
        dict: Updated state with web search results as generation
    """
    print("---GENERATE WEB RESPONSE---")

    question = state["question"]
    web_urls = state.get("web_urls", "")

    if web_urls:
        print(f"   🌐 Formatting web search results")
        generation = web_urls
    else:
        print(f"   ⚠️  No web URLs found")
        generation = f"Xin lỗi, không tìm thấy thông tin về '{question}'"

    print(f"   ✅ Generated web response")

    return {
        "question": question,
        "generation": generation,
        "web_urls": web_urls
    }

### Hallucination Grader - Kiểm tra ảo giác

from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

# Data model
class GradeHallucinations(BaseModel):
    """Đánh giá nhị phân xem câu trả lời có dựa trên tài liệu hay không."""

    binary_score: str = Field(
        description="Câu trả lời có dựa trên tài liệu không, 'có' hoặc 'không'"
    )

# LLM with function call
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
structured_llm_grader = llm.with_structured_output(GradeHallucinations)

# Prompt
system = """Bạn là chuyên gia đánh giá chất lượng câu trả lời AI trong lĩnh vực pháp luật EPR Việt Nam.

🎯 MỤC TIÊU:
Xác định xem câu trả lời của AI có HOÀN TOÀN dựa trên các tài liệu pháp luật được cung cấp hay không.

📋 TIÊU CHÍ ĐÁNH GIÁ 'CÓ' (câu trả lời tốt):
✓ Mọi thông tin trong câu trả lời đều có trong tài liệu
✓ Số Điều, Chương, Mục được trích dẫn CHÍNH XÁC khớp với tài liệu
✓ Câu trả lời có thể tóm tắt hoặc diễn giải tài liệu
✓ Ngôn ngữ khác nhau nhưng ý nghĩa giống tài liệu

❌ TIÊU CHÍ ĐÁNH GIÁ 'KHÔNG' (câu trả lời có vấn đề):
✗ Câu trả lời có thông tin KHÔNG CÓ trong tài liệu
✗ Số Điều, Chương, Mục SAI hoặc không khớp
✗ Câu trả lời thêm chi tiết không có trong tài liệu
✗ Câu trả lời đưa ra ý kiến cá nhân không có cơ sở
✗ Câu trả lời suy luận thông tin không được tài liệu hỗ trợ

🔍 ĐẶC BIỆT CHÚ Ý:
- Kiểm tra kỹ các con số: số Điều, Khoản, Mục, Chương, năm
- Kiểm tra tên chính xác của các điều luật
- Không chấp nhận thông tin "gần đúng" hoặc "có thể suy ra"

⚖️ KẾT LUẬN:
Trả lời 'có' chỉ khi câu trả lời HOÀN TOÀN dựa trên tài liệu.
Trả lời 'không' nếu có BẤT KỲ thông tin nào không được tài liệu hỗ trợ.

Hãy đưa ra đánh giá: 'có' hoặc 'không'"""

hallucination_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system),
        ("human", "Tài liệu pháp luật: \n\n {documents} \n\n Câu trả lời của AI: {generation}"),
    ]
)

hallucination_grader = hallucination_prompt | structured_llm_grader

print("✅ Hallucination grader đã được tạo thành công!")

### Answer Grader - Đánh giá câu trả lời có giải quyết câu hỏi không

from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate

# Data model
class GradeAnswer(BaseModel):
    """Đánh giá nhị phân xem câu trả lời có giải quyết được câu hỏi hay không."""

    binary_score: str = Field(
        description="Câu trả lời có giải quyết câu hỏi không, 'có' hoặc 'không'"
    )

# LLM with function call
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
structured_llm_grader = llm.with_structured_output(GradeAnswer)

# Prompt
system = """Bạn là bộ đánh giá xem câu trả lời của AI có giải quyết/trả lời được câu hỏi của người dùng hay không.

NHIỆM VỤ:
Đánh giá xem câu trả lời có GIẢI QUYẾT TRỰC TIẾP câu hỏi hay không.

QUY TẮC ĐÁNH GIÁ 'CÓ':
✓ Câu trả lời cung cấp thông tin mà người dùng đang tìm kiếm
✓ Câu trả lời trả lời đúng trọng tâm câu hỏi
✓ Người dùng có thể hiểu và sử dụng được thông tin trong câu trả lời
✓ Câu trả lời có thể dài hoặc ngắn, nhưng phải ĐÚNG TRỌNG TÂM

QUY TẮC ĐÁNH GIÁ 'KHÔNG':
✗ Câu trả lời không liên quan đến câu hỏi
✗ Câu trả lời né tránh hoặc không trả lời trực tiếp
✗ Câu trả lời quá chung chung, không cung cấp thông tin cụ thể
✗ Câu trả lời nói "không có thông tin" khi người dùng hỏi câu hỏi cụ thể

Hãy đưa ra đánh giá: 'có' hoặc 'không'"""

answer_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system),
        ("human", "Câu hỏi của người dùng: \n\n {question} \n\n Câu trả lời của AI: {generation}"),
    ]
)

answer_grader = answer_prompt | structured_llm_grader

print("✅ Answer grader đã được tạo thành công!")

def grade_generation_v_documents_and_question(state):
    """Grade generation quality"""
    print("---KIỂM TRA CHẤT LƯỢNG CÂU TRẢ LỜI---")
    
    question = state["question"]
    documents = state["documents"]
    generation = state["generation"]
    generation_retries = int(state.get("generation_retries") or 0)
    max_generation_retries = 3
    
    print(f"   Generation retries: {generation_retries}/{max_generation_retries}")
    
    
    # Determine grade_result and new_generation_retries
    grade_result = "useful"  # default
    new_generation_retries = generation_retries  # default
    
    if not documents:
        print("   ⚠️  Không có tài liệu, bỏ qua grading")
        grade_result = "useful"
    else:
        formatted_docs = format_docs(documents)
        
        print("---BƯỚC 1: KIỂM TRA ẢO GIÁC---")
        hallucination_score = hallucination_grader.invoke({
            "documents": formatted_docs,
            "generation": generation
        })
        hallucination_grade = hallucination_score.binary_score

        if hallucination_grade == "có":
            print("   ✅ PASS: Dựa trên tài liệu")
            
            print("---BƯỚC 2: KIỂM TRA CÂU TRẢ LỜI---")
            answer_score = answer_grader.invoke({
                "question": question,
                "generation": generation
            })
            answer_grade = answer_score.binary_score
            
            if answer_grade == "có":
                print("   ✅ PASS: Giải quyết câu hỏi")
                print("---QUYẾT ĐỊNH: USEFUL---")
                grade_result = "useful"
                # Don't increment
            else:
                print("   ❌ FAIL: Không giải quyết câu hỏi")
                
                if generation_retries < max_generation_retries:
                    print(f"---TẠO LẠI: Lần {generation_retries + 1}/{max_generation_retries}---")
                    grade_result = "not useful"
                    new_generation_retries = generation_retries + 1  # ✅ INCREMENT
                else:
                    print(f"---HẾT LẦN THỬ: CHUYỂN WEB SEARCH---")
                    grade_result = "web_search"
        else:
            print("   ❌ FAIL: Có ảo giác")
            
            if generation_retries < max_generation_retries:
                print(f"---TẠO LẠI: Lần {generation_retries + 1}/{max_generation_retries}---")
                grade_result = "not supported"
                new_generation_retries = generation_retries + 1  # ✅ INCREMENT
            else:
                print(f"---HẾT LẦN THỬ: CHUYỂN WEB SEARCH---")
                grade_result = "web_search"
    
    print(f"\n🔍 RETURNING STATE:")
    print(f"   grade_result: {grade_result}")
    print(f"   generation_retries: {new_generation_retries} (was {generation_retries})")
    
    # ✅ Return ALL state fields
    return {
        "question": state.get("question"),
        "original_question": state.get("original_question"),
        "chat_history": state.get("chat_history", ""),
        "generation": state.get("generation"),
        "documents": state.get("documents", []),
        "retries": state.get("retries", 0),
        "generation_retries": new_generation_retries,  # ✅ Updated value
        "grade_result": grade_result,  # ✅ Updated value
        "hallucination_detected": hallucination_grade == "không" if documents else False
    }

# 

def decide_after_grade_generation(state):
    """Decide next step"""
    print(f"\n{'='*80}")
    print(f"🔍 ROUTING FUNCTION - FULL DEBUG")
    print(f"{'='*80}")
    
    # Print EVERYTHING
    print("Full state received:")
    for key, val in state.items():
        if key not in ["documents", "chat_history"]:
            print(f"  {key}: {repr(val)}")
    
    grade_result = state.get("grade_result", "useful")
    
    print(f"\nExtracted:")
    print(f"  grade_result: {repr(grade_result)}")
    print(f"  Type: {type(grade_result)}")
    print(f"  Is 'not supported': {grade_result == 'not supported'}")
    print(f"  Is 'useful': {grade_result == 'useful'}")
    
    print(f"\n🔀 ROUTING DECISION: {grade_result}")
    print(f"{'='*80}\n")
    
    if grade_result == "not supported":
        print("  → Routing to 'not supported' (regenerate)")
        return "not supported"
    elif grade_result == "useful":
        print("  → Routing to 'useful' (END)")
        return "useful"
    elif grade_result == "not useful":
        print("  → Routing to 'not useful' (transform)")
        return "not useful"
    elif grade_result == "web_search":
        print("  → Routing to 'web_search'")
        return "web_search"
    else:
        print(f"  → Unknown value, defaulting to 'useful'")
        return "useful"

from langgraph.graph import END, StateGraph
from typing import TypedDict, List

class GraphState(TypedDict):
    question: str
    generation: str
    documents: List[str]
    
    original_question: str
    chat_history: str
    retries: int
    generation_retries: int
    grade_result: str 
    hallucination_detected: bool 
    web_urls: str

# ========== STATEGRAPH WORKFLOW REMOVED ==========
# Old StateGraph workflow removed (not used - replaced by optimized_chatbot_pipeline)



def get_full_chat_history(max_exchanges=3):
    """
    Get recent chat history from memory

    Args:
        max_exchanges: Number of recent conversation pairs to keep (default: 3)
        Each exchange = 1 user message + 1 assistant message = 2 messages total
        Reduced from 5 to 3 to prevent context overflow

    Returns:
        Formatted chat history string
    """
    try:
        memory_vars = conversation_memory.load_memory_variables({})
        if "chat_history" in memory_vars:
            messages = memory_vars["chat_history"]

            if messages:
                # Keep only last N exchanges (N*2 messages)
                recent_messages = messages[-(max_exchanges * 2):]

                formatted = []
                for msg in recent_messages:
                    if hasattr(msg, 'type'):
                        role = "User" if msg.type == "human" else "Assistant"
                        content = msg.content
                        # Truncate individual messages to prevent overflow
                        content = truncate_text(content, max_tokens=500)
                        formatted.append(f"{role}: {content}")
                    else:
                        formatted.append(str(msg))

                chat_history = "\n".join(formatted)

                # Ensure total chat history doesn't exceed limit
                return truncate_text(chat_history, max_tokens=2000)
    except Exception as e:
        print(f"  ⚠️ Error loading history: {e}")
    return ""

print("✓ get_full_chat_history with limit created")

def clear_memory():
    """Xóa toàn bộ bộ nhớ hội thoại"""
    conversation_memory.clear()
    print("✨ Đã xóa toàn bộ bộ nhớ hội thoại thành công!")


print("✅ EPR Chatbot Core Module Loaded Successfully!")


# ============================================================================
# 🚀 PERFORMANCE OPTIMIZATIONS: ASYNC + STREAMING
# ============================================================================

import asyncio
from typing import AsyncIterator, Dict, Any

print("\n" + "="*80)
print("🚀 Loading Performance Optimizations...")
print("="*80)

# ========== ASYNC PARALLEL RETRIEVAL ==========

async def retrieve_faq_async(query: str, score_threshold: float = 0.6):
    """Async version of FAQ retrieval"""
    print("  🔍 [ASYNC] Retrieving FAQ...")

    # Run synchronous retrieval in thread pool
    loop = asyncio.get_event_loop()
    documents = await loop.run_in_executor(
        None,
        retrieve_faq_top1,
        query,
        score_threshold
    )

    print(f"  ✅ [ASYNC] FAQ retrieval done: {len(documents)} docs")
    return documents


async def retrieve_legal_async(question: str):
    """Async version of legal document retrieval with counting support"""
    print("  📚 [ASYNC] Retrieving legal docs...")

    # Run synchronous retrieval in thread pool
    loop = asyncio.get_event_loop()

    # ✅ CHECK IF THIS IS A COUNTING QUESTION
    if is_counting_question(question):
        print("  🔢 [ASYNC] Detected COUNTING question")

        def _count_sync():
            try:
                # Parse the query to extract filters
                structured_query = llm_constructor_phap_luat.invoke({"query": question})

                # Count articles with the filter
                translator = QdrantTranslator(metadata_key="metadata")
                count_result = count_articles_with_filter(
                    structured_query,
                    translator,
                    vectorstore_fix
                )

                # Generate counting answer
                counting_answer = generate_counting_answer(count_result, question)

                # Store the counting answer as a special document
                from langchain_core.documents import Document
                counting_doc = Document(
                    page_content=counting_answer,
                    metadata={"type": "counting_result", "count": count_result.get("count")}
                )

                return [counting_doc]

            except Exception as e:
                print(f"  ⚠️ [ASYNC] Counting failed: {e}")
                import traceback
                traceback.print_exc()
                # Return empty list to trigger fallback
                return []

        documents = await loop.run_in_executor(None, _count_sync)

        if documents:
            print(f"  ✅ [ASYNC] Counting done: {documents[0].metadata.get('count')} articles")
            return documents
        else:
            print(f"  ⚠️ [ASYNC] Counting failed, falling back to normal search")
            # Fall through to normal retrieval

    # ✅ NORMAL RETRIEVAL FOR NON-COUNTING QUESTIONS
    try:
        documents = await loop.run_in_executor(
            None,
            fallback_retriever.invoke,
            question
        )
    except Exception as e:
        print(f"  ⚠️ [ASYNC] Error: {e}, falling back to similarity search")
        documents = await loop.run_in_executor(
            None,
            vectorstore_fix.similarity_search,
            question,
            5
        )

    print(f"  ✅ [ASYNC] Legal retrieval done: {len(documents)} docs")
    return documents


async def parallel_retrieve(query: str, faq_threshold: float = 0.6):
    """
    Retrieve FAQ and legal documents in parallel for maximum speed

    Args:
        query: User's question
        faq_threshold: Minimum score for FAQ match

    Returns:
        dict: {
            'faq_docs': list of FAQ documents,
            'legal_docs': list of legal documents,
            'faq_time': float (seconds),
            'legal_time': float (seconds)
        }
    """
    import time

    print("\n" + "="*80)
    print("⚡ PARALLEL RETRIEVAL")
    print("="*80)
    print(f"Query: {query}")

    start_time = time.time()

    # Run both retrievals in parallel
    faq_docs, legal_docs = await asyncio.gather(
        retrieve_faq_async(query, faq_threshold),
        retrieve_legal_async(query),
        return_exceptions=True
    )

    total_time = time.time() - start_time

    # Handle exceptions
    if isinstance(faq_docs, Exception):
        print(f"  ⚠️ FAQ retrieval failed: {faq_docs}")
        faq_docs = []

    if isinstance(legal_docs, Exception):
        print(f"  ⚠️ Legal retrieval failed: {legal_docs}")
        legal_docs = []

    print(f"  ⚡ Total parallel retrieval time: {total_time:.2f}s")
    print(f"  📊 Results: FAQ={len(faq_docs)}, Legal={len(legal_docs)}")
    print("="*80)

    return {
        'faq_docs': faq_docs,
        'legal_docs': legal_docs,
        'total_time': total_time
    }


# ========== STREAMING LLM GENERATION ==========

def create_streaming_llm():
    """Create an LLM instance configured for streaming"""
    return ChatOpenAI(
        model="gpt-3.5-turbo",
        temperature=0,
        streaming=True
    )

streaming_llm = create_streaming_llm()


# ========== STREAMING ANSWER GENERATION ==========

async def generate_answer_streaming(
    query: str,
    documents: list,
    source_type: str = "faq",
    response_style: str = "detailed",  # "detailed", "concise", "comprehensive"
    include_examples: bool = True,
    include_references: bool = True,
    chat_history: str = ""
) -> AsyncIterator[str]:
    """
    Generate answer with streaming for real-time display

    Args:
        query: User question
        documents: Retrieved documents
        source_type: "faq" or "legal"
        response_style: Level of detail in response
        include_examples: Whether to include practical examples
        include_references: Whether to include legal references
        chat_history: Previous conversation context

    Yields:
        str: Chunks of the generated response
    """
    if not documents:
        yield """Xin lỗi, tôi không tìm thấy thông tin phù hợp với câu hỏi của bạn trong cơ sở dữ liệu hiện tại.

**Gợi ý để tôi có thể hỗ trợ bạn tốt hơn:**
- Hãy thử diễn đạt câu hỏi theo cách khác
- Cung cấp thêm chi tiết về vấn đề bạn quan tâm
- Cho biết bạn thuộc loại hình doanh nghiệp nào (sản xuất, nhập khẩu, phân phối...)

Bạn có thể đặt câu hỏi lại được không?"""
        return

    # GPT-3.5-turbo context limit
    MAX_CONTEXT_TOKENS = 15000

    if source_type == "faq":
        async for chunk in _generate_faq_answer(
            query, documents, response_style, include_examples,
            chat_history=chat_history
        ):
            yield chunk
    else:
        async for chunk in _generate_legal_answer(
            query, documents, MAX_CONTEXT_TOKENS,
            response_style, include_examples, include_references,
            chat_history=chat_history
        ):
            yield chunk


async def _generate_faq_answer(
    query: str,
    documents: list,
    response_style: str,
    include_examples: bool,
    chat_history: str = ""
) -> AsyncIterator[str]:
    """Generate detailed FAQ-based answer with conversational AI prompts"""

    doc = documents[0]
    faq_question = doc.metadata.get("Câu_hỏi", "")
    faq_answer = doc.page_content

    # Get additional related FAQs if available
    related_faqs = ""
    if len(documents) > 1:
        related_faqs = "\n".join([
            f"- {d.metadata.get('Câu_hỏi', '')}: {truncate_text(d.page_content, 200)}"
            for d in documents[1:4]
        ])

    # Truncate FAQ answer if too long
    faq_answer = truncate_text(faq_answer, max_tokens=2500, model="gpt-3.5-turbo")

    # Use improved prompts with chat history
    prompts = format_faq_prompt(
        faq_question=faq_question,
        faq_answer=faq_answer,
        query=query,
        chat_history=chat_history,
        related_faqs=related_faqs
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", prompts["system"]),
        ("user", prompts["user"])
    ])

    chain = prompt | streaming_llm

    async for chunk in chain.astream({}):
        if hasattr(chunk, 'content'):
            yield chunk.content


async def _generate_legal_answer(
    query: str,
    documents: list,
    max_context_tokens: int,
    response_style: str,
    include_examples: bool,
    include_references: bool,
    chat_history: str = ""
) -> AsyncIterator[str]:
    """Generate comprehensive legal document-based answer"""

    # Limit documents to prevent context overflow
    context = format_docs(documents, max_docs=5, max_tokens_per_doc=1200)

    # Verify total context size
    context_tokens = count_tokens(context)
    query_tokens = count_tokens(query)
    system_prompt_tokens = 500  # Account for detailed system prompt

    total_input_tokens = context_tokens + query_tokens + system_prompt_tokens

    print(f"   📊 Context size: {context_tokens} tokens")
    print(f"   📊 Query size: {query_tokens} tokens")
    print(f"   📊 Total input: {total_input_tokens} tokens")

    if total_input_tokens > max_context_tokens:
        print(f"   ⚠️ Context too large ({total_input_tokens} tokens), reducing...")
        context = format_docs(documents, max_docs=3, max_tokens_per_doc=800)
        context_tokens = count_tokens(context)
        print(f"   ✅ Reduced to {context_tokens} tokens")

    # Use improved prompts with chat history
    prompts = format_legal_prompt(
        context=context,
        query=query,
        chat_history=chat_history
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", prompts["system"]),
        ("user", prompts["user"])
    ])

    chain = prompt | streaming_llm

    async for chunk in chain.astream({}):
        if hasattr(chunk, 'content'):
            yield chunk.content


# ========== OPTIMIZED CHATBOT PIPELINE ==========

async def optimized_chatbot_pipeline(
    query: str,
    chat_history: str = "",
    faq_threshold: float = 0.6,
    use_parallel: bool = True
) -> AsyncIterator[Dict[str, Any]]:
    """
    Optimized chatbot pipeline with parallel retrieval and streaming

    Args:
        query: User's question
        chat_history: Previous conversation context
        faq_threshold: Minimum FAQ match score
        use_parallel: If True, retrieve FAQ + legal docs in parallel

    Yields:
        dict: Status updates and response chunks
    """

    print("\n" + "🔹"*40)
    print("🚀 OPTIMIZED PIPELINE START")
    print("🔹"*40)

    # Step 0a: Rewrite question based on chat history (if needed)
    original_query = query
    if chat_history:
        print("---REWRITING QUESTION BASED ON CHAT HISTORY---")
        print(f"  Original query: {original_query}")
        try:
            # Use the question rewriter to contextualize the question
            rewritten_query = question_rewriter_legal.invoke({
                "question": query,
                "chat_history": chat_history
            })
            print(f"  Rewritten query: {rewritten_query}")
            # Use the rewritten query for retrieval
            query = rewritten_query
        except Exception as e:
            print(f"  ⚠️ Error in question rewriting: {e}")
            print(f"  ➡️ Continuing with original query")
            # Continue with original query if rewriting fails
    else:
        print("---NO CHAT HISTORY - USING ORIGINAL QUESTION---")
        print(f"  Query: {query}")

    # Step 0b: Check if this is chitchat BEFORE any retrieval
    print("---CHECKING IF CHITCHAT---")
    try:
        # Use the FAQ router to check if this is chitchat
        route_result = question_router_faq.invoke({
            "question": query,
            "chat_history": chat_history
        })

        datasource = route_result.get("datasource") if isinstance(route_result, dict) else getattr(route_result, "datasource", None)
        print(f"   Routing decision: {datasource}")

        if datasource == 'chitchat':
            print("   ✅ Detected as chitchat - generating friendly response")
            yield {
                'type': 'status',
                'message': '💬 Generating friendly response...',
                'stage': 'chitchat'
            }

            # Call chitchat function
            state = {
                "question": query,
                "chat_history": chat_history
            }
            result_state = chitchat(state)
            chitchat_response = result_state.get("generation", "Xin chào!")

            # Stream the chitchat response
            yield {
                'type': 'response_chunk',
                'chunk': chitchat_response,
                'stage': 'streaming'
            }

            # Complete
            yield {
                'type': 'response_complete',
                'text': chitchat_response,
                'documents': [],
                'source': 'chitchat',
                'stage': 'complete'
            }

            print("🔹"*40)
            print("✅ CHITCHAT COMPLETE")
            print("🔹"*40 + "\n")
            return
    except Exception as e:
        print(f"   ⚠️ Error in chitchat routing: {e}")
        # Continue to retrieval if routing fails

    print("   ➡️ Not chitchat - proceeding to document retrieval")

    # Step 1: Yield status - starting retrieval
    yield {
        'type': 'status',
        'message': '🔍 Searching knowledge base...',
        'stage': 'retrieval'
    }

    # Step 2: Parallel retrieval
    if use_parallel:
        results = await parallel_retrieve(query, faq_threshold)
        faq_docs = results['faq_docs']
        legal_docs = results['legal_docs']
    else:
        # Sequential fallback
        faq_docs = await retrieve_faq_async(query, faq_threshold)
        legal_docs = []
        if not faq_docs:
            legal_docs = await retrieve_legal_async(query)

    # Step 3: Determine which documents to use
    documents_to_use = []
    source_type = None

    if faq_docs:
        documents_to_use = faq_docs
        source_type = "faq"
        yield {
            'type': 'status',
            'message': '✅ Found answer in FAQ',
            'stage': 'generation',
            'source': 'faq'
        }
    elif legal_docs:
        documents_to_use = legal_docs
        source_type = "legal"
        yield {
            'type': 'status',
            'message': '✅ Found relevant legal documents',
            'stage': 'generation',
            'source': 'legal'
        }
    else:
        # No documents found - try web search
        yield {
            'type': 'status',
            'message': '🌐 Searching web for additional information...',
            'stage': 'web_search'
        }

        # Call web search
        web_state = {
            "question": query
        }
        web_result = web_search(web_state)
        web_urls = web_result.get("web_urls", "")

        if web_urls:
            yield {
                'type': 'response_chunk',
                'chunk': web_urls,
                'stage': 'streaming'
            }

            yield {
                'type': 'response_complete',
                'text': web_urls,
                'documents': [],
                'source': 'web_search',
                'stage': 'complete'
            }
        else:
            yield {
                'type': 'response_complete',
                'text': 'Xin lỗi, tôi không tìm thấy thông tin phù hợp trong cơ sở dữ liệu hoặc trên web.',
                'documents': [],
                'source': None,
                'stage': 'complete'
            }

        print("🔹"*40)
        print("✅ WEB SEARCH COMPLETE")
        print("🔹"*40 + "\n")
        return

    # Step 4: Stream the response
    full_response = ""

    async for chunk in generate_answer_streaming(
        query,
        documents_to_use,
        source_type,
        chat_history=chat_history
    ):
        full_response += chunk
        yield {
            'type': 'response_chunk',
            'chunk': chunk,
            'stage': 'streaming'
        }

    # Step 5: Final metadata
    yield {
        'type': 'response_complete',
        'text': full_response,
        'documents': documents_to_use,
        'source': source_type,
        'stage': 'complete'
    }

    print("🔹"*40)
    print("✅ OPTIMIZED PIPELINE COMPLETE")
    print("🔹"*40 + "\n")


print("✅ Performance optimizations loaded!")
print("   - Async parallel retrieval")
print("   - Streaming LLM responses")
print("   - Optimized pipeline")
print("="*80 + "\n")



