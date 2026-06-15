import logging
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mcp.server.fastmcp import FastMCP

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("events-mcp")

# Initialize FastMCP Server
mcp = FastMCP("Events Operations")

# Mock Events Database
EVENTS_DB = [
    {
        "id": "EV001",
        "title": "Annual Campus Hackathon",
        "category": "Technology",
        "date": "2026-06-20",
        "time": "09:00 AM - 09:00 PM",
        "venue": "Engineering Auditorium Block C",
        "description": "A 12-hour coding marathon where students collaborate to build creative software solutions.",
        "speaker_or_host": "ACM Student Chapter",
        "capacity": 200,
        "registrations": 185
    },
    {
        "id": "EV002",
        "title": "AI in Education: Panel Discussion",
        "category": "Academic",
        "date": "2026-06-16",
        "time": "02:00 PM - 04:00 PM",
        "venue": "Science Block Hall 2",
        "description": "Distinguished professors discuss the implications of LLMs and AI interfaces in higher education.",
        "speaker_or_host": "Dr. Sarah Jenkins, Prof. Liam Carter",
        "capacity": 100,
        "registrations": 98
    },
    {
        "id": "EV003",
        "title": "Spring Career Fair",
        "category": "Career",
        "date": "2026-06-25",
        "time": "10:00 AM - 04:00 PM",
        "venue": "University Gymnasium",
        "description": "Connect with representatives from over 50 leading companies recruiting for internships and full-time jobs.",
        "speaker_or_host": "Career Services Office",
        "capacity": 1000,
        "registrations": 620
    },
    {
        "id": "EV004",
        "title": "Inter-University Basketball Finals",
        "category": "Sports",
        "date": "2026-06-18",
        "time": "06:00 PM - 08:30 PM",
        "venue": "Sports Arena Court A",
        "description": "Watch the Campus Tigers face off against the City College Knights in the final tournament.",
        "speaker_or_host": "Athletic Department",
        "capacity": 500,
        "registrations": 450
    }
]

@mcp.tool()
def get_upcoming_events(category: str = None) -> dict:
    """
    Get a list of upcoming campus events.
    Args:
        category: Optional filter by category (e.g. 'Technology', 'Academic', 'Career', 'Sports')
    """
    logger.info(f"Executing tool: get_upcoming_events with category filter: '{category}'")
    try:
        results = []
        for event in EVENTS_DB:
            if not category or event["category"].lower() == category.lower().strip():
                results.append(event)
        
        return {
            "status": "success",
            "count": len(results),
            "events": results
        }
    except Exception as e:
        logger.error(f"Error in get_upcoming_events: {str(e)}")
        return {"status": "error", "message": str(e)}

@mcp.tool()
def search_event(query: str) -> dict:
    """
    Search upcoming events by title, description, or speaker/host.
    Args:
        query: Search query string (case-insensitive)
    """
    logger.info(f"Executing tool: search_event with query: '{query}'")
    try:
        if not query.strip():
            return {"status": "error", "message": "Search query cannot be empty."}

        results = []
        for event in EVENTS_DB:
            if (query.lower() in event["title"].lower() or
                query.lower() in event["description"].lower() or
                query.lower() in event["speaker_or_host"].lower() or
                query.lower() in event["venue"].lower()):
                results.append(event)

        return {
            "status": "success",
            "count": len(results),
            "events": results
        }
    except Exception as e:
        logger.error(f"Error in search_event: {str(e)}")
        return {"status": "error", "message": str(e)}

# Create FastAPI wrapper app
app = FastAPI(title="Events MCP Server")

# Add CORS Middleware to allow client write requests
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
    return {"status": "Events MCP Server is active", "endpoints": ["/mcp/sse", "/mcp/messages"]}

from pydantic import BaseModel

class EventModel(BaseModel):
    title: str
    category: str
    date: str
    time: str
    venue: str
    description: str
    speaker_or_host: str
    capacity: int = 100
    registrations: int = 0

@app.post("/events")
def add_event(event: EventModel):
    logger.info(f"Adding event: {event.title}")
    next_id = f"EV{len(EVENTS_DB) + 1:03d}"
    
    new_event = {
        "id": next_id,
        "title": event.title,
        "category": event.category,
        "date": event.date,
        "time": event.time,
        "venue": event.venue,
        "description": event.description,
        "speaker_or_host": event.speaker_or_host,
        "capacity": event.capacity,
        "registrations": event.registrations
    }
    EVENTS_DB.append(new_event)
    return {"status": "success", "message": "Event scheduled successfully.", "event": new_event}

@app.delete("/events/{event_id}")
def delete_event(event_id: str):
    logger.info(f"Deleting event: {event_id}")
    eid = event_id.upper().strip()
    for idx, event in enumerate(EVENTS_DB):
        if event["id"] == eid:
            deleted = EVENTS_DB.pop(idx)
            return {"status": "success", "message": f"Event '{deleted['title']}' deleted successfully."}
            
    raise HTTPException(status_code=404, detail=f"Event with ID '{event_id}' not found.")

@app.get("/events")
def get_events():
    return EVENTS_DB
