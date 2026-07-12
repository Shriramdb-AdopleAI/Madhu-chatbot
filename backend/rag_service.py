import os
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
import pickle
from typing import List, Dict, Tuple
import hashlib

class DocumentStore:
    def __init__(self, index_path: str = "faiss_index"):
        self.index_path = index_path
        self.model = SentenceTransformer('BAAI/bge-base-en-v1.5')
        self.dimension = self.model.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatIP(self.dimension)
        self.documents: List[Dict] = []
        self.load_index()

    def embed_text(self, text: str) -> np.ndarray:
        embedding = self.model.encode(text)
        return np.array(embedding, dtype='float32')

    def add_document(self, text: str, metadata: Dict = None):
        print(f"   - Generating embedding for new document index {len(self.documents)}...")
        embedding = self.embed_text(text)
        
        print("   - Updating FAISS vector index...")
        self.index.add(np.expand_dims(embedding, 0))
        
        doc = {
            "id": len(self.documents),
            "text": text,
            "metadata": metadata or {}
        }
        self.documents.append(doc)
        
        print("   - Saving vectors to local storage...")
        self.save_index()
        print(f"   - Successfully completed indexing for '{metadata.get('filename')}'")


    def add_documents(self, texts: List[str], metadatas: List[Dict] = None):
        embeddings = []
        for i, text in enumerate(texts):
            embedding = self.embed_text(text)
            embeddings.append(embedding)
            doc = {
                "id": len(self.documents) + i,
                "text": text,
                "metadata": metadatas[i] if metadatas else {}
            }
            self.documents.append(doc)
        if embeddings:
            self.index.add(np.array(embeddings, dtype='float32'))
        self.save_index()

    def search(self, query: str, top_k: int = 5, filter_files: List[str] = None) -> List[Tuple[float, Dict]]:
        if self.index.ntotal == 0:
            return []
        
        query_embedding = self.embed_text(query)
        # Search for more than top_k if filtering to ensure we find enough matches
        search_k = max(top_k * 3, 50) if filter_files else top_k
        distances, indices = self.index.search(np.expand_dims(query_embedding, 0), search_k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx < len(self.documents):
                doc = self.documents[idx]
                # Apply filter if provided
                if filter_files:
                    doc_filename = doc.get("metadata", {}).get("filename")
                    if doc_filename not in filter_files:
                        continue
                
                results.append((float(dist), doc))
                if len(results) >= top_k:
                    break
        return results


    def save_index(self):
        faiss.write_index(self.index, f"{self.index_path}.faiss")
        with open(f"{self.index_path}.pkl", "wb") as f:
            pickle.dump(self.documents, f)

    def load_index(self):
        try:
            if os.path.exists(f"{self.index_path}.faiss"):
                self.index = faiss.read_index(f"{self.index_path}.faiss")
            if os.path.exists(f"{self.index_path}.pkl"):
                with open(f"{self.index_path}.pkl", "rb") as f:
                    self.documents = pickle.load(f)
        except Exception as e:
            print(f"Error loading index: {e}")

    def clear(self):
        self.index = faiss.IndexFlatIP(self.dimension)
        self.documents = []
        self.save_index()

    def get_all_files(self) -> List[str]:
        seen = set()
        for doc in self.documents:
            filename = doc.get("metadata", {}).get("filename", "Unknown")
            seen.add(filename)
        return list(seen)
