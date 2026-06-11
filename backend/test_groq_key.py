import os
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path="d:/Edumind/backend/.env")
api_key = os.getenv("GROQ_API_KEY")
print("KEY:", api_key)

url = "https://api.groq.com/openai/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}
payload = {
    "model": "llama-3.3-70b-versatile",
    "messages": [
        {"role": "user", "content": "Hello, are you active?"}
    ],
    "max_tokens": 10
}

try:
    res = requests.post(url, headers=headers, json=payload)
    print("STATUS:", res.status_code)
    print("RESPONSE:", res.json())
except Exception as e:
    print("ERROR:", e)
