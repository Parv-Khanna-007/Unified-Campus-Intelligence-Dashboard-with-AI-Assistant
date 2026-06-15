import os
import sqlite3
import json
import math
import re
import urllib.request
import urllib.error
from datetime import datetime

# Simple English stop words list for local fallback search
STOP_WORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
    'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
    'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres',
    'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is',
    'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor', 'not', 'of',
    'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same',
    'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats',
    'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll',
    'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt',
    'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which',
    'while', 'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll',
    'youre', 'youve', 'your', 'yours', 'yourself', 'yourselves'
}

class VectorStore:
    def __init__(self, db_path="handbook_vectors.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize SQLite database for storing document chunks & vector metadata"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create documents tracking table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT UNIQUE,
                uploaded_at TEXT
            )
        """)
        
        # Create document chunks table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER,
                page_num INTEGER,
                chunk_idx INTEGER,
                content TEXT,
                embedding TEXT, -- JSON string array of floats if using Gemini
                FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
            )
        """)
        conn.commit()
        conn.close()

    def get_api_key(self) -> str:
        """Attempts to retrieve GEMINI_API_KEY from environment or by checking parent configs"""
        key = os.environ.get("GEMINI_API_KEY")
        if key:
            return key
        
        # Look for env file in the apps/ai-orchestrator directory
        try:
            # Academics MCP is located in packages/mcp-server-academics
            # apps/ai-orchestrator is ../../apps/ai-orchestrator
            dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "apps", "ai-orchestrator", ".env"))
            if os.path.exists(dotenv_path):
                with open(dotenv_path, "r") as f:
                    for line in f:
                        if line.startswith("GEMINI_API_KEY="):
                            val = line.split("=", 1)[1].strip().strip('"').strip("'")
                            if val:
                                return val
        except Exception:
            pass
        return ""

    def _get_gemini_embedding(self, text: str, api_key: str) -> list:
        """Call Gemini Embeddings API via urllib.request"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "model": "models/text-embedding-004",
            "content": {
                "parts": [{"text": text}]
            }
        }
        
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as res:
                response = json.loads(res.read().decode("utf-8"))
                return response.get("embedding", {}).get("values", [])
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            raise Exception(f"Gemini API Error {e.code}: {error_body}")

    def _tokenize(self, text: str) -> list:
        """Helper to tokenize text into lowercase alphabetic words, ignoring stop words"""
        words = re.findall(r'[a-z0-9]+', text.lower())
        return [w for w in words if w not in STOP_WORDS]

    def _compute_tfidf_vectors(self, query_tokens: list, chunks_data: list) -> list:
        """
        Builds a TF-IDF vocabulary on-the-fly for the database chunks + query,
        and calculates cosine similarities.
        """
        # Step 1: Parse chunks into token lists
        documents_tokens = []
        for c_id, content, doc_name, page_num in chunks_data:
            documents_tokens.append(self._tokenize(content))
        
        # Step 2: Compute document frequencies (DF)
        vocabulary = set(query_tokens)
        for tokens in documents_tokens:
            vocabulary.update(tokens)
            
        vocabulary = list(vocabulary)
        vocab_idx = {word: i for i, word in enumerate(vocabulary)}
        
        num_docs = len(documents_tokens)
        df = {word: 0 for word in vocabulary}
        for tokens in documents_tokens:
            unique_tokens = set(tokens)
            for t in unique_tokens:
                df[t] += 1
                
        # Compute IDF (with smoothing)
        idf = {}
        for word in vocabulary:
            idf[word] = math.log((num_docs + 1) / (df[word] + 1)) + 1
            
        # Step 3: Compute TF-IDF vectors
        def get_tfidf_vector(tokens):
            vector = [0.0] * len(vocabulary)
            tf = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1
                
            for t, count in tf.items():
                if t in vocab_idx:
                    vector[vocab_idx[t]] = (count / len(tokens)) * idf[t]
            return vector
            
        query_vector = get_tfidf_vector(query_tokens)
        
        # Step 4: Compute Cosine Similarities
        def cosine_similarity(v1, v2):
            dot_product = sum(x * y for x, y in zip(v1, v2))
            norm_v1 = math.sqrt(sum(x * x for x in v1))
            norm_v2 = math.sqrt(sum(y * y for y in v2))
            if norm_v1 == 0 or norm_v2 == 0:
                return 0.0
            return dot_product / (norm_v1 * norm_v2)
            
        results = []
        for idx, (c_id, content, doc_name, page_num) in enumerate(chunks_data):
            doc_vector = get_tfidf_vector(documents_tokens[idx])
            sim = cosine_similarity(query_vector, doc_vector)
            results.append({
                "chunk_id": c_id,
                "content": content,
                "document": doc_name,
                "page": page_num,
                "score": round(sim, 4)
            })
            
        return results

    def add_document(self, filename: str, pages: list) -> dict:
        """
        Processes document pages, chunks text, generates embeddings, and saves to SQLite.
        pages is a list of strings where pages[i] is the text content of page i+1.
        """
        api_key = self.get_api_key()
        use_gemini = bool(api_key)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # 1. Register or get existing document ID
            cursor.execute("INSERT OR REPLACE INTO documents (filename, uploaded_at) VALUES (?, ?)", 
                           (filename, datetime.now().isoformat()))
            document_id = cursor.lastrowid
            
            # Remove old chunks if replacing document
            cursor.execute("DELETE FROM chunks WHERE document_id = ?", (document_id,))
            
            chunk_count = 0
            # 2. Loop through pages & perform overlapping chunking
            # Target chunk size: 500 chars. Overlap: 100 chars
            chunk_size = 500
            overlap = 100
            
            for page_idx, page_text in enumerate(pages):
                page_num = page_idx + 1
                if not page_text.strip():
                    continue
                
                # Split page text into overlapping windows
                start = 0
                while start < len(page_text):
                    end = start + chunk_size
                    chunk_text = page_text[start:end].strip()
                    
                    if chunk_text:
                        embedding_json = "[]"
                        if use_gemini:
                            try:
                                embedding_values = self._get_gemini_embedding(chunk_text, api_key)
                                embedding_json = json.dumps(embedding_values)
                            except Exception as e:
                                print(f"[VectorStore] Gemini embedding failed for chunk, falling back to TF-IDF. Error: {e}")
                                use_gemini = False
                                
                        cursor.execute(
                            "INSERT INTO chunks (document_id, page_num, chunk_idx, content, embedding) VALUES (?, ?, ?, ?, ?)",
                            (document_id, page_num, chunk_count, chunk_text, embedding_json)
                        )
                        chunk_count += 1
                        
                    start += (chunk_size - overlap)
            
            conn.commit()
            return {
                "status": "success",
                "filename": filename,
                "chunks_created": chunk_count,
                "mode": "Gemini Embeddings" if use_gemini else "Local TF-IDF fallback"
            }
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    def query_kb(self, query: str, top_k: int = 3) -> list:
        """
        Queries the knowledge base, calculating similarity scores using Gemini cosine search
        or local TF-IDF math.
        """
        api_key = self.get_api_key()
        use_gemini = bool(api_key)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Load all chunks for search
        cursor.execute("""
            SELECT c.id, c.content, d.filename, c.page_num, c.embedding 
            FROM chunks c 
            JOIN documents d ON c.document_id = d.id
        """)
        rows = cursor.fetchall()
        
        if not rows:
            conn.close()
            return []
            
        # 1. Option A: Gemini Embeddings Cosine Search
        if use_gemini:
            try:
                query_emb = self._get_gemini_embedding(query, api_key)
                
                def cosine_similarity(v1, v2):
                    if not v1 or not v2: return 0.0
                    dot_product = sum(x * y for x, y in zip(v1, v2))
                    norm_v1 = math.sqrt(sum(x * x for x in v1))
                    norm_v2 = math.sqrt(sum(y * y for y in v2))
                    if norm_v1 == 0 or norm_v2 == 0: return 0.0
                    return dot_product / (norm_v1 * norm_v2)
                
                results = []
                for c_id, content, doc_name, page_num, emb_json in rows:
                    try:
                        emb = json.loads(emb_json)
                    except:
                        emb = []
                    
                    if emb:
                        sim = cosine_similarity(query_emb, emb)
                        results.append({
                            "chunk_id": c_id,
                            "content": content,
                            "document": doc_name,
                            "page": page_num,
                            "score": round(sim, 4)
                        })
                
                # Sort by score descending
                results.sort(key=lambda x: x["score"], reverse=True)
                conn.close()
                return results[:top_k]
                
            except Exception as e:
                print(f"[VectorStore] Gemini query embedding failed, falling back to local TF-IDF. Error: {e}")
                use_gemini = False
                
        # 2. Option B: Local TF-IDF Fallback search
        query_tokens = self._tokenize(query)
        if not query_tokens:
            # Empty query or only stop words
            conn.close()
            return []
            
        chunks_data = [(r[0], r[1], r[2], r[3]) for r in rows]
        results = self._compute_tfidf_vectors(query_tokens, chunks_data)
        
        # Filter and sort
        results = [r for r in results if r["score"] > 0]
        results.sort(key=lambda x: x["score"], reverse=True)
        
        conn.close()
        return results[:top_k]

    def list_documents(self) -> list:
        """Returns metadata of all uploaded documents"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, filename, uploaded_at FROM documents ORDER BY uploaded_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [{"id": r[0], "filename": r[1], "uploaded_at": r[2]} for r in rows]

    def delete_document(self, doc_id: int) -> bool:
        """Deletes a document and all related chunks cascade"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
