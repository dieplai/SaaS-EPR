# EPR Legal Chatbot - UX/UI

A beautiful and intelligent chatbot interface for Vietnamese EPR (Extended Producer Responsibility) law queries. Built with Streamlit, LangChain, and LangGraph.

## Features

- **Intelligent Routing**: Automatically routes questions to FAQ, legal documents, or web search
- **Multi-source Retrieval**:
  - FAQ database
  - Legal document vector store (Qdrant)
  - Web search fallback (Tavily)
- **Quality Control**:
  - Hallucination detection
  - Answer relevance grading
  - Automatic retry mechanisms
- **Context-Aware**: Maintains conversation history and handles follow-up questions
- **Beautiful UI**: Clean, responsive interface with source document display
- **Real-time Indicators**: Shows quality badges, retry counts, and hallucination warnings

## Architecture

The chatbot uses a sophisticated LangGraph workflow:

1. **Query Transformation**: Improves question clarity and handles context
2. **FAQ Router**: First checks FAQ database for common questions
3. **Legal Document Retrieval**: Searches Vietnamese legal documents with self-query
4. **Document Grading**: Filters relevant documents
5. **RAG Generation**: Generates answers from retrieved documents
6. **Quality Grading**: Checks for hallucinations and answer quality
7. **Web Search Fallback**: If quality is low, searches the web

## Prerequisites

- Python 3.8+
- OpenAI API key
- Tavily API key (for web search)
- LangChain API key (optional, for tracing)

## Installation

### 1. Clone or navigate to the project directory

```bash
cd EPR_PRO_CHATBOT_FIX
```

### 2. Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

The API keys are already configured in `epr_chatbot_core.py`:

- **OPENAI_API_KEY**: Your OpenAI API key
- **TAVILY_API_KEY**: Your Tavily search API key
- **LANGCHAIN_API_KEY**: (Optional) For LangChain tracing

**Important**: For production use, move these to environment variables or a `.env` file for security.

## Running the Chatbot

### Start the Streamlit app

```bash
streamlit run app.py
```

The app will open in your browser at `http://localhost:8501`

### First Run

On first run, the chatbot will:
1. Initialize the FAQ database (Qdrant)
2. Load legal documents and create embeddings
3. Set up the LangGraph workflow

This may take 1-2 minutes. Subsequent runs will be faster.

## Usage

### Basic Questions

```
User: Điều 7 quy định gì?
User: Quy định về tái chế là gì?
User: Ai chịu trách nhiệm tái chế?
```

### Follow-up Questions

```
User: Cho tôi biết về Điều 1?
Assistant: [Explains Điều 1...]
User: Điều đó có áp dụng cho công ty sản xuất không?
```

The chatbot understands context and resolves references like "điều đó" automatically.

### Chitchat

```
User: Xin chào!
User: Bạn có thể làm gì?
User: Cảm ơn bạn!
```

## Project Structure

```
EPR_PRO_CHATBOT_FIX/
├── app.py                          # Streamlit UI application
├── epr_chatbot_core.py            # Core chatbot logic (from notebook)
├── EPR_PRO_DEMO (2).ipynb         # Original Colab notebook
├── requirements.txt                # Python dependencies
├── README.md                       # This file
├── qdrant_faq_db/                 # FAQ vector database (auto-generated)
└── venv/                          # Virtual environment (gitignored)
```

## Key Components

### app.py
- Streamlit UI with chat interface
- Session state management
- Quality indicators and badges
- Source document display

### epr_chatbot_core.py
- LangGraph workflow
- FAQ and legal document retrieval
- Query transformation
- Document grading
- Hallucination detection
- Web search fallback

## Customization

### Modify API Keys

Edit `epr_chatbot_core.py` lines 7-10:

```python
os.environ['TAVILY_API_KEY'] = "your-tavily-key"
os.environ['LANGCHAIN_API_KEY'] = "your-langchain-key"
os.environ['OPENAI_API_KEY'] = "your-openai-key"
```

### Adjust Chat History

In `app.py`, modify the `max_exchanges` parameter:

```python
chat_history = chatbot_core.get_full_chat_history(max_exchanges=5)  # Keep last 5 exchanges
```

### Change Models

In `epr_chatbot_core.py`, update the model names:

```python
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)  # Change to gpt-4, etc.
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
```

## Troubleshooting

### "Module not found" errors

Make sure you've installed all dependencies:
```bash
pip install -r requirements.txt
```

### Slow first run

This is normal. The chatbot needs to:
- Create vector databases
- Generate embeddings
- Compile the LangGraph workflow

### API rate limits

If you hit OpenAI rate limits:
- Reduce the number of test questions
- Add delays between requests
- Upgrade your OpenAI plan

### Memory issues

Clear chat history using the sidebar button or restart the app.

## Performance Tips

1. **Use Caching**: Streamlit caches the chatbot core with `@st.cache_resource`
2. **Limit History**: Keep `max_exchanges=5` to avoid context bloat
3. **Adjust Temperature**: Lower temperature (0-0.3) for more deterministic answers
4. **Use Haiku Models**: Switch to smaller models for faster responses

## Security Notes

**Important**: The current implementation has API keys hardcoded in `epr_chatbot_core.py`. For production:

1. Move keys to environment variables
2. Use `.env` files (with `python-dotenv`)
3. Never commit API keys to version control
4. Use secret management services (AWS Secrets Manager, etc.)

Example with `.env`:

```python
from dotenv import load_dotenv
load_dotenv()

os.environ['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY')
```

## Contributing

To modify the core logic:
1. Edit the original notebook `EPR_PRO_DEMO (2).ipynb` in Colab
2. Export to Python: `jupyter nbconvert --to script notebook.ipynb`
3. Replace `epr_chatbot_core.py`
4. Restart the Streamlit app

## License

This project is for educational and research purposes.

## Acknowledgments

- Built with [Streamlit](https://streamlit.io/)
- Powered by [LangChain](https://langchain.com/) and [LangGraph](https://langchain-ai.github.io/langgraph/)
- Uses [OpenAI GPT models](https://openai.com/)
- Web search by [Tavily](https://tavily.com/)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the code comments in `epr_chatbot_core.py`
3. Refer to the original notebook for detailed explanations

---

Made with ❤️ for Vietnamese Legal Tech
