import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import json

from auth import verify_firebase_token
from rag_service import DocumentStore
import httpx
from dotenv import load_dotenv
import io

# Notion Integration
from notion_client import AsyncClient
NOTION_TOKEN = os.getenv("NOTION_TOKEN")
notion = AsyncClient(auth=NOTION_TOKEN) if NOTION_TOKEN and "your-notion" not in NOTION_TOKEN.lower() else None

app = FastAPI(title="NexusRAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

doc_store = DocumentStore()

class QueryRequest(BaseModel):
    question: str
    selectedFiles: Optional[List[str]] = None

class VerifyTokenRequest(BaseModel):
    idToken: str

@app.post("/verify-token")
async def verify_token(request: VerifyTokenRequest):
    user = await verify_firebase_token(request.idToken)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {"username": user["username"], "email": user["email"], "uid": user["uid"], "role": "user"}


@app.post("/upload")
async def upload(file: UploadFile = File(...), docName: str = Form(None)):
    try:
        print(f"\n[UPLOAD] Received file: {file.filename} (content_type: {file.content_type})")
        content = await file.read()
        
        print(f"[EXTRACT] Extracting text from: {file.filename}...")
        text = extract_text(content, file.filename)
        
        if not text:
            print(f"[ERROR] Could not extract text from {file.filename}")
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        
        filename = docName or file.filename
        print(f"[INDEX] Processing {len(text)} characters for document: {filename}")
        
        doc_store.add_document(text, metadata={"filename": filename, "source": file.filename})
        
        print(f"[SUCCESS] Document '{filename}' indexed successfully.\n")
        return {"message": f"Document '{filename}' uploaded and indexed successfully"}
    except Exception as e:
        print(f"[ERROR] Exception during upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Notion Integration Endpoints ---

@app.get("/notion/pages")
async def list_notion_pages(token: Optional[str] = None):
    try:
        # Use provided token or fallback to environment
        notion_token = token or os.getenv("NOTION_TOKEN")
        
        if not notion_token or "your-notion" in notion_token.lower():
             raise HTTPException(status_code=401, detail="Notion token not configured (neither in UI nor in .env)")
        
        temp_notion = AsyncClient(auth=notion_token)
        results = await temp_notion.search()
        
        pages = []
        for r in results.get("results", []):
            ptype = r.get("object")
            title = "Untitled"
            if ptype == "page":
              properties = r.get("properties", {})
              for prop in properties.values():
                  if prop.get("type") == "title":
                      title_list = prop.get("title", [])
                      if title_list:
                          title = title_list[0].get("plain_text", "Untitled")
                      break
            elif ptype == "database":
              title_list = r.get("title", [])
              if title_list:
                  title = title_list[0].get("plain_text", "Untitled")
            
            pages.append({
                "id": r["id"],
                "name": title,
                "type": ptype,
                "last_modified": r.get("last_edited_time")
            })
        return {"pages": pages}
    except Exception as e:
        print(f"[NOTION ERROR] Search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class NotionSyncRequest(BaseModel):
    pageId: str
    filename: str
    notionToken: Optional[str] = None

@app.post("/sync/notion-page")
async def sync_notion_page(request: NotionSyncRequest):
    try:
        notion_token = request.notionToken or os.getenv("NOTION_TOKEN")
        if not notion_token or "your-notion" in notion_token.lower():
             raise HTTPException(status_code=401, detail="Notion token not configured")
        
        temp_notion = AsyncClient(auth=notion_token)
        
        async def fetch_notion_text(block_id):
            text = ""
            res = await temp_notion.blocks.children.list(block_id=block_id)
            for block in res.get("results", []):
                btype = block.get("type")
                content_types = ["paragraph", "heading_1", "heading_2", "heading_3", "bulleted_list_item", "numbered_list_item", "to_do"]
                if btype in content_types:
                    rich_text = block[btype].get("rich_text", [])
                    for rt in rich_text:
                        text += rt.get("plain_text", "")
                    text += "\n"
                
                if block.get("has_children"):
                    text += await fetch_notion_text(block["id"])
            return text

        print(f"\n[NOTION SYNC] Fetching content for: {request.filename}")
        content = await fetch_notion_text(request.pageId)
        
        if not content.strip():
            raise HTTPException(status_code=400, detail="No content found in page")

        doc_store.add_document(content, metadata={"filename": request.filename, "source": f"Notion ({request.pageId})"})
        print(f"[SUCCESS] Notion page {request.filename} indexed in FAISS.\n")
        return {"message": f"Notion page '{request.filename}' indexed successfully"}
    except Exception as e:
        print(f"[NOTION ERROR] Sync failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/files")


def get_files():
    files = doc_store.get_all_files()
    return {"files": files}

@app.post("/query")
async def query(request: QueryRequest):
    try:
        results = doc_store.search(
            request.question, 
            top_k=7, 
            filter_files=request.selectedFiles
        )
        if not results:
            answer = "I couldn't find relevant information in the selected knowledge base."
        else:
            context = "\n\n".join([doc["text"] for _, doc in results])
            answer = await generate_answer(request.question, context)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def generate_answer(question: str, context: str) -> str:
    # Refresh environment variables
    load_dotenv(override=True)
    
    # helper to get non-placeholder env
    def get_valid_env(key):
        val = os.getenv(key)
        if not val or "your-" in val.lower():
            return None
        return val

    hf_token = get_valid_env("HUGGINGFACE_TOKEN") or get_valid_env("HF_TOKEN")
    hf_model = os.getenv("HUGGINGFACE_MODEL") or "mistralai/Mistral-7B-Instruct-v0.2"
    
    nv_key = get_valid_env("NVIDIA_API_KEY") or get_valid_env("NIVIDIA_QWEN_API_KEY")
    nv_model = os.getenv("NVIDIA_MODEL") or "nvidia/qwen2-72b-instruct"
    
    or_key = get_valid_env("OPENROUTER_API_KEY")
    or_model = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-exp:free")
    
    # Priority check (OpenRouter first, as requested)
    if or_key:
        provider, api_key, model = "OpenRouter", or_key, or_model
        base_url = "https://openrouter.ai/api/v1/chat/completions"
    elif hf_token:
        provider, api_key, model = "HuggingFace", hf_token, hf_model
        base_url = f"https://router.huggingface.co/hf-inference/models/{model}"
    elif nv_key:
        provider, api_key, model = "NVIDIA", nv_key, nv_model
        base_url = "https://integrate.api.nvidia.com/v1/chat/completions"
    else:
        return f"No valid LLM API key found in .env (tried OpenRouter, HF, NVIDIA)"



    prompt = f"""You are a helpful assistant answering questions based on the provided context.

Context:
{context}

Question: {question}

Answer:"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # OpenRouter specific headers
    if provider == "OpenRouter":
        headers["HTTP-Referer"] = "http://localhost:8000"
        headers["X-Title"] = "NexusRAG"

    async with httpx.AsyncClient() as client:
        # Construct payload based on provider
        if provider == "HuggingFace":
            payload = {"inputs": prompt}
        else:
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 1024 if provider == "NVIDIA" else 512,
                "temperature": 0.7
            }

        response = await client.post(
            base_url,
            headers=headers,
            json=payload,
            timeout=90.0
        )
        
        if response.status_code != 200:
            print(f"[{provider} ERROR] API returned {response.status_code}")
            print(f"            Reason: {response.text}")
            return f"API error from {provider}: {response.status_code}"
        
        data = response.json()
        print(f"[{provider} SUCCESS] Answer generated using '{model}'")
        
        # Parse based on provider format
        if provider == "HuggingFace":
            # Direct API returns a list of objects with generated_text
            res_text = data[0].get("generated_text", "")
            # HF often includes the prompt in the output, strip it if found
            if prompt in res_text:
                res_text = res_text.split("Answer:")[-1].strip()
            return res_text
        else:
            return data["choices"][0]["message"]["content"].strip()





def extract_text(content: bytes, filename: str) -> str:
    if filename.lower().endswith('.pdf'):
        try:
            from pypdf import PdfReader
            import io
            reader = PdfReader(io.BytesIO(content))
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            return text
        except Exception as e:
            print(f"PDF extraction error: {e}")
            return ""
    elif filename.lower().endswith(('.txt', '.md')):
        try:
            return content.decode('utf-8')
        except Exception as e:
            print(f"Text file decoding error: {e}")
            return ""
    elif filename.lower().endswith(('.docx', '.doc')):
        try:
            import docx2txt
            import io
            return docx2txt.process(io.BytesIO(content))
        except ImportError:
            print("docx2txt not installed. Install with: pip install docx2txt")
            return ""
        except Exception as e:
            print(f"DOCX extraction error: {e}")
            return ""
    return ""

@app.get("/health")
def health_check():
    return {"status": "healthy", "indexed_docs": len(doc_store.documents)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
