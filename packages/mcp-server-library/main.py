import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mcp.server.fastmcp import FastMCP

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("library-mcp")

# Initialize FastMCP Server
mcp = FastMCP("Library Operations")

# Mock Book Database
BOOKS_DB = [
    {
        "title": "Introduction to Algorithms",
        "authors": "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
        "isbn": "9780262033848",
        "category": "Computer Science",
        "description": "The standard reference textbook for modern computer algorithms, widely known as CLRS.",
        "location": "Shelf A-4",
        "copies_available": 3,
        "total_copies": 5,
    },
    {
        "title": "Structure and Interpretation of Computer Programs",
        "authors": "Harold Abelson, Gerald Jay Sussman, Julie Sussman",
        "isbn": "9780262510875",
        "category": "Computer Science",
        "description": "A classic computer science textbook teaching programming principles using Scheme, known as SICP.",
        "location": "Shelf A-2",
        "copies_available": 0,
        "total_copies": 2,
    },
    {
        "title": "Design Patterns: Elements of Reusable Object-Oriented Software",
        "authors": "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
        "isbn": "9780201633610",
        "category": "Software Engineering",
        "description": "The seminal software engineering book describing 23 design patterns, known as Gang of Four.",
        "location": "Shelf B-1",
        "copies_available": 4,
        "total_copies": 4,
    },
]

@mcp.tool()
def search_book(query: str) -> dict:
    """
    Search books in the library by title, author, or category.
    Args:
        query: Search query string (case-insensitive)
    """
    logger.info(f"Executing tool: search_book with query: '{query}'")
    try:
        if not query.strip():
            return {"status": "error", "message": "Search query cannot be empty."}

        results = []
        for book in BOOKS_DB:
            if (query.lower() in book["title"].lower() or
                query.lower() in book["authors"].lower() or
                query.lower() in book["category"].lower()):
                results.append({
                    "title": book["title"],
                    "authors": book["authors"],
                    "isbn": book["isbn"],
                    "category": book["category"]
                })

        return {
            "status": "success",
            "count": len(results),
            "books": results
        }
    except Exception as e:
        logger.error(f"Error in search_book: {str(e)}")
        return {"status": "error", "message": f"Internal error during search: {str(e)}"}

@mcp.tool()
def get_book_details(isbn: str) -> dict:
    """
    Get detailed information about a specific book by its ISBN.
    Args:
        isbn: The 13-digit ISBN of the book
    """
    logger.info(f"Executing tool: get_book_details with ISBN: '{isbn}'")
    try:
        isbn_clean = isbn.replace("-", "").strip()
        for book in BOOKS_DB:
            if book["isbn"] == isbn_clean:
                return {
                    "status": "success",
                    "book": book
                }
        return {
            "status": "error",
            "message": f"Book with ISBN '{isbn}' not found."
        }
    except Exception as e:
        logger.error(f"Error in get_book_details: {str(e)}")
        return {"status": "error", "message": str(e)}

@mcp.tool()
def check_availability(isbn: str) -> dict:
    """
    Check availability and shelf location of a book by its ISBN.
    Args:
        isbn: The 13-digit ISBN of the book
    """
    logger.info(f"Executing tool: check_availability with ISBN: '{isbn}'")
    try:
        isbn_clean = isbn.replace("-", "").strip()
        for book in BOOKS_DB:
            if book["isbn"] == isbn_clean:
                available = book["copies_available"] > 0
                return {
                    "status": "success",
                    "title": book["title"],
                    "isbn": book["isbn"],
                    "available": available,
                    "copies_available": book["copies_available"],
                    "total_copies": book["total_copies"],
                    "location": book["location"] if available else "N/A (All copies loaned)",
                    "expected_return": "2026-06-18" if not available else None
                }
        return {
            "status": "error",
            "message": f"Book with ISBN '{isbn}' not found in database."
        }
    except Exception as e:
        logger.error(f"Error in check_availability: {str(e)}")
        return {"status": "error", "message": str(e)}

# Create FastAPI wrapper app
app = FastAPI(title="Library MCP Server")

# Add CORS Middleware to allow client upload/write requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/mcp", mcp.sse_app())

@app.get("/")
def read_root():
    return {"status": "Library MCP Server is active", "endpoints": ["/mcp/sse", "/mcp/messages"]}

from pydantic import BaseModel

class BookModel(BaseModel):
    title: str
    authors: str
    isbn: str
    category: str
    description: str = ""
    location: str = "Shelf A-1"
    copies_available: int = 1
    total_copies: int = 1

@app.post("/books")
def add_book(book: BookModel):
    logger.info(f"Adding book to catalog: {book.title}")
    isbn_clean = book.isbn.replace("-", "").strip()
    
    # Check if book already exists
    for existing in BOOKS_DB:
        if existing["isbn"] == isbn_clean:
            raise HTTPException(status_code=400, detail=f"Book with ISBN '{book.isbn}' already exists.")
            
    new_book = {
        "title": book.title,
        "authors": book.authors,
        "isbn": isbn_clean,
        "category": book.category,
        "description": book.description,
        "location": book.location,
        "copies_available": book.copies_available,
        "total_copies": book.total_copies
    }
    BOOKS_DB.append(new_book)
    return {"status": "success", "message": "Book added successfully.", "book": new_book}

@app.delete("/books/{isbn}")
def delete_book(isbn: str):
    logger.info(f"Deleting book with ISBN: {isbn}")
    isbn_clean = isbn.replace("-", "").strip()
    for idx, book in enumerate(BOOKS_DB):
        if book["isbn"] == isbn_clean:
            deleted = BOOKS_DB.pop(idx)
            return {"status": "success", "message": f"Book '{deleted['title']}' deleted successfully."}
            
    raise HTTPException(status_code=404, detail=f"Book with ISBN '{isbn}' not found.")

@app.get("/books")
def get_books():
    return BOOKS_DB
