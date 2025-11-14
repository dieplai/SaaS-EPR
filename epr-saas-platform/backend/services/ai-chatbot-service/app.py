from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import openai

from config import Config
from middleware.auth import verify_token
from clients.package_client import PackageServiceClient
from routes import api_routes

# Initialize systems (will be done on startup)
app = FastAPI(
    title="AI Chatbot Service",
    description="Legal consultation chatbot with RAG pipeline",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state (initialized on startup)
class AppState:
    query_handler = None
    package_client = None
    openai_client = None

app.state = AppState()

@app.on_event("startup")
async def startup_event():
    """
    Initialize all systems on startup.
    """
    print("🔧 Initializing AI Chatbot Service...")

    # Initialize OpenAI
    openai.api_key = Config.OPENAI_API_KEY
    app.state.openai_client = openai.OpenAI(api_key=Config.OPENAI_API_KEY)
    print("✅ OpenAI client initialized")

    # Initialize Package Service client
    app.state.package_client = PackageServiceClient()
    print("✅ Package Service client initialized")

    # Initialize RAG systems (import here to avoid circular imports)
    from retriever.setup import RetrieverSystem
    from systems.faq_system import FAQSystem
    from systems.pdf_catalog_system import PDFCatalogSystem
    from systems.app_info_system import AppInfoSystem
    from systems.scope_checker import ScopeChecker
    from systems.conversation_tracker import ConversationTracker
    from handlers.query_handler import QueryHandler

    # Initialize Weaviate + RAG
    retriever_system = RetrieverSystem()
    retriever_system.initialize()
    print("✅ Retriever system (Weaviate + RAG) initialized")

    # Initialize other systems
    faq_system = FAQSystem(app.state.openai_client)
    pdf_catalog_system = PDFCatalogSystem()
    app_info_system = AppInfoSystem(app.state.openai_client)
    scope_checker = ScopeChecker(app.state.openai_client)
    conversation_tracker = ConversationTracker()
    print("✅ All support systems initialized")

    # Initialize main query handler
    app.state.query_handler = QueryHandler(
        faq_system=faq_system,
        pdf_catalog_system=pdf_catalog_system,
        app_info_system=app_info_system,
        retriever=retriever_system.get_retriever(),
        query_engine=retriever_system.get_query_engine(),
        scope_checker=scope_checker,
        conversation_tracker=conversation_tracker,
        openai_client=app.state.openai_client
    )
    print("✅ Query handler initialized")
    print("🚀 AI Chatbot Service ready!")

# Include routes
app.include_router(api_routes.router, prefix="/api/v1", tags=["chatbot"])

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-chatbot-service",
        "version": "2.0.0",
        "system_ready": app.state.query_handler is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=Config.PORT,
        reload=Config.DEBUG
    )
