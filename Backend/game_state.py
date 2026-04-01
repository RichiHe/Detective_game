from pydantic import BaseModel
from typing import Dict, Optional, Set

class GameState(BaseModel):
    session_id: str
    round_count: int
    current_scene: str           # 当前场景标识
    clues: Set[str]
    suspect_status: Dict[str, str]
    game_over: bool
    solved: Optional[bool] = None