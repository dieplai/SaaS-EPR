# 🚀 HƯỚNG DẪN IMPLEMENT PROMPTS MỚI

## TẠI SAO CẦN SỬA?

**Vấn đề hiện tại:**
- ❌ Câu trả lời robotic, không tự nhiên
- ❌ Không dùng chat history trong generation (chỉ dùng khi rewrite query)
- ❌ LLM follow template cứng nhắc (1. 2. 3. 4.)
- ❌ Thiếu chain-of-thought reasoning

**Sau khi sửa:**
- ✅ Câu trả lời tự nhiên như ChatGPT/Claude
- ✅ Context-aware (nhớ previous conversation)
- ✅ Flexible structure (không rigid template)
- ✅ Thoughtful reasoning

---

## CÁCH IMPLEMENT

### **BƯỚC 1: Update `_generate_legal_answer()`**

**File:** `epr_chatbot_core.py`

**Tìm function:** `async def _generate_legal_answer(...)` (dòng ~2517)

**THAY ĐỔI:**

```python
# BEFORE (hiện tại)
async def _generate_legal_answer(
    query: str,
    documents: list,
    max_context_tokens: int,
    response_style: str,
    include_examples: bool,
    include_references: bool
) -> AsyncIterator[str]:

    context = format_docs(documents, max_docs=5, max_tokens_per_doc=1200)

    # OLD PROMPT - no chat history
    system_prompt = """Bạn là chuyên gia tư vấn..."""
    user_prompt = f"""...{context}...{query}..."""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", user_prompt)
    ])
```

**AFTER (mới):**

```python
# Import prompts mới
from improved_prompts import format_legal_prompt_v2

async def _generate_legal_answer(
    query: str,
    documents: list,
    max_context_tokens: int,
    response_style: str,
    include_examples: bool,
    include_references: bool,
    chat_history: str = ""  # ← THÊM THAM SỐ NÀY
) -> AsyncIterator[str]:

    context = format_docs(documents, max_docs=5, max_tokens_per_doc=1200)

    # NEW PROMPT - with chat history
    prompts = format_legal_prompt_v2(
        context=context,
        query=query,
        chat_history=chat_history  # ← PASS CHAT HISTORY VÀO
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", prompts["system"]),
        ("user", prompts["user"])
    ])
```

---

### **BƯỚC 2: Update `_generate_faq_answer()`**

**Tìm function:** `async def _generate_faq_answer(...)` (dòng ~2435)

**THAY ĐỔI:**

```python
# BEFORE
async def _generate_faq_answer(
    query: str,
    documents: list,
    response_style: str,
    include_examples: bool
) -> AsyncIterator[str]:

    # OLD PROMPT
    system_prompt = """Bạn là trợ lý AI..."""
    user_prompt = f"""...{faq_answer}...{query}..."""
```

**AFTER:**

```python
# Import
from improved_prompts import format_faq_prompt_v2

async def _generate_faq_answer(
    query: str,
    documents: list,
    response_style: str,
    include_examples: bool,
    chat_history: str = ""  # ← THÊM
) -> AsyncIterator[str]:

    doc = documents[0]
    faq_question = doc.metadata.get("Câu_hỏi", "")
    faq_answer = doc.page_content

    # Get related FAQs
    related_faqs = ""
    if len(documents) > 1:
        related_faqs = "\n".join([
            f"- {d.metadata.get('Câu_hỏi', '')}: {truncate_text(d.page_content, 200)}"
            for d in documents[1:4]
        ])

    # NEW PROMPT
    prompts = format_faq_prompt_v2(
        faq_question=faq_question,
        faq_answer=faq_answer,
        query=query,
        chat_history=chat_history,  # ← PASS CHAT HISTORY
        related_faqs=related_faqs
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", prompts["system"]),
        ("user", prompts["user"])
    ])
```

---

### **BƯỚC 3: Update `generate_answer_streaming()` để pass chat_history**

**Tìm function:** `async def generate_answer_streaming(...)` (dòng ~2388)

**THAY ĐỔI:**

```python
# BEFORE
async def generate_answer_streaming(
    query: str,
    documents: list,
    source_type: str = "faq",
    response_style: str = "detailed",
    include_examples: bool = True,
    include_references: bool = True
) -> AsyncIterator[str]:
```

**AFTER:**

```python
async def generate_answer_streaming(
    query: str,
    documents: list,
    source_type: str = "faq",
    response_style: str = "detailed",
    include_examples: bool = True,
    include_references: bool = True,
    chat_history: str = ""  # ← THÊM THAM SỐ NÀY
) -> AsyncIterator[str]:

    if source_type == "faq":
        async for chunk in _generate_faq_answer(
            query, documents, response_style, include_examples,
            chat_history=chat_history  # ← PASS VÀO
        ):
            yield chunk
    else:
        async for chunk in _generate_legal_answer(
            query, documents, MAX_CONTEXT_TOKENS,
            response_style, include_examples, include_references,
            chat_history=chat_history  # ← PASS VÀO
        ):
            yield chunk
```

---

### **BƯỚC 4: Update `optimized_chatbot_pipeline()` để pass chat_history**

**Tìm function:** `async def optimized_chatbot_pipeline(...)` (dòng ~2645)

**THAY ĐỔI:** Ở phần streaming response

