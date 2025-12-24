#!/usr/bin/env python3
"""
Test extraction bug: Bot extracts "Điều 5" instead of "Mục 5"
"""

import sys
import os
import re

sys.path.insert(0, os.path.dirname(__file__))

from epr_chatbot_core import analyze_query_clarity

def test_extraction():
    """Test that extraction gets correct section"""
    print("\n" + "="*80)
    print("🐛 TEST: Extraction Bug - Mục 5 vs Điều 5")
    print("="*80)

    chat_history = """Human: vậy trong mục 5 có bao nhiêu chương
Assistant: Theo cấu trúc văn bản pháp luật, mục không thể chứa chương. Có thể bạn muốn hỏi về số lượng điều trong Mục 5?"""

    query = "đúng vậy"

    print(f"\n📝 Chat History:")
    print(chat_history)
    print(f"\n💬 User Query: {query}")

    # Test pattern extraction manually
    print(f"\n🔍 Pattern Testing:")
    pattern1 = r'Có thể bạn muốn hỏi.*?["\'](.*?)["\']'
    pattern2 = r'Có thể bạn muốn hỏi.*?về\s+(.*?)\?'
    pattern3 = r'Có thể bạn muốn hỏi.*?:\s+(.*?)\?'

    for i, pattern in enumerate([pattern1, pattern2, pattern3], 1):
        match = re.search(pattern, chat_history, re.IGNORECASE | re.DOTALL)
        if match:
            print(f"  Pattern {i} matched: '{match.group(1)}'")
        else:
            print(f"  Pattern {i} no match")

    # Now test actual function
    print(f"\n📊 Calling analyze_query_clarity():")
    result = analyze_query_clarity(query, chat_history)

    transformed_query = result.get('transformed_query')
    print(f"\n✅ Transformed Query: {transformed_query}")

    # Check if correct
    if transformed_query and "mục 5" in transformed_query.lower():
        print(f"✅ CORRECT: Extracted Mục 5")
        return True
    elif transformed_query and "điều 5" in transformed_query.lower():
        print(f"❌ BUG: Extracted Điều 5 instead of Mục 5!")
        return False
    else:
        print(f"❌ No transformation happened")
        return False

if __name__ == "__main__":
    success = test_extraction()
    sys.exit(0 if success else 1)
