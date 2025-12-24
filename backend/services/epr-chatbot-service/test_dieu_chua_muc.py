#!/usr/bin/env python3
"""
Test case: "trong điều 10 có bao nhiêu mục"
This should be detected as structure violation!
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from epr_chatbot_core import analyze_query_clarity

def test_dieu_chua_muc():
    """Test that 'điều chứa mục' is detected as violation"""
    print("\n" + "="*80)
    print("🐛 BUG TEST: Điều chứa mục")
    print("="*80)

    queries = [
        "trong điều 10 có bao nhiêu mục",
        "điều 5 có bao nhiêu mục",
        "trong điều 3 có mấy mục",
    ]

    all_passed = True

    for query in queries:
        print(f"\nQuery: {query}")

        result = analyze_query_clarity(query, "")

        is_clear = result.get('is_clear')
        issue_type = result.get('issue_type')
        clarifying_question = result.get('clarifying_question', '')

        print(f"  Is Clear: {is_clear}")
        print(f"  Issue Type: {issue_type}")
        if not is_clear:
            print(f"  Clarifying Question: {clarifying_question}")

        # Should be NOT clear (structure violation)
        if is_clear == False and issue_type == "illogical":
            print(f"  ✅ CORRECT - Detected structure violation")
        else:
            print(f"  ❌ FAILED - Should detect 'điều chứa mục' as illogical!")
            all_passed = False

    return all_passed

if __name__ == "__main__":
    success = test_dieu_chua_muc()
    sys.exit(0 if success else 1)
