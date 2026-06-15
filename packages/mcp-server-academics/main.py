import logging
import io
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mcp.server.fastmcp import FastMCP
from pypdf import PdfReader
from vector_store import VectorStore

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("academics-mcp")

# Initialize VectorStore
vector_store = VectorStore()

# Initialize FastMCP Server
mcp = FastMCP("Academics Operations")

# Mock Courses Database
COURSES_DB = [
    {
        "code": "CS101",
        "title": "Introduction to Computer Science",
        "department": "Computer Science",
        "credits": 4,
        "timing": "Mon/Wed 10:00 AM - 11:30 AM",
        "instructor": "Dr. Sarah Jenkins",
        "syllabus": "Fundamentals of programming, control structures, variables, recursion, and object-oriented paradigms using Python."
    },
    {
        "code": "CS202",
        "title": "Data Structures and Algorithms",
        "department": "Computer Science",
        "credits": 4,
        "timing": "Tue/Thu 01:00 PM - 02:30 PM",
        "instructor": "Prof. Liam Carter",
        "syllabus": "Analysis of algorithms, complexity bounds (Big-O), linear data structures (stacks, queues, lists), trees, heaps, graphs."
    },
    {
        "code": "CHEM202",
        "title": "Organic Chemistry I",
        "department": "Chemistry",
        "credits": 3,
        "timing": "Mon/Wed/Fri 09:00 AM - 09:50 AM",
        "instructor": "Dr. Emily Roberts",
        "syllabus": "Structure, bonding, stereochemistry, and reactivity of organic compounds, emphasizing hydrocarbons and functional groups."
    }
]

# Mock Faculty Database
FACULTY_DB = [
    {
        "name": "Dr. Sarah Jenkins",
        "email": "sarah.jenkins@university.edu",
        "department": "Computer Science",
        "office": "Tech Block Room 402",
        "office_hours": "Mon/Wed 02:00 PM - 03:30 PM"
    },
    {
        "name": "Prof. Liam Carter",
        "email": "liam.carter@university.edu",
        "department": "Computer Science",
        "office": "Tech Block Room 405",
        "office_hours": "Tue/Thu 10:00 AM - 11:30 AM"
    },
    {
        "name": "Dr. Emily Roberts",
        "email": "emily.roberts@university.edu",
        "department": "Chemistry",
        "office": "Science Block Room 212",
        "office_hours": "Fri 11:00 AM - 01:00 PM"
    }
]

@mcp.tool()
def search_course(query: str, department: str = None) -> dict:
    """
    Search academic courses by name, course code, or syllabus content.
    Args:
        query: Search query string (case-insensitive)
        department: Optional department filter (e.g. 'Computer Science', 'Chemistry')
    """
    logger.info(f"Executing tool: search_course with query: '{query}' and dept filter: '{department}'")
    try:
        results = []
        for course in COURSES_DB:
            if department and course["department"].lower() != department.lower().strip():
                continue
            
            if (query.lower() in course["code"].lower() or
                query.lower() in course["title"].lower() or
                query.lower() in course["syllabus"].lower()):
                results.append(course)
                
        return {
            "status": "success",
            "count": len(results),
            "courses": results
        }
    except Exception as e:
        logger.error(f"Error in search_course: {str(e)}")
        return {"status": "error", "message": str(e)}

@mcp.tool()
def get_course_details(course_code: str) -> dict:
    """
    Get detailed information, credit hours, and syllabus for a specific course by its code.
    Args:
        course_code: The course identifier code (e.g. 'CS101', 'CHEM202')
    """
    logger.info(f"Executing tool: get_course_details with course_code: '{course_code}'")
    try:
        code_clean = course_code.upper().strip()
        for course in COURSES_DB:
            if course["code"] == code_clean:
                return {
                    "status": "success",
                    "course": course
                }
        return {
            "status": "error",
            "message": f"Course with code '{course_code}' not found."
        }
    except Exception as e:
        logger.error(f"Error in get_course_details: {str(e)}")
        return {"status": "error", "message": str(e)}

