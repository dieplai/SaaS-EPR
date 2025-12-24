#!/usr/bin/env python3
"""
Test all structure violation cases
Structure: Chương > Mục > Điều

INVALID:
- Điều chứa điều ❌
- Điều chứa mục ❌
- Điều chứa chương ❌
- Mục chứa chương ❌
- Mục chứa mục ❌

VALID:
- Chương chứa mục ✅
- Mục chứa điều ✅
- Điều có nội dung ✅
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from epr_chatbot_core import analyze_query_clarity

def test_structure_violation(query, should_be_clear, description):
    """Test a structure violation case"""
    print(f"\n{'='*80}")
    print(f"TEST: {description}")
    print(f"{'='*80}")
    print(f"Query: {query}")

    result = analyze_query_clarity(query, "")

    is_clear = result.get('is_clear')
    issue_type = result.get('issue_type')
    clarifying_question = result.get('clarifying_question', '')

    print(f"\nResult:")
    print(f"  Is Clear: {is_clear} {'✅' if is_clear == should_be_clear else '❌'}")
    print(f"  Issue Type: {issue_type}")
    if not is_clear:
        print(f"  Clarifying Question: {clarifying_question}")

    passed = (is_clear == should_be_clear)

    if passed:
        print(f"\n✅ PASSED")
    else:
        print(f"\n❌ FAILED - Expected is_clear={should_be_clear}, got {is_clear}")

    return passed

def main():
    print("\n" + "🔬"*40)
    print("TESTING STRUCTURE VIOLATION DETECTION")
    print("🔬"*40)

    tests = [
        # INVALID structures - should be detected (is_clear = False)
        ("trong điều 5 có bao nhiêu điều", False, "Điều chứa điều ❌"),
        ("trong điều 5 có bao nhiêu mục", False, "Điều chứa mục ❌"),
        ("trong điều 10 có bao nhiêu chương", False, "Điều chứa chương ❌"),
        ("trong mục 4 có bao nhiêu chương", False, "Mục chứa chương ❌"),
        ("trong mục 2 có bao nhiêu mục", False, "Mục chứa mục ❌"),

        # VALID structures - should pass (is_clear = True)
        ("trong chương 4 có bao nhiêu mục", True, "Chương chứa mục ✅"),
        ("trong mục 2 có bao nhiêu điều", True, "Mục chứa điều ✅"),
        ("điều 5 nói về gì", True, "Hỏi về nội dung điều ✅"),
        ("nội dung của điều 5", True, "Hỏi nội dung điều ✅"),
    ]

    results = {}
    for i, (query, should_be_clear, description) in enumerate(tests, 1):
        test_name = f"test{i}"
        results[test_name] = test_structure_violation(query, should_be_clear, description)

    # Summary
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
        print("\n🎉 ALL TESTS PASSED! Structure validation working correctly.")
    else:
        print("\n❌ SOME TESTS FAILED. Structure validation needs fixes.")

    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
