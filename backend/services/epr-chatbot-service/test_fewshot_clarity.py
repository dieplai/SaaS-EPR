#!/usr/bin/env python3
"""
Test script for few-shot clarity analysis implementation
Tests specific cases that were failing before:
1. User confirmation with "đúng vậy"
2. User confirmation with "đúng"
3. Ambiguous section query "mục 2 thuộc chương nào"
4. Structure violation "trong mục 4 có bao nhiêu chương"
"""

import asyncio
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Import the chatbot core
from epr_chatbot_core import analyze_query_clarity

def test_case_1():
    """Test Case 1: User confirms with 'đúng vậy'"""
    print("\n" + "="*60)
    print("TEST CASE 1: User confirms with 'đúng vậy'")
    print("="*60)

    chat_history = """Human: điều 5 có bao nhiêu điều
Assistant: Theo cấu trúc văn bản pháp luật, điều không thể chứa điều khác. Có thể bạn muốn hỏi về nội dung của Điều 5?"""

    query = "đúng vậy"

    print(f"Query: {query}")
    print(f"Chat History:\n{chat_history}")

    result = analyze_query_clarity(query, chat_history)

    print(f"\nResult:")
    print(f"  Is Clear: {result['is_clear']} {'✅' if result['is_clear'] else '❌'}")
    print(f"  Issue Type: {result['issue_type']}")
    print(f"  Clarifying Question: {result.get('clarifying_question', '')}")

    # Expected: is_clear = True
    return result['is_clear'] == True

def test_case_2():
    """Test Case 2: User confirms with 'đúng'"""
    print("\n" + "="*60)
    print("TEST CASE 2: User confirms with 'đúng'")
    print("="*60)

    chat_history = """Human: trong mục 4 có bao nhiêu chương
Assistant: Theo cấu trúc văn bản pháp luật, mục không thể chứa chương. Có thể bạn muốn hỏi 'Trong chương 4 có bao nhiêu mục?'"""

    query = "đúng"

    print(f"Query: {query}")
    print(f"Chat History:\n{chat_history}")

    result = analyze_query_clarity(query, chat_history)

    print(f"\nResult:")
    print(f"  Is Clear: {result['is_clear']} {'✅' if result['is_clear'] else '❌'}")
    print(f"  Issue Type: {result['issue_type']}")
    print(f"  Clarifying Question: {result.get('clarifying_question', '')}")

    # Expected: is_clear = True
    return result['is_clear'] == True

def test_case_3():
    """Test Case 3: User rephrases with confirmation"""
    print("\n" + "="*60)
    print("TEST CASE 3: User rephrases with confirmation")
    print("="*60)

    chat_history = """Human: trong mục 4 có bao nhiêu chương
Assistant: Theo cấu trúc văn bản pháp luật, mục không thể chứa chương. Có thể bạn muốn hỏi 'Trong chương 4 có bao nhiêu mục?'"""

    query = "đúng trong chương 4 có bao nhiêu mục"

    print(f"Query: {query}")
    print(f"Chat History:\n{chat_history}")

    result = analyze_query_clarity(query, chat_history)

    print(f"\nResult:")
    print(f"  Is Clear: {result['is_clear']} {'✅' if result['is_clear'] else '❌'}")
    print(f"  Issue Type: {result['issue_type']}")
    print(f"  Clarifying Question: {result.get('clarifying_question', '')}")

    # Expected: is_clear = True
    return result['is_clear'] == True

def test_case_4():
    """Test Case 4: Query with specific number (should be clear)"""
    print("\n" + "="*60)
    print("TEST CASE 4: Query with specific number")
    print("="*60)

    chat_history = ""
    query = "mục 2 thuộc chương nào"

    print(f"Query: {query}")
    print(f"Chat History: (empty)")

    result = analyze_query_clarity(query, chat_history)

    print(f"\nResult:")
    print(f"  Is Clear: {result['is_clear']} {'✅' if result['is_clear'] else '❌'}")
    print(f"  Issue Type: {result['issue_type']}")
    print(f"  Clarifying Question: {result.get('clarifying_question', '')}")

    # Expected: is_clear = True (has specific number)
    return result['is_clear'] == True

def test_case_5():
    """Test Case 5: Structure violation"""
    print("\n" + "="*60)
    print("TEST CASE 5: Structure violation")
    print("="*60)

    chat_history = ""
    query = "điều 5 có bao nhiêu điều"

    print(f"Query: {query}")
    print(f"Chat History: (empty)")

    result = analyze_query_clarity(query, chat_history)

    print(f"\nResult:")
    print(f"  Is Clear: {result['is_clear']} {'✅' if not result['is_clear'] else '❌'}")
    print(f"  Issue Type: {result['issue_type']}")
    print(f"  Clarifying Question: {result.get('clarifying_question', '')}")

    # Expected: is_clear = False (structure violation)
    return result['is_clear'] == False

def main():
    """Run all test cases"""
    print("\n🧪 TESTING FEW-SHOT CLARITY ANALYSIS IMPLEMENTATION")
    print("="*60)

    results = {}

    try:
        results['test1'] = test_case_1()
        results['test2'] = test_case_2()
        results['test3'] = test_case_3()
        results['test4'] = test_case_4()
        results['test5'] = test_case_5()
    except Exception as e:
        print(f"\n❌ ERROR during testing: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Print summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)

    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")

    all_passed = all(results.values())
    total = len(results)
    passed_count = sum(results.values())

    print(f"\nTotal: {passed_count}/{total} tests passed")

    if all_passed:
        print("\n🎉 ALL TESTS PASSED! Few-shot implementation is working correctly.")
        return True
    else:
        print("\n❌ SOME TESTS FAILED. Few-shot implementation needs adjustment.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