@mcp.tool()
def search_faculty(name: str, department: str = None) -> dict:
    """
    Search faculty profiles by name or department.
    Args:
        name: Name of the faculty member (partial matches supported)
        department: Optional department filter (e.g. 'Computer Science')
    """
    logger.info(f"Executing tool: search_faculty with name: '{name}' and dept filter: '{department}'")
    try:
        results = []
        for faculty in FACULTY_DB:
            if department and faculty["department"].lower() != department.lower().strip():
                continue
                
            if name.lower() in faculty["name"].lower():
                results.append(faculty)
                
        return {
            "status": "success",
            "count": len(results),
            "faculty": results
        }
    except Exception as e:
        logger.error(f"Error in search_faculty: {str(e)}")
        return {"status": "error", "message": str(e)}

# Create FastAPI wrapper app
app = FastAPI(title="Academics MCP Server")

# Add CORS Middleware to allow client upload requests
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
    return {"status": "Academics MCP Server is active", "endpoints": ["/mcp/sse", "/mcp/messages"]}

@mcp.tool()
def search_handbook(query: str) -> dict:
    """
    Search the uploaded academic handbooks, policies, and regulatory documents for answers.
    Args:
        query: Semantic query text regarding policies (e.g. 'attendance rules', 'grading policy')
    """
    logger.info(f"Executing tool: search_handbook with query: '{query}'")
    try:
        if not query.strip():
            return {"status": "error", "message": "Search query cannot be empty."}
            
        results = vector_store.query_kb(query, top_k=3)
        return {
            "status": "success",
            "count": len(results),
            "results": results
        }
    except Exception as e:
        logger.error(f"Error in search_handbook: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    logger.info(f"Received PDF upload request: {file.filename}")
    try:
        content = await file.read()
        pdf_file = io.BytesIO(content)
        reader = PdfReader(pdf_file)
        
        pages = []
        for page in reader.pages:
            text = page.extract_text() or ""
            pages.append(text)
            
        if not pages or all(not p.strip() for p in pages):
            raise HTTPException(status_code=400, detail="The uploaded PDF contains no extractable text.")
            
        result = vector_store.add_document(file.filename, pages)
        return result
    except Exception as e:
        logger.error(f"Error processing PDF upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents")
def get_documents():
    try:
        return vector_store.list_documents()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int):
    try:
        success = vector_store.delete_document(doc_id)
        if not success:
            raise HTTPException(status_code=404, detail="Document not found.")
        return {"status": "success", "message": "Document deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/preload-sample")
def preload_sample():
    logger.info("Pre-loading sample academic handbook guidelines...")
    try:
        pages = [
            "CAMPUS ACADEMIC HANDBOOK - SECTION 1: ATTENDANCE POLICY\n\n"
            "All enrolled students must maintain a minimum of 75% attendance in lectures, tutorials, and laboratory sessions. "
            "Attendance is monitored weekly by course coordinators via the Academics MCP database. "
            "A student whose attendance falls below the 75% threshold in any course without a validated medical excuse "
            "will be automatically debarred from taking the final examination in that course. "
            "Excused absences (due to illness, sports events, or personal emergencies) must be submitted with original "
            "documentation to the Office of the Registrar within three (3) business days of returning to campus.",
            
            "CAMPUS ACADEMIC HANDBOOK - SECTION 2: GRADING SYSTEMS\n\n"
            "Grades are calculated using a credit-weighted system. Letters range from A (4.0) to F (0.0). "
            "A passing grade in elective courses is D (1.0). However, core department courses in Computer Science "
            "and Engineering majors require a minimum grade of C- (1.7) to satisfy degree requirements. "
            "Late submissions of coursework will incur a penalty of 10% per day, up to a maximum of five (5) days, "
            "after which a grade of zero (0) will be recorded.",
            
            "CAMPUS ACADEMIC HANDBOOK - SECTION 3: ACADEMIC INTEGRITY\n\n"
            "Academic integrity is paramount. Plagiarism, cheating on examinations, or utilizing unauthorized AI assistance "
            "on take-home exams will result in severe penalties. "
            "First infractions result in an immediate fail grade (F) for the specific assignment or exam. "
            "A second infraction will result in an automatic F for the entire course and a referral to the Dean of Students "
            "for disciplinary hearings, which may lead to suspension or expulsion."
        ]
        
        result = vector_store.add_document("academic_handbook_excerpt.pdf", pages)
        return {"status": "success", "message": "Sample handbook indexed successfully.", "details": result}
    except Exception as e:
        logger.error(f"Error preloading sample data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
