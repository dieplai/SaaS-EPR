from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import openai
import os

from config import Config
from middleware.auth import verify_token
from clients.package_client import PackageServiceClient
from routes import api_routes

# Initialize systems (will be done on startup)
app = FastAPI(
    title="AI Chatbot Service - TOP-TIER RAG",
    description="Legal consultation chatbot with advanced RAG pipeline",
    version="2.0.0-advanced"
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
    advanced_retriever_system = None

app.state = AppState()

@app.on_event("startup")
async def startup_event():
    """
    Initialize all systems on startup.
    """
    print("\n" + "="*70)
    print("🚀 INITIALIZING TOP-TIER RAG SYSTEM")
    print("="*70 + "\n")

    # Initialize OpenAI
    openai.api_key = Config.OPENAI_API_KEY
    app.state.openai_client = openai.OpenAI(api_key=Config.OPENAI_API_KEY)
    print("✅ OpenAI client initialized")

    # Initialize Package Service client
    app.state.package_client = PackageServiceClient()
    print("✅ Package Service client initialized")

    # Check if using advanced RAG or legacy
    use_advanced = os.getenv("USE_ADVANCED_RAG", "true").lower() == "true"

    if use_advanced:
        print("\n🎯 Loading ADVANCED RAG System...\n")

        # Import advanced components
        from retriever.advanced_setup import AdvancedRetrieverSystem
        from systems.faq_system import FAQSystem
        from systems.pdf_catalog_system import PDFCatalogSystem
        from systems.app_info_system import AppInfoSystem
        from systems.scope_checker import ScopeChecker
        from systems.conversation_tracker import ConversationTracker
        from systems.conversation_memory import ConversationMemory
        from handlers.advanced_query_handler import AdvancedQueryHandler

        # Initialize Advanced Retriever System
        app.state.advanced_retriever_system = AdvancedRetrieverSystem()
        success = app.state.advanced_retriever_system.initialize()

        if not success:
            print("⚠️  Warning: Advanced RAG initialization failed, some features may be unavailable")

        # Initialize support systems
        faq_system = FAQSystem(app.state.openai_client)
        pdf_catalog_system = PDFCatalogSystem()
        app_info_system = AppInfoSystem(app.state.openai_client)
        scope_checker = ScopeChecker(app.state.openai_client)
        conversation_tracker = ConversationTracker()
        conversation_memory = ConversationMemory(
            max_messages=20,
            max_tokens_estimate=8000
        )
        print("✅ Support systems initialized")

        # Initialize Advanced Query Handler
        app.state.query_handler = AdvancedQueryHandler(
            faq_system=faq_system,
            pdf_catalog_system=pdf_catalog_system,
            app_info_system=app_info_system,
            advanced_retriever_system=app.state.advanced_retriever_system,
            scope_checker=scope_checker,
            conversation_tracker=conversation_tracker,
            conversation_memory=conversation_memory,
            openai_client=app.state.openai_client
        )
        print("✅ Advanced Query Handler initialized")

        print("\n" + "="*70)
        print("✅ TOP-TIER RAG SYSTEM READY!")
        print("="*70 + "\n")

        # Print system info
        sys_info = app.state.advanced_retriever_system.get_system_info()
        print("📊 Active Components:")
        for component, status in sys_info['components'].items():
            if isinstance(status, dict) and status.get('enabled'):
                print(f"   ✓ {component.replace('_', ' ').title()}")

    else:
        print("\n📦 Loading Legacy RAG System...\n")

        # Use legacy system
        from retriever.setup import RetrieverSystem
        from systems.faq_system import FAQSystem
        from systems.pdf_catalog_system import PDFCatalogSystem
        from systems.app_info_system import AppInfoSystem
        from systems.scope_checker import ScopeChecker
        from systems.conversation_tracker import ConversationTracker
        from handlers.query_handler import QueryHandler

        retriever_system = RetrieverSystem()
        retriever_system.initialize()

        faq_system = FAQSystem(app.state.openai_client)
        pdf_catalog_system = PDFCatalogSystem()
        app_info_system = AppInfoSystem(app.state.openai_client)
        scope_checker = ScopeChecker(app.state.openai_client)
        conversation_tracker = ConversationTracker()

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

        print("✅ Legacy RAG system initialized")

    print("\n🚀 AI Chatbot Service ready!\n")

# Include routes
app.include_router(api_routes.router, prefix="/api/v1", tags=["chatbot"])

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    system_info = {}
    if app.state.advanced_retriever_system:
        system_info = app.state.advanced_retriever_system.get_system_info()

    return {
        "status": "healthy",
        "service": "ai-chatbot-service",
        "version": "2.0.0-advanced",
        "system_ready": app.state.query_handler is not None,
        "system_info": system_info
    }

@app.get("/system/stats")
async def get_system_stats():
    """Get system statistics"""
    if hasattr(app.state.query_handler, 'get_stats'):
        return app.state.query_handler.get_stats()
    return {"message": "Stats not available in legacy mode"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=Config.PORT,
        reload=Config.DEBUG
    )
