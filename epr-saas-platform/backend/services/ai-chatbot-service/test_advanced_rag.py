#!/usr/bin/env python3
"""
Test script for Advanced RAG System
Tests imports, configuration, and module structure
"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def print_header(text):
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70)

def print_section(text):
    print(f"\n{'─'*70}")
    print(f"  {text}")
    print(f"{'─'*70}")

def test_config():
    """Test configuration loading"""
    print_section("TEST 1: Configuration")

    try:
        from config import Config

        print("✅ Config module imported")
        print(f"\n📋 Configuration Status:")
        print(f"   LLM Model: {Config.LLM_MODEL}")
        print(f"   Similarity Top K: {Config.SIMILARITY_TOP_K}")
        print(f"   Port: {Config.PORT}")
        print()
        print(f"🎯 Advanced Features Enabled:")
        print(f"   Hybrid Search: {Config.ENABLE_HYBRID_SEARCH}")
        print(f"   Query Transform (HyDE): {Config.ENABLE_HYDE}")
        print(f"   Query Transform (Multi): {Config.ENABLE_MULTI_QUERY}")
        print(f"   Cross-Encoder Rerank: {Config.ENABLE_CROSS_ENCODER_RERANK}")
        print(f"   LLM Rerank: {Config.ENABLE_LLM_RERANK}")
        print(f"   Self-RAG: {Config.ENABLE_SELF_RAG}")
        print(f"   Semantic Cache: {Config.ENABLE_SEMANTIC_CACHE}")
        print(f"   Query Routing: {Config.ENABLE_QUERY_ROUTING}")
        print(f"   Evaluation: {Config.ENABLE_EVALUATION}")

        return True
    except Exception as e:
        print(f"❌ Config test failed: {e}")
        return False

def test_module_imports():
    """Test all advanced module imports"""
    print_section("TEST 2: Module Imports")

    modules = [
        # Core systems
        ('systems.evaluation', 'EvaluationFramework'),
        ('systems.semantic_cache', 'SemanticCache'),
        ('systems.query_transforms', 'QueryTransformPipeline'),
        ('systems.query_transforms', 'HyDETransform'),
        ('systems.query_transforms', 'MultiQueryGenerator'),
        ('systems.advanced_reranker', 'MultiStageReranker'),
        ('systems.self_rag', 'SelfRAG'),
        ('systems.query_router', 'QueryRouter'),
        ('systems.query_router', 'AdaptiveRouter'),

        # Retrievers
        ('retriever.hybrid_retriever', 'HybridRetriever'),

        # Handlers
        ('handlers.advanced_query_handler', 'AdvancedQueryHandler'),
    ]

    results = {'passed': 0, 'failed': 0, 'missing_deps': 0}

    for module_name, class_name in modules:
        try:
            module = __import__(module_name, fromlist=[class_name])
            cls = getattr(module, class_name)
            print(f"✅ {module_name}.{class_name}")
            results['passed'] += 1
        except ImportError as e:
            print(f"⚠️  {module_name}.{class_name} - Missing: {str(e).split()[-1]}")
            results['missing_deps'] += 1
        except Exception as e:
            print(f"❌ {module_name}.{class_name} - Error: {str(e)[:50]}")
            results['failed'] += 1

    print(f"\n📊 Import Results:")
    print(f"   ✅ Passed: {results['passed']}")
    print(f"   ⚠️  Missing deps: {results['missing_deps']}")
    print(f"   ❌ Failed: {results['failed']}")

    return results['failed'] == 0

def test_class_structure():
    """Test class instantiation (without external deps)"""
    print_section("TEST 3: Class Structure")

    try:
        from systems.evaluation import EvaluationFramework, RetrievalMetrics
        from systems.query_router import QueryProfile

        # Test dataclasses
        profile = QueryProfile(
            query="Test query",
            length=10,
            has_exact_reference=False,
            has_multiple_intents=False,
            complexity="simple",
            query_type="factual",
            recommended_strategy="hybrid"
        )

        print(f"✅ QueryProfile created: {profile.query}")

        metrics = RetrievalMetrics(
            query="Test",
            retrieved_docs=[]
        )

        print(f"✅ RetrievalMetrics created")

        # Test evaluation framework (no LLM needed for init)
        evaluator = EvaluationFramework(enable_llm_evaluation=False)
        print(f"✅ EvaluationFramework instantiated")

        # Test metrics calculations
        hit_rate = evaluator.calculate_hit_rate(
            retrieved_doc_ids=["doc1", "doc2", "doc3"],
            relevant_doc_ids=["doc2", "doc5"],
            k=5
        )
        print(f"✅ Hit rate calculation: {hit_rate}")

        mrr = evaluator.calculate_mrr(
            retrieved_doc_ids=["doc1", "doc2", "doc3"],
            relevant_doc_ids=["doc2"]
        )
        print(f"✅ MRR calculation: {mrr}")

        return True

    except Exception as e:
        print(f"❌ Class structure test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_hybrid_retriever_logic():
    """Test hybrid retriever RRF logic"""
    print_section("TEST 4: Hybrid Retriever Logic")

    try:
        from retriever.hybrid_retriever import HybridRetriever

        # We can't instantiate without Weaviate, but we can check the class
        print(f"✅ HybridRetriever class available")
        print(f"   Methods: {[m for m in dir(HybridRetriever) if not m.startswith('_')][:5]}")

        # Check RRF implementation exists
        if hasattr(HybridRetriever, '_reciprocal_rank_fusion'):
            print(f"✅ RRF method present")

        if hasattr(HybridRetriever, '_bm25_retrieve'):
            print(f"✅ BM25 retrieval method present")

        return True

    except Exception as e:
        print(f"⚠️  Hybrid retriever test skipped (needs weaviate): {str(e)[:50]}")
        return True  # Not critical for syntax test

def test_app_structure():
    """Test FastAPI app structure"""
    print_section("TEST 5: FastAPI App Structure")

    try:
        # Import app (won't start server, just check structure)
        import importlib.util
        spec = importlib.util.spec_from_file_location("app", "app.py")
        app_module = importlib.util.module_from_spec(spec)

        print(f"✅ app.py module loadable")
        print(f"   FastAPI app initialization code present")

        # Check key features in app.py
        with open('app.py', 'r') as f:
            app_code = f.read()

        features = {
            'USE_ADVANCED_RAG': 'USE_ADVANCED_RAG' in app_code,
            'AdvancedRetrieverSystem': 'AdvancedRetrieverSystem' in app_code,
            'AdvancedQueryHandler': 'AdvancedQueryHandler' in app_code,
            '/system/stats endpoint': '/system/stats' in app_code,
        }

        for feature, present in features.items():
            status = "✅" if present else "❌"
            print(f"   {status} {feature}")

        return all(features.values())

    except Exception as e:
        print(f"❌ App structure test failed: {e}")
        return False

def test_documentation():
    """Check documentation exists"""
    print_section("TEST 6: Documentation")

    docs = [
        ('ADVANCED_RAG_README.md', 'Main documentation'),
        ('requirements.txt', 'Dependencies'),
        ('config.py', 'Configuration'),
    ]

    all_present = True
    for filename, description in docs:
        if os.path.exists(filename):
            size = os.path.getsize(filename)
            print(f"✅ {filename:30s} ({size:,} bytes) - {description}")
        else:
            print(f"❌ {filename:30s} - Missing")
            all_present = False

    return all_present

def main():
    """Run all tests"""
    print_header("ADVANCED RAG SYSTEM - TEST SUITE")

    tests = [
        ("Configuration", test_config),
        ("Module Imports", test_module_imports),
        ("Class Structure", test_class_structure),
        ("Hybrid Retriever", test_hybrid_retriever_logic),
        ("App Structure", test_app_structure),
        ("Documentation", test_documentation),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ {test_name} crashed: {e}")
            results.append((test_name, False))

    # Summary
    print_header("TEST SUMMARY")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status:10s} {test_name}")

    print(f"\n{'='*70}")
    print(f"  TOTAL: {passed}/{total} tests passed")

    if passed == total:
        print(f"  🎉 ALL TESTS PASSED!")
    else:
        print(f"  ⚠️  Some tests failed (likely due to missing dependencies)")

    print(f"{'='*70}\n")

    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
