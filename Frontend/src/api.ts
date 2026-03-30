import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export interface ChatResponse {
  session_id: string;
  message: string;
  new_clue: string | null;
  suspect_update: Record<string, string>;
  game_over: boolean;
  solved: boolean | null;
  round: number;
  current_scene: string;
}

export const sendMessage = async (sessionId: string | null, message: string): Promise<ChatResponse> => {
  const response = await axios.post(`${API_BASE}/chat`, {
    session_id: sessionId,
    message: message
  });
  return response.data;
};