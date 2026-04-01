from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uuid
import json
from game_state import GameState
from api_client import query_api

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

games = {}  # session_id -> GameState

# Load the system prompt from file
with open("detective_system_prompt.txt", "r", encoding="utf-8") as f:
    SYSTEM_PROMPT = f.read()

@app.post("/chat")
async def chat(request: dict):
    session_id = request.get("session_id")
    user_message = request.get("message", "").strip()

    # Create new session if none provided
    if not session_id:
        session_id = str(uuid.uuid4())
        games[session_id] = GameState(
            session_id=session_id,
            round_count=0,
            current_scene="living_room",
            clues=[],
            suspect_status={},
            game_over=False,
            solved=None
        )

    state = games[session_id]

    if state.game_over:
        return {
            "session_id": session_id,
            "game_over": True,
            "message": "Game already ended. Please refresh to start a new game.",
            "new_clue": None,
            "suspect_update": {},
            "solved": state.solved,
            "round": state.round_count,
            "current_scene": state.current_scene
        }

    # Build context for AI
    context = f"Current round: {state.round_count + 1}/20\n"
    context += f"Player location: {state.current_scene}\n"
    context += f"Discovered clues: {state.clues}\n"
    context += f"Suspect status: {state.suspect_status}\n"
    context += f"Player says: {user_message}\n"
    context += "Respond with a JSON object according to the rules."

    response_text = query_api(context, SYSTEM_PROMPT, temperature=0.8)
    print(f"DEBUG: Groq raw response: {response_text}")

    try:
        result = json.loads(response_text)
        
    except json.JSONDecodeError:
        print(f"DEBUG: Json decode error")
        result = {
            "message": "The game master seems confused. Please rephrase your action.",
            "new_clue": None,
            "suspect_update": {},
            "game_over": False
        }

    # Handle action (move, examine, etc.)
    action = result.get("action")
    if action:
        type = action.get("type")
        if  type == "move":
            target = action.get("target")
            # Simple validation – you can extend with a list of valid locations
            if target in ["study", "living_room", "garden", "maid_room", "butler_room", "guest_room", "shed"]:
                state.current_scene = target
        elif type == "question":
            target = action.get("target")
            if target in ["Molly", "Alfred", "Eleanor", "George"]:
                state.current_scene = "question" + "_" + target
                print(state.current_scene)
        elif type == "accuse":
            target = action.get("target")
            if target in ["Molly", "Alfred", "Eleanor", "George"]:
                state.current_scene = "accuse" + "_" + target

    # Update game state if not game over
    if not result.get("game_over", False):
        state.round_count += 1
        if result.get("new_clue"):
            state.clues.append(result["new_clue"])
        if result.get("suspect_update"):
            state.suspect_status.update(result["suspect_update"])

        # Check for 30 round limit
        if state.round_count >= 30:
            state.game_over = True
            state.solved = False
            result["message"] = "30 rounds have passed without solving the case. The true thief escapes. Game over."
            result["game_over"] = True
            result["solved"] = False
    else:
        state.game_over = True
        state.solved = result.get("solved", False)

    games[session_id] = state

    return {
        "session_id": session_id,
        "message": result.get("message", ""),
        "new_clue": result.get("new_clue"),
        "suspect_update": result.get("suspect_update", {}),
        "game_over": state.game_over,
        "solved": state.solved,
        "round": state.round_count,
        "current_scene": state.current_scene,
    }

@app.get("/")
def root():
    return {"message": "Detective Game Backend is running."}