#!/usr/bin/env python3
"""
Test counting query ambiguity detection
When query is "trong mục 3 có bao nhiêu điều" and multiple Mục 3 exist,
should ask user which chapter.
"""

import sys
import os
import re

sys.path.insert(0, os.path.dirname(__file__))

def test_counting_pattern():
    """Test that counting pattern matches correctly"""
    print("\n" + "="*80)
    print("🧪 TEST: Counting Query Pattern Matching")
    print("="*80)

    test_queries = [
        "trong mục 3 có bao nhiêu điều",
        "mục 3 có bao nhiêu điều",
        "ở mục 5 có bao nhiêu điều",
        "Trong Mục 2 có bao nhiêu Điều",
    ]

    # Patterns from epr_chatbot_core.py
    counting_pattern_muc = r'(trong|ở)\s+(mục|Mục)\s+(\d+)\s+có\s+bao\s+nhiêu\s+(điều|Điều)'
    counting_pattern_muc_short = r'(mục|Mục)\s+(\d+)\s+có\s+bao\s+nhiêu\s+(điều|Điều)'

    all_passed = True

    for query in test_queries:
        print(f"\n Query: '{query}'")

        match1 = re.search(counting_pattern_muc, query, re.IGNORECASE)
        match2 = re.search(counting_pattern_muc_short, query, re.IGNORECASE)

        if match1:
            section_num = match1.group(3)
            print(f"  ✅ Pattern 1 matched! Section: {section_num}")
        elif match2:
            section_num = match2.group(2)
            print(f"  ✅ Pattern 2 matched! Section: {section_num}")
        else:
            print(f"  ❌ NO MATCH!")
            all_passed = False

    return all_passed


def test_ambiguity_detection():
    """Test full ambiguity detection with mock documents"""
    print("\n" + "="*80)
    print("🧪 TEST: Counting Ambiguity Detection with Multiple Chapters")
    print("="*80)

    # Mock document class
    class MockDoc:
        def __init__(self, metadata):
            self.metadata = metadata
            self.page_content = "mock content"

    # Create mock documents for Mục 3 in different chapters
    documents = [
        MockDoc({"Chương": "Chương II", "Mục": "Mục 3"}),
        MockDoc({"Chương": "Chương II", "Mục": "Mục 3"}),
        MockDoc({"Chương": "Chương IV", "Mục": "Mục 3"}),
        MockDoc({"Chương": "Chương IV", "Mục": "Mục 3"}),
        MockDoc({"Chương": "Chương V", "Mục": "Mục 3"}),
    ]

    query = "trong mục 3 có bao nhiêu điều"

    print(f"Query: {query}")
    print(f"Documents: {len(documents)} docs from chapters: II, IV, V")

    # Import function
    from epr_chatbot_core import detect_ambiguous_section_query

    result = detect_ambiguous_section_query(query, documents)

    print(f"\nResult:")
    print(f"  Is Ambiguous: {result['is_ambiguous']}")
    print(f"  Chapters: {result['chapters']}")
    if result['is_ambiguous']:
        print(f"  Clarification: {result['clarification']}")

    # Check result
    if result['is_ambiguous'] and len(result['chapters']) > 1:
        print(f"\n✅ PASSED - Detected multiple chapters!")
        return True
    else:
        print(f"\n❌ FAILED - Should detect ambiguity!")
        return False


if __name__ == "__main__":
    print("\n" + "🔬"*40)
    print("TESTING COUNTING QUERY AMBIGUITY DETECTION")
    print("🔬"*40)

    test1 = test_counting_pattern()
    test2 = test_ambiguity_detection()

    print("\n" + "="*80)
    print("📊 SUMMARY")
    print("="*80)
    print(f"Pattern matching: {'✅ PASSED' if test1 else '❌ FAILED'}")
    print(f"Ambiguity detection: {'✅ PASSED' if test2 else '❌ FAILED'}")

    success = test1 and test2
    if success:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print("\n❌ SOME TESTS FAILED!")

    sys.exit(0 if success else 1)
