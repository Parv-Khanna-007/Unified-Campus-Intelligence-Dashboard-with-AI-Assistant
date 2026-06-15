import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mcp.server.fastmcp import FastMCP

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("cafeteria-mcp")

# Initialize FastMCP Server
mcp = FastMCP("Cafeteria Operations")

# Mock Cafeteria Database
CAFETERIAS = ["dining_hall_1", "quad_cafe"]

MENU_DB = {
    "dining_hall_1": {
        "today": {
            "breakfast": [
                {"item": "Oatmeal with Berries", "price": 3.50, "calories": 280, "allergens": ["Gluten"]},
                {"item": "Scrambled Eggs & Bacon", "price": 5.25, "calories": 420, "allergens": ["Egg", "Pork"]}
            ],
            "lunch": [
                {"item": "Grilled Chicken Breast & Quinoa", "price": 8.50, "calories": 520, "allergens": []},
                {"item": "Vegan Buddha Bowl", "price": 7.75, "calories": 460, "allergens": ["Soy", "Sesame"]}
            ],
            "dinner": [
                {"item": "Baked Salmon with Asparagus", "price": 11.00, "calories": 610, "allergens": ["Fish"]},
                {"item": "Classic Margherita Pizza Slice", "price": 4.50, "calories": 380, "allergens": ["Dairy", "Gluten"]}
            ]
        },
        "weekly": {
            "Monday": {"special": "Taco Tuesday Prep Salad", "soup": "Tomato Basil"},
            "Tuesday": {"special": "Street Taco Trio", "soup": "Chicken Tortilla"},
            "Wednesday": {"special": "Traditional Ramen Bowl", "soup": "Miso Soup"},
            "Thursday": {"special": "BBQ Pulled Pork Sandwich", "soup": "Corn Chowder"},
            "Friday": {"special": "Fish and Chips", "soup": "New England Clam Chowder"},
            "Saturday": {"special": "Chef Selection Brunch", "soup": "Vegetable Soup"},
            "Sunday": {"special": "Sunday Roast Beef", "soup": "Minestrone"}
        }
    },
    "quad_cafe": {
        "today": {
            "breakfast": [
                {"item": "Avocado Toast on Sourdough", "price": 6.50, "calories": 340, "allergens": ["Gluten"]},
                {"item": "Greek Yogurt Parfait", "price": 4.25, "calories": 260, "allergens": ["Dairy", "Nuts"]}
            ],
            "lunch": [
                {"item": "Smoked Turkey & Provolone Panini", "price": 8.25, "calories": 580, "allergens": ["Dairy", "Gluten"]},
                {"item": "Caprese Salad", "price": 7.00, "calories": 320, "allergens": ["Dairy"]}
            ],
            "dinner": [
                {"item": "Pesto Penne with Grilled Veggies", "price": 9.50, "calories": 640, "allergens": ["Gluten", "Dairy", "Nuts"]},
                {"item": "Beef Teriyaki Rice Bowl", "price": 10.25, "calories": 710, "allergens": ["Soy", "Gluten"]}
            ]
        },
        "weekly": {
            "Monday": {"special": "Pesto Chicken Sandwich", "soup": "French Onion"},
            "Tuesday": {"special": "Falafel Wrap", "soup": "Lentil Soup"},
            "Wednesday": {"special": "Beef Dip Au Jus", "soup": "Potato Leek"},
            "Thursday": {"special": "Butter Chicken with Naan", "soup": "Chicken Noodle"},
            "Friday": {"special": "Shrimp Po Boy", "soup": "Lobster Bisque"},
            "Saturday": {"special": "Waffle Station", "soup": "None"},
            "Sunday": {"special": "Pancake Stack Buffet", "soup": "None"}
        }
    }
}

@mcp.tool()
def get_today_menu(cafeteria_id: str) -> dict:
    """
    Get today's breakfast, lunch, and dinner menus for a specific cafeteria.
    Args:
        cafeteria_id: The identifier of the cafeteria ('dining_hall_1' or 'quad_cafe')
    """
    logger.info(f"Executing tool: get_today_menu for cafeteria_id: '{cafeteria_id}'")
    try:
        cid = cafeteria_id.lower().strip()
        if cid not in MENU_DB:
            return {
                "status": "error",
                "message": f"Cafeteria '{cafeteria_id}' not found. Valid IDs: {CAFETERIAS}"
            }
        return {
            "status": "success",
            "cafeteria_id": cid,
            "menu": MENU_DB[cid]["today"]
        }
    except Exception as e:
        logger.error(f"Error in get_today_menu: {str(e)}")
        return {"status": "error", "message": str(e)}

@mcp.tool()
def get_weekly_menu(cafeteria_id: str) -> dict:
    """
    Get the weekly special specials schedule for a specific cafeteria.
    Args:
        cafeteria_id: The identifier of the cafeteria ('dining_hall_1' or 'quad_cafe')
    """
    logger.info(f"Executing tool: get_weekly_menu for cafeteria_id: '{cafeteria_id}'")
    try:
        cid = cafeteria_id.lower().strip()
        if cid not in MENU_DB:
            return {
                "status": "error",
                "message": f"Cafeteria '{cafeteria_id}' not found. Valid IDs: {CAFETERIAS}"
            }
        return {
            "status": "success",
            "cafeteria_id": cid,
            "weekly_schedule": MENU_DB[cid]["weekly"]
        }
    except Exception as e:
        logger.error(f"Error in get_weekly_menu: {str(e)}")
        return {"status": "error", "message": str(e)}

# Create FastAPI wrapper app
app = FastAPI(title="Cafeteria MCP Server")

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
    return {"status": "Cafeteria MCP Server is active", "endpoints": ["/mcp/sse", "/mcp/messages"]}

from pydantic import BaseModel
from typing import List

class MenuItemModel(BaseModel):
    cafeteria_id: str
    meal_type: str # breakfast, lunch, dinner
    item: str
    price: float
    calories: int = 0
    allergens: List[str] = []

@app.post("/menu")
def update_menu(item_data: MenuItemModel):
    cid = item_data.cafeteria_id.lower().strip()
    meal = item_data.meal_type.lower().strip()
    
    if cid not in MENU_DB:
        raise HTTPException(status_code=400, detail=f"Cafeteria '{item_data.cafeteria_id}' not found.")
    if meal not in ["breakfast", "lunch", "dinner"]:
        raise HTTPException(status_code=400, detail="Meal type must be breakfast, lunch, or dinner.")
        
    current_menu = MENU_DB[cid]["today"][meal]
    updated = False
    for i in current_menu:
        if i["item"].lower() == item_data.item.lower():
            i["price"] = item_data.price
            i["calories"] = item_data.calories
            i["allergens"] = item_data.allergens
            updated = True
            break
            
    if not updated:
        current_menu.append({
            "item": item_data.item,
            "price": item_data.price,
            "calories": item_data.calories,
            "allergens": item_data.allergens
        })
        
    logger.info(f"Updated menu for {cid} -> {meal} -> {item_data.item}")
    return {"status": "success", "message": "Menu item updated successfully.", "menu": MENU_DB[cid]["today"]}

@app.get("/menu")
def get_menu():
    return MENU_DB
