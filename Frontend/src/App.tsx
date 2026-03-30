import { useState, useRef, useEffect } from 'react';
import { sendMessage, type ChatResponse } from './api';
import type { GameState, Message } from './types';

// 场景背景图映射（根据后端返回的 current_scene 加载对应图片）
const sceneBackgrounds: Record<string, string> = {
  study: '/images/study.jpg',
  garden: '/images/garden.jpg',
  living_room: '/images/living_room.jpg',
  maid_room: '/images/maid_room.jpg',
  question_Molly: '/images/question_Molly.jpg', 
  butler_room: '/images/butler_room.jpg',
  question_Alfred: '/images/question_Alfred.jpg',
  guest_room: '/images/guest_room.jpg',
  shed: '/images/shed.jpg',
  question_Eleanor: '/images/question_Eleanor.jpg',
  question_George: '/images/question_George.jpg',
  accuse_George: '/images/question_George.jpg',
  accuse_Molly: '/images/question_Molly.jpg',
  accuse_Alfred: '/images/question_Alfred.jpg',
  accuse_Eleanor: '/images/question_Eleanor.jpg',
};

// 默认背景（当场景未匹配时使用）
const DEFAULT_BG = '/images/study.jpg';

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
  const [cluesOpen, setCluesOpen] = useState(true);
  const [suspectsOpen, setSuspectsOpen] = useState(true);
  const [currentScene, setCurrentScene] = useState('study');
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

      // 更新当前场景（如果后端返回了）
      if (res.current_scene) {
        setCurrentScene(res.current_scene);
      }
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
    setCurrentScene('study');
  };

  const backgroundImage = sceneBackgrounds[currentScene] || DEFAULT_BG;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 左侧：场景背景图 */}
      <div className="w-3/4 relative bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {/* 可选：半透明遮罩 + 场景名称 */}
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-end justify-start p-4">
          <span className="text-white text-lg font-semibold bg-black bg-opacity-50 px-3 py-1 rounded">
            {currentScene.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* 右侧：对话 + 输入 + 折叠面板 */}
      <div className="w-1/4 flex flex-col bg-gray-100">
        {/* 对话历史区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {gameState.messages.map((msg, idx) => (
            <div key={idx} className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-200 text-right' : 'bg-white'}`}>
              <strong>{msg.role === 'user' ? 'You' : 'Game Master'}:</strong> {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框区域 */}
        <div className="p-4 border-t bg-white">
          <div className="flex">
            <input
              className="flex-1 border rounded-l p-2"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              disabled={loading || gameState.gameOver}
              placeholder="Type your action (e.g., 'go to garden', 'question maid')..."
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-r"
              onClick={handleSend}
              disabled={loading || gameState.gameOver}
            >
              Send
            </button>
          </div>
        </div>

        {/* 折叠面板区域 */}
        <div className="border-t bg-white p-2 space-y-2">
          {/* 线索折叠面板 */}
          <div className="border rounded">
            <button
              className="w-full text-left p-2 font-bold bg-gray-200 hover:bg-gray-300 flex justify-between"
              onClick={() => setCluesOpen(!cluesOpen)}
            >
              🔍 Clues Found
              <span>{cluesOpen ? '▼' : '▶'}</span>
            </button>
            {cluesOpen && (
              <div className="p-2 max-h-40 overflow-y-auto">
                <ul className="list-disc list-inside text-sm space-y-1">
                  {gameState.clues.map((clue, i) => <li key={i}>{clue}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* 嫌疑人折叠面板 */}
          <div className="border rounded">
            <button
              className="w-full text-left p-2 font-bold bg-gray-200 hover:bg-gray-300 flex justify-between"
              onClick={() => setSuspectsOpen(!suspectsOpen)}
            >
              👥 Suspects Status
              <span>{suspectsOpen ? '▼' : '▶'}</span>
            </button>
            {suspectsOpen && (
              <div className="p-2 max-h-60 overflow-y-auto">
                {Object.entries(gameState.suspectStatus).map(([name, info]) => (
                  <div key={name} className="mb-2 border-b pb-1">
                    <span className="font-semibold">{name}</span>
                    <p className="text-sm text-gray-600">{info}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;