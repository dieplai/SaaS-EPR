#!/usr/bin/env python3
"""
Test script for user confirmation query transformation
Simulates the real scenario:
1. User asks structure violation: "trong điều 5 có bao nhiêu điều"
2. Bot detects and asks clarification: "Có thể bạn muốn hỏi về nội dung của Điều 5?"
3. User confirms: "đúng vậy"
4. Bot should transform query to "nội dung của Điều 5"
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Import the chatbot core
from epr_chatbot_core import analyze_query_clarity

def test_user_confirmation_transformation():
    """Test that user confirmation triggers query transformation"""
    print("\n" + "="*80)
    print("🧪 TEST: User Confirmation Query Transformation")
    print("="*80)

    # Scenario: Assistant asked clarification, user confirmed
    chat_history = """Human: trong điều 5 có bao nhiêu điều
Assistant: Theo cấu trúc văn bản pháp luật, điều không thể chứa điều khác. Có thể bạn muốn hỏi về nội dung của Điều 5?"""

    query = "đúng vậy"

    print(f"\n📝 Chat History:")
    print(chat_history)
    print(f"\n💬 User Query: {query}")

    result = analyze_query_clarity(query, chat_history)

    print(f"\n📊 Clarity Analysis Result:")
    print(f"  Is Clear: {result['is_clear']}")
    print(f"  Issue Type: {result['issue_type']}")
    print(f"  Transformed Query: {result.get('transformed_query', 'None')}")

    # Check if transformation happened
    if result.get('transformed_query'):
        print(f"\n✅ SUCCESS: Query was transformed!")
        print(f"   Original: {query}")
        print(f"   Transformed: {result['transformed_query']}")
        return True
    else:
        print(f"\n❌ FAILED: Query was NOT transformed!")
        return False

def test_another_confirmation():
    """Test another confirmation scenario"""
    print("\n" + "="*80)
    print("🧪 TEST: Another Confirmation with 'Trong chương 4...'")
    print("="*80)

    chat_history = """Human: trong mục 4 có bao nhiêu chương
Assistant: Theo cấu trúc văn bản pháp luật, mục không thể chứa chương. Có thể bạn muốn hỏi 'Trong chương 4 có bao nhiêu mục?'"""

    query = "đúng"

    print(f"\n📝 Chat History:")
    print(chat_history)
    print(f"\n💬 User Query: {query}")

    result = analyze_query_clarity(query, chat_history)

    print(f"\n📊 Clarity Analysis Result:")
    print(f"  Is Clear: {result['is_clear']}")
    print(f"  Issue Type: {result['issue_type']}")
    print(f"  Transformed Query: {result.get('transformed_query', 'None')}")

    if result.get('transformed_query'):
        print(f"\n✅ SUCCESS: Query was transformed!")
        print(f"   Original: {query}")
        print(f"   Transformed: {result['transformed_query']}")
        return True
    else:
        print(f"\n❌ FAILED: Query was NOT transformed!")
        return False

def test_no_confirmation():
    """Test that normal queries are NOT transformed"""
    print("\n" + "="*80)
    print("🧪 TEST: Normal Query (Should NOT Transform)")
    print("="*80)

    chat_history = ""
    query = "điều 5 nói về gì"

    print(f"\n💬 User Query: {query}")
    print(f"📝 Chat History: (empty)")

    result = analyze_query_clarity(query, chat_history)

    print(f"\n📊 Clarity Analysis Result:")
    print(f"  Is Clear: {result['is_clear']}")
    print(f"  Issue Type: {result['issue_type']}")
    print(f"  Transformed Query: {result.get('transformed_query', 'None')}")

    if not result.get('transformed_query'):
        print(f"\n✅ SUCCESS: Normal query was NOT transformed (as expected)")
        return True
    else:
        print(f"\n❌ FAILED: Normal query was incorrectly transformed!")
        return False

def main():
    """Run all tests"""
    print("\n" + "🔬"*40)
    print("TESTING USER CONFIRMATION QUERY TRANSFORMATION")
    print("🔬"*40)

    results = {}

    try:
        results['test1'] = test_user_confirmation_transformation()
        results['test2'] = test_another_confirmation()
        results['test3'] = test_no_confirmation()
    except Exception as e:
        print(f"\n❌ ERROR during testing: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Print summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)

    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")

    all_passed = all(results.values())
    total = len(results)
    passed_count = sum(results.values())

    print(f"\nTotal: {passed_count}/{total} tests passed")

    if all_passed:
        print("\n🎉 ALL TESTS PASSED! Query transformation is working correctly.")
        return True
    else:
        print("\n❌ SOME TESTS FAILED. Query transformation needs adjustment.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
