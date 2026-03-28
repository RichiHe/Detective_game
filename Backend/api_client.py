import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is not set in environment variables. Please add it to .env file.")

MODEL_NAME = "llama-3.1-8b-instant" 

def query_api(prompt: str, system_prompt: str = "", temperature: float = 0.7) -> str:
    """Send a request to Groq API and return the response text."""
    client = Groq(api_key=GROQ_API_KEY)

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=temperature,
            max_tokens=800
        )
        return completion.choices[0].message.content # type: ignore
    except Exception as e:
        print(f"Groq API call failed: {e}")
        return "{}"   # Return empty JSON object as fallback