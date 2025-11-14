"""
API Routes - Flask endpoints for the application
"""
import logging
from flask import request, jsonify, send_from_directory, Blueprint

logger = logging.getLogger(__name__)

# Create Blueprint for API routes
api_bp = Blueprint('api', __name__)

# Query handler will be set by the app
query_handler = None

def set_query_handler(handler):
    """Set the query handler for routes"""
    global query_handler
    query_handler = handler

@api_bp.route('/')
def serve_frontend():
    """Serve the main HTML frontend"""
    return send_from_directory('static', 'index.html')

@api_bp.route('/pdf_catalog.json')
def serve_pdf_catalog():
    """Serve PDF catalog JSON"""
    return send_from_directory('.', 'pdf_catalog.json')

@api_bp.route('/documents/<path:filename>')
def serve_document(filename):
    """Serve PDF documents from the documents folder"""
    return send_from_directory('documents', filename)

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'system_ready': query_handler is not None
    })

@api_bp.route('/query', methods=['POST'])
def process_query():
    """Process a legal query and return both answer and source nodes"""
    try:
        # Validate query handler
        if not query_handler:
            return jsonify({'error': 'System not initialized'}), 503

        # Get query from request
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'Missing query parameter'}), 400

        query_text = data['query'].strip()
        if not query_text:
            return jsonify({'error': 'Empty query'}), 400

        # Get session_id from request (optional)
        # Client should generate and maintain a unique session_id (e.g., UUID)
        session_id = data.get('session_id', None)

        # Process query through handler with session tracking
        result = query_handler.process_query(query_text, session_id=session_id)
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@api_bp.route('/search', methods=['POST'])
def search_documents():
    """Search for documents without generating an answer (just retrieval)"""
    try:
        # Validate query handler
        if not query_handler:
            return jsonify({'error': 'System not initialized'}), 503

        # Get query from request
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({'error': 'Missing query parameter'}), 400

        query_text = data['query'].strip()
        if not query_text:
            return jsonify({'error': 'Empty query'}), 400

        # Get top_k from request (default to 3)
        top_k = data.get('top_k', 3)

        # Search documents through handler
        result = query_handler.search_documents(query_text, top_k)
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error searching documents: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@api_bp.route('/conversation/<session_id>/history', methods=['GET'])
def get_conversation_history(session_id):
    """Get conversation history for a session"""
    try:
        if not query_handler:
            return jsonify({'error': 'System not initialized'}), 503

        # Get conversation context
        context = query_handler.conversation_memory.get_context(
            session_id,
            include_summary=True,
            max_messages=None  # Get all messages
        )

        # Get session info
        session_info = query_handler.conversation_memory.get_session_info(session_id)

        return jsonify({
            'session_id': session_id,
            'messages': context,
            'session_info': session_info
        })

    except Exception as e:
        logger.error(f"Error getting conversation history: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@api_bp.route('/conversation/<session_id>/clear', methods=['POST'])
def clear_conversation(session_id):
    """Clear conversation history for a session"""
    try:
        if not query_handler:
            return jsonify({'error': 'System not initialized'}), 503

        query_handler.conversation_memory.clear_session(session_id)

        return jsonify({
            'status': 'success',
            'message': f'Conversation history cleared for session {session_id}'
        })

    except Exception as e:
        logger.error(f"Error clearing conversation: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@api_bp.route('/conversation/<session_id>/info', methods=['GET'])
def get_conversation_info(session_id):
    """Get information about a conversation session"""
    try:
        if not query_handler:
            return jsonify({'error': 'System not initialized'}), 503

        session_info = query_handler.conversation_memory.get_session_info(session_id)

        return jsonify({
            'session_id': session_id,
            'info': session_info
        })

    except Exception as e:
        logger.error(f"Error getting session info: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@api_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@api_bp.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500