export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface GameState {
  sessionId: string;
  messages: Message[];
  clues: string[];
  suspectStatus: Record<string, string>;
  gameOver: boolean;
  solved: boolean | null;
  round: number;
  current_scene?: string;
}