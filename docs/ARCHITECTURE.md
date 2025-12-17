# EPR Legal SaaS - Architecture Deep Dive

> Chi tiết về kiến trúc hệ thống, luồng xử lý, và technical decisions

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Service Communication](#service-communication)
3. [Database Design](#database-design)
4. [RAG Pipeline](#rag-pipeline)
5. [Authentication Flow](#authentication-flow)
6. [Request Lifecycle](#request-lifecycle)
7. [Caching Strategy](#caching-strategy)
8. [Error Handling](#error-handling)

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                                │
│  ┌──────────┐     ┌─────────────┐     ┌──────────────┐         │
│  │   Web    │     │  iOS App    │     │ Android App  │         │
│  │ (React)  │     │  (Flutter)  │     │  (Flutter)   │         │
│  └─────┬────┘     └──────┬──────┘     └──────┬───────┘         │
└────────┼─────────────────┼───────────────────┼──────────────────┘
         │                 │                   │
         │  HTTPS/JSON     │  HTTPS/JSON       │  HTTPS/JSON
         └─────────────────┴───────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────────────┐
│                    EDGE LAYER                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Cloudflare                                                 │  │
│  │  - CDN (cache static assets)                               │  │
│  │  - WAF (Web Application Firewall)                          │  │
│  │  - DDoS Protection                                         │  │
│  │  - Rate Limiting (IP-based: 100 req/min)                   │  │
│  │  - SSL/TLS Termination                                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────▼────────────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────────────┐
│                    REVERSE PROXY                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Nginx                                                      │  │
│  │  - Load Balancing (round-robin)                            │  │
│  │  - Health Checks                                            │  │
│  │  - Request Routing by path                                 │  │
│  │  - Gzip compression                                         │  │
│  │  - Static file serving                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────▼────────────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────────────┐
│                   API GATEWAY                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Golang/Gin Framework                                       │  │
│  │  Port: 8000                                                 │  │
│  │                                                             │  │
│  │  Responsibilities:                                          │  │
│  │  1. JWT Authentication                                      │  │
│  │     - Verify JWT token                                      │  │
│  │     - Extract user_id from claims                           │  │
│  │                                                             │  │
│  │  2. Rate Limiting (Redis-based)                             │  │
│  │     - Per-user based on package tier                        │  │
│  │     - Sliding window algorithm                              │  │
│  │                                                             │  │
│  │  3. Request Routing                                         │  │
│  │     - /v1/auth/*        → User Service                      │  │
│  │     - /v1/users/*       → User Service                      │  │
│  │     - /v1/packages/*    → Package Service                   │  │
│  │     - /v1/subscriptions/* → Package Service                 │  │
│  │     - /v1/chat/*        → AI Chatbot Service                │  │
│  │                                                             │  │
│  │  4. Response Aggregation                                    │  │
│  │     - Combine data from multiple services                   │  │
│  │                                                             │  │
│  │  5. Metrics Collection                                      │  │
│  │     - Request count, latency, errors                        │  │
│  │     - Export to Prometheus                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼────────┐  ┌─────▼──────────────┐
│ User Service │  │ Package Service │  │  AI Chatbot Svc    │
│  (Golang)    │  │   (Golang)      │  │    (Python)        │
│  Port: 8001  │  │   Port: 8002    │  │   Port: 8004       │
└───────┬──────┘  └────────┬────────┘  └─────┬──────────────┘
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼─────────────────┐  ┌────────────────▼──────┐
│  PostgreSQL + pgvector  │  │       Redis           │
│  - Relational data      │  │  - Session cache      │
│  - Vector embeddings    │  │  - API response cache │
│  Port: 5432             │  │  - Rate limit counter │
└─────────────────────────┘  │  Port: 6379           │
                             └───────────────────────┘
```

### 1.2 Technology Choices & Rationale

| Component | Technology | Why? |
|-----------|-----------|------|
| **API Gateway** | Golang/Gin | High performance, low latency, strong typing |
| **Backend Services** | Golang/Gin | Same as above, clean architecture support |
| **AI Service** | Python/FastAPI | Rich AI/ML ecosystem, async support |
| **Database** | PostgreSQL 16 | ACID, mature, pgvector for embeddings |
| **Cache** | Redis 7 | Fast, versatile (cache + queue + pub/sub) |
| **Web** | React + Vite | Modern, fast, large ecosystem |
| **Mobile** | Flutter | Single codebase, native performance, beautiful UI |

---

## 2. Service Communication

### 2.1 Communication Patterns

```
┌─────────────────┐
│  API Gateway    │
└────────┬────────┘
         │
         │ HTTP REST (current)
         │ gRPC (future for internal)
         ▼
┌─────────────────┐
│  User Service   │
└─────────────────┘

Pattern: Synchronous HTTP REST
Timeout: 5 seconds
Retry: 3 times with exponential backoff
Circuit Breaker: Open after 5 consecutive failures
```

### 2.2 Request Flow Example

**Client → API Gateway → User Service**

```go
// API Gateway
func (h *GatewayHandler) ForwardToUserService(c *gin.Context) {
    // 1. Extract user_id from JWT
    userID := c.GetString("user_id")

    // 2. Prepare request to User Service
    req := &http.Request{
        Method: "GET",
        URL:    "http://user-service:8001/internal/users/" + userID,
        Header: http.Header{
            "X-Request-ID": c.GetString("request_id"),
        },
    }

    // 3. Send request with timeout
    ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
    defer cancel()

    resp, err := h.httpClient.Do(req.WithContext(ctx))
    if err != nil {
        // Circuit breaker logic
        h.circuitBreaker.RecordFailure()
        c.JSON(503, gin.H{"error": "Service unavailable"})
        return
    }

    // 4. Return response
    c.JSON(resp.StatusCode, resp.Body)
}
```

### 2.3 Service Discovery

**Current:** Static configuration (environment variables)
```bash
USER_SERVICE_URL=http://user-service:8001
PACKAGE_SERVICE_URL=http://package-service:8002
```

**Future:** Consul/etcd for dynamic service discovery

---

## 3. Database Design

### 3.1 Schema Overview

```
┌─────────────────────────────────────────────────────┐
│                   PostgreSQL                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐      ┌──────────────┐               │
│  │  users   │──────│subscriptions │               │
│  └────┬─────┘      └──────┬───────┘               │
│       │                   │                        │
│       │                   ▼                        │
│       │            ┌─────────────┐                 │
│       │            │  packages   │                 │
│       │            └─────────────┘                 │
│       │                                            │
│       │            ┌──────────────┐                │
│       └────────────│usage_quotas  │                │
│                    └──────────────┘                │
│                                                     │
│  ┌──────────────┐      ┌─────────────┐            │
│  │conversations │      │  documents  │            │
│  │              │      │ (+ vectors) │            │
│  └──────────────┘      └─────────────┘            │
│                                                     │
│  Vector Search:                                    │
│  SELECT * FROM documents                           │
│  ORDER BY embedding <=> '[query_embedding]'        │
│  LIMIT 5;                                          │
└─────────────────────────────────────────────────────┘
```

### 3.2 Key Tables

#### 3.2.1 Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
```

**Purpose:** Store user accounts
**Key Features:**
- UUID primary key (better than auto-increment for distributed systems)
- bcrypt password hashing
- Soft delete support (deleted_at column)

#### 3.2.2 Documents Table (with pgvector)

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    title VARCHAR(500),
    content TEXT,

    -- Vector embedding (1536 dimensions)
    embedding vector(1536),

    -- Legal metadata
    article VARCHAR(50),
    chapter VARCHAR(100),

    created_at TIMESTAMP DEFAULT NOW()
);

-- HNSW index for fast vector search
CREATE INDEX idx_documents_embedding
ON documents USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**Purpose:** Store legal documents with semantic search capability
**Key Features:**
- **pgvector extension** for embeddings
- **HNSW index** - fast approximate nearest neighbor search
  - m=16: connections per layer
  - ef_construction=64: accuracy vs speed trade-off
- **Cosine similarity** - better than euclidean for text

**Performance:**
- 10K vectors: < 50ms query time
- 100K vectors: < 100ms query time
- 1M vectors: < 200ms query time

#### 3.2.3 Conversations Table

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    role VARCHAR(20),  -- user, assistant, system
    content TEXT,
    model VARCHAR(50),
    tokens_used INT,
    sources JSONB,     -- Array of document IDs
    created_at TIMESTAMP DEFAULT NOW()
);

-- Composite index for fast session retrieval
CREATE INDEX idx_conversations_user_session
ON conversations(user_id, session_id);
```

**Purpose:** Store chat history
**Partitioning Strategy:** Partition by month for large scale
```sql
CREATE TABLE conversations_2024_11 PARTITION OF conversations
FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');
```

---

## 4. RAG Pipeline

### 4.1 Complete RAG Flow

```
User Query: "EPR là gì?"
│
▼
┌─────────────────────────────────────────────────────────┐
│  STEP 1: Query Processing                               │
│  ┌───────────────────────────────────────────────────┐ │
│  │ - Normalize text (lowercase, remove accents)      │ │
│  │ - Detect language (Vietnamese)                    │ │
│  │ - Extract keywords                                │ │
│  └───────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 2: Generate Embedding                             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ OpenAI API:                                       │ │
│  │  POST https://api.openai.com/v1/embeddings       │ │
│  │  {                                                │ │
│  │    "model": "text-embedding-3-small",            │ │
│  │    "input": "EPR là gì?"                         │ │
│  │  }                                               │ │
│  │                                                  │ │
│  │  Response: [0.02, -0.15, 0.08, ... ] (1536 dims)│ │
│  └───────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 3: Vector Similarity Search (PostgreSQL)          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ SELECT                                            │ │
│  │   id,                                             │ │
│  │   title,                                          │ │
│  │   content,                                        │ │
│  │   article,                                        │ │
│  │   1 - (embedding <=> $1) AS similarity           │ │
│  │ FROM documents                                    │ │
│  │ WHERE 1 - (embedding <=> $1) > 0.7               │ │
│  │ ORDER BY embedding <=> $1                        │ │
│  │ LIMIT 5;                                          │ │
│  │                                                   │ │
│  │ $1 = [0.02, -0.15, 0.08, ...]  (query embedding)│ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Results:                                               │
│  1. Điều 5 - Định nghĩa EPR (similarity: 0.92)        │
│  2. Điều 8 - Trách nhiệm EPR (similarity: 0.85)       │
│  3. Điều 12 - Đối tượng áp dụng (similarity: 0.78)    │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 4: Retrieve Conversation History                  │
│  ┌───────────────────────────────────────────────────┐ │
│  │ SELECT role, content                              │ │
│  │ FROM conversations                                │ │
│  │ WHERE user_id = $1 AND session_id = $2           │ │
│  │ ORDER BY created_at DESC                          │ │
│  │ LIMIT 5;                                          │ │
│  │                                                   │ │
│  │ Results (last 5 messages):                        │ │
│  │ - user: "Xin chào"                                │ │
│  │ - assistant: "Xin chào! Tôi là luật sư Minh Anh"│ │
│  │ - user: "EPR là gì?"                              │ │
│  └───────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 5: Build Context                                  │
│  ┌───────────────────────────────────────────────────┐ │
│  │ context = {                                       │ │
│  │   system_prompt: "Bạn là luật sư Minh Anh...",   │ │
│  │   conversation_history: [                         │ │
│  │     {role: "user", content: "Xin chào"},         │ │
│  │     {role: "assistant", content: "Xin chào..."}  │ │
│  │   ],                                              │ │
│  │   retrieved_docs: [                               │ │
│  │     {                                             │ │
│  │       source: "Điều 5",                           │ │
│  │       content: "EPR là Extended Producer..."     │ │
│  │     },                                            │ │
│  │     ...                                           │ │
│  │   ],                                              │ │
│  │   user_query: "EPR là gì?"                        │ │
│  │ }                                                 │ │
│  └───────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 6: LLM Generation (OpenAI GPT-3.5/4)             │
│  ┌───────────────────────────────────────────────────┐ │
│  │ POST https://api.openai.com/v1/chat/completions  │ │
│  │ {                                                 │ │
│  │   "model": "gpt-3.5-turbo",                      │ │
│  │   "messages": [                                   │ │
│  │     {                                             │ │
│  │       "role": "system",                           │ │
│  │       "content": "Bạn là luật sư Minh Anh..."    │ │
│  │     },                                            │ │
│  │     ...conversation_history,                      │ │
│  │     {                                             │ │
│  │       "role": "user",                             │ │
│  │       "content": "EPR là gì?\n\nContext: ..."    │ │
│  │     }                                             │ │
│  │   ],                                              │ │
│  │   "temperature": 0.1                              │ │
│  │ }                                                 │ │
│  │                                                   │ │
│  │ Response:                                         │ │
│  │ "EPR (Extended Producer Responsibility) là..."   │ │
│  └───────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 7: Save to Database                               │
│  ┌───────────────────────────────────────────────────┐ │
│  │ -- Save user message                              │ │
│  │ INSERT INTO conversations                         │ │
│  │ (user_id, session_id, role, content)              │ │
│  │ VALUES ($1, $2, 'user', 'EPR là gì?');           │ │
│  │                                                   │ │
│  │ -- Save assistant response                        │ │
│  │ INSERT INTO conversations                         │ │
│  │ (user_id, session_id, role, content, sources)    │ │
│  │ VALUES (                                          │ │
│  │   $1, $2, 'assistant',                            │ │
│  │   'EPR là...',                                    │ │
│  │   '["doc-id-1", "doc-id-2"]'::jsonb              │ │
│  │ );                                                │ │
│  └───────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 8: Return Response to Client                      │
│  ┌───────────────────────────────────────────────────┐ │
│  │ {                                                 │ │
│  │   "answer": "EPR (Extended Producer...",         │ │
│  │   "sources": [                                    │ │
│  │     {                                             │ │
│  │       "title": "Điều 5",                          │ │
│  │       "article": "5",                             │ │
│  │       "similarity": 0.92                          │ │
│  │     }                                             │ │
│  │   ],                                              │ │
│  │   "tokens_used": 450,                             │ │
│  │   "response_time_ms": 1250                        │ │
│  │ }                                                 │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Performance Optimization

**Caching Strategy:**

```python
# 1. Check cache first (Redis)
cache_key = f"chat:query:{hash(query)}"
cached_response = redis.get(cache_key)
if cached_response:
    return cached_response

# 2. If not cached, run full RAG pipeline
response = run_rag_pipeline(query)

# 3. Cache for 1 hour
redis.setex(cache_key, 3600, response)

return response
```

**Token Optimization:**
```python
# Truncate long documents
def truncate_doc(doc, max_tokens=500):
    tokens = tokenize(doc.content)
    if len(tokens) > max_tokens:
        return tokens[:max_tokens]
    return tokens
```

---

## 5. Authentication Flow

### 5.1 JWT Authentication

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ POST /v1/auth/login
     │ {email, password}
     ▼
┌─────────────────┐
│  API Gateway    │
│  (no auth req)  │
└────┬────────────┘
     │
     │ Forward to User Service
     ▼
┌──────────────────────────────────┐
│  User Service                    │
│                                  │
│  1. Find user by email           │
│     SELECT * FROM users          │
│     WHERE email = $1;            │
│                                  │
│  2. Verify password              │
│     bcrypt.CompareHashAndPassword│
│     (stored_hash, password)      │
│                                  │
│  3. Generate JWT tokens          │
│     access_token = jwt.New({     │
│       user_id: user.ID,          │
│       email: user.Email,         │
│       exp: now + 15min           │
│     })                           │
│                                  │
│     refresh_token = jwt.New({    │
│       user_id: user.ID,          │
│       exp: now + 7days           │
│     })                           │
│                                  │
│  4. Store refresh token          │
│     INSERT INTO refresh_tokens   │
│     (user_id, token, expires_at) │
│     VALUES ($1, $2, $3);         │
│                                  │
│  5. Return tokens                │
│     return {                     │
│       access_token,              │
│       refresh_token,             │
│       expires_in: 900  # 15 min  │
│     }                            │
└──────────────────────────────────┘
```

### 5.2 Protected Endpoint Flow

```
Client → API Gateway → Backend Service

1. Client adds token to header:
   Authorization: Bearer eyJhbGc...

2. API Gateway middleware:
   func AuthMiddleware(c *gin.Context) {
       token := c.GetHeader("Authorization")

       claims, err := jwt.Verify(token)
       if err != nil {
           c.JSON(401, gin.H{"error": "Unauthorized"})
           return
       }

       // Add user_id to context
       c.Set("user_id", claims.UserID)
       c.Next()
   }

3. Backend service receives user_id in header/context
```

---

## 6. Request Lifecycle

### Complete Request Flow

```
Client sends: GET /v1/chat/history?session_id=abc123
│
▼
┌──────────────────────────────────────────────┐
│  1. Cloudflare Edge                          │
│     - Check rate limit (IP: 100 req/min)     │
│     - DDoS protection                        │
│     - SSL/TLS termination                    │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  2. Nginx Reverse Proxy                      │
│     - Route to API Gateway:8000              │
│     - Add X-Forwarded-For header             │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  3. API Gateway (Middleware Chain)           │
│                                              │
│  a. Request ID Middleware                    │
│     - Generate UUID                          │
│     - Add X-Request-ID header                │
│                                              │
│  b. Logging Middleware                       │
│     - Log request: method, path, IP          │
│     - Start timer                            │
│                                              │
│  c. CORS Middleware                          │
│     - Check Origin                           │
│     - Add CORS headers                       │
│                                              │
│  d. Auth Middleware                          │
│     - Extract JWT from header                │
│     - Verify signature                       │
│     - Check expiration                       │
│     - Extract user_id                        │
│                                              │
│  e. Rate Limit Middleware (Redis)            │
│     key = "ratelimit:user:" + user_id        │
│     count = INCR key                         │
│     if count == 1:                           │
│         EXPIRE key 86400  # 1 day            │
│     if count > quota_limit:                  │
│         return 429 Too Many Requests         │
│                                              │
│  f. Route Handler                            │
│     - Forward to AI Chatbot Service          │
│                                              │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  4. AI Chatbot Service                       │
│                                              │
│  a. Validate request                         │
│     - Check session_id format                │
│                                              │
│  b. Query database                           │
│     SELECT * FROM conversations              │
│     WHERE user_id = $1                       │
│       AND session_id = $2                    │
│     ORDER BY created_at DESC                 │
│     LIMIT 20;                                │
│                                              │
│  c. Format response                          │
│     {                                        │
│       "messages": [...],                     │
│       "total": 15,                           │
│       "session_id": "abc123"                 │
│     }                                        │
│                                              │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│  5. API Gateway (Response)                   │
│     - Log response time                      │
│     - Add headers                            │
│     - Return to client                       │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
             Client receives response

Total time: ~150ms
```

---

## 7. Caching Strategy

### 7.1 Multi-Layer Caching

```
┌─────────────────────────────────────────┐
│  Layer 1: Cloudflare CDN                │
│  - Static assets (JS, CSS, images)      │
│  - TTL: 24 hours                        │
│  - Hit rate: ~95%                       │
└─────────────────┬───────────────────────┘
                  │ Cache miss
                  ▼
┌─────────────────────────────────────────┐
│  Layer 2: Redis Application Cache       │
│  - API responses                        │
│  - TTL: 1 hour                          │
│  - Hit rate: ~60%                       │
│                                         │
│  Examples:                              │
│  - chat:query:{hash}   → RAG response   │
│  - user:{id}:profile   → User data      │
│  - package:{id}        → Package info   │
└─────────────────┬───────────────────────┘
                  │ Cache miss
                  ▼
┌─────────────────────────────────────────┐
│  Layer 3: Database Query Cache          │
│  - PostgreSQL query result cache        │
│  - Shared buffers: 256MB                │
└─────────────────────────────────────────┘
```

### 7.2 Cache Invalidation

```python
# When user updates profile
def update_user_profile(user_id, data):
    # Update database
    db.execute("UPDATE users SET ... WHERE id = %s", user_id)

    # Invalidate cache
    redis.delete(f"user:{user_id}:profile")

    # Publish event for other services
    redis.publish("user:updated", json.dumps({
        "user_id": user_id,
        "timestamp": now()
    }))
```

---

## 8. Error Handling

### 8.1 Error Response Format

```json
{
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Bạn đã hết quota truy vấn hôm nay",
    "details": {
      "quota_used": 10,
      "quota_limit": 10,
      "reset_at": "2024-11-13T00:00:00Z"
    },
    "request_id": "req_abc123xyz"
  }
}
```

### 8.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid/expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `QUOTA_EXCEEDED` | 429 | Daily/monthly quota exceeded |
| `INVALID_REQUEST` | 400 | Validation error |
| `NOT_FOUND` | 404 | Resource not found |
| `SERVICE_UNAVAILABLE` | 503 | Backend service down |
| `INTERNAL_ERROR` | 500 | Unexpected error |

### 8.3 Retry Logic

```go
func RetryWithBackoff(fn func() error, maxRetries int) error {
    for i := 0; i < maxRetries; i++ {
        err := fn()
        if err == nil {
            return nil
        }

        // Exponential backoff
        backoff := time.Duration(math.Pow(2, float64(i))) * time.Second
        time.Sleep(backoff)
    }
    return errors.New("max retries exceeded")
}
```

---

## 9. Monitoring & Observability

### 9.1 Metrics Collected

**Golden Signals:**
- **Latency:** p50, p95, p99 response times
- **Traffic:** Requests per second
- **Errors:** Error rate (%)
- **Saturation:** CPU, memory, database connections

**Business Metrics:**
- Queries per user/day
- OpenAI API costs
- Conversion rate (free → paid)
- Churn rate

### 9.2 Distributed Tracing

```
Request ID: req_abc123xyz

Trace:
├─ API Gateway           [0ms - 5ms]      5ms
├─ Auth Middleware       [5ms - 8ms]      3ms
├─ Rate Limit Check      [8ms - 12ms]     4ms
├─ AI Chatbot Service    [12ms - 1200ms] 1188ms
│  ├─ DB Query (history) [15ms - 35ms]    20ms
│  ├─ OpenAI Embedding   [40ms - 250ms]  210ms
│  ├─ Vector Search      [255ms - 280ms]  25ms
│  ├─ OpenAI GPT         [285ms - 1150ms] 865ms
│  └─ DB Insert          [1155ms - 1180ms] 25ms
└─ Response              [1200ms - 1205ms] 5ms

Total: 1205ms
```

---

**Conclusion:** Kiến trúc này được thiết kế để:
- ✅ Scale từ 20 users → 10K users
- ✅ Maintain < 200ms average response time
- ✅ Cost-effective với free tiers
- ✅ Easy to maintain và monitor
- ✅ Production-ready

---

**Next:** [Deployment Guide](./DEPLOYMENT.md)
