# 🕵️ The Stolen Painting – AI Detective Game

An interactive Victorian-era mystery game where you play as a detective's assistant. Interrogate suspects, examine crime scenes, and uncover the truth using natural language. Powered by Groq LLM (Llama 3) for dynamic storytelling.

**🎮 Play the game:** [https://your-deployed-frontend-url.vercel.app](https://your-deployed-frontend-url.vercel.app)

![Game Screenshot](docs/screenshot.png)  <!-- Optional: add a screenshot later -->

## ✨ Features

- 🔍 **Natural language interaction** – Move, examine, question, accuse just by typing.
- 🎭 **Rich narrative** – AI generates unique responses based on your actions and discovered clues.
- 📜 **Progressive clue system** – Discover physical and motive evidence across 7 locations.
- 🔐 **Logical deduction** – Only one suspect can be the real thief. Use evidence to prove it.
- ⚡ **Fast & free** – Deployed on Render (backend) + Vercel (frontend) with Groq's free tier.

## 🧠 How It Works

The game uses a custom prompt-engineered LLM (Groq's Llama 3.1 8B) that acts as a game master. It tracks:
- Your current location
- Clues you've found
- Suspects' moods and secrets

You interact by typing commands like:
- `go to the garden`
- `examine the flowerpot`
- `ask Eleanor about the painting`
- `search Molly's room`
- `I accuse Molly`

The AI returns a structured JSON containing the narrative, any new clue, and a suggested action (move, examine, question, accuse).

## 🛠️ Tech Stack

| Layer       | Technologies                                                                 |
|-------------|------------------------------------------------------------------------------|
| Frontend    | React, TypeScript, Vite, Tailwind CSS, Axios                                |
| Backend     | FastAPI (Python), Uvicorn, Pydantic                                          |
| AI          | Groq API (Llama 3.1 8B Instruct)                                            |
| Deployment  | Render (backend), Vercel (frontend)                                          |
| Other       | python-dotenv, Git                                                           |

## 🚀 Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate   # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env        # add your GROQ_API_KEY
uvicorn main:app --reload --port 8000
