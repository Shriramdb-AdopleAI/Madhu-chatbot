# NexusRAG Backend (FastAPI)

The NexusRAG backend is the core intelligence engine. Built with **FastAPI** for high performance and **FAISS** for ultra-fast semantic search, it manages document ingestion, knowledge conversion, and LLM communication.

---

## 🛠️ Main Components
1.  **FastAPI Core (`main.py`)**: REST endpoints for auth, document uploads, Notion sync, and RAG queries.
2.  **RAG Service (`rag_service.py`)**: 
    - Text Embedding via `BGE-Base-En-v1.5`.
    - Local vector storage using `FAISS` and `Pickle`.
    - Semantic search with top-k retrieval and document-level filtering.
3.  **Extraction Engine**:
    - `PyPDF` for PDF extraction.
    - `docx2txt` for Word documents.
    - `python-magic` for robust MIME type detection.
4.  **Database Layer (`database.py`)**:
    - **SQLite** stores user metadata, roles, and credentials.
    - **SQLAlchemy** ORM for extensible database interactions.

---

## 🔌 Connectors

### 1. Notion Workflow
The backend supports direct Notion workspace synchronization.
- **Internal Token Method**: Uses an Integration Token (`secret_...`) to discovered shared pages.
- **Discovery & Sync**: The `/notion/pages` endpoint lists accessible content, and `/sync/notion-page` performs a recursive fetch of all block content (paragraphs, headings, lists) to index in FAISS.

### 2. File Upload Engine
An asynchronous file ingestion pipeline that supports:
- Automatic text normalization.
- Chunked embedding generation.
- Real-time indexing into the active FAISS memory.

---

## 🛡️ Authentication & Authorization
Uses a secure authentication system (`auth.py`) providing:
- Bcrypt-hashed password storage.
- Role-based access control (Admin vs User).
- Admin-only endpoints for vector database purging and system status.

---

## 🚀 Setup & Installation

### 1. Environment Setup
Create a `.env` file in this directory with the following variables:
```python
DATABASE_URL=sqlite:///./users.db

# LLM Providers (Pick at least one)
OPENROUTER_API_KEY=sk-or-v1-...
NVIDIA_API_KEY=nvapi-...
HUGGINGFACE_TOKEN=hf_...

# Notion Integration
NOTION_TOKEN=ntn_...
```

### 2. Core Installation
```bash
python -m venv .venv
# Activate venv accordingly
pip install -r requirements.txt
```

### 3. Run the Server
```bash
python run.py
# Default host: http://localhost:8000
```

---

## 🧪 System Health
Access `/health` to check index status and total document counts.
Access `/docs` for full interactive Swagger documentation.
