"""
Test script for conversation memory and enhanced legal consulting
Demonstrates ChatGPT/Claude-like conversation capabilities
"""
import requests
import json
import uuid
from datetime import datetime

# Base URL
BASE_URL = "http://127.0.0.1:5000"

# Generate a unique session ID for this conversation
SESSION_ID = str(uuid.uuid4())

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def ask_question(query, session_id=SESSION_ID):
    """Send a query to the chatbot"""
    print(f"👤 USER: {query}")
    print("-" * 80)

    response = requests.post(
        f"{BASE_URL}/query",
        json={
            "query": query,
            "session_id": session_id
        },
        headers={"Content-Type": "application/json"}
    )

    if response.status_code == 200:
        result = response.json()
        answer = result.get('answer', 'No answer')

        print(f"🤖 ASSISTANT:\n{answer}\n")

        # Show metadata
        if result.get('num_sources'):
            print(f"📚 Sources: {result['num_sources']}")
        if result.get('is_faq'):
            print("ℹ️  Source Type: FAQ")
        elif result.get('is_pdf_catalog'):
            print("ℹ️  Source Type: PDF Catalog")
        else:
            print("ℹ️  Source Type: Legal RAG")

        return result
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return None

def get_conversation_history(session_id=SESSION_ID):
    """Get conversation history"""
    response = requests.get(
        f"{BASE_URL}/conversation/{session_id}/history"
    )

    if response.status_code == 200:
        return response.json()
    return None

def get_session_info(session_id=SESSION_ID):
    """Get session information"""
    response = requests.get(
        f"{BASE_URL}/conversation/{session_id}/info"
    )

    if response.status_code == 200:
        return response.json()
    return None

def clear_conversation(session_id=SESSION_ID):
    """Clear conversation history"""
    response = requests.post(
        f"{BASE_URL}/conversation/{session_id}/clear"
    )

    if response.status_code == 200:
        return response.json()
    return None

# ============================================================================
# TEST SCENARIOS
# ============================================================================

def test_conversation_continuity():
    """Test conversation memory and context awareness"""
    print_section("TEST 1: CONVERSATION CONTINUITY & MEMORY")

    print(f"📋 Session ID: {SESSION_ID}\n")

    # Question 1: Initial question
    ask_question("EPR là gì?")

    input("\n⏸️  Press Enter to continue...")

    # Question 2: Follow-up (should reference previous answer)
    ask_question("Ai phải chịu trách nhiệm đó?")

    input("\n⏸️  Press Enter to continue...")

    # Question 3: Another follow-up
    ask_question("Có bị phạt không nếu không tuân thủ?")

    input("\n⏸️  Press Enter to continue...")

    # Check conversation history
    print_section("CONVERSATION HISTORY")
    history = get_conversation_history()
    if history:
        print(f"Total messages: {len(history['messages'])}")
        print(f"Session info: {json.dumps(history['session_info'], indent=2, ensure_ascii=False)}")

def test_professional_tone():
    """Test professional legal consultant tone"""
    print_section("TEST 2: PROFESSIONAL LEGAL CONSULTING TONE")

    # Complex legal question
    ask_question(
        "Tôi là nhà sản xuất bao bì nhựa. Tôi cần biết rõ các nghĩa vụ cụ thể "
        "mà công ty tôi phải thực hiện theo luật EPR, bao gồm cả thủ tục và thời hạn."
    )

def test_context_switching():
    """Test handling context switches in conversation"""
    print_section("TEST 3: CONTEXT SWITCHING")

    # Start with EPR topic
    ask_question("Quy định về bao bì tái chế là gì?")

    input("\n⏸️  Press Enter to continue...")

    # Switch to different but related topic
    ask_question("Còn về pin ắc quy thì sao?")

    input("\n⏸️  Press Enter to continue...")

    # Reference back to first topic
    ask_question("Quay lại vấn đề bao bì, có bị phạt không?")

def test_multi_turn_complex():
    """Test multi-turn complex conversation"""
    print_section("TEST 4: MULTI-TURN COMPLEX CONSULTATION")

    # Turn 1
    ask_question("Công ty tôi nhập khẩu đồ điện tử. Tôi có phải tuân thủ EPR không?")

    input("\n⏸️  Press Enter to continue...")

    # Turn 2
    ask_question("Cụ thể tôi phải làm những gì?")

    input("\n⏸️  Press Enter to continue...")

    # Turn 3
    ask_question("Nếu tôi không làm được điều đó thì có phương án nào khác không?")

    input("\n⏸️  Press Enter to continue...")

    # Turn 4
    ask_question("Chi phí khoảng bao nhiêu?")

def test_greetings_and_offtopic():
    """Test handling greetings and off-topic with memory"""
    print_section("TEST 5: GREETINGS & OFF-TOPIC WITH MEMORY")

    # Greeting
    ask_question("Xin chào!")

    input("\n⏸️  Press Enter to continue...")

    # EPR question
    ask_question("Cho tôi hỏi về nghĩa vụ tái chế bao bì")

    input("\n⏸️  Press Enter to continue...")

    # Off-topic but friendly
    ask_question("Cảm ơn bạn nhiều!")

def main():
    """Main test runner"""
    print_section("🚀 LEGAL CHATBOT - CONVERSATION MEMORY TEST")
    print("Testing ChatGPT/Claude-like conversation capabilities")
    print(f"Session ID: {SESSION_ID}")

    print("\nAvailable tests:")
    print("1. Conversation Continuity & Memory")
    print("2. Professional Legal Consulting Tone")
    print("3. Context Switching")
    print("4. Multi-turn Complex Consultation")
    print("5. Greetings & Off-topic with Memory")
    print("6. Run all tests")
    print("7. Custom query")

    choice = input("\nSelect test (1-7): ").strip()

    if choice == "1":
        test_conversation_continuity()
    elif choice == "2":
        test_professional_tone()
    elif choice == "3":
        test_context_switching()
    elif choice == "4":
        test_multi_turn_complex()
    elif choice == "5":
        test_greetings_and_offtopic()
    elif choice == "6":
        print("\n⚠️  Running all tests will take several minutes and multiple API calls.")
        confirm = input("Continue? (y/n): ")
        if confirm.lower() == 'y':
            test_conversation_continuity()
            input("\n⏸️  Press Enter for next test...")
            test_professional_tone()
            input("\n⏸️  Press Enter for next test...")
            test_context_switching()
            input("\n⏸️  Press Enter for next test...")
            test_multi_turn_complex()
            input("\n⏸️  Press Enter for next test...")
            test_greetings_and_offtopic()
    elif choice == "7":
        query = input("Enter your question: ")
        ask_question(query)

        # Show session info
        print_section("SESSION INFO")
        info = get_session_info()
        if info:
            print(json.dumps(info, indent=2, ensure_ascii=False))
    else:
        print("Invalid choice")
        return

    # Final summary
    print_section("📊 SESSION SUMMARY")
    info = get_session_info()
    if info:
        print(f"Session ID: {SESSION_ID}")
        print(f"Message count: {info['info']['message_count']}")
        print(f"Has summary: {info['info']['has_summary']}")
        if info['info'].get('topics'):
            print(f"Discussed topics: {', '.join(info['info']['topics'])}")

    # Option to clear
    clear = input("\n🗑️  Clear conversation history? (y/n): ")
    if clear.lower() == 'y':
        result = clear_conversation()
        if result:
            print(f"✅ {result['message']}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