```python
# BEFORE (dòng ~2832)
async for chunk in generate_answer_streaming(query, documents_to_use, source_type):
    full_response += chunk
    yield {
        'type': 'response_chunk',
        'chunk': chunk,
        'stage': 'streaming'
    }
```

**AFTER:**

```python
# Pass chat_history vào generation
async for chunk in generate_answer_streaming(
    query,
    documents_to_use,
    source_type,
    chat_history=chat_history  # ← THÊM DÒNG NÀY
):
    full_response += chunk
    yield {
        'type': 'response_chunk',
        'chunk': chunk,
        'stage': 'streaming'
    }
```

---

### **BƯỚC 5: Update Chitchat prompt (Optional)**

**Tìm function:** `def chitchat(state)` (dòng ~621)

```python
# BEFORE
def chitchat(state):
    question = state["question"]

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Bạn là trợ lý AI thân thiện..."),
        ("user", "{question}")
    ])
```

**AFTER:**

```python
from improved_prompts import format_chitchat_prompt_v2

def chitchat(state):
    question = state["question"]
    chat_history = state.get("chat_history", "")

    prompts = format_chitchat_prompt_v2(question, chat_history)

    prompt = ChatPromptTemplate.from_messages([
        ("system", prompts["system"]),
        ("user", prompts["user"])
    ])
```

---

## CHECKLIST IMPLEMENTATION

```
[ ] Bước 1: Import improved_prompts vào epr_chatbot_core.py
[ ] Bước 2: Update _generate_legal_answer() - thêm chat_history param
[ ] Bước 3: Update _generate_faq_answer() - thêm chat_history param
[ ] Bước 4: Update generate_answer_streaming() - thêm chat_history param
[ ] Bước 5: Update optimized_chatbot_pipeline() - pass chat_history vào generation
[ ] Bước 6: (Optional) Update chitchat() với prompt mới
[ ] Bước 7: Test với câu hỏi follow-up để verify chat history works
[ ] Bước 8: Compare câu trả lời before/after
```

---

## TESTING

**Test Case 1: Chat History Works**

```python
# Conversation flow:
User: "Điều 77 là gì?"
Bot: "Điều 77 quy định về trách nhiệm tái chế..."

User: "Nó áp dụng cho ai?"  # ← "Nó" reference previous message
Bot: "Điều 77 mà chúng ta vừa nói áp dụng cho các doanh nghiệp..."
     # ✅ Bot hiểu "nó" = Điều 77
```

**Test Case 2: Natural Language**

```python
# Before (robotic):
"1. Tóm tắt: Điều 77 quy định...
 2. Chi tiết: Các tổ chức phải...
 3. Ví dụ: ..."

# After (natural):
"Điều 77 này khá quan trọng! Nó quy định rằng các doanh nghiệp sản xuất
hoặc nhập khẩu sản phẩm cần phải chịu trách nhiệm tái chế. Cụ thể hơn..."
```

**Test Case 3: Context Awareness**

```python
User: "Cho tôi biết về bao bì"
Bot: "Về bao bì thì..."

User: "Còn sản phẩm thì sao?"
Bot: "Khác với bao bì mà tôi vừa giải thích, sản phẩm có quy định..."
     # ✅ Reference previous topic naturally
```

---

## KẾT QUẢ MONG ĐỢI

### BEFORE (Hiện tại)
```
User: Điều 77 quy định gì?

Bot:
**1. Tóm tắt**
Điều 77 quy định về trách nhiệm tái chế.

**2. Căn cứ pháp lý**
Theo Điều 77 Nghị định 08/2022/NĐ-CP...

**3. Chi tiết**
...

❌ Robotic, template-based
❌ No personality
```

### AFTER (Với prompts mới)
```
User: Điều 77 quy định gì?

Bot:
Điều 77 của Nghị định 08/2022/NĐ-CP là một quy định rất quan trọng về
trách nhiệm tái chế!

Nói đơn giản, điều này yêu cầu các doanh nghiệp sản xuất hoặc nhập khẩu
sản phẩm và bao bì phải chịu trách nhiệm thu gom và tái chế sản phẩm sau
khi người tiêu dùng sử dụng xong.

Cụ thể hơn, điều 77 áp dụng cho các tổ chức sản xuất, nhập khẩu những
sản phẩm thuộc danh mục trong Phụ lục XXII. Họ cần phải:
- Thu gom hoặc phối hợp thu gom sản phẩm, bao bì đã qua sử dụng
- Đạt tỷ lệ tái chế tối thiểu theo quy định
- Báo cáo định kỳ về hoạt động tái chế

✅ Natural, conversational
✅ Has personality
✅ Still accurate with citations
```

---

## QUAN TRỌNG

**⚠️ Chat History Format:**

Đảm bảo `chat_history` được format đúng:

```python
# Good format:
chat_history = """
User: Điều 77 là gì?
Assistant: Điều 77 quy định về...

User: Nó áp dụng cho ai?
"""

# NOT just raw messages array
```

Function `get_full_chat_history()` trong code bạn đã handle việc này rồi! ✅

---

## TÓM TẮT

**5 thay đổi chính:**

1. ✅ **Import** improved_prompts.py
2. ✅ **Thêm param** `chat_history` vào generation functions
3. ✅ **Replace** old prompts bằng new prompts (sử dụng helper functions)
4. ✅ **Pass** chat_history từ pipeline → generation
5. ✅ **Test** để verify natural language & context awareness

**Thời gian:** ~30 phút để implement
**Impact:** Massive improvement trong quality & user experience!
