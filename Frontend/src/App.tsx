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


const clueDisplayMap: Record<string, string> = {
  "frame paint": "You notice blue paint smudges on the back of the frame, still slightly wet. Maybe you should examine suspects.",
  "flowerpot fabric": "A torn fragment of fabric is caught on the rim of the flowerpot. Maybe you should search suspects' rooms.",
  "rose blood": "Fresh blood drops and a small torn cloth on a thorn. Maybe you should examine suspects.",
  "gazebo cigarette": "Cigarette butts of a specific brand near the gazebo. Maybe you should examine suspects.",
  "study carpet": "Red carpet fibers on the floor, as if dragged from the study. Maybe you should examine suspects.",
  "Eleanor letter": "Eleanor’s unsent letter reveals she planned to steal the painting to sell it and rescue her family’s business.",
  "Eleanor blood": "There is a band-aid on Eleanor's right index finger. It seems that her finger bled.",
  "Eleanor action": "Eleanor confessed she initially stole the painting and hid it in the gazebo, but when she returned it was gone.",
  "Molly note": "Molly’s private notebook contains angry words about the master’s boasting; she wrote: ‘If the painting disappeared, he wouldn’t be so proud.’",
  "Molly fabric": "A torn glove in Molly’s belongings – the right hand is missing a piece of fabric.",
  "accuse Molly": "Molly confesses and shows the painting hidden under her bed. (This ends the game)",
  "Alfred diary": "Alfred’s diary reveals he feared the estate land would be sold, leaving old servants jobless. He intended to appraise the painting to convince the master to sell it instead of land.",
  "Alfred paint": "Alfred’s gloves have blue paint stains matching the frame’s back.",
  "George cigarette": "George’s cigarette, the brand is 'Zhonghua'.",
  "George carpet": "George’s shoes have red carpet fibers from the study hallway.",
  "George action": "George admits he was at the gazebo and saw Eleanor go from the study toward the gazebo, but he didn’t investigate further."
};

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
  const [currentScene, setCurrentScene] = useState('living_room');
  const [showIntro, setShowIntro] = useState(false);
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
    <div className="flex flex-col h-screen">
      {/* 标题栏 */}
      <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">📜 The Stolen Painting</h1>
        <div className="flex items-center gap-4">
          <span>Round: {gameState.round}/30</span>
          <button
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            onClick={() => setShowIntro(true)}
          >
            📖 How to Play
          </button>
          {gameState.gameOver && (
            <button
              className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
              onClick={resetGame}
            >
              New Game
            </button>
          )}
        </div>
      </div>

      {/* 主内容区：左右布局 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧场景背景图 */}
        <div className="w-3/4 relative bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }}>
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-end justify-start p-4">
            <span className="text-white text-lg font-semibold bg-black bg-opacity-50 px-3 py-1 rounded">
              {currentScene.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
          {/* 这里可以放置热点按钮 */}
        </div>

        {/* 右侧对话及面板 */}
        <div className="w-1/4 flex flex-col bg-gray-100">
          {/* 对话历史区域 */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {gameState.messages.map((msg, idx) => (
              <div key={idx} className={`p-1 rounded text-sm ${msg.role === 'user' ? 'bg-blue-200 text-right' : 'bg-white'}`}>
                <strong>{msg.role === 'user' ? 'You' : 'GM'}:</strong> {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入框区域 */}
          <div className="p-2 border-t bg-white">
            <div className="flex">
              <input
                className="flex-1 border rounded-l p-1 text-sm"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                disabled={loading || gameState.gameOver}
                placeholder="Type your action..."
              />
              <button
                className="bg-blue-500 text-white px-2 py-1 rounded-r text-sm"
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
                className="w-full text-left p-1 text-sm font-bold bg-gray-200 hover:bg-gray-300 flex justify-between"
                onClick={() => setCluesOpen(!cluesOpen)}
              >
                🔍 Clues
                <span>{cluesOpen ? '▼' : '▶'}</span>
              </button>
              {cluesOpen && (
                <div className="p-1 max-h-32 overflow-y-auto text-xs">
                  <ul className="list-disc list-inside space-y-0.5">
                    {gameState.clues.map((clue, i) => (
                      <li key={i}>{clueDisplayMap[clue] || clue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 嫌疑人折叠面板 */}
            <div className="border rounded">
              <button
                className="w-full text-left p-1 text-sm font-bold bg-gray-200 hover:bg-gray-300 flex justify-between"
                onClick={() => setSuspectsOpen(!suspectsOpen)}
              >
                👥 Suspects
                <span>{suspectsOpen ? '▼' : '▶'}</span>
              </button>
              {suspectsOpen && (
                <div className="p-1 max-h-40 overflow-y-auto text-xs">
                  {Object.entries(gameState.suspectStatus).map(([name, info]) => (
                    <div key={name} className="mb-1 border-b pb-0.5">
                      <span className="font-semibold">{name}</span>
                      <p className="text-gray-600">{info}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 游戏介绍模态框 */}
      {showIntro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="p-6 flex-1 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">📖 How to Play</h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>🖼️ The Story</strong><br />
                Lord Arthur's valuable painting "The Morning Maiden" has been stolen from his study during a dinner party. You are a detective's assistant, tasked with uncovering the truth before the thief escapes.</p>
                
                <p><strong>🎯 Goal</strong><br />
                Find the real thief and recover the painting within <strong>20 rounds</strong>. Accuse the correct suspect with evidence.</p>

                <p><strong>👥 Suspects</strong><br/></p>
                <ul className="list-disc list-inside ml-4">
                  <li>Eleanor Sterling – Art Dealer’s Daughter</li>
                  <li>Molly Higgins – Maid</li>
                  <li>Alfred Thorne – Butler</li>
                  <li>George Hardwick – Gardener</li>
                </ul>

                <p><strong>🗺️ Locations to Explore</strong><br />
                You can move between different areas of the manor. Each location contains unique clues and people.</p>
                <ul className="list-disc list-inside ml-4">
                  <li><strong>Study</strong> – Where the painting was stolen. Examine the empty frame.</li>
                  <li><strong>Garden</strong> – The gazebo and rose bushes hold key evidence.</li>
                  <li><strong>Living Room</strong> – Guests gathered here after dinner.</li>
                  <li><strong>Maid's Room</strong> – Molly's private space.</li>
                  <li><strong>Butler's Room</strong> – Alfred's quarters.</li>
                  <li><strong>Guest Room</strong> – Where Eleanor is staying.</li>
                  <li><strong>Garden Shed</strong> – George's workplace.</li>
                </ul>
                <p className="text-sm text-gray-500">Use commands like <code>go to the garden</code> to move.</p>
                
                <p><strong>💬 What You Can Do</strong><br />
                Type natural language commands to explore, question suspects, and examine objects. Examples:</p>
                <ul className="list-disc list-inside ml-4">
                  <li><code>go to the garden</code> — Move to another room</li>
                  <li><code>ask Eleanor about the painting</code> — Question a suspect</li>
                  <li><code>examine the flowerpot</code> — Search for clues</li>
                  <li><code>search Molly's room</code> — Investigate private areas</li>
                  <li><code>I accuse Molly</code> — Make your final guess</li>
                </ul>
          
                <p><strong>🔍 Clues</strong><br />
                Clues you find will appear in the right panel. Some clues only appear after you search specific locations or confront suspects. Use logic to connect the dots.</p>
                
                <p><strong>⏱️ Rounds</strong><br />
                You have 20 rounds to solve the case. Each action (move, question, examine) counts as one round. Use them wisely!</p>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() => setShowIntro(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;