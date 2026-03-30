import { useState, useRef, useEffect } from 'react';
import { sendMessage, type ChatResponse } from './api';
import type { GameState, Message } from './types';

function App() {
  const [gameState, setGameState] = useState<GameState>({
    sessionId: '',
    messages: [],
    clues: [],
    suspectStatus: {},
    gameOver: false,
    solved: null,
    round: 0
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim() || loading || gameState.gameOver) return;
    const userMsg: Message = { role: 'user', content: input };
    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg]
    }));
    setInput('');
    setLoading(true);

    try {
      const res: ChatResponse = await sendMessage(gameState.sessionId, input);
      const assistantMsg: Message = { role: 'assistant', content: res.message };
      
      setGameState(prev => ({
        ...prev,
        sessionId: res.session_id,
        messages: [...prev.messages, assistantMsg],
        clues: res.new_clue ? [...prev.clues, res.new_clue] : prev.clues,
        suspectStatus: res.suspect_update ? { ...prev.suspectStatus, ...res.suspect_update } : prev.suspectStatus,
        gameOver: res.game_over,
        solved: res.solved,
        round: res.round
      }));
    } catch (error) {
      console.error('请求失败', error);
      alert('与服务器通信失败，请确保后端已启动。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.messages]);

  const resetGame = () => {
    setGameState({
      sessionId: '',
      messages: [],
      clues: [],
      suspectStatus: {},
      gameOver: false,
      solved: null,
      round: 0
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex">
      {/* 左侧聊天区 */}
      <div className="flex-1 flex flex-col bg-white rounded shadow">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">📜 The Stolen Painting</h1>
          <p>Round: {gameState.round}/20</p>
          {gameState.gameOver && (
            <p className="text-red-500">
              {gameState.solved ? '🎉 Case Solved!' : '❌ Case Unsolved'}
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {gameState.messages.map((msg, idx) => (
            <div key={idx} className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100'}`}>
              <strong>{msg.role === 'user' ? 'You' : 'Game Master'}：</strong> {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t flex">
          <input
            className="flex-1 border rounded p-2"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            disabled={loading || gameState.gameOver}
            placeholder="Ask a suspect, go to a room, examine something..."
          />
          <button
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
            onClick={handleSend}
            disabled={loading || gameState.gameOver}
          >
            Send
          </button>
          {gameState.gameOver && (
            <button className="ml-2 px-4 py-2 bg-gray-500 text-white rounded" onClick={resetGame}>
              New Game
            </button>
          )}
        </div>
      </div>

      {/* 右侧面板 */}
      <div className="w-80 ml-4 space-y-4">
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-bold mb-2">🔍 Clues Found</h2>
          <ul className="list-disc list-inside text-sm space-y-1">
            {gameState.clues.map((clue, i) => <li key={i}>{clue}</li>)}
          </ul>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-bold mb-2">👥 Suspects Status</h2>
          {Object.entries(gameState.suspectStatus).map(([name, info]) => (
            <div key={name} className="mb-2 border-b pb-1">
              <span className="font-semibold">{name}</span>
              <p className="text-sm text-gray-600">{info}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;